# AI Stack Implementation Summary

## Overview

The AI Stack provides Amazon Bedrock and Rekognition integration for the AWS Backend Infrastructure. This stack configures AI/ML services with proper IAM permissions, logging, and circuit breaker protection for reliability.

## Components Implemented

### 1. AIStack (lib/stacks/ai-stack.ts)

**Purpose**: CDK stack that provisions AI service infrastructure

**Resources Created**:
- **CloudWatch Log Group**: `/aws/bedrock/{environment}` for Bedrock invocation logging
- **Bedrock IAM Role**: Grants Lambda functions permission to invoke Bedrock models
  - Claude 3 Sonnet (anthropic.claude-3-sonnet-20240229-v1:0)
  - Claude 3.5 Sonnet (anthropic.claude-3-5-sonnet-20240620-v1:0)
  - Claude 3 Haiku (anthropic.claude-3-haiku-20240307-v1:0)
- **Rekognition IAM Role**: Grants Lambda functions permission to use Rekognition
  - DetectLabels
  - DetectModerationLabels
  - DetectText
  - RecognizeCelebrities

**Stack Outputs**:
- `BedrockRoleArn`: ARN of the Bedrock access role
- `RekognitionRoleArn`: ARN of the Rekognition access role
- `BedrockLogGroupName`: CloudWatch log group name

### 2. Bedrock Integration Utilities (lib/lambda/shared/utils/bedrock.ts)

**Purpose**: Helper functions for invoking Amazon Bedrock models with prompt templates

**Key Functions**:
- `invokeClaude()`: Invoke Claude 3 models with circuit breaker protection
- `invokeBedrockWithRetry()`: Retry wrapper with exponential backoff
- `buildDiseaseDetectionPrompt()`: Generate prompts for crop disease analysis
- `buildMarketPredictionPrompt()`: Generate prompts for price forecasting
- `buildAdvisoryChatPrompt()`: Generate prompts for conversational AI
- `buildResourceOptimizationPrompt()`: Generate prompts for resource recommendations

**Features**:
- Circuit breaker pattern for fault tolerance
- Automatic retry with exponential backoff
- Structured JSON response parsing
- Token usage tracking
- Comprehensive error handling

**Model Configuration**:
- Default model: Claude 3 Sonnet
- Temperature: 0.7 (configurable)
- Max tokens: 2048 (configurable)
- Top P: 0.9 (configurable)

### 3. Rekognition Integration Utilities (lib/lambda/shared/utils/rekognition.ts)

**Purpose**: Helper functions for image analysis using Amazon Rekognition

**Key Functions**:
- `detectImageLabels()`: Detect objects and scenes in images
- `detectModerationLabels()`: Detect inappropriate content
- `analyzeImageForDiseaseDetection()`: Combined analysis for crop disease detection
- `filterPlantRelevantLabels()`: Filter labels relevant to plant analysis
- `generateImageDescription()`: Create text descriptions from labels
- `analyzeImageWithRetry()`: Retry wrapper with exponential backoff

**Features**:
- Circuit breaker pattern for fault tolerance
- Automatic moderation checks
- Plant-specific label filtering
- Confidence threshold filtering (default: 70%)
- Comprehensive error handling

### 4. Circuit Breaker Implementation (lib/lambda/shared/utils/circuit-breaker.ts)

**Purpose**: Protect against cascading failures when calling AI services

**Circuit States**:
- **CLOSED**: Normal operation, requests pass through
- **OPEN**: Circuit is open, requests are blocked (service unavailable)
- **HALF_OPEN**: Testing if service has recovered

**Configuration**:
- Failure threshold: 5 failures before opening
- Success threshold: 2 successes to close from HALF_OPEN
- Timeout: 60 seconds before attempting recovery
- Failure rate threshold: 50% failure rate triggers open
- Volume threshold: 10 requests minimum before calculating failure rate

**Predefined Circuit Breakers**:
- `bedrockCircuitBreaker`: For Amazon Bedrock operations
- `rekognitionCircuitBreaker`: For Amazon Rekognition operations

**Fallback Responses**:
- Disease detection fallback
- Market prediction fallback
- Advisory chat fallback
- Resource optimization fallback

**Features**:
- Automatic state transitions
- Statistics tracking (failures, successes, total requests)
- Manual reset capability
- Centralized circuit breaker management

## Integration with CDK App

The AI Stack is integrated into the main CDK app (bin/app.ts):

