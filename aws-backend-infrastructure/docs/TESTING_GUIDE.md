# Testing Guide

Comprehensive guide for testing all features of the AWS Backend Infrastructure for the AI Rural Innovation Platform.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Testing Authentication](#testing-authentication)
- [Testing Farm Management](#testing-farm-management)
- [Testing Image Upload](#testing-image-upload)
- [Testing Disease Detection](#testing-disease-detection)
- [Testing IoT Integration](#testing-iot-integration)
- [Testing Market Prices](#testing-market-prices)
- [Testing Resource Optimization](#testing-resource-optimization)
- [Testing Advisory Chatbot](#testing-advisory-chatbot)
- [Testing Alerts](#testing-alerts)
- [Automated Testing](#automated-testing)
- [Performance Testing](#performance-testing)
- [Troubleshooting](#troubleshooting)

## Overview

This guide provides detailed instructions for testing all major features of the AWS backend infrastructure. It covers both manual testing using tools like Postman/curl and automated testing approaches.

### Testing Environments

- **Development**: `https://dev-api.example.com` (replace with your dev API endpoint)
- **Staging**: `https://staging-api.example.com` (replace with your staging API endpoint)
- **Production**: `https://api.example.com` (replace with your production API endpoint)

### Required Tools

- **Postman** or **curl** for API testing
- **AWS CLI** for AWS service interaction
- **MQTT client** (e.g., MQTT.fx, mosquitto) for IoT testing
- **Node.js** and **npm** for running automated tests
- **jq** (optional) for JSON parsing in command line

## Prerequisites

### 1. Get API Endpoint

After deployment, retrieve your API Gateway endpoint:

```bash
# Get the API endpoint from CloudFormation outputs
aws cloudformation describe-stacks \
  --stack-name APIStack-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
  --output text
```

### 2. Set Environment Variables


```bash
# Set your API endpoint
export API_ENDPOINT="https://your-api-id.execute-api.us-east-1.amazonaws.com/prod"

# You'll set these after testing authentication
export ACCESS_TOKEN=""
export USER_ID=""
```

### 3. Import Postman Collection

The project includes a Postman collection at `docs/api/postman-collection.json`. Import this into Postman for easier testing.

## Testing Authentication

Authentication is the foundation for all other API calls. Test this first to obtain access tokens.

### Test 1: User Registration

Register a new user account.

**Using curl:**

```bash
curl -X POST "${API_ENDPOINT}/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testfarmer@example.com",
    "password": "TestPass123!",
    "name": "Test Farmer",
    "phone": "+1234567890",
    "role": "farmer"
  }'
```

**Expected Response (201):**

```json
{
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "email": "testfarmer@example.com",
  "message": "Verification email sent"
}
```

**Validation:**
- Check your email for verification link
- Click the verification link to activate the account
- Verify the user appears in Cognito User Pool

**Using AWS CLI to verify:**

```bash
aws cognito-idp list-users \
  --user-pool-id <your-user-pool-id> \
  --filter "email = \"testfarmer@example.com\""
```

### Test 2: Email Verification

If testing in development, you may need to manually verify the user:

```bash
aws cognito-idp admin-confirm-sign-up \
  --user-pool-id <your-user-pool-id> \
  --username testfarmer@example.com
```

### Test 3: User Login


Login with the registered user credentials.

**Using curl:**

```bash
curl -X POST "${API_ENDPOINT}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testfarmer@example.com",
    "password": "TestPass123!"
  }'
```

**Expected Response (200):**

```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "role": "farmer"
}
```

**Save the tokens:**

```bash
export ACCESS_TOKEN="<paste-access-token-here>"
export USER_ID="<paste-user-id-here>"
```

### Test 4: Token Refresh

Test refreshing the access token using the refresh token.

**Using curl:**

```bash
curl -X POST "${API_ENDPOINT}/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<your-refresh-token>"
  }'
```

**Expected Response (200):**

```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

### Test 5: Invalid Credentials

Test authentication failure handling.

**Using curl:**

```bash
curl -X POST "${API_ENDPOINT}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testfarmer@example.com",
    "password": "WrongPassword123!"
  }'
```

**Expected Response (401):**

```json
{
  "error": "Unauthorized",
  "message": "Invalid credentials"
}
```

## Testing Farm Management

Test CRUD operations for farm profiles. All endpoints require authentication.

### Test 6: Create Farm


Create a new farm profile.

**Using curl:**

```bash
curl -X POST "${API_ENDPOINT}/farms" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -d '{
    "name": "Green Valley Farm",
    "location": {
      "latitude": 28.6139,
      "longitude": 77.2090,
      "address": "Village Rampur, District Meerut, UP"
    },
    "cropTypes": ["wheat", "rice", "sugarcane"],
    "acreage": 15.5,
    "soilType": "loamy"
  }'
```

**Expected Response (201):**

```json
{
  "farmId": "f9e8d7c6-b5a4-3210-fedc-ba0987654321",
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Green Valley Farm",
  "location": {
    "latitude": 28.6139,
    "longitude": 77.2090,
    "address": "Village Rampur, District Meerut, UP"
  },
  "cropTypes": ["wheat", "rice", "sugarcane"],
  "acreage": 15.5,
  "soilType": "loamy",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Save the farmId:**

```bash
export FARM_ID="<paste-farm-id-here>"
```

### Test 7: List Farms

Retrieve all farms for the authenticated user.

**Using curl:**

```bash
curl -X GET "${API_ENDPOINT}/farms" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
```

**Expected Response (200):**

```json
{
  "farms": [
    {
      "farmId": "f9e8d7c6-b5a4-3210-fedc-ba0987654321",
      "name": "Green Valley Farm",
      "location": {...},
      "cropTypes": ["wheat", "rice", "sugarcane"],
      "acreage": 15.5,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "count": 1
}
```

### Test 8: Get Farm Details


Retrieve details for a specific farm.

**Using curl:**

```bash
curl -X GET "${API_ENDPOINT}/farms/${FARM_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
```

**Expected Response (200):**

```json
{
  "farmId": "f9e8d7c6-b5a4-3210-fedc-ba0987654321",
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Green Valley Farm",
  "location": {...},
  "cropTypes": ["wheat", "rice", "sugarcane"],
  "acreage": 15.5,
  "soilType": "loamy",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### Test 9: Update Farm

Update farm information.

**Using curl:**

```bash
curl -X PUT "${API_ENDPOINT}/farms/${FARM_ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -d '{
    "name": "Green Valley Farm Updated",
    "cropTypes": ["wheat", "rice", "sugarcane", "corn"],
    "acreage": 16.0
  }'
```

**Expected Response (200):**

```json
{
  "farmId": "f9e8d7c6-b5a4-3210-fedc-ba0987654321",
  "name": "Green Valley Farm Updated",
  "cropTypes": ["wheat", "rice", "sugarcane", "corn"],
  "acreage": 16.0,
  "updatedAt": "2024-01-16T14:20:00Z"
}
```

### Test 10: Delete Farm

Soft-delete a farm (sets deletedAt timestamp).

**Using curl:**

```bash
curl -X DELETE "${API_ENDPOINT}/farms/${FARM_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
```

**Expected Response (200):**

```json
{
  "message": "Farm deleted successfully",
  "farmId": "f9e8d7c6-b5a4-3210-fedc-ba0987654321",
  "deletedAt": "2024-01-20T09:15:00Z"
}
```

## Testing Image Upload

Test the image upload flow for disease detection.

### Test 11: Request Upload URL


Request a pre-signed URL for uploading an image.

**Using curl:**

```bash
curl -X POST "${API_ENDPOINT}/images/upload-url" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -d '{
    "farmId": "'"${FARM_ID}"'",
    "fileName": "wheat_leaf.jpg",
    "contentType": "image/jpeg"
  }'
```

**Expected Response (200):**

```json
{
  "uploadUrl": "https://s3.amazonaws.com/dev-farm-images-123456789/...",
  "imageId": "img-12345678-abcd-ef12-3456-789012345678",
  "expiresIn": 900
}
```

**Save the values:**

```bash
export UPLOAD_URL="<paste-upload-url-here>"
export IMAGE_ID="<paste-image-id-here>"
```

### Test 12: Upload Image to S3

Upload an actual image file using the pre-signed URL.

**Using curl:**

```bash
# Prepare a test image (or use your own)
curl -X PUT "${UPLOAD_URL}" \
  -H "Content-Type: image/jpeg" \
  --data-binary "@/path/to/your/test-image.jpg"
```

**Expected Response (200):**
- Empty response body with 200 status code indicates success

**Validation:**
- Check S3 bucket to verify image was uploaded
- Check Images table in DynamoDB

```bash
aws s3 ls s3://dev-farm-images-<account-id>/${USER_ID}/${FARM_ID}/ --recursive
```

### Test 13: Request Download URL

Request a pre-signed URL for downloading an image.

**Using curl:**

```bash
curl -X GET "${API_ENDPOINT}/images/${IMAGE_ID}/download-url" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
```

**Expected Response (200):**

```json
{
  "downloadUrl": "https://s3.amazonaws.com/dev-farm-images-123456789/...",
  "expiresIn": 300
}
```

**Test the download:**

```bash
curl -o downloaded-image.jpg "<paste-download-url-here>"
```

## Testing Disease Detection

Test AI-powered disease detection from uploaded images.

### Test 14: Analyze Image for Disease


Trigger disease detection analysis on an uploaded image.

**Using curl:**

```bash
curl -X POST "${API_ENDPOINT}/disease-detection/analyze" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -d '{
    "imageId": "'"${IMAGE_ID}"'",
    "farmId": "'"${FARM_ID}"'",
    "cropType": "wheat"
  }'
```

**Expected Response (200):**

```json
{
  "analysisId": "analysis-12345678-abcd-ef12-3456-789012345678",
  "imageId": "img-12345678-abcd-ef12-3456-789012345678",
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
    },
    {
      "diseaseName": "Leaf Blight",
      "confidence": 0.45,
      "severity": "mild",
      "affectedArea": "leaves",
      "recommendations": [
        "Monitor closely for progression",
        "Ensure proper drainage"
      ]
    }
  ],
  "isUncertain": false,
  "analyzedAt": "2024-01-15T11:00:00Z",
  "processingTimeMs": 3420
}
```

**Validation:**
- Verify diseases are ranked by confidence score (descending)
- Verify processing time is under 5 seconds
- Check DynamoDB DiseaseAnalyses table for stored results

### Test 15: Get Disease Detection History

Retrieve past disease detection analyses.

**Using curl:**

```bash
curl -X GET "${API_ENDPOINT}/disease-detection/history?farmId=${FARM_ID}&limit=20" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
```

**Expected Response (200):**

```json
{
  "analyses": [
    {
      "analysisId": "analysis-12345678-abcd-ef12-3456-789012345678",
      "imageId": "img-12345678-abcd-ef12-3456-789012345678",
      "farmId": "f9e8d7c6-b5a4-3210-fedc-ba0987654321",
      "diseaseName": "Wheat Rust",
      "confidence": 0.87,
      "analyzedAt": "2024-01-15T11:00:00Z"
    }
  ],
  "count": 1,
  "nextToken": null
}
```

## Testing IoT Integration

Test real-time sensor data ingestion and querying.

### Test 16: Set Up IoT Device


Create a test IoT device and certificate.

**Create IoT Thing:**

```bash
# Create a thing
aws iot create-thing --thing-name test-sensor-001

# Create keys and certificate
aws iot create-keys-and-certificate \
  --set-as-active \
  --certificate-pem-outfile cert.pem \
  --public-key-outfile public.key \
  --private-key-outfile private.key \
  --query 'certificateArn' \
  --output text > cert-arn.txt

# Attach policy to certificate
aws iot attach-policy \
  --policy-name IoTDevicePolicy-dev \
  --target $(cat cert-arn.txt)

# Attach certificate to thing
aws iot attach-thing-principal \
  --thing-name test-sensor-001 \
  --principal $(cat cert-arn.txt)
```

**Get IoT endpoint:**

```bash
export IOT_ENDPOINT=$(aws iot describe-endpoint \
  --endpoint-type iot:Data-ATS \
  --query 'endpointAddress' \
  --output text)

echo "IoT Endpoint: ${IOT_ENDPOINT}"
```

### Test 17: Publish Sensor Data

Publish sensor data using MQTT.

**Using mosquitto_pub:**

```bash
# Install mosquitto client if not already installed
# Ubuntu/Debian: sudo apt-get install mosquitto-clients
# macOS: brew install mosquitto

# Publish soil moisture reading
mosquitto_pub \
  --cafile AmazonRootCA1.pem \
  --cert cert.pem \
  --key private.key \
  -h ${IOT_ENDPOINT} \
  -p 8883 \
  -t "farm/${FARM_ID}/sensors/soil_moisture" \
  -m '{
    "deviceId": "test-sensor-001",
    "sensorType": "soil_moisture",
    "value": 45.2,
    "unit": "percent",
    "timestamp": "2024-01-15T14:00:00Z"
  }'

# Publish temperature reading
mosquitto_pub \
  --cafile AmazonRootCA1.pem \
  --cert cert.pem \
  --key private.key \
  -h ${IOT_ENDPOINT} \
  -p 8883 \
  -t "farm/${FARM_ID}/sensors/temperature" \
  -m '{
    "deviceId": "test-sensor-001",
    "sensorType": "temperature",
    "value": 28.5,
    "unit": "celsius",
    "timestamp": "2024-01-15T14:00:00Z"
  }'
```

**Download Amazon Root CA:**

```bash
curl -o AmazonRootCA1.pem https://www.amazontrust.com/repository/AmazonRootCA1.pem
```

### Test 18: Query Sensor Data


Query stored sensor data via API.

**Using curl:**

```bash
# Query all sensor data for a farm
curl -X GET "${API_ENDPOINT}/sensors/data?farmId=${FARM_ID}&aggregation=raw&limit=50" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
```

**Expected Response (200):**

```json
{
  "data": [
    {
      "deviceId": "test-sensor-001",
      "sensorType": "soil_moisture",
      "value": 45.2,
      "unit": "percent",
      "timestamp": "2024-01-15T14:00:00Z"
    },
    {
      "deviceId": "test-sensor-001",
      "sensorType": "temperature",
      "value": 28.5,
      "unit": "celsius",
      "timestamp": "2024-01-15T14:00:00Z"
    }
  ],
  "count": 2,
  "aggregation": "raw"
}
```

**Query specific sensor type:**

```bash
curl -X GET "${API_ENDPOINT}/sensors/data?farmId=${FARM_ID}&sensorType=soil_moisture" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
```

**Query aggregated data:**

```bash
curl -X GET "${API_ENDPOINT}/sensors/data?farmId=${FARM_ID}&aggregation=hourly" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
```

### Test 19: Query Device Details

Get details and statistics for a specific device.

**Using curl:**

```bash
curl -X GET "${API_ENDPOINT}/sensors/data/test-sensor-001" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
```

**Expected Response (200):**

```json
{
  "deviceId": "test-sensor-001",
  "farmId": "f9e8d7c6-b5a4-3210-fedc-ba0987654321",
  "sensorType": "soil_moisture",
  "status": "active",
  "lastReading": {
    "value": 45.2,
    "unit": "percent",
    "timestamp": "2024-01-15T14:00:00Z"
  },
  "statistics": {
    "min": 32.1,
    "max": 58.3,
    "avg": 44.7,
    "period": "24h"
  }
}
```

### Test 20: Verify Data Storage

Check DynamoDB to verify sensor data was stored.

**Using AWS CLI:**

```bash
aws dynamodb query \
  --table-name dev-sensor-data \
  --key-condition-expression "deviceId = :deviceId" \
  --expression-attribute-values '{":deviceId":{"S":"test-sensor-001"}}' \
  --limit 10
```

## Testing Market Prices


Test market price retrieval and predictions.

### Test 21: Get Market Prices

Retrieve current market prices for commodities.

**Using curl:**

```bash
# Get all market prices
curl -X GET "${API_ENDPOINT}/market-prices" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"

# Get prices for specific commodity
curl -X GET "${API_ENDPOINT}/market-prices?commodity=wheat" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"

# Get prices near a location
curl -X GET "${API_ENDPOINT}/market-prices?commodity=wheat&location=28.6139,77.2090&radius=50" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
```

**Expected Response (200):**

```json
{
  "prices": [
    {
      "priceId": "price-12345678-abcd-ef12-3456-789012345678",
      "commodity": "wheat",
      "price": 2500,
      "unit": "INR/quintal",
      "marketLocation": {
        "name": "Meerut Mandi",
        "latitude": 28.9845,
        "longitude": 77.7064,
        "distance": 12.5
      },
      "timestamp": "2024-01-15T08:00:00Z",
      "isStale": false
    }
  ],
  "count": 1,
  "lastUpdated": "2024-01-15T08:00:00Z"
}
```

### Test 22: Get Commodity Details

Get detailed price information for a specific commodity.

**Using curl:**

```bash
curl -X GET "${API_ENDPOINT}/market-prices/wheat" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
```

**Expected Response (200):**

```json
{
  "commodity": "wheat",
  "currentPrice": 2500,
  "unit": "INR/quintal",
  "priceHistory": [
    {
      "price": 2450,
      "timestamp": "2024-01-14T08:00:00Z"
    },
    {
      "price": 2480,
      "timestamp": "2024-01-13T08:00:00Z"
    }
  ],
  "trend": "increasing",
  "changePercent": 2.04
}
```

### Test 23: Request Price Prediction

Request AI-powered price predictions.

**Using curl:**

```bash
curl -X POST "${API_ENDPOINT}/market-prices/predict" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -d '{
    "commodity": "wheat",
    "horizons": [7, 14, 30]
  }'
```

**Expected Response (200):**

```json
{
  "commodity": "wheat",
  "predictions": [
    {
      "horizon": 7,
      "predictedPrice": 2550,
      "confidenceInterval": {
        "lower": 2500,
        "upper": 2600
      },
      "confidence": 0.85
    },
    {
      "horizon": 14,
      "predictedPrice": 2600,
      "confidenceInterval": {
        "lower": 2520,
        "upper": 2680
      },
      "confidence": 0.78
    }
  ],
  "generatedAt": "2024-01-15T12:00:00Z"
}
```

## Testing Resource Optimization


Test AI-powered resource optimization recommendations.

### Test 24: Calculate Water Optimization

Request irrigation recommendations.

**Using curl:**

```bash
curl -X POST "${API_ENDPOINT}/optimization/calculate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -d '{
    "farmId": "'"${FARM_ID}"'",
    "optimizationType": "water",
    "parameters": {
      "cropType": "wheat",
      "currentStage": "vegetative",
      "soilMoisture": 45,
      "weatherForecast": "sunny"
    }
  }'
```

**Expected Response (200):**

```json
{
  "optimizationId": "opt-12345678-abcd-ef12-3456-789012345678",
  "farmId": "f9e8d7c6-b5a4-3210-fedc-ba0987654321",
  "type": "water",
  "recommendations": {
    "dailyWaterRequirement": 25,
    "unit": "mm",
    "irrigationSchedule": [
      {
        "time": "06:00",
        "duration": 45,
        "unit": "minutes"
      },
      {
        "time": "18:00",
        "duration": 30,
        "unit": "minutes"
      }
    ],
    "estimatedSavings": {
      "water": 30,
      "unit": "percent",
      "costSavings": 450,
      "currency": "INR"
    }
  },
  "calculatedAt": "2024-01-15T12:00:00Z"
}
```

### Test 25: Calculate Fertilizer Optimization

Request fertilizer recommendations.

**Using curl:**

```bash
curl -X POST "${API_ENDPOINT}/optimization/calculate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -d '{
    "farmId": "'"${FARM_ID}"'",
    "optimizationType": "fertilizer",
    "parameters": {
      "cropType": "wheat",
      "currentStage": "flowering",
      "soilType": "loamy",
      "lastApplication": "2024-01-01"
    }
  }'
```

### Test 26: Get Optimization History

Retrieve past optimization recommendations.

**Using curl:**

```bash
curl -X GET "${API_ENDPOINT}/optimization/history?farmId=${FARM_ID}&type=water" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
```

**Expected Response (200):**

```json
{
  "optimizations": [
    {
      "optimizationId": "opt-12345678-abcd-ef12-3456-789012345678",
      "type": "water",
      "estimatedSavings": {
        "water": 30,
        "unit": "percent",
        "costSavings": 450,
        "currency": "INR"
      },
      "calculatedAt": "2024-01-15T12:00:00Z"
    }
  ],
  "count": 1
}
```

## Testing Advisory Chatbot


Test the AI-powered agricultural advisory chatbot.

### Test 27: Send Chat Message

Send a question to the advisory chatbot.

**Using curl:**

```bash
curl -X POST "${API_ENDPOINT}/advisory/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -d '{
    "message": "What is the best time to plant wheat in North India?",
    "farmId": "'"${FARM_ID}"'",
    "includeContext": true
  }'
