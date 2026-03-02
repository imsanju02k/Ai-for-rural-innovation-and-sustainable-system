# Disease Detection Lambda Functions

This directory contains Lambda functions for crop disease detection using AI/ML services.

## Functions

### 1. disease-detect

**Purpose**: Analyze crop images for disease identification using Amazon Rekognition and Amazon Bedrock (Claude 3).

**Triggers**:
- S3 event (automatic when image is uploaded)
- API Gateway POST request

**Process Flow**:
1. Load image from S3
2. Call Amazon Rekognition for initial image analysis (labels, objects)
3. Download image and encode as base64
4. Call Amazon Bedrock (Claude 3) with image and context for disease identification
5. Parse AI response for diseases, confidence scores, severity, and recommendations
6. Rank diseases by confidence score (descending)
7. Store analysis results in DiseaseAnalyses DynamoDB table
8. Return analysis results with treatment recommendations

**Environment Variables**:
- `IMAGES_TABLE`: DynamoDB table name for image metadata
- `DISEASE_ANALYSES_TABLE`: DynamoDB table name for disease analyses
- `S3_BUCKET`: S3 bucket name for images
- `BEDROCK_MODEL_ID`: Bedrock model ID (default: anthropic.claude-3-sonnet-20240229-v1:0)

**API Request Format**:
```json
POST /disease-detection/analyze
{
  "imageId": "uuid",
  "farmId": "uuid",
  "cropType": "wheat"
}
```

**API Response Format**:
```json
{
  "analysisId": "uuid",
  "imageId": "uuid",
  "results": [
    {
      "diseaseName": "Wheat Rust",
      "confidence": 0.87,
      "severity": "moderate",
      "affectedArea": "leaves",
      "recommendations": [
        "Apply fungicide containing propiconazole",
        "Remove infected plants to prevent spread",
        "Improve air circulation between plants"
      ]
    }
  ],
  "isUncertain": false,
  "analyzedAt": "2024-01-15T11:00:00Z",
  "processingTimeMs": 3420
}
```

**Requirements Validated**:
- 5.1: Automatic trigger on S3 image upload
- 5.2: Uses Amazon Bedrock for AI analysis
- 5.3: Returns confidence scores (0-1) for each disease
- 5.4: Processes within 5 seconds (target)
- 5.5: Provides treatment recommendations
- 5.6: Stores results in DynamoDB
- 5.9: Ranks multiple diseases by confidence score

### 2. disease-history

**Purpose**: Retrieve historical disease analysis records with filtering and pagination.

**Triggers**:
- API Gateway GET request

**Features**:
- Query by farmId or userId
- Filter by date range (startDate, endDate)
- Pagination support (limit, nextToken)
- Returns summary of past analyses

**Environment Variables**:
- `DISEASE_ANALYSES_TABLE`: DynamoDB table name for disease analyses

**API Request Format**:
```
GET /disease-detection/history?farmId=uuid&limit=20&startDate=2024-01-01T00:00:00Z
```

**Query Parameters**:
- `farmId` (optional): Filter by farm ID
- `userId` (optional): Filter by user ID (defaults to authenticated user)
- `startDate` (optional): Filter analyses after this date (ISO 8601)
- `endDate` (optional): Filter analyses before this date (ISO 8601)
- `limit` (optional): Number of results per page (1-100, default: 20)
- `nextToken` (optional): Pagination token for next page

**API Response Format**:
```json
{
  "analyses": [
    {
      "analysisId": "uuid",
      "imageId": "uuid",
      "farmId": "uuid",
      "diseaseName": "Wheat Rust",
      "confidence": 0.87,
      "severity": "moderate",
      "analyzedAt": "2024-01-15T11:00:00Z"
    }
  ],
  "count": 15,
  "nextToken": "base64-encoded-token"
}
```

**Requirements Validated**:
- 5.6: Query disease analyses from DynamoDB
- Supports filtering by date range
- Supports pagination for large result sets

## Error Handling

The `shared/error-handler.ts` module provides comprehensive error handling for:

### Rekognition API Errors
- `InvalidImageFormatException`: Invalid image format (400)
- `ImageTooLargeException`: Image exceeds 10MB limit (400)
- `InvalidS3ObjectException`: Cannot access S3 object (404)
- `ThrottlingException`: Service throttled (503)
- `ProvisionedThroughputExceededException`: Capacity exceeded (503)
- `ServiceUnavailableException`: Service unavailable (503)

### Bedrock API Errors
- `ValidationException`: Invalid request (400)
- `ModelTimeoutException`: Model processing timeout (504)
- `ThrottlingException`: Service throttled (503)
- `ServiceQuotaExceededException`: Quota exceeded (503)
- `ServiceUnavailableException`: Service unavailable (503)
- `AccessDeniedException`: Access denied (500)
- `ModelNotReadyException`: Model not ready (503)

### S3 Errors
- `NoSuchKey`: Image not found (404)
- `AccessDenied`: Cannot access image (403)

### DynamoDB Errors
- `ResourceNotFoundException`: Table not found (500)
- `ProvisionedThroughputExceededException`: Capacity exceeded (503)
- `ConditionalCheckFailedException`: Condition failed (409)

