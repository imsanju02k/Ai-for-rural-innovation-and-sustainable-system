# AWS Backend Infrastructure - AI Rural Innovation Platform

Complete AWS CDK infrastructure for the AI-powered agricultural platform serving rural farmers.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Configure AWS credentials
aws configure

# Bootstrap CDK (first time only)
cdk bootstrap

# Deploy to development
cdk deploy --all --context environment=dev

# Deploy specific stack
cdk deploy dev-ComputeStack --context environment=dev
```

---

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **AWS CLI** configured with credentials
- **AWS CDK** 2.x installed globally: `npm install -g aws-cdk`
- **AWS Account** with appropriate permissions
- **Amazon Bedrock** model access enabled (Claude 3 Sonnet)

---

## 🏗️ Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture diagrams including:
- High-level system architecture
- Authentication flow
- Disease detection flow
- Advisory chatbot flow
- IoT sensor data flow
- Market price prediction flow
- Data model (ER diagram)
- CDK stack architecture
- Security architecture
- CI/CD pipeline

---

## 📁 Project Structure

```
aws-backend-infrastructure/
├── bin/
│   └── aws-backend-infrastructure.ts    # CDK app entry point
├── lib/
│   ├── stacks/                          # CDK stacks
│   │   ├── network-stack.ts
│   │   ├── storage-stack.ts
│   │   ├── auth-stack.ts
│   │   ├── compute-stack.ts
│   │   ├── ai-stack.ts
│   │   ├── iot-stack.ts
│   │   └── monitoring-stack.ts
│   ├── constructs/                      # Reusable constructs
│   └── config/                          # Environment configs
├── lambda/                              # Lambda function code
│   ├── auth/
│   ├── farm/
│   ├── disease/
│   ├── market/
│   ├── advisory/
│   ├── iot/
│   ├── optimization/
│   └── alerts/
├── docs/                                # Documentation
├── test/                                # Tests
└── scripts/                             # Utility scripts
```

---

## 🔧 Configuration

### Environment Variables

Create `.env` file (see `.env.example`):

```bash
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=your-account-id
ENVIRONMENT=dev
```

### Environment-Specific Config

- `lib/config/dev.ts` - Development settings
- `lib/config/staging.ts` - Staging settings
- `lib/config/prod.ts` - Production settings

---

## 🚀 Deployment

### Deploy All Stacks

```bash
# Development
cdk deploy --all --context environment=dev

# Staging
cdk deploy --all --context environment=staging

# Production
cdk deploy --all --context environment=prod
```

### Deploy Individual Stacks

```bash
cdk deploy dev-NetworkStack
cdk deploy dev-StorageStack
cdk deploy dev-AuthStack
cdk deploy dev-ComputeStack
cdk deploy dev-AIStack
cdk deploy dev-IoTStack
cdk deploy dev-MonitoringStack
```

### Destroy Stacks

```bash
cdk destroy --all --context environment=dev
```

---

## 🧪 Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
npm run test:integration
```

### Property-Based Tests

```bash
npm run test:pbt
```

---

## 📊 AWS Services

| Service | Purpose |
|---------|---------|
| **API Gateway** | REST API with 30+ endpoints |
| **Lambda** | 40+ serverless functions |
| **Cognito** | User authentication |
| **DynamoDB** | 10 NoSQL tables |
| **S3** | Image storage & backups |
| **ElastiCache** | Redis caching |
| **IoT Core** | MQTT broker for sensors |
| **Bedrock** | AI/ML (Claude 3 Sonnet) |
| **Rekognition** | Image analysis |
| **CloudWatch** | Monitoring & logging |
| **SNS** | Notifications |
| **VPC** | Network isolation |

---

## 🔐 Security

- **Authentication**: AWS Cognito with JWT tokens
- **Authorization**: Lambda authorizer with IAM policies
- **Encryption**: At rest (KMS) and in transit (TLS 1.2+)
- **Network**: VPC with private subnets
- **IAM**: Least privilege roles
- **Secrets**: AWS Secrets Manager
- **WAF**: Web Application Firewall (optional)

---

## 📈 Monitoring

### CloudWatch Dashboards

- API Gateway metrics
- Lambda performance
- DynamoDB capacity
- Error rates
- Cost tracking

### Alarms

- API error rate > 5%
- Lambda duration > 10s
- DynamoDB throttling
- S3 bucket size alerts
- Bedrock usage alerts

### Logs

- API Gateway access logs
- Lambda execution logs
- IoT Core logs
- Structured logging with request IDs

---

## 💰 Cost Estimation

### Development Environment
- **Monthly**: $50-100
- **Services**: Minimal Lambda, DynamoDB on-demand, t3.micro Redis