```

**Expected Response (200):**

```json
{
  "messageId": "msg-12345678-abcd-ef12-3456-789012345678",
  "response": "The optimal time to plant wheat in North India is from mid-October to mid-November. Based on your farm location in Meerut, I recommend planting between October 25 and November 10. Current soil conditions and weather patterns suggest early November would be ideal this year.",
  "recommendations": [
    {
      "type": "planting_schedule",
      "action": "Plant wheat seeds",
      "timeframe": "November 1-10, 2024"
    }
  ],
  "sources": ["historical_weather_data", "farm_profile", "regional_guidelines"],
  "timestamp": "2024-01-15T13:00:00Z",
  "processingTimeMs": 1840
}
```

**Validation:**
- Verify response time is under 2 seconds
- Verify response is relevant to agriculture
- Verify farm context is included in response

### Test 28: Test Conversation Context

Send multiple messages to test context maintenance.

**Message 1:**

```bash
curl -X POST "${API_ENDPOINT}/advisory/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -d '{
    "message": "I am growing wheat on 15 acres",
    "farmId": "'"${FARM_ID}"'",
    "includeContext": true
  }'
```

**Message 2 (should reference previous context):**

```bash
curl -X POST "${API_ENDPOINT}/advisory/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -d '{
    "message": "How much fertilizer should I use?",
    "farmId": "'"${FARM_ID}"'",
    "includeContext": true
  }'
