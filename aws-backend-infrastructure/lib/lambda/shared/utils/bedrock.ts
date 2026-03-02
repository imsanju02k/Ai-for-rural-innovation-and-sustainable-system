import {
    BedrockRuntimeClient,
    InvokeModelCommand,
    InvokeModelCommandInput,
} from '@aws-sdk/client-bedrock-runtime';
import { bedrockCircuitBreaker, CircuitBreakerOpenError } from './circuit-breaker';

/**
 * Bedrock Integration Utilities
 * 
 * Helper functions for invoking Amazon Bedrock models (Claude 3)
 * with prompt templates for various AI features.
 */

// Initialize Bedrock client
const bedrockClient = new BedrockRuntimeClient({
    region: process.env.AWS_REGION || 'us-east-1',
});

// Model IDs
export const BEDROCK_MODELS = {
    CLAUDE_3_SONNET: 'anthropic.claude-3-sonnet-20240229-v1:0',
    CLAUDE_3_5_SONNET: 'anthropic.claude-3-5-sonnet-20240620-v1:0',
    CLAUDE_3_HAIKU: 'anthropic.claude-3-haiku-20240307-v1:0',
} as const;

export interface BedrockInvokeOptions {
    modelId?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
}

export interface BedrockResponse {
    content: string;
    stopReason: string;
    usage: {
        inputTokens: number;
        outputTokens: number;
    };
}

/**
 * Invoke Claude 3 model with a prompt (with circuit breaker protection)
 */