### Timeout Errors
- Operation timeout (504)

**Requirements Validated**:
- 5.7: Comprehensive error handling with descriptive messages
- Logs errors with full context
- Returns appropriate HTTP status codes
- Handles Rekognition, Bedrock, S3, DynamoDB, and timeout errors

## DynamoDB Schema

### DiseaseAnalyses Table

**Primary Key**:
- Partition Key: `imageId` (String)
- Sort Key: `analysisId` (String)

**Attributes**:
- `analysisId`: String (UUID)
- `imageId`: String (UUID)
- `userId`: String (UUID)
- `farmId`: String (UUID)
- `cropType`: String
- `results`: List of disease results
  - `diseaseName`: String
  - `confidence`: Number (0-1)
  - `severity`: String (low|moderate|high|critical)
  - `affectedArea`: String
  - `recommendations`: List of strings
- `isUncertain`: Boolean
- `modelVersion`: String
- `processingTimeMs`: Number
- `analyzedAt`: String (ISO 8601)

**Global Secondary Indexes**:
1. `farmId-analyzedAt-index`
   - Partition Key: `farmId`
   - Sort Key: `analyzedAt`
   - Purpose: Query analyses by farm

2. `userId-analyzedAt-index`
   - Partition Key: `userId`
   - Sort Key: `analyzedAt`
   - Purpose: Query analyses by user

## IAM Permissions Required

### disease-detect Lambda
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::${bucket}/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "rekognition:DetectLabels"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/${env}-images",
        "arn:aws:dynamodb:*:*:table/${env}-disease-analyses"
      ]
    }
  ]
}
```

### disease-history Lambda
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:Query"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/${env}-disease-analyses",
        "arn:aws:dynamodb:*:*:table/${env}-disease-analyses/index/*"
      ]
    }
  ]
}
```

## Testing

### Unit Tests
Located in `test/unit/lambda/disease/`

Test coverage includes:
- Disease ranking by confidence score
- Error handling for various AWS service errors
- Request validation
- Response formatting

### Integration Tests
Located in `test/integration/lambda/disease/`

Test scenarios:
- End-to-end disease detection flow
- S3 trigger processing
- API Gateway request handling
- DynamoDB query operations
- Error scenarios (invalid images, service unavailable)

### Property-Based Tests
Located in `test/property/disease-detection/`

Properties tested:
- **Property 16**: Image upload triggers analysis (Requirement 5.1)
- **Property 17**: Confidence scores between 0 and 1 (Requirement 5.3)
- **Property 18**: Treatment recommendations provided (Requirement 5.5)
- **Property 19**: Analysis results persisted (Requirement 5.6)
- **Property 20**: Error handling and logging (Requirement 5.7)
- **Property 21**: Multiple diseases ranked by confidence (Requirement 5.9)

## Deployment

These Lambda functions are deployed as part of the ComputeStack in the CDK infrastructure.

**Configuration**:
- Runtime: Node.js 20.x
- Memory: 1024 MB (AI operations require more memory)
- Timeout: 60 seconds
- Architecture: ARM64 (Graviton2 for cost optimization)

**S3 Trigger Configuration**:
- Event: `s3:ObjectCreated:*`
- Prefix: (user-specific paths)
- Suffix: `.jpg`, `.jpeg`, `.png`, `.heic`

## Monitoring

**CloudWatch Metrics**:
- Invocation count
- Error count
- Duration (p50, p95, p99)
- Throttles
- Concurrent executions

**CloudWatch Alarms**:
- Error rate > 5% over 5 minutes
- Duration > 50 seconds (p95)
- Throttles > 0

**Custom Metrics**:
- Disease detection processing time
- Rekognition API latency
- Bedrock API latency
- Confidence score distribution

**Logs**:
All logs include structured context:
- Request ID
- Image ID
- Farm ID
- Crop type
- Processing time
- Error details (if applicable)

## Cost Optimization

**Strategies**:
1. Use ARM64 architecture (Graviton2) for 20% cost savings
2. Optimize memory allocation based on actual usage
3. Implement caching for frequently analyzed crop types
4. Use Bedrock on-demand pricing (no provisioned capacity)
5. Set appropriate DynamoDB TTL for old analyses
6. Use S3 Intelligent-Tiering for image storage

**Estimated Costs** (per 1000 analyses):
- Lambda execution: $0.20
- Rekognition DetectLabels: $1.00
- Bedrock Claude 3 Sonnet: $3.00
- DynamoDB writes: $0.01
- S3 data transfer: $0.05
- **Total**: ~$4.26 per 1000 analyses

## Future Enhancements

1. **Model Fine-tuning**: Train custom disease detection models for specific crops
2. **Batch Processing**: Support analyzing multiple images in a single request
3. **Real-time Notifications**: Send alerts when critical diseases are detected
4. **Historical Trends**: Analyze disease patterns over time for predictive insights
5. **Multi-language Support**: Provide recommendations in regional languages
6. **Offline Mode**: Cache common disease information for offline analysis
7. **Image Quality Validation**: Pre-check image quality before expensive AI calls
8. **A/B Testing**: Compare different AI models for accuracy improvements