```

**Expected:** The second response should reference wheat and the 15-acre farm size.

### Test 29: Test Out-of-Scope Query

Test how the chatbot handles non-agricultural queries.

**Using curl:**

```bash
curl -X POST "${API_ENDPOINT}/advisory/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -d '{
    "message": "What is the capital of France?",
    "farmId": "'"${FARM_ID}"'",
    "includeContext": true
  }'
```

**Expected Response:**

```json
{
  "messageId": "msg-12345678-abcd-ef12-3456-789012345678",
  "response": "I'm here to help with agricultural questions and farm management. I can assist with topics like crop planning, pest control, irrigation, fertilization, and market information. How can I help you with your farming needs?",
  "timestamp": "2024-01-15T13:05:00Z",
  "processingTimeMs": 850
}
```

### Test 30: Get Chat History


Retrieve conversation history.

**Using curl:**

```bash
curl -X GET "${API_ENDPOINT}/advisory/history?limit=50" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
```

**Expected Response (200):**

```json
{
  "messages": [
    {
      "messageId": "msg-12345678-abcd-ef12-3456-789012345678",
      "role": "user",
      "content": "What is the best time to plant wheat in North India?",
      "timestamp": "2024-01-15T13:00:00Z"
    },
    {
      "messageId": "msg-87654321-dcba-21fe-6543-210987654321",
      "role": "assistant",
      "content": "The optimal time to plant wheat in North India...",
      "timestamp": "2024-01-15T13:00:05Z"
    }
  ],
  "count": 2,
  "hasMore": false
}
```

## Testing Alerts

Test alert creation, listing, and acknowledgment.

### Test 31: List Alerts

Retrieve alerts for the user.

**Using curl:**

```bash
# Get all alerts
curl -X GET "${API_ENDPOINT}/alerts" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"

