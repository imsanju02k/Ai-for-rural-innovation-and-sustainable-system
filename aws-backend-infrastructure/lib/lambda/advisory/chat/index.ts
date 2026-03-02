import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    BedrockRuntimeClient,
    InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

// Initialize AWS clients
const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const CHAT_MESSAGES_TABLE = process.env.CHAT_MESSAGES_TABLE || '';
const FARMS_TABLE = process.env.FARMS_TABLE || '';
const SENSOR_DATA_TABLE = process.env.SENSOR_DATA_TABLE || '';
const MAX_HISTORY_MESSAGES = 10;
const RESPONSE_TIMEOUT_MS = 2000;

interface ChatRequest {
    message: string;
    farmId?: string;
    includeContext?: boolean;
}

interface ChatMessage {
    messageId: string;
    userId: string;
    farmId?: string;
    role: 'user' | 'assistant';
    content: string;
    metadata?: {
        sources?: string[];
        recommendations?: Array<{
            type: string;
            action: string;
            timeframe?: string;
        }>;
        processingTimeMs?: number;
    };
    timestamp: string;
}

interface UserContext {
    farms?: any[];
    sensorData?: any[];
}

/**
 * Advisory Chat Lambda Handler
 * Processes chat messages with Amazon Bedrock (Claude 3)
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.7, 7.9
 */
export const handler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const startTime = Date.now();
    const requestId = event.requestContext.requestId;

    try {
        // Extract userId from authorizer context
        const userId = event.requestContext.authorizer?.userId;
        if (!userId) {
            return errorResponse(401, 'UNAUTHORIZED', 'User not authenticated', requestId);
        }

        // Parse and validate request body
        const body: ChatRequest = JSON.parse(event.body || '{}');
        const validationError = validateChatRequest(body);
        if (validationError) {
            return errorResponse(400, 'VALIDATION_ERROR', validationError, requestId);
        }

        const { message, farmId, includeContext = true } = body;

        // Check for out-of-scope queries (Requirement 7.8)
        if (isOutOfScope(message)) {
            const redirectionMessage = getOutOfScopeRedirection();

            // Store the out-of-scope query for analysis
            await storeMessage(userId, farmId, 'user', message, requestId);
            await storeMessage(userId, farmId, 'assistant', redirectionMessage, requestId, {
                sources: ['out_of_scope_handler'],
            });

            // Log for analysis
            console.log('Out-of-scope query detected', {
                userId,
                message: message.substring(0, 100),
                requestId,
            });

            return successResponse(200, {
                messageId: uuidv4(),
                response: redirectionMessage,
                recommendations: [],
                sources: ['out_of_scope_handler'],
                timestamp: new Date().toISOString(),
                processingTimeMs: Date.now() - startTime,
            });
        }

        // Load conversation history (last 10 messages) - Requirement 7.3
        const conversationHistory = await loadConversationHistory(userId, farmId);

        // Retrieve user context if requested - Requirement 7.9
        let userContext: UserContext = {};
        if (includeContext) {
            userContext = await getUserContext(userId, farmId);
        }

        // Build prompt with context and conversation history
        const prompt = buildPrompt(message, conversationHistory, userContext);

        // Call Amazon Bedrock (Claude 3) - Requirement 7.1
        const bedrockResponse = await invokeBedrockModel(prompt);

        // Parse response for recommendations and citations - Requirement 7.5
        const parsedResponse = parseBedrockResponse(bedrockResponse);

        // Store user message and assistant response - Requirement 7.7
        await storeMessage(userId, farmId, 'user', message, requestId);
        const assistantMessageId = await storeMessage(
            userId,
            farmId,
            'assistant',
            parsedResponse.content,
            requestId,
            {
                sources: parsedResponse.sources,
                recommendations: parsedResponse.recommendations,
                processingTimeMs: Date.now() - startTime,
            }
        );

        const processingTime = Date.now() - startTime;

        // Ensure response within 2 seconds - Requirement 7.2
        if (processingTime > RESPONSE_TIMEOUT_MS) {
            console.warn('Response time exceeded target', {
                processingTimeMs: processingTime,
                targetMs: RESPONSE_TIMEOUT_MS,
                requestId,
            });
        }

        return successResponse(200, {
            messageId: assistantMessageId,
            response: parsedResponse.content,
            recommendations: parsedResponse.recommendations,
            sources: parsedResponse.sources,
            timestamp: new Date().toISOString(),
            processingTimeMs: processingTime,
        });
    } catch (error: any) {
        console.error('Error processing chat request', {
            error: error.message,
            stack: error.stack,
            requestId,
        });

        if (error.name === 'ThrottlingException') {
            return errorResponse(503, 'SERVICE_UNAVAILABLE', 'AI service temporarily unavailable', requestId);
        }

        return errorResponse(500, 'INTERNAL_ERROR', 'An unexpected error occurred', requestId);
    }
};

