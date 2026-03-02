# Scripts Directory

This directory contains utility scripts for the Farm Platform infrastructure.

## Available Scripts

### rollback.sh

Rollback script for infrastructure deployments.

**Usage**:
```bash
# Make executable (first time only)
chmod +x scripts/rollback.sh

# Rollback all stacks in an environment
./scripts/rollback.sh --environment prod

# Rollback specific stack
./scripts/rollback.sh --environment staging --stack StorageStack

# Rollback to specific timestamp
./scripts/rollback.sh --environment prod --timestamp 2024-01-15T10:30:00Z
```

**Requirements**:
- AWS CLI configured
- Appropriate IAM permissions
- Bash shell

**See Also**: `docs/ROLLBACK_PROCEDURES.md`

### generate-frontend-config.ts

Generates frontend configuration from CDK outputs.

**Usage**:
```bash
npm run generate:frontend-config -- --environment dev
```

### generate-amplify-config.ts

Generates AWS Amplify configuration.

**Usage**:
```bash
npm run generate:amplify-config -- --environment dev
```

### generate-openapi.ts

Generates OpenAPI specification from API Gateway.

**Usage**:
```bash
npm run generate:openapi -- --environment dev
```

### deploy.sh

Deployment script for infrastructure.

**Usage**:
```bash
./scripts/deploy.sh dev
```

### seed-all.ts

Master seeding script that runs all data seeding scripts in sequence.

**Usage**:
```bash
npm run seed:all -- --environment dev
npm run seed:all -- --environment dev --users 5 --farms 10 --days 30
```

**See Also**: `docs/DATA_SEEDING_GUIDE.md`

### seed-users.ts

Creates test users in Cognito User Pool and DynamoDB.

**Usage**:
```bash
npm run seed:users -- --environment dev
npm run seed:users -- --environment dev --count 5
```

**Requirements**: USER_POOL_ID environment variable must be set

### seed-farms.ts

Creates test farms in DynamoDB Farms table.

**Usage**:
```bash
npm run seed:farms -- --environment dev
npm run seed:farms -- --environment dev --userId <user-id> --count 5
```

### seed-market-prices.ts

Generates historical market price data for testing.

**Usage**:
```bash
npm run seed:market-prices -- --environment dev
npm run seed:market-prices -- --environment dev --days 60
```

## Script Permissions

To make scripts executable:

```bash
chmod +x scripts/*.sh
```

## Environment Variables

Most scripts require these environment variables:

- `AWS_REGION`: AWS region (default: us-east-1)
- `AWS_ACCOUNT_ID`: AWS account ID
- `ENVIRONMENT`: Target environment (dev/staging/prod)

## Error Handling

All scripts include error handling and will:
- Exit with non-zero status on errors
- Print colored output for clarity
- Provide detailed error messages
- Log operations for audit trail

## Best Practices

1. **Test in Dev First**: Always test scripts in dev environment
2. **Review Changes**: Review what will be changed before confirming
3. **Backup First**: Take backups before destructive operations
4. **Monitor Progress**: Watch CloudWatch logs during execution
5. **Document Issues**: Report any issues or improvements needed