# Filter by severity
curl -X GET "${API_ENDPOINT}/alerts?severity=high" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"

# Filter by status
curl -X GET "${API_ENDPOINT}/alerts?status=active" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"

# Filter by farm
curl -X GET "${API_ENDPOINT}/alerts?farmId=${FARM_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
```

**Expected Response (200):**

```json
{
  "alerts": [
    {
      "alertId": "alert-12345678-abcd-ef12-3456-789012345678",
      "farmId": "f9e8d7c6-b5a4-3210-fedc-ba0987654321",
      "type": "soil_moisture_low",
      "severity": "high",
      "message": "Soil moisture has dropped below 30% in Field A",
      "status": "active",
      "createdAt": "2024-01-15T15:00:00Z",
      "acknowledgedAt": null
    }
  ],
  "count": 1
}
```

### Test 32: Acknowledge Alert

Acknowledge an alert.

**Using curl:**

```bash
export ALERT_ID="alert-12345678-abcd-ef12-3456-789012345678"

curl -X PUT "${API_ENDPOINT}/alerts/${ALERT_ID}/acknowledge" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -d '{
    "note": "Irrigation scheduled for tomorrow morning"
  }'
```

**Expected Response (200):**

```json
{
  "alertId": "alert-12345678-abcd-ef12-3456-789012345678",
  "status": "acknowledged",
  "acknowledgedAt": "2024-01-15T15:30:00Z",
  "acknowledgedBy": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "note": "Irrigation scheduled for tomorrow morning"
}
```

### Test 33: Trigger Alert from Sensor Data


Test automatic alert creation from sensor threshold violations.

**Publish sensor data below threshold:**

```bash
mosquitto_pub \
  --cafile AmazonRootCA1.pem \
  --cert cert.pem \
  --key private.key \
  -h ${IOT_ENDPOINT} \
  -p 8883 \
  -t "farm/${FARM_ID}/sensors/soil_moisture" \
  -m '{
    "deviceId": "test-sensor-001",
    "sensorType": "soil_moisture",
    "value": 25.0,
    "unit": "percent",
    "timestamp": "2024-01-15T16:00:00Z"
  }'