export async function invokeClaude(
    prompt: string,
    options: BedrockInvokeOptions = {}
): Promise<BedrockResponse> {
    // Use circuit breaker to protect against cascading failures
    return bedrockCircuitBreaker.execute(async () => {
        const {
            modelId = BEDROCK_MODELS.CLAUDE_3_SONNET,
            temperature = 0.7,
            maxTokens = 2048,
            topP = 0.9,
        } = options;

        const payload = {
            anthropic_version: 'bedrock-2023-05-31',
            max_tokens: maxTokens,
            temperature,
            top_p: topP,
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
        };

        const input: InvokeModelCommandInput = {
            modelId,
            contentType: 'application/json',
            accept: 'application/json',
            body: JSON.stringify(payload),
        };

        try {
            const command = new InvokeModelCommand(input);
            const response = await bedrockClient.send(command);

            const responseBody = JSON.parse(new TextDecoder().decode(response.body));

            return {
                content: responseBody.content[0].text,
                stopReason: responseBody.stop_reason,
                usage: {
                    inputTokens: responseBody.usage.input_tokens,
                    outputTokens: responseBody.usage.output_tokens,
                },
            };
        } catch (error) {
            console.error('Error invoking Bedrock model:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Bedrock invocation failed: ${errorMessage}`);
        }
    });
}

/**
 * Prompt Templates
 */

/**
 * Disease Detection Prompt Template
 */
export function buildDiseaseDetectionPrompt(
    cropType: string,
    imageLabels: string[],
    imageDescription?: string
): string {
    return `You are an expert agricultural pathologist specializing in crop disease identification.

Crop Type: ${cropType}

Image Analysis Results:
${imageLabels.map((label) => `- ${label}`).join('\n')}

${imageDescription ? `Image Description: ${imageDescription}` : ''}

Based on the image analysis, identify any crop diseases present. For each disease detected:

1. Disease Name: Provide the scientific and common name
2. Confidence: Rate your confidence (high/medium/low)
3. Severity: Assess the severity (mild/moderate/severe)
4. Affected Area: Identify which part of the plant is affected (leaves, stem, roots, fruit, etc.)
5. Treatment Recommendations: Provide 3-5 specific, actionable treatment recommendations

If no diseases are detected, state that the crop appears healthy and provide general maintenance advice.

Format your response as JSON with this structure:
{
  "diseases": [
    {
      "name": "Disease Name",
      "scientificName": "Scientific Name",
      "confidence": "high|medium|low",
      "severity": "mild|moderate|severe",
      "affectedArea": "leaves|stem|roots|fruit|etc",
      "recommendations": ["recommendation 1", "recommendation 2", ...]
    }
  ],
  "isHealthy": true|false,
  "generalAdvice": "General maintenance advice if healthy"
}`;
}

/**
 * Market Price Prediction Prompt Template
 */
export function buildMarketPredictionPrompt(
    commodity: string,
    historicalPrices: Array<{ date: string; price: number }>,
    currentPrice: number
): string {
    const priceHistory = historicalPrices
        .map((p) => `${p.date}: ${p.price}`)
        .join('\n');

    return `You are an agricultural economist specializing in commodity price forecasting.

Commodity: ${commodity}
Current Price: ${currentPrice} INR/quintal

Historical Prices (last 30 days):
${priceHistory}

Based on the historical price data and market trends, provide price predictions for the following horizons:
- 7 days
- 14 days
- 30 days

For each prediction, include:
1. Predicted Price: The forecasted price
2. Confidence Interval: Lower and upper bounds (95% confidence)
3. Trend: Direction of price movement (increasing/decreasing/stable)
4. Factors: Key factors influencing the prediction

Format your response as JSON:
{
  "predictions": [
    {
      "horizon": 7,
      "predictedPrice": number,
      "confidenceInterval": {
        "lower": number,
        "upper": number
      },
      "trend": "increasing|decreasing|stable",
      "factors": ["factor 1", "factor 2", ...]
    }
  ],
  "overallTrend": "increasing|decreasing|stable",
  "recommendation": "Buy now / Wait / Sell now"
}`;
}

/**
 * Advisory Chat Prompt Template
 */
export function buildAdvisoryChatPrompt(
    userMessage: string,
    conversationHistory: Array<{ role: string; content: string }>,
    userContext?: {
        farmLocation?: string;
        cropTypes?: string[];
        soilType?: string;
        recentSensorData?: Record<string, number>;
    }
): string {
    const historyText = conversationHistory
        .map((msg) => `${msg.role === 'user' ? 'Farmer' : 'Advisor'}: ${msg.content}`)
        .join('\n\n');

    const contextText = userContext
        ? `
Farm Context:
- Location: ${userContext.farmLocation || 'Not specified'}
- Crops: ${userContext.cropTypes?.join(', ') || 'Not specified'}
- Soil Type: ${userContext.soilType || 'Not specified'}
${userContext.recentSensorData
            ? `- Recent Sensor Readings:
${Object.entries(userContext.recentSensorData)
                .map(([key, value]) => `  - ${key}: ${value}`)
                .join('\n')}`
            : ''
        }
`
        : '';

    return `You are an experienced agricultural advisor helping farmers with their farming questions and challenges. Provide practical, actionable advice based on agricultural best practices.

${contextText}

${historyText ? `Previous Conversation:\n${historyText}\n` : ''}

Farmer's Question: ${userMessage}

Provide a helpful, concise response that:
1. Directly addresses the farmer's question
2. Incorporates their farm context if relevant
3. Provides specific, actionable recommendations
4. Cites agricultural best practices when applicable
5. Stays focused on agricultural topics

If the question is outside the agricultural domain, politely redirect to farming-related topics.

Format your response as JSON:
{
  "response": "Your detailed response to the farmer",
  "recommendations": [
    {
      "type": "planting|irrigation|fertilization|pest_control|general",
      "action": "Specific action to take",
      "timeframe": "When to do it"
    }
  ],
  "sources": ["source 1", "source 2"],
  "isOutOfScope": false
}`;
}

/**
 * Resource Optimization Prompt Template
 */
export function buildResourceOptimizationPrompt(
    farmId: string,
    cropType: string,
    currentStage: string,
    sensorData: {
        soilMoisture?: number;
        temperature?: number;
        humidity?: number;
        ph?: number;
    },
    weatherForecast?: string
): string {
    return `You are an agricultural resource optimization specialist. Analyze the farm data and provide recommendations for optimal resource usage.

Farm Details:
- Crop Type: ${cropType}
- Growth Stage: ${currentStage}

Current Sensor Readings:
- Soil Moisture: ${sensorData.soilMoisture || 'N/A'}%
- Temperature: ${sensorData.temperature || 'N/A'}°C
- Humidity: ${sensorData.humidity || 'N/A'}%
- Soil pH: ${sensorData.ph || 'N/A'}

${weatherForecast ? `Weather Forecast: ${weatherForecast}` : ''}

Provide optimization recommendations for:
1. Water/Irrigation: Daily water requirements and irrigation schedule
2. Fertilizer: Type, quantity, and application timing
3. Cost Savings: Estimated savings compared to standard practices

Format your response as JSON:
{
  "irrigation": {
    "dailyRequirement": number,
    "unit": "mm",
    "schedule": [
      {
        "time": "HH:MM",
        "duration": number,
        "unit": "minutes"
      }
    ],
    "reasoning": "Why this schedule is optimal"
  },
  "fertilizer": {
    "type": "NPK ratio or fertilizer type",
    "quantity": number,
    "unit": "kg/hectare",
    "applicationTiming": "When to apply",
    "reasoning": "Why this fertilizer plan is optimal"
  },
  "costSavings": {
    "waterSavings": number,
    "waterSavingsUnit": "percent",
    "fertilizerSavings": number,
    "fertilizerSavingsUnit": "percent",
    "estimatedCostSavings": number,
    "currency": "INR",
    "period": "per month"
  },
  "additionalRecommendations": ["recommendation 1", "recommendation 2"]
}`;
}

/**
 * Error handling wrapper for Bedrock invocations
 */
export async function invokeBedrockWithRetry(
    prompt: string,
    options: BedrockInvokeOptions = {},
    maxRetries: number = 3
): Promise<BedrockResponse> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await invokeClaude(prompt, options);
        } catch (error) {
            lastError = error instanceof Error ? error : new Error('Unknown error');
            const errorMessage = lastError.message;
            console.warn(`Bedrock invocation attempt ${attempt} failed:`, errorMessage);

            if (attempt < maxRetries) {
                // Exponential backoff
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
    }

    const errorMessage = lastError?.message || 'Unknown error';
    throw new Error(`Bedrock invocation failed after ${maxRetries} attempts: ${errorMessage}`);
}