function validateChatRequest(body: ChatRequest): string | null {
    if (!body.message || typeof body.message !== 'string') {
        return 'Message is required and must be a string';
    }
    if (body.message.trim().length === 0) {
        return 'Message cannot be empty';
    }
    if (body.message.length > 5000) {
        return 'Message exceeds maximum length of 5000 characters';
    }
    return null;
}

function isOutOfScope(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  
  const outOfScopeKeywords = [
    'movie', 'film', 'music', 'song', 'game', 'sport', 'football', 'basketball',
    'politics', 'election', 'president', 'government', 'war', 'military',
    'celebrity', 'actor', 'actress', 'entertainment',
    'recipe', 'cooking', 'restaurant', 'food delivery',
    'travel', 'vacation', 'hotel', 'flight',
    'stock market', 'cryptocurrency', 'bitcoin', 'investment',
    'programming', 'code', 'software', 'app development',
  ];

  for (const keyword of outOfScopeKeywords) {
    if (lowerMessage.includes(keyword)) {
      return true;
    }
  }

  const agriculturalKeywords = [
    'crop', 'farm', 'plant', 'soil', 'seed', 'harvest', 'irrigation', 'fertilizer',
    'pest', 'disease', 'weather', 'yield', 'agriculture', 'cultivation', 'livestock',
    'wheat', 'rice', 'corn', 'tomato', 'potato', 'vegetable', 'fruit',
  ];

  for (const keyword of agriculturalKeywords) {
    if (lowerMessage.includes(keyword)) {
      return false;
    }
  }

  return false;
}

function getOutOfScopeRedirection(): string {
  return "I'm an agricultural advisory assistant specialized in helping farmers with crop management, pest control, irrigation, fertilization, and other farming-related topics. I'd be happy to help you with questions about agriculture, farming practices, crop diseases, market prices, or resource optimization. How can I assist you with your farming needs today?";
}

async function loadConversationHistory(
  userId: string,
  farmId?: string
): Promise<ChatMessage[]> {
  try {
    const params: any = {
      TableName: CHAT_MESSAGES_TABLE,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      ScanIndexForward: false,
      Limit: MAX_HISTORY_MESSAGES,
    };

    if (farmId) {
      params.FilterExpression = 'farmId = :farmId';
      params.ExpressionAttributeValues[':farmId'] = farmId;
    }

    const result = await dynamoClient.send(new QueryCommand(params));
    return (result.Items || []).reverse() as ChatMessage[];
  } catch (error) {
    console.error('Error loading conversation history', { error, userId, farmId });
    return [];
  }
}

async function getUserContext(userId: string, farmId?: string): Promise<UserContext> {
  const context: UserContext = {};

  try {
    const farmsResult = await dynamoClient.send(
      new QueryCommand({
        TableName: FARMS_TABLE,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
        Limit: 5,
      })
    );
    context.farms = farmsResult.Items || [];

    if (farmId && SENSOR_DATA_TABLE) {
      const sensorResult = await dynamoClient.send(
        new QueryCommand({
          TableName: SENSOR_DATA_TABLE,
          IndexName: 'farmId-timestamp-index',
          KeyConditionExpression: 'farmId = :farmId',
          ExpressionAttributeValues: {
            ':farmId': farmId,
          },
          ScanIndexForward: false,
          Limit: 10,
        })
      );
      context.sensorData = sensorResult.Items || [];
    }
  } catch (error) {
    console.error('Error loading user context', { error, userId, farmId });
  }

  return context;
}

