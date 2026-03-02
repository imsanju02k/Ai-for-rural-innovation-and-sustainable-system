# Data Seeding Quick Start

Quick reference for seeding test data into the AWS Backend Infrastructure.

## Prerequisites

```bash
# 1. Deploy infrastructure
npm run cdk:deploy -- --all --context environment=dev

# 2. Set environment variables
export AWS_REGION=us-east-1
export USER_POOL_ID=$(aws cloudformation describe-stacks \
  --stack-name dev-AuthStack \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
  --output text)
```

## Quick Commands

### Seed Everything (Recommended)
```bash
npm run seed:all -- --environment dev
```

### Seed with Custom Amounts
```bash
npm run seed:all -- --environment dev --users 5 --farms 10 --days 60
```

### Seed Individual Components
```bash
# Users only
npm run seed:users -- --environment dev --count 3

# Farms only
npm run seed:farms -- --environment dev --count 5

# Market prices only
npm run seed:market-prices -- --environment dev --days 30
```

## Test Credentials

After seeding, use these credentials to test:

| Email | Password | Role |
|-------|----------|------|
| john.farmer@example.com | TestPass123! | farmer |
| sarah.advisor@example.com | TestPass123! | advisor |
| admin@example.com | TestPass123! | admin |

## Verify Data

```bash
# Check users
aws dynamodb scan --table-name dev-dynamodb-users --limit 5

# Check farms
aws dynamodb scan --table-name dev-dynamodb-farms --limit 5

# Check market prices
aws dynamodb query \
  --table-name dev-dynamodb-market-prices \
  --key-condition-expression "commodity = :c" \
  --expression-attribute-values '{":c":{"S":"wheat"}}' \
  --limit 5
```

## Test Authentication

```bash
curl -X POST https://your-api-url/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.farmer@example.com",
    "password": "TestPass123!"
  }'
```

## Full Documentation

See [DATA_SEEDING_GUIDE.md](./docs/DATA_SEEDING_GUIDE.md) for complete documentation.