### Production Environment (Low Traffic)
- **Monthly**: $200-300
- **Services**: Moderate Lambda, DynamoDB provisioned, t3.small Redis

### Production Environment (High Traffic)
- **Monthly**: $500-1000
- **Services**: High Lambda concurrency, DynamoDB auto-scaling, Redis cluster

See [docs/COST_ESTIMATION_GUIDE.md](./docs/COST_ESTIMATION_GUIDE.md) for details.

---

## 🔄 CI/CD Pipeline

Automated deployment pipeline using AWS CodePipeline:

1. **Source**: GitHub repository
2. **Build**: CodeBuild (lint, test, synth)
3. **Security**: npm audit, SAST scanning
4. **Deploy Dev**: Automatic deployment
5. **Integration Tests**: Automated testing
6. **Deploy Staging**: Manual approval required
7. **Smoke Tests**: Automated validation
8. **Deploy Production**: Manual approval required
9. **Rollback**: Automatic on failure

---

## 📚 Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Architecture diagrams
- [DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md) - Deployment instructions
- [FRONTEND_INTEGRATION_GUIDE.md](./docs/FRONTEND_INTEGRATION_GUIDE.md) - Frontend setup
- [API Documentation](./docs/api/README.md) - API reference
- [DATA_SEEDING_GUIDE.md](./docs/DATA_SEEDING_GUIDE.md) - Test data setup
- [OPERATIONS_RUNBOOK.md](./docs/OPERATIONS_RUNBOOK.md) - Operations guide

---

## 🛠️ Development

### Local Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

### CDK Commands

```bash
# List all stacks
cdk list

# Synthesize CloudFormation
cdk synth

# Show differences
cdk diff

# Deploy
cdk deploy

# Destroy
cdk destroy
```

---

## 🌐 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh token

### Farm Management
- `POST /farms` - Create farm
- `GET /farms` - List farms
- `GET /farms/{farmId}` - Get farm details
- `PUT /farms/{farmId}` - Update farm
- `DELETE /farms/{farmId}` - Delete farm

### Disease Detection
- `POST /images/upload-url` - Get upload URL
- `POST /disease-detection/analyze` - Analyze image
- `GET /disease-detection/history` - Get analysis history

### Market Prices
- `GET /market-prices` - Get current prices
- `POST /market-prices/predict` - Get price predictions

### Advisory Chatbot
- `POST /advisory/chat` - Send message
- `GET /advisory/history` - Get chat history

### IoT Sensors
- `GET /sensors/data` - Get sensor data
- `GET /sensors/data/{deviceId}` - Get device data

### Alerts
- `GET /alerts` - List alerts
- `PUT /alerts/{alertId}/acknowledge` - Acknowledge alert

See [API Documentation](./docs/api/README.md) for complete reference.

---

## 🔧 Troubleshooting

### Common Issues

**CDK Bootstrap Error**
```bash
cdk bootstrap aws://ACCOUNT-ID/REGION
```

**Lambda Timeout**
- Check CloudWatch logs
- Increase timeout in stack definition
- Optimize function code

**DynamoDB Throttling**
- Enable auto-scaling
- Increase provisioned capacity
- Use on-demand billing

**Bedrock Access Denied**
- Enable model access in AWS Console
- Check IAM permissions
- Verify region availability

---

## 📞 Support

For issues or questions:
- Check [docs/](./docs/) directory
- Review CloudWatch logs
- Check AWS service quotas
- Refer to AWS documentation

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Run tests
5. Submit pull request

---

## 📄 License

This project is part of the AI Rural Innovation Platform.

---

## 🎯 Features

- ✅ User authentication with Cognito
- ✅ Farm management CRUD operations
- ✅ AI-powered disease detection (Bedrock + Rekognition)
- ✅ Market price predictions with AI
- ✅ Advisory chatbot with context awareness
- ✅ IoT sensor data ingestion and processing
- ✅ Resource optimization recommendations
- ✅ Real-time alerts and notifications
- ✅ Comprehensive monitoring and logging
- ✅ CI/CD pipeline with automated testing
- ✅ Multi-environment support (dev, staging, prod)
- ✅ Infrastructure as Code with AWS CDK

---

## 🚀 Deployed Resources

After deployment, you'll have:
- **API Gateway**: REST API endpoint
- **Cognito**: User Pool and Identity Pool
- **Lambda**: 40+ functions
- **DynamoDB**: 10 tables
- **S3**: 2 buckets
- **IoT Core**: MQTT endpoint
- **CloudWatch**: Dashboards and alarms
- **SNS**: Notification topics

---

**Built with ❤️ for rural farmers using AWS CDK + TypeScript**