```

**Wait a few seconds, then check alerts:**

```bash
curl -X GET "${API_ENDPOINT}/alerts?farmId=${FARM_ID}&status=active" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
```

**Expected:** A new alert should appear for low soil moisture.

## Automated Testing

The project includes automated test suites for comprehensive testing.

### Running Unit Tests

Run unit tests for Lambda functions and utilities.

```bash
cd aws-backend-infrastructure
npm test
```

**Expected output:**
- All unit tests should pass
- Code coverage report generated

### Running Integration Tests

Run integration tests against deployed infrastructure.

```bash
# Set environment
export TEST_ENV=dev
export API_ENDPOINT="<your-api-endpoint>"

# Run integration tests
npm run test:integration
```

**Integration tests cover:**
- Authentication flow (register, login, refresh)
- Farm CRUD operations
- Image upload and disease detection
- Market price retrieval
- Advisory chatbot interaction
- IoT data ingestion and querying
- Alert management

### Running Property-Based Tests

Run property-based tests to validate universal properties.

```bash
npm run test:property
```

**Property tests validate:**
- Request validation rejection
- Password validation enforcement
- Pre-signed URL generation
- Disease ranking by confidence
- Sensor message validation

### Running Smoke Tests

Run smoke tests to verify critical paths after deployment.

```bash
npm run test:smoke
```

**Smoke tests verify:**
- API Gateway is accessible
- Authentication endpoints work
- Database connectivity
- S3 bucket accessibility
- IoT Core connectivity

## Performance Testing

### Load Testing with Artillery


Test system performance under load.

**Install Artillery:**

```bash
npm install -g artillery
```

**Create load test configuration (artillery-config.yml):**

```yaml
config:
  target: "{{ $processEnvironment.API_ENDPOINT }}"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load"
    - duration: 60
      arrivalRate: 100
      name: "Peak load"
  variables:
    accessToken: "{{ $processEnvironment.ACCESS_TOKEN }}"

