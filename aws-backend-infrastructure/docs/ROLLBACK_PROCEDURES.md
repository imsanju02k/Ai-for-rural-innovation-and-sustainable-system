# Rollback Procedures

This document describes the rollback strategies and procedures for the Farm Platform infrastructure.

## Table of Contents

- [Overview](#overview)
- [Automatic Rollback](#automatic-rollback)
- [Manual Rollback](#manual-rollback)
- [CloudFormation Rollback](#cloudformation-rollback)
- [Database Point-in-Time Recovery](#database-point-in-time-recovery)
- [Lambda Version Rollback](#lambda-version-rollback)
- [Rollback Testing](#rollback-testing)
- [Emergency Procedures](#emergency-procedures)

## Overview

The Farm Platform implements multiple rollback strategies to ensure system reliability:

1. **Automatic Rollback**: Triggered by failed smoke tests or CloudFormation rollback triggers
2. **Manual Rollback**: Initiated by operators using scripts or AWS Console
3. **Point-in-Time Recovery**: For DynamoDB tables to recover from data corruption
4. **Lambda Version Rollback**: Using Lambda aliases for instant rollback

**Requirements**: Non-functional - Reliability

## Automatic Rollback

### CloudFormation Rollback Triggers

CloudFormation automatically rolls back stack updates when:

- Stack update fails
- Resources fail to create or update
- Rollback triggers are activated (e.g., high error rate)

**Configuration in CDK**:

```typescript
const stack = new cdk.Stack(this, 'MyStack', {
  // Enable termination protection for production
  terminationProtection: environment === 'prod',
});

// Add rollback configuration
stack.cfnOptions.rollbackConfiguration = {
  rollbackTriggers: [
    {
      arn: alarmArn,
      type: 'AWS::CloudWatch::Alarm',
    },
  ],
  monitoringTimeInMinutes: 5,
};
```

### Smoke Test Failure Rollback

The CI/CD pipeline automatically triggers rollback when smoke tests fail:

1. Deployment completes
2. Smoke tests run
3. If tests fail:
   - Pipeline marks deployment as failed
   - CloudFormation automatically rolls back
   - Notifications sent to team
   - Previous version remains active

**Buildspec Configuration** (buildspec-smoke-tests.yml):

```yaml
post_build:
  commands:
    - |
      if [ $CODEBUILD_BUILD_SUCCEEDING -eq 1 ]; then
        echo "✓ All smoke tests passed"
      else
        echo "✗ Smoke tests failed - triggering rollback"
        exit 1
      fi
```

## Manual Rollback

### Using the Rollback Script

The `scripts/rollback.sh` script provides a convenient way to rollback deployments:

**Rollback all stacks in an environment**:

```bash
./scripts/rollback.sh --environment prod
```

**Rollback a specific stack**:

```bash
./scripts/rollback.sh --environment staging --stack StorageStack
```

**Rollback to a specific timestamp** (for DynamoDB):

```bash
./scripts/rollback.sh --environment prod --timestamp 2024-01-15T10:30:00Z
```

### Using AWS CLI

**Rollback a CloudFormation stack**:

```bash
# Cancel an in-progress update
aws cloudformation cancel-update-stack --stack-name prod-StorageStack

# Update stack with previous template
aws cloudformation update-stack \
  --stack-name prod-StorageStack \
  --use-previous-template \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM
```

**Monitor rollback progress**:

```bash
aws cloudformation describe-stack-events \
  --stack-name prod-StorageStack \
  --max-items 20
```

### Using AWS Console

1. Navigate to CloudFormation console
2. Select the stack to rollback
3. Click "Stack actions" → "Continue update rollback"
4. Review and confirm rollback
5. Monitor progress in Events tab

## CloudFormation Rollback

### Stack Rollback Order

When rolling back multiple stacks, follow this order (reverse of deployment):

1. PipelineStack
2. MonitoringStack
3. WebSocketStack
4. IoTStack
5. AIStack
6. APIStack
7. ComputeStack
8. AuthStack
9. StorageStack
10. NetworkStack

### Handling Failed Rollbacks

If a stack rollback fails:

1. **Identify the failing resource**:

```bash
aws cloudformation describe-stack-events \
  --stack-name prod-StorageStack \
  --query 'StackEvents[?ResourceStatus==`UPDATE_FAILED`]'
```

2. **Skip the failing resource** (if safe):

```bash
aws cloudformation continue-update-rollback \
  --stack-name prod-StorageStack \
  --resources-to-skip FailingResourceLogicalId
```

3. **Delete and recreate** (last resort):

```bash
# Export stack outputs first
aws cloudformation describe-stacks \
  --stack-name prod-StorageStack \
  --query 'Stacks[0].Outputs' > stack-outputs.json

# Delete stack
aws cloudformation delete-stack --stack-name prod-StorageStack

# Wait for deletion
aws cloudformation wait stack-delete-complete --stack-name prod-StorageStack

# Redeploy
cdk deploy prod-StorageStack
```

## Database Point-in-Time Recovery

### DynamoDB Point-in-Time Recovery

DynamoDB tables have point-in-time recovery enabled in production.

**Restore a table to a specific point in time**:

```bash
# List available recovery points
aws dynamodb describe-continuous-backups \
  --table-name prod-users

# Restore table
aws dynamodb restore-table-to-point-in-time \
  --source-table-name prod-users \
  --target-table-name prod-users-restored \
  --restore-date-time 2024-01-15T10:30:00Z

# Wait for restore to complete
aws dynamodb wait table-exists --table-name prod-users-restored

# Verify data
aws dynamodb scan --table-name prod-users-restored --max-items 5

# Swap tables (requires application downtime)
# 1. Stop application
# 2. Rename original table
# 3. Rename restored table to original name
# 4. Start application
```

**Automated restore script**:

```bash
#!/bin/bash
TABLE_NAME=$1
RESTORE_TIME=$2

aws dynamodb restore-table-to-point-in-time \
  --source-table-name "$TABLE_NAME" \
  --target-table-name "${TABLE_NAME}-restored-$(date +%s)" \
  --restore-date-time "$RESTORE_TIME"
```

### Backup Restoration

For manual backups:

```bash
# List available backups
aws dynamodb list-backups --table-name prod-users

# Restore from backup
aws dynamodb restore-table-from-backup \
  --target-table-name prod-users-restored \
  --backup-arn arn:aws:dynamodb:region:account:table/prod-users/backup/01234567890123-abcdefgh
```

## Lambda Version Rollback

### Using Lambda Aliases

Lambda functions use aliases for instant rollback:

**Current deployment**:
- Alias: `live` → Version: 5
- Previous: Version 4

**Rollback to previous version**:

```bash
# Update alias to point to previous version
aws lambda update-alias \
  --function-name prod-farm-create \
  --name live \
  --function-version 4

# Verify
aws lambda get-alias \
  --function-name prod-farm-create \
  --name live
```

**Rollback all Lambda functions**:

```bash
#!/bin/bash
FUNCTIONS=(
  "prod-farm-create"
  "prod-farm-list"
  "prod-disease-detect"
  # ... add all functions
)

for func in "${FUNCTIONS[@]}"; do
  echo "Rolling back $func..."
  
  # Get current version
  CURRENT=$(aws lambda get-alias --function-name "$func" --name live --query 'FunctionVersion' --output text)
  
  # Calculate previous version
  PREVIOUS=$((CURRENT - 1))
  
  # Update alias
  aws lambda update-alias \
    --function-name "$func" \
    --name live \
    --function-version "$PREVIOUS"
done
```

### Lambda Layer Rollback

If a Lambda layer update causes issues:

```bash
# List layer versions
aws lambda list-layer-versions --layer-name prod-common-dependencies

# Update functions to use previous layer version
aws lambda update-function-configuration \
  --function-name prod-farm-create \
  --layers arn:aws:lambda:region:account:layer:prod-common-dependencies:4
```

## Rollback Testing

### Pre-Production Testing

Test rollback procedures in staging before production:

```bash
# Deploy to staging
cdk deploy --all --context environment=staging

# Simulate failure and rollback
./scripts/rollback.sh --environment staging

# Verify system functionality
npm run test:integration
```

### Rollback Drills

Conduct regular rollback drills:

1. **Monthly drill schedule**:
   - Week 1: CloudFormation stack rollback
   - Week 2: DynamoDB point-in-time recovery
   - Week 3: Lambda version rollback
   - Week 4: Full system rollback

2. **Document results**:
   - Time to complete rollback
   - Issues encountered
   - Improvements needed

3. **Update procedures** based on drill findings

## Emergency Procedures

### Critical Production Issue

If production is experiencing critical issues:

1. **Immediate actions**:

```bash
# Stop incoming traffic (if needed)
aws apigateway update-stage \
  --rest-api-id API_ID \
  --stage-name prod \
  --patch-operations op=replace,path=/throttle/rateLimit,value=0

# Rollback to last known good version
./scripts/rollback.sh --environment prod
```

2. **Notify stakeholders**:

```bash
# Send SNS notification
aws sns publish \
  --topic-arn arn:aws:sns:region:account:prod-alerts \
  --subject "CRITICAL: Production Rollback Initiated" \
  --message "Production system rolled back due to critical issue. Investigating..."
```

3. **Monitor rollback**:

```bash
# Watch CloudFormation events
watch -n 5 'aws cloudformation describe-stack-events \
  --stack-name prod-APIStack \
  --max-items 10'
```

4. **Verify system health**:

```bash
# Run smoke tests
npm run test:smoke

# Check CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name 5XXError \
  --dimensions Name=ApiName,Value=prod-farm-api \
  --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Sum
```

### Data Corruption

If data corruption is detected:

1. **Stop writes immediately**:

```bash
# Disable write operations via API Gateway
aws apigateway update-method \
  --rest-api-id API_ID \
  --resource-id RESOURCE_ID \
  --http-method POST \
  --patch-operations op=replace,path=/authorizationType,value=NONE
```

2. **Restore from point-in-time**:

```bash
# Restore affected tables
for table in prod-users prod-farms prod-crops; do
  aws dynamodb restore-table-to-point-in-time \
    --source-table-name "$table" \
    --target-table-name "${table}-restored" \
    --restore-date-time "2024-01-15T10:00:00Z"
done
```

3. **Validate restored data**:

```bash
# Compare record counts
aws dynamodb describe-table --table-name prod-users --query 'Table.ItemCount'
aws dynamodb describe-table --table-name prod-users-restored --query 'Table.ItemCount'
```

4. **Swap tables** (requires maintenance window)

### Rollback Checklist

- [ ] Identify the issue and determine rollback scope
- [ ] Notify team and stakeholders
- [ ] Take backup of current state (if possible)
- [ ] Execute rollback procedure
- [ ] Monitor rollback progress
- [ ] Verify system functionality
- [ ] Run smoke tests
- [ ] Check CloudWatch metrics and logs
- [ ] Update incident documentation
- [ ] Conduct post-mortem

## Rollback Metrics

Track these metrics for rollback procedures:

- **Mean Time to Rollback (MTTR)**: Target < 15 minutes
- **Rollback Success Rate**: Target > 95%
- **Data Loss**: Target = 0 (with point-in-time recovery)
- **Downtime During Rollback**: Target < 5 minutes

## Contact Information

**Emergency Contacts**:
- DevOps Lead: [contact info]
- AWS Support: [support case link]
- On-Call Engineer: [pager duty link]

**Escalation Path**:
1. On-Call Engineer (0-15 minutes)
2. DevOps Lead (15-30 minutes)
3. Engineering Manager (30+ minutes)

## References

- [AWS CloudFormation Rollback Documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-rollback-triggers.html)
- [DynamoDB Point-in-Time Recovery](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/PointInTimeRecovery.html)
- [Lambda Versioning and Aliases](https://docs.aws.amazon.com/lambda/latest/dg/configuration-aliases.html)
- Internal Runbooks: `docs/runbooks/`