```typescript
const aiStack = new AIStack(
    app,
    getStackName(config.environment, 'AIStack'),
    {
        ...stackProps,
        config,
    }
);
```

## Usage Examples

### Invoking Bedrock for Disease Detection

```typescript
import { invokeClaude, buildDiseaseDetectionPrompt } from '../shared/utils/bedrock';

const prompt = buildDiseaseDetectionPrompt(
    'wheat',
    ['leaf', 'plant', 'vegetation', 'rust', 'spots'],
    'Image shows wheat leaves with rust-colored spots'
);

const response = await invokeClaude(prompt, {
    temperature: 0.7,
    maxTokens: 2048,
});

const result = JSON.parse(response.content);
```

### Analyzing Images with Rekognition

```typescript
import { analyzeImageForDiseaseDetection } from '../shared/utils/rekognition';

const analysis = await analyzeImageForDiseaseDetection({
    bucket: 'farm-images-bucket',
    key: 'user123/farm456/image.jpg',
});

console.log('Labels:', analysis.labels);
console.log('Moderation:', analysis.moderationLabels);
```

### Using Circuit Breaker

```typescript
import { bedrockCircuitBreaker, BEDROCK_FALLBACK_RESPONSES } from '../shared/utils/circuit-breaker';

try {
    const result = await bedrockCircuitBreaker.execute(async () => {
        return await invokeClaude(prompt);
    });
} catch (error) {
    if (error instanceof CircuitBreakerOpenError) {
        // Circuit is open, return fallback
        return BEDROCK_FALLBACK_RESPONSES.diseaseDetection;
    }
    throw error;
}
```

## Dependencies Added

The following dependencies were added to package.json:

```json
{
    "@aws-sdk/client-bedrock-runtime": "^3.490.0",
    "@aws-sdk/client-rekognition": "^3.490.0"
}
```

## Requirements Satisfied

This implementation satisfies the following requirements:

- **Requirement 5.2**: Disease_Detector SHALL use Amazon Bedrock with Claude or Titan models for image analysis
- **Requirement 6.1**: Market_Predictor SHALL use Amazon Bedrock for time-series price prediction
- **Requirement 7.1**: Advisory_Chatbot SHALL use Amazon Bedrock with Claude for conversational AI
- **Requirement 8.3**: Resource_Optimizer SHALL use Amazon Bedrock to generate fertilizer application recommendations
- **Non-functional - Reliability**: Circuit breaker pattern for fault tolerance

## Security Considerations

1. **IAM Least Privilege**: Roles grant only necessary permissions
2. **Model Access Control**: Specific model ARNs are whitelisted
3. **Logging**: All Bedrock invocations are logged to CloudWatch
4. **Error Handling**: Sensitive error details are not exposed to clients
5. **Circuit Breaker**: Prevents cascading failures and service overload

## Performance Considerations

1. **Circuit Breaker**: Fails fast when service is unavailable
2. **Retry Logic**: Exponential backoff prevents thundering herd
3. **Timeout Configuration**: 60-second timeout for AI operations
4. **Token Limits**: Configurable max tokens to control costs
5. **Caching**: Consider implementing response caching for repeated queries

## Cost Optimization

1. **Model Selection**: Use Claude 3 Haiku for faster, cheaper operations
2. **Token Management**: Set appropriate max_tokens limits
3. **Circuit Breaker**: Prevents excessive API calls during outages
4. **Prompt Engineering**: Optimize prompts for concise responses
5. **Fallback Responses**: Reduce API calls when service is degraded

## Monitoring and Observability

1. **CloudWatch Logs**: All Bedrock invocations logged
2. **Circuit Breaker Stats**: Track failure rates and state transitions
3. **Token Usage**: Monitor input/output token consumption
4. **Error Rates**: Track API errors and timeouts
5. **Latency**: Monitor response times for AI operations

## Next Steps

1. **Lambda Integration**: Update Lambda functions to use AI utilities
2. **Testing**: Write unit tests for AI utilities
3. **Monitoring**: Set up CloudWatch alarms for AI service metrics
4. **Cost Tracking**: Implement cost allocation tags for AI usage
5. **Performance Tuning**: Optimize prompts and model parameters

## Related Files

- `lib/stacks/ai-stack.ts` - CDK stack definition
- `lib/lambda/shared/utils/bedrock.ts` - Bedrock integration
- `lib/lambda/shared/utils/rekognition.ts` - Rekognition integration
- `lib/lambda/shared/utils/circuit-breaker.ts` - Circuit breaker implementation
- `bin/app.ts` - CDK app with AI stack integration