scenarios:
  - name: "Farm operations"
    flow:
      - get:
          url: "/farms"
          headers:
            Authorization: "Bearer {{ accessToken }}"
      - think: 2
      - post:
          url: "/farms"
          headers:
            Authorization: "Bearer {{ accessToken }}"
            Content-Type: "application/json"
          json:
            name: "Test Farm {{ $randomString() }}"
            location:
              latitude: 28.6139
              longitude: 77.2090
            cropTypes: ["wheat"]
            acreage: 10
```

**Run load test:**

```bash
export API_ENDPOINT="https://your-api-endpoint.com"
export ACCESS_TOKEN="your-access-token"

artillery run artillery-config.yml
```

**Performance benchmarks to verify:**
- API response time < 1 second for 95% of requests
- Error rate < 1%
- System handles 1000 concurrent requests
- DynamoDB read latency < 20ms at p99
- DynamoDB write latency < 50ms at p99

### Monitoring During Tests

Monitor CloudWatch metrics during load testing:

```bash
# Watch API Gateway metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name Latency \
  --dimensions Name=ApiName,Value=BackendAPI-dev \
  --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Average,Maximum

# Watch Lambda metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=farm-list-dev \
  --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Average,Maximum
```

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: 401 Unauthorized Error

**Symptoms:** API calls return 401 status code

**Solutions:**
1. Verify access token is valid and not expired
2. Check Authorization header format: `Bearer <token>`
3. Verify user is confirmed in Cognito
4. Try refreshing the token

```bash
# Check token expiration
echo $ACCESS_TOKEN | cut -d'.' -f2 | base64 -d | jq .exp
```

#### Issue 2: 403 Forbidden Error

**Symptoms:** API calls return 403 status code

**Solutions:**
1. Verify user has correct role/permissions
2. Check API Gateway resource policies
3. Verify Lambda execution role has required permissions
4. Check CloudWatch logs for authorization errors

#### Issue 3: Image Upload Fails

**Symptoms:** Image upload to S3 returns error

**Solutions:**
1. Verify pre-signed URL hasn't expired (15 min validity)
2. Check Content-Type header matches requested type
3. Verify file size is under 10MB
4. Check S3 bucket CORS configuration

```bash
# Check S3 bucket CORS
aws s3api get-bucket-cors --bucket dev-farm-images-<account-id>
```

#### Issue 4: Disease Detection Takes Too Long

**Symptoms:** Disease detection exceeds 5 second timeout

**Solutions:**
1. Check image size (should be < 10MB)
2. Verify Bedrock model is accessible
3. Check Lambda function timeout settings
4. Review CloudWatch logs for bottlenecks

```bash
# Check Lambda logs
aws logs tail /aws/lambda/disease-detect-dev --follow
```

#### Issue 5: IoT Messages Not Received


**Symptoms:** Sensor data not appearing in database

**Solutions:**
1. Verify device certificate is attached to thing
2. Check IoT policy allows publish to topic
3. Verify topic format: `farm/{farmId}/sensors/{sensorType}`
4. Check IoT Core logs for connection issues
5. Verify IoT Rule is enabled and routing correctly

```bash
# Check IoT thing
aws iot describe-thing --thing-name test-sensor-001

