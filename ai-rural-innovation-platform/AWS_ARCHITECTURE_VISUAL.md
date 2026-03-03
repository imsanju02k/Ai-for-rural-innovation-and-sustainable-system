# KrishiSankalp AI - AWS Architecture Visual Guide

## Complete System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          KRISHISANKALP AI PLATFORM                          │
│                    Complete AWS Architecture Overview                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           PRESENTATION LAYER                                │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  React App (AWS Amplify)                                             │  │
│  │  ├─ Multi-language UI (English, Kannada, Hindi)                     │  │
│  │  ├─ Dark/Light Mode                                                 │  │
│  │  ├─ Responsive Design (Mobile-first)                                │  │
│  │  ├─ Progressive Web App (PWA)                                       │  │
│  │  └─ Global CDN Distribution                                         │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            API LAYER                                        │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  API Gateway (REST API)                                              │  │
│  │  ├─ 30+ Endpoints                                                    │  │
│  │  ├─ Rate Limiting (10,000 req/sec)                                  │  │
│  │  ├─ Request Validation                                               │  │
│  │  ├─ CORS Configuration                                               │  │
│  │  └─ CloudWatch Logging                                               │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Lambda Authorizer (JWT Validation)                                  │  │
│  │  ├─ Token Verification                                               │  │
│  │  ├─ IAM Policy Generation                                            │  │
│  │  ├─ User Context Extraction                                          │  │
│  │  └─ Security Enforcement                                             │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                        AUTHENTICATION LAYER                                  │
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  Amazon Cognito (User Pool)                                            │ │
│  │  ├─ User Registration & Login                                          │ │
│  │  ├─ JWT Token Generation                                               │ │
│  │  ├─ Multi-Factor Authentication                                        │ │
│  │  ├─ Session Management                                                 │ │
│  │  └─ User Attributes Storage                                            │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                      BUSINESS LOGIC LAYER                                    │
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  AWS Lambda Functions (40+ Functions)                                  │ │
│  │                                                                         │ │
│  │  Authentication Services:                                              │ │
│  │  ├─ Login Handler                                                      │ │
│  │  ├─ Registration Handler                                               │ │
│  │  ├─ Token Refresh                                                      │ │
│  │  └─ Logout Handler                                                     │ │
│  │                                                                         │ │
│  │  Farm Management:                                                      │ │
│  │  ├─ Create Farm                                                        │ │
│  │  ├─ Update Farm                                                        │ │
│  │  ├─ Delete Farm                                                        │ │
│  │  └─ List Farms                                                         │ │
│  │                                                                         │ │
│  │  Disease Detection:                                                    │ │
│  │  ├─ Upload Image Handler                                               │ │
│  │  ├─ Image Processing                                                   │ │
│  │  ├─ Disease Analysis                                                   │ │
│  │  └─ Results Storage                                                    │ │
│  │                                                                         │ │
│  │  Advisory Chatbot:                                                     │ │
│  │  ├─ Chat Handler                                                       │ │
│  │  ├─ Context Retrieval                                                  │ │
│  │  ├─ Response Generation                                                │ │
│  │  └─ Message Storage                                                    │ │
│  │                                                                         │ │
│  │  Market Prices:                                                        │ │
│  │  ├─ Get Current Prices                                                 │ │
│  │  ├─ Price Prediction                                                   │ │
│  │  ├─ Trend Analysis                                                     │ │
│  │  └─ Alert Management                                                   │ │
│  │                                                                         │ │
│  │  IoT Processing:                                                       │ │
│  │  ├─ Sensor Data Ingestion                                              │ │
│  │  ├─ Data Validation                                                    │ │
│  │  ├─ Threshold Checking                                                 │ │
│  │  └─ Alert Triggering                                                   │ │
│  │                                                                         │ │
│  │  Resource Optimization:                                                │ │
│  │  ├─ Water Optimization                                                 │ │
│  │  ├─ Fertilizer Recommendations                                         │ │
│  │  ├─ Yield Prediction                                                   │ │
│  │  └─ Cost Analysis                                                      │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                        AI/ML SERVICES LAYER                                  │
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  Amazon Bedrock (Claude 3 Sonnet)                                      │ │
│  │  ├─ Disease Identification                                             │ │
│  │  ├─ Treatment Recommendations                                          │ │
│  │  ├─ Advisory Responses                                                 │ │
│  │  ├─ Price Predictions                                                  │ │
│  │  ├─ Resource Optimization                                              │ │
│  │  └─ Multi-language Support                                             │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  Amazon Rekognition (Image Analysis)                                   │ │
│  │  ├─ Object Detection                                                   │ │
│  │  ├─ Feature Extraction                                                 │ │
│  │  ├─ Crop Type Identification                                           │ │
│  │  ├─ Disease Pattern Recognition                                        │ │
│  │  └─ Confidence Scoring                                                 │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                        DATA STORAGE LAYER                                    │
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  DynamoDB (NoSQL Database - 10 Tables)                                 │ │
│  │  ├─ Users Table (User profiles)                                        │ │
│  │  ├─ Farms Table (Farm details)                                         │ │
│  │  ├─ Images Table (Uploaded images metadata)                            │ │
│  │  ├─ Disease Analyses Table (Analysis results)                          │ │
│  │  ├─ Sensor Data Table (IoT readings)                                   │ │
│  │  ├─ Chat Messages Table (Conversation history)                         │ │
│  │  ├─ Market Prices Table (Price data)                                   │ │
│  │  ├─ Optimizations Table (Recommendations)                              │ │
│  │  ├─ Alerts Table (Alert records)                                       │ │
│  │  └─ Sessions Table (User sessions)                                     │ │
│  │                                                                         │ │
│  │  Features:                                                              │ │
│  │  ├─ Auto-scaling read/write capacity                                   │ │
│  │  ├─ Global secondary indexes                                           │ │
│  │  ├─ TTL for data expiration                                            │ │
│  │  ├─ Point-in-time recovery                                             │ │
│  │  └─ Encryption at rest (KMS)                                           │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  S3 (Object Storage - 2 Buckets)                                       │ │
│  │  ├─ krishisankalp-images (Crop images)                                 │ │
│  │  │  ├─ Versioning enabled                                              │ │
│  │  │  ├─ Lifecycle policies                                              │ │
│  │  │  ├─ Server-side encryption                                          │ │
│  │  │  └─ CloudFront distribution                                         │ │
│  │  │                                                                      │ │
│  │  └─ krishisankalp-backups (Backup storage)                             │ │
│  │     ├─ Cross-region replication                                        │ │
│  │     ├─ Glacier transition (90 days)                                    │ │
│  │     └─ Compliance mode                                                 │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  ElastiCache (Redis Cluster)                                           │ │
│  │  ├─ Session caching                                                    │ │
│  │  ├─ Query result caching                                               │ │
│  │  ├─ Real-time sensor data                                              │ │
│  │  ├─ Price prediction cache                                             │ │
│  │  ├─ Sub-millisecond latency                                            │ │
│  │  └─ Automatic failover                                                 │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                        IOT LAYER                                             │
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  AWS IoT Core (MQTT Broker)                                            │ │
│  │  ├─ Device Management                                                  │ │
│  │  ├─ MQTT Topic Routing                                                 │ │
│  │  ├─ Message Persistence                                                │ │
│  │  ├─ TLS 1.2+ Encryption                                                │ │
│  │  └─ Real-time Processing                                               │ │
│  │                                                                         │ │
│  │  IoT Rules Engine:                                                     │ │
│  │  ├─ Topic Filtering                                                    │ │
│  │  ├─ SQL Transformations                                                │ │
│  │  ├─ Threshold Checking                                                 │ │
│  │  ├─ Lambda Invocation                                                  │ │
│  │  └─ DynamoDB Storage                                                   │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                    MONITORING & NOTIFICATION LAYER                           │
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  CloudWatch (Logs & Metrics)                                           │ │
│  │  ├─ Application Logs                                                   │ │
│  │  ├─ Performance Metrics                                                │ │
│  │  ├─ Error Tracking                                                     │ │
│  │  ├─ Custom Dashboards                                                  │ │
│  │  ├─ Alarms & Alerts                                                    │ │
│  │  └─ Log Insights Queries                                               │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  SNS (Simple Notification Service)                                     │ │
│  │  ├─ Email Notifications                                                │ │
│  │  ├─ SMS Alerts                                                         │ │
│  │  ├─ In-app Notifications                                               │ │
│  │  ├─ Topic-based Publishing                                             │ │
│  │  └─ Message Filtering                                                  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                        SECURITY LAYER                                        │
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  AWS WAF (Web Application Firewall)                                    │ │
│  │  ├─ DDoS Protection                                                    │ │
│  │  ├─ SQL Injection Prevention                                           │ │
│  │  ├─ XSS Attack Prevention                                              │ │
│  │  ├─ Rate Limiting                                                      │ │
│  │  └─ IP Reputation Filtering                                            │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  VPC (Virtual Private Cloud)                                           │ │
│  │  ├─ Private Subnets (Lambda)                                           │ │
│  │  ├─ Security Groups                                                    │ │
│  │  ├─ Network ACLs                                                       │ │
│  │  ├─ VPC Endpoints                                                      │ │
│  │  └─ NAT Gateway                                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  IAM (Identity & Access Management)                                    │ │
│  │  ├─ Role-based Access Control                                          │ │
│  │  ├─ Least Privilege Principle                                          │ │
│  │  ├─ Resource Policies                                                  │ │
│  │  ├─ Service-to-service Auth                                            │ │
│  │  └─ Audit Logging                                                      │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  KMS (Key Management Service)                                          │ │
│  │  ├─ Encryption Keys                                                    │ │
│  │  ├─ Key Rotation                                                       │ │
│  │  ├─ Audit Trail                                                        │ │
│  │  └─ Compliance                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  Secrets Manager                                                       │ │
│  │  ├─ API Keys Storage                                                   │ │
│  │  ├─ Database Credentials                                               │ │
│  │  ├─ Automatic Rotation                                                 │ │
│  │  └─ Encryption                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Key Statistics

