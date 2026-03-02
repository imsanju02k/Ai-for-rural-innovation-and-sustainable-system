# Data Seeding Guide

This guide explains how to seed test data into the AWS Backend Infrastructure for development and testing purposes.

**Requirements**: 15.7

## Overview

The data seeding scripts populate the database with realistic test data including:
- **Test Users**: User accounts in Cognito and DynamoDB
- **Test Farms**: Farm profiles with locations and crop information
- **Market Price Data**: Historical market price data for various commodities

## Prerequisites

Before running the seeding scripts, ensure you have:

1. **Deployed Infrastructure**: All CDK stacks must be deployed
   ```bash
   npm run deploy -- --all --context environment=dev
   ```

2. **AWS Credentials**: Configured AWS CLI with appropriate permissions
   ```bash
   aws configure
   ```

3. **Environment Variables**: Set required environment variables
   ```bash
   export AWS_REGION=us-east-1
   export USER_POOL_ID=<your-cognito-user-pool-id>
   ```

4. **Dependencies Installed**: Install Node.js dependencies
   ```bash
   npm install
   ```

## Quick Start

### Seed All Data (Recommended)

The easiest way to seed all test data is using the master script:

```bash
npm run seed:all -- --environment dev
```

This will:
1. Create 3 test users in Cognito and DynamoDB
2. Create 3 test farms for a random user
3. Generate 30 days of market price data for 10 commodities

### Custom Configuration

You can customize the amount of data seeded:

```bash
npm run seed:all -- --environment dev --users 5 --farms 10 --days 60
```

Options:
- `--environment`: Target environment (dev, staging, prod)
- `--users`: Number of test users to create (default: 3, max: 5)
- `--farms`: Number of test farms to create (default: 3, max: 6)
- `--days`: Days of historical market price data (default: 30)

## Individual Seeding Scripts

You can also run each seeding script independently:

### 1. Seed Test Users

Creates test user accounts in Cognito User Pool and DynamoDB Users table.

**Usage**:
```bash
npm run seed:users -- --environment dev
```

**Options**:
- `--environment`: Target environment (required)
- `--count`: Number of users to create (default: 3, max: 5)

**Example**:
```bash
npm run seed:users -- --environment dev --count 5
```

**Test Users Created**:

| Name | Email | Role | Password |
|------|-------|------|----------|
| John Farmer | john.farmer@example.com | farmer | TestPass123! |
| Sarah Advisor | sarah.advisor@example.com | advisor | TestPass123! |
| Admin User | admin@example.com | admin | TestPass123! |
| Rajesh Kumar | rajesh.kumar@example.com | farmer | TestPass123! |
| Priya Sharma | priya.sharma@example.com | farmer | TestPass123! |

**Note**: All test users have the same password: `TestPass123!`

### 2. Seed Test Farms

Creates test farm profiles in DynamoDB Farms table.

**Usage**:
```bash
npm run seed:farms -- --environment dev
```

**Options**:
- `--environment`: Target environment (required)
- `--userId`: Specific user ID to assign farms to (optional)
- `--count`: Number of farms to create (default: 3, max: 6)

**Examples**:
```bash
# Create farms for a random user
npm run seed:farms -- --environment dev --count 3

# Create farms for a specific user
npm run seed:farms -- --environment dev --userId abc123-def456 --count 5
```

**Test Farms Created**:

1. **Green Valley Farm** (Meerut, UP)
   - Crops: wheat, rice, sugarcane
   - Acreage: 15.5 acres
   - Soil: loamy

2. **Sunrise Organic Farm** (Mohali, Punjab)
   - Crops: rice, corn, cotton
   - Acreage: 22.3 acres
   - Soil: clay

3. **Golden Harvest Farm** (Lucknow, UP)
   - Crops: wheat, mustard, chickpea
   - Acreage: 18.7 acres
   - Soil: sandy loam

4. **Riverside Farm** (Ahmedabad, Gujarat)
   - Crops: cotton, groundnut, millet
   - Acreage: 25.0 acres
   - Soil: black soil

5. **Highland Farm** (Bangalore, Karnataka)
   - Crops: tomato, potato, onion
   - Acreage: 10.5 acres
   - Soil: red soil

6. **Coastal Farm** (Palghar, Maharashtra)
   - Crops: rice, coconut, mango
   - Acreage: 12.8 acres
   - Soil: laterite

### 3. Seed Market Price Data

Generates historical market price data for various commodities across multiple market locations.

**Usage**:
```bash
npm run seed:market-prices -- --environment dev
```

**Options**:
- `--environment`: Target environment (required)
- `--days`: Number of days of historical data (default: 30)

**Example**:
```bash
npm run seed:market-prices -- --environment dev --days 60
```

**Commodities Included**:
- wheat, rice, corn
- tomato, potato, onion
- sugarcane, cotton
- soybean, chickpea

**Market Locations**:
- Meerut Mandi (Uttar Pradesh)
- Ludhiana Mandi (Punjab)
- Ahmedabad APMC (Gujarat)
- Bangalore Market (Karnataka)
- Mumbai APMC (Maharashtra)
- Delhi Azadpur Mandi (Delhi)

**Price Generation**:
- Prices follow a random walk with slight upward trend
- Each commodity has realistic base price and volatility
- Location-based price variations (±5%)
- Data includes timestamp and TTL for automatic expiration

## Environment Setup

### Required Environment Variables

```bash
# AWS Configuration
export AWS_REGION=us-east-1
export AWS_ACCOUNT_ID=123456789012

# Cognito Configuration (required for user seeding)
export USER_POOL_ID=us-east-1_ABC123DEF

# Optional: Override table names
export USERS_TABLE=dev-dynamodb-users
export FARMS_TABLE=dev-dynamodb-farms
export MARKET_PRICES_TABLE=dev-dynamodb-market-prices
```