# List attached certificates
aws iot list-thing-principals --thing-name test-sensor-001

# Check IoT rule
aws iot get-topic-rule --rule-name SensorDataIngestionRule
```

#### Issue 6: Rate Limiting Errors

**Symptoms:** API returns 429 Too Many Requests

**Solutions:**
1. Reduce request rate to under 1000/minute per user
2. Implement exponential backoff in client
3. Check API Gateway usage plan settings
4. Consider requesting rate limit increase

#### Issue 7: Chatbot Returns Generic Responses

**Symptoms:** Advisory chatbot doesn't use farm context

**Solutions:**
1. Verify `includeContext: true` in request
2. Check farmId is valid and belongs to user
3. Verify farm has data (crops, location, sensors)
4. Review Bedrock prompt construction in logs

### Viewing Logs

**CloudWatch Logs:**

```bash
# View Lambda function logs
aws logs tail /aws/lambda/farm-create-dev --follow

# View API Gateway logs
aws logs tail /aws/apigateway/BackendAPI-dev --follow

# Search for errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/disease-detect-dev \
  --filter-pattern "ERROR"
```

**X-Ray Traces:**

```bash
# Get recent traces
aws xray get-trace-summaries \
  --start-time $(date -u -d '1 hour ago' +%s) \
  --end-time $(date -u +%s)
