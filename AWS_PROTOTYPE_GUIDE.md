# AWS Prototype Implementation Guide

## Overview

This guide outlines how to build functional AWS prototypes showcasing the core functionality of the AI Rural Innovation Platform. The prototypes demonstrate key features using AWS services with minimal infrastructure setup.

## Prototype Scope

We'll build 4 core prototypes that showcase the most impactful features:

1. **Disease Detection Prototype** - AI-powered crop disease identification
2. **Market Intelligence Prototype** - Real-time price queries and buyer matching
3. **Resource Optimization Prototype** - Smart irrigation recommendations
4. **Advisory Chatbot Prototype** - Multilingual voice-enabled agricultural advisor

## Prerequisites

### AWS Account Setup
- AWS Account with appropriate permissions
- AWS CLI installed and configured
- Python 3.11+ installed locally
- Node.js 18+ for mobile app development

### Required AWS Services
- AWS Lambda
- API Gateway
- DynamoDB
- S3
- Rekognition (Custom Labels)
- SageMaker
- Lex
- Transcribe
- Polly
- Translate
- Cognito
- CloudWatch

## Prototype 1: Disease Detection Service

### Architecture
```
Mobile App → API Gateway → Lambda → Rekognition/SageMaker → DynamoDB → S3
```

### Implementation Steps

#### Step 1: Create S3 Bucket for Images
```bash
aws s3 mb s3://ai-rural-disease-images-prototype
aws s3api put-bucket-encryption \
  --bucket ai-rural-disease-images-prototype \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'
```

#### Step 2: Create DynamoDB Table
```bash
aws dynamodb create-table \
  --table-name DiseaseResults \
  --attribute-definitions \
    AttributeName=result_id,AttributeType=S \
    AttributeName=detected_at,AttributeType=S \
  --key-schema \
    AttributeName=result_id,KeyType=HASH \
    AttributeName=detected_at,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST
```

#### Step 3: Create Lambda Function

Create `disease_detection_lambda.py`:

```python
import json
import boto3
import base64
import uuid
from datetime import datetime

rekognition = boto3.client('rekognition')
s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('DiseaseResults')

BUCKET_NAME = 'ai-rural-disease-images-prototype'
CONFIDENCE_THRESHOLD = 0.85

def lambda_handler(event, context):
    try:
        # Parse request
        body = json.loads(event['body'])
        image_base64 = body['image']
        crop_type = body['crop_type']
        farmer_id = body['farmer_id']
        location = body.get('location', {})
        
        # Decode image
        image_bytes = base64.b64decode(image_base64)
        
        # Upload to S3
        result_id = str(uuid.uuid4())
        image_key = f"{farmer_id}/{result_id}.jpg"
        s3.put_object(
            Bucket=BUCKET_NAME,
            Key=image_key,
            Body=image_bytes,
            ContentType='image/jpeg'
        )
        
        # Call Rekognition Custom Labels
        response = rekognition.detect_custom_labels(
            ProjectVersionArn='arn:aws:rekognition:region:account:project/crop-disease/version/1',
            Image={'Bytes': image_bytes},
            MinConfidence=CONFIDENCE_THRESHOLD
        )
        
        # Process results
        if response['CustomLabels']:
            disease = response['CustomLabels'][0]
            disease_name = disease['Name']
            confidence = disease['Confidence'] / 100
            
            # Get treatment recommendations (simplified)
            treatments = get_treatments(disease_name)
            
            # Store in DynamoDB
            result = {
                'result_id': result_id,
                'farmer_id': farmer_id,
                'crop_type': crop_type,
                'image_url': f"s3://{BUCKET_NAME}/{image_key}",
                'disease_name': disease_name,
                'confidence': str(confidence),
                'detected_at': datetime.utcnow().isoformat(),
                'location': location,
                'treatments': treatments
            }
            table.put_item(Item=result)
            
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'result_id': result_id,
                    'disease_name': disease_name,
                    'confidence': confidence,
                    'treatments': treatments,
                    'message': 'Disease detected successfully'
                })
            }
        else:
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'No disease detected',
                    'confidence': 0
                })
            }
            
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def get_treatments(disease_name):
    # Simplified treatment database
    treatments_db = {
        'Rice Blast': [
            {
                'name': 'Tricyclazole',
                'type': 'chemical',
                'dosage': '0.6g per liter',
                'timing': 'Apply at tillering and booting stage'
            },
            {
                'name': 'Neem Oil',
                'type': 'organic',
                'dosage': '5ml per liter',
                'timing': 'Spray every 7 days'
            }
        ],
        'Wheat Rust': [
            {
                'name': 'Propiconazole',
                'type': 'chemical',
                'dosage': '1ml per liter',
                'timing': 'Apply at first sign of infection'
            }
        ]
    }
    return treatments_db.get(disease_name, [])
```