### Finding Your User Pool ID

You can find your Cognito User Pool ID in several ways:

**Method 1: AWS Console**
1. Go to AWS Console > Cognito
2. Select your user pool
3. Copy the Pool ID from the General Settings

**Method 2: AWS CLI**
```bash
aws cognito-idp list-user-pools --max-results 10
```

**Method 3: CDK Outputs**
```bash
aws cloudformation describe-stacks \
  --stack-name dev-AuthStack \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
  --output text
```

## NPM Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "seed:all": "ts-node scripts/seed-all.ts",
    "seed:users": "ts-node scripts/seed-users.ts",
    "seed:farms": "ts-node scripts/seed-farms.ts",
    "seed:market-prices": "ts-node scripts/seed-market-prices.ts"
  }
}
```

## Verification

After seeding data, verify it was created successfully:

### Verify Users

**DynamoDB Console**:
```bash
aws dynamodb scan --table-name dev-dynamodb-users --limit 10
```

**Cognito Console**:
```bash
aws cognito-idp list-users --user-pool-id <your-pool-id>
```

### Verify Farms

```bash
aws dynamodb scan --table-name dev-dynamodb-farms --limit 10
```

### Verify Market Prices

```bash
aws dynamodb query \
  --table-name dev-dynamodb-market-prices \
  --key-condition-expression "commodity = :commodity" \
  --expression-attribute-values '{":commodity":{"S":"wheat"}}' \
  --limit 10
```

### Test Authentication

Use the seeded credentials to test authentication:

```bash
curl -X POST https://your-api-gateway-url/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.farmer@example.com",
    "password": "TestPass123!"
  }'
```

## Troubleshooting

### Error: USER_POOL_ID not set

**Problem**: The USER_POOL_ID environment variable is not configured.

**Solution**:
```bash
export USER_POOL_ID=$(aws cloudformation describe-stacks \
  --stack-name dev-AuthStack \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
  --output text)
```

### Error: Table does not exist

**Problem**: DynamoDB tables haven't been created yet.

**Solution**: Deploy the StorageStack first:
```bash
npm run deploy -- StorageStack --context environment=dev
```

### Error: Access Denied

**Problem**: AWS credentials don't have sufficient permissions.

**Solution**: Ensure your IAM user/role has these permissions:
- `cognito-idp:AdminCreateUser`
- `cognito-idp:AdminSetUserPassword`
- `dynamodb:PutItem`
- `dynamodb:Scan`

### Error: UsernameExistsException

**Problem**: User already exists in Cognito.

**Solution**: This is expected behavior. The script will skip existing users and continue.

### Slow Performance

**Problem**: Seeding large amounts of data is slow.

**Solution**: 
- Reduce the number of days for market prices
- Use batch write operations (future enhancement)
- Run scripts in parallel (advanced)

## Data Cleanup

To remove seeded test data:

### Delete Users

```bash
# List users
aws cognito-idp list-users --user-pool-id <your-pool-id>

# Delete a user
aws cognito-idp admin-delete-user \
  --user-pool-id <your-pool-id> \
  --username john.farmer@example.com
```

### Delete Farms

```bash
# Scan and delete items
aws dynamodb scan --table-name dev-dynamodb-farms \
  --projection-expression "userId,farmId" \
  | jq -r '.Items[] | @json' \
  | while read item; do
      aws dynamodb delete-item \
        --table-name dev-dynamodb-farms \
        --key "$item"
    done
```

### Delete Market Prices

Market prices have TTL enabled and will automatically expire after 90 days. To manually delete:

```bash
# Delete all items (use with caution)
aws dynamodb scan --table-name dev-dynamodb-market-prices \
  --projection-expression "commodity,timestamp" \
  | jq -r '.Items[] | @json' \
  | while read item; do
      aws dynamodb delete-item \
        --table-name dev-dynamodb-market-prices \
        --key "$item"
    done
```

## Best Practices

1. **Always seed in dev first**: Test seeding scripts in development before using in staging/production
2. **Use consistent passwords**: All test users use the same password for easy testing
3. **Document test accounts**: Keep track of seeded users for testing purposes
4. **Clean up regularly**: Remove old test data to avoid clutter
5. **Version control**: Keep seeding scripts in version control
6. **Automate**: Include seeding in CI/CD pipeline for ephemeral environments

## Integration with CI/CD

You can automate data seeding in your CI/CD pipeline:

```yaml
# Example: GitHub Actions
- name: Seed Test Data
  run: |
    export USER_POOL_ID=${{ secrets.DEV_USER_POOL_ID }}
    npm run seed:all -- --environment dev --users 3 --farms 5 --days 30
```

## Future Enhancements

Potential improvements to the seeding scripts:

- [ ] Batch write operations for better performance
- [ ] Seed sensor data for IoT testing
- [ ] Seed disease analysis records
- [ ] Seed chat message history
- [ ] Seed optimization recommendations
- [ ] Support for custom data templates
- [ ] Parallel execution for faster seeding
- [ ] Progress bars for long-running operations
- [ ] Rollback capability
- [ ] Data validation before seeding

## Support

For issues or questions about data seeding:

1. Check the troubleshooting section above
2. Review CloudWatch logs for errors
3. Verify AWS permissions
4. Check the GitHub issues for known problems
5. Contact the development team

## Related Documentation

- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Testing Guide](./TESTING_GUIDE.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Database Schema](../lib/stacks/storage-stack.ts)
