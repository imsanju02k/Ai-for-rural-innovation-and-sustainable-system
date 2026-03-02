# AWS Backend Architecture - AI Rural Innovation Platform

## 🏗️ High-Level Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[React App<br/>AWS Amplify]
    end
    
    subgraph "API Layer"
        B[API Gateway<br/>REST API]
        C[Lambda Authorizer<br/>JWT Validation]
    end
    
    subgraph "Authentication"
        D[Amazon Cognito<br/>User Pool]
        E[Cognito<br/>Identity Pool]
    end
    
    subgraph "Compute Layer - Lambda Functions"
        F1[Auth Functions]
        F2[Farm Management]
        F3[Disease Detection]
        F4[Market Prices]
        F5[Advisory Chat]
        F6[IoT Processing]
        F7[Optimization]
        F8[Alerts]
    end
    
    subgraph "AI/ML Services"
        G1[Amazon Bedrock<br/>Claude 3 Sonnet]
        G2[Amazon Rekognition<br/>Image Analysis]
    end
    
    subgraph "Storage Layer"
        H1[DynamoDB<br/>10 Tables]
        H2[S3 Buckets<br/>Images & Backups]
        H3[ElastiCache<br/>Redis]
    end
    
    subgraph "IoT Layer"
        I1[AWS IoT Core<br/>MQTT Broker]
        I2[IoT Rules Engine]
    end
    
    subgraph "Monitoring"
        J1[CloudWatch<br/>Logs & Metrics]
        J2[CloudWatch<br/>Alarms]
        J3[SNS Topics<br/>Notifications]
    end
    
    A -->|HTTPS| B
    B -->|Authorize| C
    C -->|Validate Token| D
    B -->|Invoke| F1
    B -->|Invoke| F2
    B -->|Invoke| F3
    B -->|Invoke| F4
    B -->|Invoke| F5
    B -->|Invoke| F7
    B -->|Invoke| F8
    
    F1 -->|Auth| D
    F1 -->|Store User| H1
    
    F2 -->|CRUD| H1
    F3 -->|Analyze| G2
    F3 -->|AI Detection| G1
    F3 -->|Store Results| H1
    F3 -->|Get Images| H2
    
    F4 -->|Query Prices| H1
    F4 -->|Cache| H3
    F4 -->|Predict| G1
    
    F5 -->|Chat| G1
    F5 -->|History| H1
    
    F7 -->|Optimize| G1
    F7 -->|Sensor Data| H1
    
    I1 -->|Trigger| I2
    I2 -->|Process| F6
    F6 -->|Store| H1
    F6 -->|Alert| F8
    
    F8 -->|Notify| J3
    
    F1 & F2 & F3 & F4 & F5 & F6 & F7 & F8 -->|Logs| J1
    J1 -->|Trigger| J2
    J2 -->|Alert| J3
    
    style A fill:#4CAF50
    style B fill:#2196F3
    style D fill:#FF9800
    style G1 fill:#9C27B0
    style G2 fill:#9C27B0
    style H1 fill:#F44336
    style I1 fill:#00BCD4
```

---

## 🔐 Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant APIGateway
    participant Authorizer
    participant Cognito
    participant Lambda
    participant DynamoDB
    
    User->>Frontend: Enter credentials
    Frontend->>APIGateway: POST /auth/login
    APIGateway->>Lambda: Invoke auth-login
    Lambda->>Cognito: Authenticate user
    Cognito-->>Lambda: JWT tokens
    Lambda->>DynamoDB: Store session
    Lambda-->>Frontend: Return tokens
    
    Note over User,DynamoDB: Subsequent API Calls
    
    Frontend->>APIGateway: API Request + JWT
    APIGateway->>Authorizer: Validate token
    Authorizer->>Cognito: Verify JWT
    Cognito-->>Authorizer: Token valid
    Authorizer-->>APIGateway: IAM Policy (Allow)
    APIGateway->>Lambda: Invoke function
    Lambda->>DynamoDB: Query data
    DynamoDB-->>Lambda: Return data
    Lambda-->>Frontend: Response
```

---

## 🌾 Disease Detection Flow