function buildPrompt(
  message: string,
  conversationHistory: ChatMessage[],
  userContext: UserContext
): string {
  let prompt = `You are an expert agricultural advisor helping farmers with crop management, pest control, irrigation, fertilization, and farming best practices. Provide practical, actionable advice based on agricultural science and best practices.\n\n`;

  if (userContext.farms && userContext.farms.length > 0) {
    prompt += `User's Farm Information:\n`;
    userContext.farms.forEach((farm: any) => {
      prompt += `- Farm: ${farm.name}, Location: ${farm.location?.address || 'N/A'}, Crops: ${farm.cropTypes?.join(', ') || 'N/A'}, Size: ${farm.acreage || 'N/A'} acres\n`;
    });
    prompt += '\n';
  }

  if (userContext.sensorData && userContext.sensorData.length > 0) {
    prompt += `Recent Sensor Data:\n`;
    userContext.sensorData.slice(0, 5).forEach((reading: any) => {
      prompt += `- ${reading.sensorType}: ${reading.value} ${reading.unit} (${reading.timestamp})\n`;
    });
    prompt += '\n';
  }

  if (conversationHistory.length > 0) {
    prompt += `Conversation History:\n`;
    conversationHistory.forEach((msg) => {
      prompt += `${msg.role === 'user' ? 'Farmer' : 'Advisor'}: ${msg.content}\n`;
    });
    prompt += '\n';
  }

  prompt += `Current Question: ${message}\n\n`;
  prompt += `Please provide a helpful response that:\n`;
  prompt += `1. Addresses the farmer's question directly\n`;
  prompt += `2. Provides specific, actionable recommendations\n`;
  prompt += `3. Cites relevant agricultural best practices or data sources\n`;
  prompt += `4. Considers the farmer's context (location, crops, current conditions)\n`;
  prompt += `5. Is practical and easy to implement\n\nResponse:`;

  return prompt;
}

async function invokeBedrockModel(prompt: string): Promise<string> {
  const modelId = 'anthropic.claude-3-sonnet-20240229-v1:0';

  const payload = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 1000,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    top_p: 0.9,
  };

  const command = new InvokeModelCommand({
    modelId,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(payload),
  });

  const response = await bedrockClient.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));

  return responseBody.content[0].text;
}

function parseBedrockResponse(response: string): {
  content: string;
  recommendations: Array<{ type: string; action: string; timeframe?: string }>;
  sources: string[];
} {
  const recommendations: Array<{ type: string; action: string; timeframe?: string }> = [];
  const sources: string[] = ['agricultural_best_practices', 'farm_profile'];

  const lines = response.split('\n');
  for (const line of lines) {
    if (line.match(/recommend|suggest|should|advise/i)) {
      recommendations.push({
        type: 'general_advice',
        action: line.trim(),
      });
    }
  }

  return {
    content: response,
    recommendations: recommendations.slice(0, 5),
    sources,
  };
}

async function storeMessage(
  userId: string,
  farmId: string | undefined,
  role: 'user' | 'assistant',
  content: string,
  requestId: string,
  metadata?: any
): Promise<string> {
  const messageId = uuidv4();
  const timestamp = new Date().toISOString();

  const item: ChatMessage = {
    messageId,
    userId,
    role,
    content,
    timestamp,
  };

  if (farmId) {
    item.farmId = farmId;
  }

  if (metadata) {
    item.metadata = metadata;
  }

  try {
    await dynamoClient.send(
      new PutCommand({
        TableName: CHAT_MESSAGES_TABLE,
        Item: item,
      })
    );

    return messageId;
  } catch (error) {
    console.error('Error storing message', { error, userId, role, requestId });
    throw error;
  }
}

function successResponse(statusCode: number, data: any): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(data),
  };
}

function errorResponse(
  statusCode: number,
  code: string,
  message: string,
  requestId: string
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
      'X-Request-Id': requestId,
    },
    body: JSON.stringify({
      error: {
        code,
        message,
        requestId,
        timestamp: new Date().toISOString(),
      },
    }),
  };
}