```

### Debugging Tips

1. **Enable verbose logging:** Set `LOG_LEVEL=debug` in Lambda environment variables
2. **Use X-Ray:** Enable X-Ray tracing to visualize request flow
3. **Check IAM permissions:** Verify Lambda execution roles have required permissions
4. **Test locally:** Use AWS SAM CLI to test Lambda functions locally
5. **Monitor metrics:** Watch CloudWatch dashboards during testing

### Getting Help

If you encounter issues not covered here:

1. Check CloudWatch Logs for detailed error messages
2. Review the deployment guide for configuration issues
3. Verify all prerequisites are met
4. Check AWS service quotas and limits
5. Review the API documentation for correct request formats

## Testing Checklist

Use this checklist to ensure comprehensive testing:

### Authentication
- [ ] User registration works
- [ ] Email verification works
- [ ] User login returns valid tokens
- [ ] Token refresh works
- [ ] Invalid credentials are rejected
- [ ] Password requirements are enforced

### Farm Management
- [ ] Create farm succeeds
- [ ] List farms returns user's farms
- [ ] Get farm details works
- [ ] Update farm succeeds
- [ ] Delete farm succeeds
- [ ] Unauthorized access is blocked

### Image Upload & Disease Detection
- [ ] Request upload URL succeeds
- [ ] Image upload to S3 works
- [ ] Disease detection completes within 5 seconds
- [ ] Results include confidence scores
- [ ] Diseases are ranked by confidence
- [ ] Treatment recommendations are provided
- [ ] Detection history is retrievable

### IoT Integration
- [ ] IoT device can connect
- [ ] Sensor data is published successfully
- [ ] Data appears in database within 1 second
- [ ] Sensor data is queryable via API
- [ ] Aggregated data is calculated
- [ ] Threshold alerts are triggered

### Market Prices
- [ ] Market prices are retrievable
- [ ] Commodity-specific prices work
- [ ] Location-based filtering works
- [ ] Price predictions are generated
- [ ] Predictions include confidence intervals

### Resource Optimization
- [ ] Water optimization recommendations work
- [ ] Fertilizer recommendations work
- [ ] Cost savings are calculated
- [ ] Optimization history is retrievable

### Advisory Chatbot
- [ ] Chat messages receive responses within 2 seconds
- [ ] Conversation context is maintained
- [ ] Farm context is included in responses
- [ ] Out-of-scope queries are handled gracefully
- [ ] Chat history is retrievable

### Alerts
- [ ] Alerts are listed correctly
- [ ] Alerts can be filtered by severity/status
- [ ] Alert acknowledgment works
- [ ] Automatic alerts are created from sensor thresholds

### Performance
- [ ] API response times < 1 second (p95)
- [ ] System handles 1000 concurrent requests
- [ ] Error rate < 1%
- [ ] Database latency meets requirements

### Security
- [ ] Authentication is required for protected endpoints
- [ ] Users can only access their own data
- [ ] Invalid tokens are rejected
- [ ] Rate limiting is enforced
- [ ] Data is encrypted in transit and at rest

## Conclusion

This testing guide provides comprehensive coverage of all major features in the AWS Backend Infrastructure. Follow the tests in order, starting with authentication, to ensure a complete validation of the system.

For automated testing, use the provided test suites:
- `npm test` - Unit tests
- `npm run test:integration` - Integration tests
- `npm run test:property` - Property-based tests
- `npm run test:smoke` - Smoke tests

For questions or issues, refer to the troubleshooting section or review CloudWatch logs for detailed error information.