```mermaid
sequenceDiagram
    participant Farmer
    participant Frontend
    participant APIGateway
    participant Lambda
    participant S3
    participant Rekognition
    participant Bedrock
    participant DynamoDB
    
    Farmer->>Frontend: Upload crop image
    Frontend->>APIGateway: POST /images/upload-url
    APIGateway->>Lambda: image-upload-url
    Lambda->>S3: Generate presigned URL
    Lambda->>DynamoDB: Store image metadata
    Lambda-->>Frontend: Presigned URL
    
    Frontend->>S3: Upload image (direct)
    S3->>Lambda: Trigger image-process
    
    Lambda->>APIGateway: POST /disease-detection/analyze
    APIGateway->>Lambda: disease-detect
    Lambda->>S3: Get image
    Lambda->>Rekognition: Analyze image
    Rekognition-->>Lambda: Image features
    Lambda->>Bedrock: Identify disease (Claude 3)
    Bedrock-->>Lambda: Disease + confidence + treatment
    Lambda->>DynamoDB: Store analysis
    Lambda-->>Frontend: Results
    Frontend-->>Farmer: Show disease & treatment
```

---

## 💬 Advisory Chatbot Flow

```mermaid
sequenceDiagram
    participant Farmer
    participant Frontend
    participant APIGateway
    participant Lambda
    participant DynamoDB
    participant Bedrock
    
    Farmer->>Frontend: Ask question
    Frontend->>APIGateway: POST /advisory/chat
    APIGateway->>Lambda: advisory-chat
    
    Lambda->>DynamoDB: Get conversation history
    Lambda->>DynamoDB: Get user context (farms, crops)
    Lambda->>DynamoDB: Get sensor data
    
    Lambda->>Bedrock: Generate response (Claude 3)
    Note over Lambda,Bedrock: Context: History + Farms + Sensors
    
    Bedrock-->>Lambda: AI response + recommendations
    Lambda->>DynamoDB: Store message
    Lambda-->>Frontend: Response
    Frontend-->>Farmer: Display advice
```

---

## 📊 IoT Sensor Data Flow

```mermaid
sequenceDiagram
    participant Sensor
    participant IoTCore
    participant IoTRule
    participant Lambda
    participant DynamoDB
    participant AlertLambda
    participant SNS
    participant Farmer
    
    Sensor->>IoTCore: Publish sensor data (MQTT)
    Note over Sensor,IoTCore: Topic: farm/{farmId}/sensors/{type}
    
    IoTCore->>IoTRule: Match topic filter
    IoTRule->>Lambda: Trigger iot-ingest
    
    Lambda->>Lambda: Validate message
    Lambda->>DynamoDB: Store sensor reading
    
    alt Threshold exceeded
        Lambda->>AlertLambda: Create alert
        AlertLambda->>DynamoDB: Store alert
        AlertLambda->>SNS: Publish notification
        SNS->>Farmer: Send email/SMS
    end
    
    Lambda-->>IoTCore: ACK
```

---

## 💰 Market Price Prediction Flow

```mermaid
sequenceDiagram
    participant Farmer
    participant Frontend
    participant APIGateway
    participant Lambda
    participant Redis
    participant DynamoDB
    participant Bedrock
    
    Farmer->>Frontend: Request price prediction
    Frontend->>APIGateway: POST /market-prices/predict
    APIGateway->>Lambda: market-predict
    
    Lambda->>Redis: Check cache
    
    alt Cache hit
        Redis-->>Lambda: Cached prediction
    else Cache miss
        Lambda->>DynamoDB: Get historical prices
        Lambda->>Bedrock: Generate prediction (Claude 3)
        Bedrock-->>Lambda: 7/14/30-day forecast
        Lambda->>Redis: Cache prediction (1 hour)
        Lambda->>DynamoDB: Store prediction
    end
    
    Lambda-->>Frontend: Price predictions
    Frontend-->>Farmer: Display forecast chart
```

---

## 🗄️ Data Model