| Component | Count | Details |
|-----------|-------|---------|
| **API Endpoints** | 30+ | REST endpoints |
| **Lambda Functions** | 40+ | Microservices |
| **DynamoDB Tables** | 10 | NoSQL storage |
| **S3 Buckets** | 2 | Object storage |
| **Supported Languages** | 3 | EN, KN, HI |
| **Concurrent Users** | 10,000+ | Scalable |
| **API Response Time** | <200ms | Performance |
| **Disease Detection** | <5s | Real-time |
| **Advisory Response** | <2s | Real-time |
| **Sensor Latency** | <1s | Real-time |

## AWS Services Summary

**Compute**: Lambda (40+ functions), API Gateway
**Database**: DynamoDB (10 tables), ElastiCache (Redis)
**Storage**: S3 (2 buckets), Secrets Manager
**AI/ML**: Bedrock (Claude 3), Rekognition
**IoT**: IoT Core, IoT Rules Engine
**Monitoring**: CloudWatch, SNS
**Security**: WAF, VPC, IAM, KMS, Cognito
**Deployment**: CodePipeline, CodeBuild, CloudFormation
**Networking**: VPC, NAT Gateway, VPC Endpoints

## Performance Metrics

- **API Gateway**: 10,000 requests/second
- **Lambda**: 1,000 concurrent executions
- **DynamoDB**: Auto-scaling capacity
- **S3**: Unlimited storage
- **ElastiCache**: Sub-millisecond latency
- **IoT Core**: Millions of devices
- **Bedrock**: <2 second response time
- **Rekognition**: <1 second analysis

## Cost Optimization

- **Development**: $50-100/month
- **Production (Low)**: $200-300/month
- **Production (High)**: $500-1000/month
- **Strategies**: On-demand pricing, auto-scaling, lifecycle policies

