# Architecture Diagram - KrishiSankalp AI Platform

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                            │
│  React App | Mobile App | Web Browser (AWS Amplify)             │
└─────────────────────────────────────────────────────────────────┘
                            │
                    HTTPS/JWT Token
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API GATEWAY LAYER                             │
│  • 30+ Endpoints  • Rate Limiting  • JWT Validation             │
│  • WAF Protection • Request Logging • CORS                      │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    COMPUTE LAYER                                 │
│  AWS Lambda Functions (40+)                                     │
│  • Authentication  • Disease Detection  • Advisory              │
│  • IoT Processing  • Market Prediction  • Optimization          │
│  • Community       • Notifications      • Utilities             │
└─────────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┼───────────┐
                │           │           │
                ▼           ▼           ▼
┌──────────────────────────────────────────────────────────────────┐
│                    AI/ML LAYER                                    │
│  AWS Rekognition (Image Analysis)                               │
│  • Object Detection • Crop Disease Detection • 95%+ Accuracy    │
│                                                                   │
│  AWS Bedrock (Claude 3 Sonnet)                                  │
│  • Disease Diagnosis • Advisory • Price Prediction • 85%+       │
└──────────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┼───────────┐
                │           │           │
                ▼           ▼           ▼
┌──────────────────────────────────────────────────────────────────┐
│                    STORAGE LAYER                                  │
│  DynamoDB (10 Tables)  │  S3 (2 Buckets)  │  ElastiCache (Redis)│
│  • Users               │  • Images        │  • Session Cache    │
│  • Farms               │  • Backups       │  • Price Cache      │
│  • Analyses            │  • Documents     │  • Sensor Cache     │
│  • Sensor Data         │  • Logs          │  • Sub-ms Latency   │
│  • Chat History        │  • Lifecycle     │  • 50K ops/sec      │
└──────────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┼───────────┐
                │           │           │
                ▼           ▼           ▼
┌──────────────────────────────────────────────────────────────────┐
│                    IOT LAYER                                      │
│  AWS IoT Core                                                    │
│  • MQTT Protocol  • Device Registry  • Rules Engine             │
│  • 5-min Data Collection  • Millions of Devices                 │
│  • Temperature, Humidity, Soil Moisture, pH, Light              │
└──────────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┼───────────┐
                │           │           │
                ▼           ▼           ▼
┌──────────────────────────────────────────────────────────────────┐
│                    NOTIFICATION LAYER                             │
│  SNS (Email/SMS)  │  In-App Notifications  │  Push Notifications│
│  • Real-time Alerts  • 99.99% Delivery  • <100ms Latency       │
└──────────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┼───────────┐
                │           │           │
                ▼           ▼           ▼
┌──────────────────────────────────────────────────────────────────┐
│                    SECURITY LAYER                                 │
│  Cognito (Auth)  │  IAM (Access)  │  KMS (Encryption)  │  WAF   │
│  • MFA Support   │  • Role-based   │  • AES-256         │  • DDoS│
│  • User Pools    │  • Least Priv   │  • TLS in Transit  │  • XSS │
└──────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│                    MONITORING LAYER                               │
│  CloudWatch (Logs & Metrics)  │  Alarms & Alerts                │
│  • Real-time Monitoring  • Performance Metrics  • Error Tracking │
└──────────────────────────────────────────────────────────────────┘
```

---

## Detailed Component Breakdown

### 1. Presentation Layer
- **React App**: Main web application (AWS Amplify)
- **Mobile App**: iOS/Android applications
- **Web Browser**: Cross-browser support
- **Features**: Dashboard, Disease Detection, Chat, Sensors, Market, Community

### 2. API Gateway Layer
- **Endpoints**: 30+ REST API endpoints
- **Rate Limiting**: 10,000 requests/second
- **JWT Validation**: Lambda Authorizer
- **WAF**: Web Application Firewall
- **Logging**: CloudWatch integration

### 3. Compute Layer
- **40+ Lambda Functions**:
  - Authentication (5 functions)
  - Disease Detection (6 functions)
  - Advisory (5 functions)
  - IoT Processing (4 functions)
  - Market Prediction (3 functions)
  - Resource Optimization (3 functions)
  - Community (4 functions)
  - Utilities (5 functions)

### 4. AI/ML Layer
- **AWS Rekognition**:
  - Image analysis
  - Object detection
  - Crop disease detection
  - 95%+ accuracy
  - <2 seconds response

- **AWS Bedrock (Claude 3)**:
  - Disease diagnosis
  - Advisory generation
  - Price prediction
  - Resource optimization
  - 85%+ accuracy
  - <3 seconds response

### 5. Storage Layer
- **DynamoDB** (10 Tables):
  - Users, Farms, Images, Analyses
  - Sensor Data, Chat, Prices, Optimizations
  - Alerts, Sessions
  - On-demand pricing, Auto-scaling

- **S3** (2 Buckets):
  - Crop images
  - Backups, Documents, Logs
  - Lifecycle policies
  - CloudFront CDN

- **ElastiCache (Redis)**:
  - Session cache (24h TTL)
  - Price cache (1h TTL)
  - Sensor cache (1h TTL)
  - Sub-millisecond latency

### 6. IoT Layer
- **AWS IoT Core**:
  - MQTT protocol
  - Device registry
  - Rules engine
  - Millions of devices

- **Sensors**:
  - Temperature (±0.5°C)
  - Humidity (±3%)
  - Soil Moisture (±5%)
  - Light Intensity (±10%)
  - pH Level (±0.2)

### 7. Notification Layer
- **SNS**: Email, SMS alerts
- **In-App**: Real-time notifications
- **Push**: Mobile notifications
- **99.99% delivery rate**

### 8. Security Layer
- **Cognito**: User authentication, MFA
- **IAM**: Role-based access control
- **KMS**: AES-256 encryption
- **WAF**: DDoS, XSS, SQL injection protection

### 9. Monitoring Layer
- **CloudWatch**: Logs, metrics, alarms
- **Performance**: Real-time monitoring
- **Alerts**: Automatic notifications

---

## Data Flow Architecture

```
User Input
    ↓
Frontend (React)
    ↓
API Gateway (Validation)
    ↓
Lambda (Business Logic)
    ↓
    ├─→ Rekognition (Image Analysis)
    ├─→ Bedrock (AI Processing)
    ├─→ IoT Core (Sensor Data)
    └─→ DynamoDB (Data Storage)
    ↓
Cache (ElastiCache)
    ↓
Response to Frontend
    ↓
Display to User
```

---

## Scalability & Performance

- **API Gateway**: 10,000 requests/second
- **Lambda**: 0-1,000 concurrent executions
- **DynamoDB**: Auto-scaling read/write
- **S3**: Unlimited storage
- **ElastiCache**: 50,000+ operations/second
- **IoT Core**: Millions of devices
- **Uptime**: 99.99% availability

---

## Security Features

- **Encryption**: AES-256 at rest, TLS in transit
- **Authentication**: Cognito with MFA
- **Authorization**: IAM role-based access
- **Network**: VPC, Security Groups
- **Monitoring**: CloudWatch, CloudTrail
- **Compliance**: GDPR, CCPA ready

---

## Cost Optimization

- **Lambda**: Pay per invocation
- **DynamoDB**: On-demand pricing
- **S3**: Lifecycle policies (Glacier after 90 days)
- **Reserved Capacity**: 30-40% savings
- **Development**: $50-100/month
- **Production (Low)**: $200-300/month
- **Production (High)**: $500-1000/month