```mermaid
erDiagram
    USERS ||--o{ FARMS : owns
    USERS ||--o{ CHAT_MESSAGES : sends
    USERS ||--o{ ALERTS : receives
    
    FARMS ||--o{ IMAGES : has
    FARMS ||--o{ DISEASE_ANALYSES : has
    FARMS ||--o{ SENSOR_DATA : monitors
    FARMS ||--o{ OPTIMIZATIONS : receives
    
    IMAGES ||--|| DISEASE_ANALYSES : analyzed_in
    
    USERS {
        string userId PK
        string email
        string name
        string role
        string phoneNumber
        timestamp createdAt
    }
    
    FARMS {
        string farmId PK
        string userId FK
        string name
        object location
        array cropTypes
        number acreage
        string soilType
        timestamp createdAt
    }
    
    IMAGES {
        string imageId PK
        string farmId FK
        string userId FK
        string s3Key
        string status
        timestamp uploadedAt
    }
    
    DISEASE_ANALYSES {
        string analysisId PK
        string imageId FK
        string farmId FK
        string userId FK
        array diseases
        array treatments
        timestamp analyzedAt
    }
    
    SENSOR_DATA {
        string readingId PK
        string farmId FK
        string deviceId
        string sensorType
        number value
        timestamp timestamp
    }
    
    CHAT_MESSAGES {
        string messageId PK
        string userId FK
        string farmId FK
        string role
        string content
        timestamp createdAt
    }
    
    MARKET_PRICES {
        string priceId PK
        string commodity
        string marketLocation
        number price
        object prediction
        timestamp date
    }
    
    OPTIMIZATIONS {
        string optimizationId PK
        string farmId FK
        string userId FK
        string type
        object recommendations
        number estimatedSavings
        timestamp createdAt
    }
    
    ALERTS {
        string alertId PK
        string userId FK
        string farmId FK
        string type
        string severity
        string message
        string status
        timestamp createdAt
    }
```

---

## 🏗️ CDK Stack Architecture

```mermaid
graph TB
    subgraph "CDK App"
        A[bin/aws-backend-infrastructure.ts]
    end
    
    subgraph "Infrastructure Stacks"
        B[NetworkStack<br/>VPC, Security Groups]
        C[StorageStack<br/>S3, DynamoDB, Redis]
        D[AuthStack<br/>Cognito]
        E[ComputeStack<br/>Lambda + API Gateway]
        F[AIStack<br/>Bedrock, Rekognition]
        G[IoTStack<br/>IoT Core, Rules]
        H[MonitoringStack<br/>CloudWatch, SNS]
    end
    
    subgraph "Shared Resources"
        I[Lambda Layers<br/>Shared utilities]
        J[IAM Roles<br/>Least privilege]
    end
    
    A -->|Creates| B
    A -->|Creates| C
    A -->|Creates| D
    A -->|Creates| E
    A -->|Creates| F
    A -->|Creates| G
    A -->|Creates| H
    
    B -->|Provides VPC| E
    B -->|Provides VPC| C
    
    C -->|Provides Tables| E
    C -->|Provides Buckets| E
    
    D -->|Provides Auth| E
    
    E -->|Uses| I
    E -->|Uses| J
    
    F -->|Provides AI| E
    G -->|Triggers| E
    
    E -->|Logs to| H
    
    style A fill:#4CAF50
    style E fill:#2196F3
    style F fill:#9C27B0
```

---

## 📁 Project Structure

```
aws-backend-infrastructure/
├── bin/
│   └── aws-backend-infrastructure.ts    # CDK app entry point
├── lib/
│   ├── stacks/
│   │   ├── network-stack.ts             # VPC, Security Groups
│   │   ├── storage-stack.ts             # S3, DynamoDB, Redis
│   │   ├── auth-stack.ts                # Cognito
│   │   ├── compute-stack.ts             # Lambda + API Gateway
│   │   ├── ai-stack.ts                  # Bedrock, Rekognition
│   │   ├── iot-stack.ts                 # IoT Core
│   │   └── monitoring-stack.ts          # CloudWatch, SNS
│   ├── constructs/
│   │   ├── lambda-function.ts           # Reusable Lambda construct
│   │   └── api-endpoint.ts              # Reusable API construct
│   └── config/
│       ├── dev.ts                       # Dev environment config
│       ├── staging.ts                   # Staging config
│       └── prod.ts                      # Production config
├── lambda/
│   ├── auth/                            # Authentication functions
│   ├── farm/                            # Farm management
│   ├── disease/                         # Disease detection
│   ├── market/                          # Market prices
│   ├── advisory/                        # Chatbot
│   ├── iot/                             # IoT processing
│   ├── optimization/                    # Resource optimization
│   └── alerts/                          # Alert management
├── docs/
│   ├── ARCHITECTURE.md                  # This file
│   ├── DEPLOYMENT_GUIDE.md              # Deployment instructions
│   └── API_DOCUMENTATION.md             # API reference
└── test/
    ├── unit/                            # Unit tests
    └── integration/                     # Integration tests
```

---

## 🔄 CI/CD Pipeline