#### Step 4: Deploy Lambda Function
```bash
# Create deployment package
zip -r disease_detection.zip disease_detection_lambda.py

# Create Lambda function
aws lambda create-function \
  --function-name DiseaseDetectionFunction \
  --runtime python3.11 \
  --role arn:aws:iam::ACCOUNT_ID:role/LambdaExecutionRole \
  --handler disease_detection_lambda.lambda_handler \
  --zip-file fileb://disease_detection.zip \
  --timeout 30 \
  --memory-size 512
```

#### Step 5: Create API Gateway Endpoint
```bash
# Create REST API
aws apigateway create-rest-api \
  --name "AI-Rural-Platform-API" \
  --description "API for AI Rural Innovation Platform"

# Create resource and method (use AWS Console for simplicity)
# POST /detect-disease → DiseaseDetectionFunction
```

#### Step 6: Test the Prototype
```bash
# Test with sample image
curl -X POST https://your-api-id.execute-api.region.amazonaws.com/prod/detect-disease \
  -H "Content-Type: application/json" \
  -d '{
    "image": "base64_encoded_image_here",
    "crop_type": "rice",
    "farmer_id": "farmer123",
    "location": {"latitude": 28.6139, "longitude": 77.2090}
  }'
```

### Expected Output
```json
{
  "result_id": "uuid-here",
  "disease_name": "Rice Blast",
  "confidence": 0.92,
  "treatments": [
    {
      "name": "Tricyclazole",
      "type": "chemical",
      "dosage": "0.6g per liter",
      "timing": "Apply at tillering and booting stage"
    }
  ],
  "message": "Disease detected successfully"
}
```

## Prototype 2: Market Intelligence Service

### Architecture
```
Mobile App → API Gateway → Lambda → RDS PostgreSQL → DynamoDB Cache
```

### Implementation Steps

#### Step 1: Create RDS PostgreSQL Database
```bash
aws rds create-db-instance \
  --db-instance-identifier ai-rural-market-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password YourPassword123! \
  --allocated-storage 20 \
  --backup-retention-period 7
```

#### Step 2: Create Market Prices Table
```sql
CREATE TABLE market_prices (
    price_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crop_type VARCHAR(50) NOT NULL,
    market_name VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    price_per_kg DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    quality_grade VARCHAR(20),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(100)
);

CREATE INDEX idx_crop_type ON market_prices(crop_type);
CREATE INDEX idx_timestamp ON market_prices(timestamp);
CREATE INDEX idx_location ON market_prices(latitude, longitude);
```

#### Step 3: Seed Sample Data
```sql
INSERT INTO market_prices (crop_type, market_name, latitude, longitude, price_per_kg, quality_grade, source)
VALUES
    ('rice', 'Delhi Mandi', 28.6139, 77.2090, 25.50, 'Grade A', 'Government API'),
    ('rice', 'Gurgaon Market', 28.4595, 77.0266, 24.80, 'Grade A', 'Government API'),
    ('wheat', 'Delhi Mandi', 28.6139, 77.2090, 22.00, 'Grade A', 'Government API'),
    ('cotton', 'Mumbai Market', 19.0760, 72.8777, 65.00, 'Grade B', 'Government API');
```

#### Step 4: Create Lambda Function for Price Queries
Create `market_intelligence_lambda.py`:

```python
import json
import psycopg2
from math import radians, cos, sin, asin, sqrt

DB_HOST = 'your-rds-endpoint.rds.amazonaws.com'
DB_NAME = 'ai_rural_db'
DB_USER = 'admin'
DB_PASSWORD = 'YourPassword123!'

def lambda_handler(event, context):
    try:
        params = event['queryStringParameters']
        crop_type = params['crop_type']
        latitude = float(params['latitude'])
        longitude = float(params['longitude'])
        radius_km = int(params.get('radius_km', 50))
        
        # Connect to database
        conn = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
        cursor = conn.cursor()
        
        # Query prices within radius
        query = """
            SELECT price_id, crop_type, market_name, latitude, longitude,
                   price_per_kg, currency, quality_grade, timestamp, source
            FROM market_prices
            WHERE crop_type = %s
            AND timestamp > NOW() - INTERVAL '24 hours'
            ORDER BY timestamp DESC
        """
        cursor.execute(query, (crop_type,))
        results = cursor.fetchall()
        
        # Filter by distance
        nearby_prices = []
        for row in results:
            market_lat, market_lon = row[3], row[4]
            distance = haversine(latitude, longitude, market_lat, market_lon)
            if distance <= radius_km:
                nearby_prices.append({
                    'price_id': str(row[0]),
                    'crop_type': row[1],
                    'market_name': row[2],
                    'location': {'latitude': float(row[3]), 'longitude': float(row[4])},
                    'price_per_kg': float(row[5]),
                    'currency': row[6],
                    'quality_grade': row[7],
                    'timestamp': row[8].isoformat(),
                    'source': row[9],
                    'distance_km': round(distance, 2)
                })
        
        # Sort by price (highest first)
        nearby_prices.sort(key=lambda x: x['price_per_kg'], reverse=True)
        
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'crop_type': crop_type,
                'markets_found': len(nearby_prices),
                'prices': nearby_prices[:5]  # Return top 5
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def haversine(lat1, lon1, lat2, lon2):
    """Calculate distance between two points in km"""
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    km = 6371 * c
    return km
```

#### Step 5: Test Market Intelligence
```bash
curl "https://your-api-id.execute-api.region.amazonaws.com/prod/market-prices?crop_type=rice&latitude=28.6139&longitude=77.2090&radius_km=50"
```

## Prototype 3: Resource Optimization (Smart Irrigation)

### Architecture
```
IoT Sensors → IoT Core → Lambda → SageMaker → DynamoDB
```

### Implementation Steps

#### Step 1: Create IoT Thing
```bash
# Create IoT Thing
aws iot create-thing --thing-name soil-sensor-001

# Create and attach certificate
aws iot create-keys-and-certificate \
  --set-as-active \
  --certificate-pem-outfile cert.pem \
  --public-key-outfile public.key \
  --private-key-outfile private.key
```

#### Step 2: Create Lambda for Irrigation Recommendations
Create `irrigation_optimizer_lambda.py`:

```python
import json
import boto3
from datetime import datetime, timedelta

dynamodb = boto3.resource('dynamodb')
sensor_table = dynamodb.Table('SensorReadings')

def lambda_handler(event, context):
    try:
        # Parse sensor data
        device_id = event['device_id']
        soil_moisture = event['soil_moisture']  # percentage
        temperature = event['temperature']  # celsius
        humidity = event['humidity']  # percentage
        
        # Store sensor reading
        reading = {
            'device_id': device_id,
            'timestamp': datetime.utcnow().isoformat(),
            'soil_moisture': str(soil_moisture),
            'temperature': str(temperature),
            'humidity': str(humidity)
        }
        sensor_table.put_item(Item=reading)
        
        # Simple irrigation logic (can be replaced with SageMaker model)
        recommendation = calculate_irrigation(soil_moisture, temperature, humidity)
        
        return {
            'statusCode': 200,
            'body': json.dumps(recommendation)
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def calculate_irrigation(soil_moisture, temperature, humidity):
    """Calculate irrigation recommendation"""
    
    # Optimal soil moisture: 60-80%
    if soil_moisture < 40:
        urgency = 'critical'
        water_amount = 20  # liters per sq meter
        duration = 30  # minutes
    elif soil_moisture < 60:
        urgency = 'high'
        water_amount = 15
        duration = 20
    elif soil_moisture < 80:
        urgency = 'medium'
        water_amount = 10
        duration = 15
    else:
        urgency = 'none'
        water_amount = 0
        duration = 0
    
    # Adjust for temperature and humidity
    if temperature > 35:
        water_amount *= 1.2
    if humidity < 30:
        water_amount *= 1.1
    
    return {
        'urgency': urgency,
        'water_amount_liters_per_sqm': round(water_amount, 2),
        'duration_minutes': duration,
        'current_soil_moisture': soil_moisture,
        'optimal_range': '60-80%',
        'recommendation': f"Irrigate for {duration} minutes" if duration > 0 else "No irrigation needed",
        'next_check': (datetime.utcnow() + timedelta(hours=6)).isoformat()
    }
```

#### Step 3: Simulate IoT Sensor Data
```python
# simulate_sensor.py
import json
import boto3
import random
import time

iot_client = boto3.client('iot-data')

def publish_sensor_data():
    data = {
        'device_id': 'soil-sensor-001',
        'soil_moisture': random.uniform(30, 90),
        'temperature': random.uniform(20, 40),
        'humidity': random.uniform(20, 80)
    }
    
    iot_client.publish(
        topic='sensors/soil/data',
        qos=1,
        payload=json.dumps(data)
    )
    print(f"Published: {data}")

# Publish every 10 seconds
while True:
    publish_sensor_data()
    time.sleep(10)
```

## Prototype 4: Multilingual Advisory Chatbot

### Architecture
```
Mobile App → API Gateway → Lambda → Lex → Translate → Polly
```

### Implementation Steps

#### Step 1: Create Lex Bot
```bash
# Create bot (use AWS Console for easier setup)
# Bot name: AgriAdvisorBot
# Intents: CropCultivation, PestManagement, WeatherAdvice, MarketPrices
```

#### Step 2: Create Chatbot Lambda
Create `chatbot_lambda.py`:

```python
import json
import boto3

lex_client = boto3.client('lexv2-runtime')
translate_client = boto3.client('translate')
polly_client = boto3.client('polly')

BOT_ID = 'your-bot-id'
BOT_ALIAS_ID = 'your-alias-id'
LOCALE_ID = 'en_US'

def lambda_handler(event, context):
    try:
        body = json.loads(event['body'])
        user_text = body['text']
        language = body.get('language', 'en')  # hi, ta, te, bn, mr
        farmer_id = body['farmer_id']
        
        # Translate to English if needed
        if language != 'en':
            translation = translate_client.translate_text(
                Text=user_text,
                SourceLanguageCode=language,
                TargetLanguageCode='en'
            )
            english_text = translation['TranslatedText']
        else:
            english_text = user_text
        
        # Send to Lex
        lex_response = lex_client.recognize_text(
            botId=BOT_ID,
            botAliasId=BOT_ALIAS_ID,
            localeId=LOCALE_ID,
            sessionId=farmer_id,
            text=english_text
        )
        
        # Get response
        bot_message = lex_response['messages'][0]['content']
        confidence = lex_response.get('sessionState', {}).get('intent', {}).get('confirmationState', 'None')
        
        # Translate back to user's language
        if language != 'en':
            translation = translate_client.translate_text(
                Text=bot_message,
                SourceLanguageCode='en',
                TargetLanguageCode=language
            )
            response_text = translation['TranslatedText']
        else:
            response_text = bot_message
        
        # Generate audio with Polly
        polly_response = polly_client.synthesize_speech(
            Text=response_text,
            OutputFormat='mp3',
            VoiceId=get_voice_for_language(language)
        )
        
        audio_stream = polly_response['AudioStream'].read()
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'text_response': response_text,
                'audio_base64': audio_stream.hex(),
                'confidence': confidence,
                'language': language
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def get_voice_for_language(language):
    voices = {
        'en': 'Joanna',
        'hi': 'Aditi',
        'ta': 'Aditi',
        'te': 'Aditi',
        'bn': 'Aditi',
        'mr': 'Aditi'
    }
    return voices.get(language, 'Joanna')
```

## Testing All Prototypes

### Create Test Script
```python
# test_prototypes.py
import requests
import json
import base64

API_BASE_URL = "https://your-api-id.execute-api.region.amazonaws.com/prod"

def test_disease_detection():
    print("Testing Disease Detection...")
    with open('sample_rice_image.jpg', 'rb') as f:
        image_base64 = base64.b64encode(f.read()).decode()
    
    response = requests.post(
        f"{API_BASE_URL}/detect-disease",
        json={
            "image": image_base64,
            "crop_type": "rice",
            "farmer_id": "test_farmer_001",
            "location": {"latitude": 28.6139, "longitude": 77.2090}
        }
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}\n")

def test_market_prices():
    print("Testing Market Intelligence...")
    response = requests.get(
        f"{API_BASE_URL}/market-prices",
        params={
            "crop_type": "rice",
            "latitude": 28.6139,
            "longitude": 77.2090,
            "radius_km": 50
        }
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}\n")

def test_chatbot():
    print("Testing Advisory Chatbot...")
    response = requests.post(
        f"{API_BASE_URL}/chatbot",
        json={
            "text": "How do I treat rice blast disease?",
            "language": "en",
            "farmer_id": "test_farmer_001"
        }
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}\n")

if __name__ == "__main__":
    test_disease_detection()
    test_market_prices()
    test_chatbot()
```

## Deployment Checklist

- [ ] All AWS services provisioned
- [ ] Lambda functions deployed
- [ ] API Gateway endpoints configured
- [ ] DynamoDB tables created
- [ ] S3 buckets configured with encryption
- [ ] IAM roles and policies set up
- [ ] CloudWatch logging enabled
- [ ] Test scripts executed successfully
- [ ] Sample data loaded
- [ ] Documentation updated

## Cost Estimation (Prototype)

**Monthly costs for prototype with 100 test users:**
- Lambda: $5-10
- API Gateway: $3-5
- DynamoDB: $2-5
- S3: $1-2
- Rekognition: $10-20
- Lex: $5-10
- RDS (t3.micro): $15-20
- **Total: ~$50-75/month**

## Next Steps

1. Deploy prototypes to AWS
2. Create mobile app UI to interact with APIs
3. Conduct user testing with sample farmers
4. Gather feedback and iterate
5. Scale infrastructure for production
6. Implement remaining features from tasks.md

## Support and Resources

- AWS Documentation: https://docs.aws.amazon.com
- AWS Free Tier: https://aws.amazon.com/free
- AWS Architecture Center: https://aws.amazon.com/architecture
- Project Tasks: See `.kiro/specs/ai-rural-innovation-platform/tasks.md`