```mermaid
graph LR
    A[GitHub Push] -->|Trigger| B[CodePipeline]
    B -->|Source| C[CodeBuild]
    C -->|Install| D[npm install]
    D -->|Lint| E[ESLint]
    E -->|Test| F[Jest Tests]
    F -->|Security| G[npm audit]
    G -->|Build| H[CDK Synth]
    H -->|Deploy Dev| I[Dev Environment]
    I -->|Integration Tests| J{Tests Pass?}
    J -->|Yes| K[Manual Approval]
    J -->|No| L[Rollback]
    K -->|Approved| M[Deploy Staging]
    M -->|Smoke Tests| N{Tests Pass?}
    N -->|Yes| O[Manual Approval]
    N -->|No| L
    O -->|Approved| P[Deploy Production]
    P -->|Smoke Tests| Q{Tests Pass?}
    Q -->|Yes| R[Success]
    Q -->|No| L
    
    style A fill:#4CAF50
    style R fill:#4CAF50
    style L fill:#F44336
```

---

## 📊 AWS Services Used

| Service | Purpose | Count |
|---------|---------|-------|
| **API Gateway** | REST API endpoints | 1 API, 30+ endpoints |
| **Lambda** | Serverless compute | 40+ functions |
| **Cognito** | User authentication | 1 User Pool, 1 Identity Pool |
| **DynamoDB** | NoSQL database | 10 tables |
| **S3** | Object storage | 2 buckets (images, backups) |
| **ElastiCache** | Redis caching | 1 cluster |
| **IoT Core** | MQTT broker | 1 endpoint |
| **Bedrock** | AI/ML (Claude 3) | 1 model |
| **Rekognition** | Image analysis | 1 service |
| **CloudWatch** | Monitoring & logs | Multiple log groups |
| **SNS** | Notifications | 2 topics |
| **VPC** | Network isolation | 1 VPC, 2 AZs |
| **Secrets Manager** | Secret storage | Multiple secrets |

---

## 🔒 Security Architecture

```mermaid
graph TB
    subgraph "Security Layers"
        A[WAF<br/>Web Application Firewall]
        B[API Gateway<br/>Rate Limiting]
        C[Lambda Authorizer<br/>JWT Validation]
        D[IAM Roles<br/>Least Privilege]
        E[VPC<br/>Network Isolation]
        F[Encryption at Rest<br/>KMS]
        G[Encryption in Transit<br/>TLS 1.2+]
    end
    
    H[User Request] -->|HTTPS| A
    A -->|Filter| B
    B -->|Authorize| C
    C -->|Validate| D
    D -->|Execute in| E
    E -->|Access| F
    
    style A fill:#F44336
    style C fill:#FF9800
    style D fill:#FF9800
    style F fill:#4CAF50
    style G fill:#4CAF50
```

---

## 💰 Cost Optimization

- **Lambda**: Pay per invocation, 1GB memory
- **DynamoDB**: On-demand pricing, auto-scaling
- **S3**: Lifecycle policies (Glacier after 90 days)
- **ElastiCache**: t3.micro for dev, t3.small for prod
- **API Gateway**: REST API (cheaper than HTTP API for this use case)
- **CloudWatch**: 30-day log retention

**Estimated Monthly Cost**:
- **Development**: $50-100
- **Production (low traffic)**: $200-300
- **Production (high traffic)**: $500-1000

---

## 🚀 Deployment Environments

| Environment | Purpose | Auto-Deploy | Approval Required |
|-------------|---------|-------------|-------------------|
| **Dev** | Development & testing | ✅ Yes | ❌ No |
| **Staging** | Pre-production validation | ❌ No | ✅ Yes |
| **Production** | Live system | ❌ No | ✅ Yes |

---

## 📈 Scalability

- **API Gateway**: Handles 10,000 requests/second
- **Lambda**: Auto-scales to 1000 concurrent executions
- **DynamoDB**: Auto-scales read/write capacity
- **ElastiCache**: Can scale to cluster mode
- **S3**: Unlimited storage
- **IoT Core**: Handles millions of devices

---

## 🔍 Monitoring & Alerting

**CloudWatch Alarms**:
- API Gateway error rate > 5%
- Lambda duration > 10 seconds
- DynamoDB throttling
- S3 bucket size > 100GB
- Bedrock API usage > threshold

**SNS Notifications**:
- Critical errors → Email + SMS
- Operational alerts → Email only

---

**Built with AWS CDK + TypeScript for Infrastructure as Code**
