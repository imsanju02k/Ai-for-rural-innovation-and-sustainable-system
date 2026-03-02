# Teardown Guide

Complete guide for safely removing all AWS resources created by the AI Rural Innovation Platform backend infrastructure.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Pre-Teardown Checklist](#pre-teardown-checklist)
- [Teardown Steps](#teardown-steps)
  - [Step 1: Empty S3 Buckets](#step-1-empty-s3-buckets)
  - [Step 2: Export Important Data](#step-2-export-important-data)
  - [Step 3: Delete Cognito Users](#step-3-delete-cognito-users)
  - [Step 4: Destroy CDK Stacks](#step-4-destroy-cdk-stacks)
  - [Step 5: Clean Up Remaining Resources](#step-5-clean-up-remaining-resources)
- [Verification Steps](#verification-steps)
- [Troubleshooting](#troubleshooting)
- [Cost Considerations](#cost-considerations)

## Overview

This guide provides step-by-step instructions for completely removing all AWS resources created by the backend infrastructure. Following these steps ensures:

- **Complete cleanup**: All resources are removed to avoid ongoing charges
- **Data safety**: Important data is backed up before deletion
- **Proper order**: Resources are deleted in the correct sequence to avoid dependency errors
- **Verification**: Confirmation that all resources have been successfully removed

**⚠️ WARNING**: This process is **irreversible**. All data will be permanently deleted. Ensure you have backups of any important data before proceeding.

## Prerequisites

Before starting the teardown process, ensure you have:

1. **AWS CLI** configured with appropriate credentials
   ```bash
   aws configure list
   ```

2. **AWS CDK CLI** installed
   ```bash
   cdk --version
   ```

3. **Administrative access** to the AWS account

4. **Environment context** - Know which environment you're tearing down (dev, staging, or prod)

5. **Backup confirmation** - Verify all important data has been backed up

## Pre-Teardown Checklist

Before proceeding with teardown, complete this checklist:

- [ ] **Backup critical data**
  - Export DynamoDB tables if needed
  - Download important images from S3
  - Save CloudWatch logs if required for audit
  
- [ ] **Notify stakeholders**
  - Inform team members about the teardown
  - Ensure no active users or processes are running
  
- [ ] **Document current state**
  - Note down any custom configurations
  - Save CloudFormation outputs if needed
  - Export API Gateway configurations
  
- [ ] **Verify environment**
  - Confirm you're targeting the correct environment
  - Double-check AWS account ID
  - Verify AWS region

## Teardown Steps

### Step 1: Empty S3 Buckets

S3 buckets must be empty before CloudFormation can delete them. Empty all buckets created by the infrastructure.

#### 1.1 List All Buckets

First, identify all buckets created by the infrastructure:

```bash
# Set your environment (dev, staging, or prod)
export ENV=dev

# List all buckets with the environment prefix
aws s3 ls | grep "${ENV}-"
```

You should see buckets like:
- `{env}-farm-images-{account-id}`
- `{env}-backups-{account-id}`

#### 1.2 Empty the Images Bucket

```bash
# Get your AWS account ID
export ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Empty the images bucket
aws s3 rm s3://${ENV}-farm-images-${ACCOUNT_ID} --recursive

# Verify the bucket is empty
aws s3 ls s3://${ENV}-farm-images-${ACCOUNT_ID}
```

#### 1.3 Empty the Backups Bucket

```bash
# Empty the backups bucket
aws s3 rm s3://${ENV}-backups-${ACCOUNT_ID} --recursive

# Verify the bucket is empty
aws s3 ls s3://${ENV}-backups-${ACCOUNT_ID}
```

#### 1.4 Delete Object Versions (if versioning is enabled)

If versioning is enabled, you need to delete all object versions:

```bash
# Delete all versions from images bucket
aws s3api list-object-versions \
  --bucket ${ENV}-farm-images-${ACCOUNT_ID} \
  --output json \
  --query 'Versions[].{Key:Key,VersionId:VersionId}' | \
  jq -r '.[] | "--key \(.Key) --version-id \(.VersionId)"' | \
  xargs -I {} aws s3api delete-object --bucket ${ENV}-farm-images-${ACCOUNT_ID} {}

# Delete all delete markers from images bucket
aws s3api list-object-versions \
  --bucket ${ENV}-farm-images-${ACCOUNT_ID} \
  --output json \
  --query 'DeleteMarkers[].{Key:Key,VersionId:VersionId}' | \
  jq -r '.[] | "--key \(.Key) --version-id \(.VersionId)"' | \
  xargs -I {} aws s3api delete-object --bucket ${ENV}-farm-images-${ACCOUNT_ID} {}

# Repeat for backups bucket
aws s3api list-object-versions \
  --bucket ${ENV}-backups-${ACCOUNT_ID} \
  --output json \
  --query 'Versions[].{Key:Key,VersionId:VersionId}' | \
  jq -r '.[] | "--key \(.Key) --version-id \(.VersionId)"' | \
  xargs -I {} aws s3api delete-object --bucket ${ENV}-backups-${ACCOUNT_ID} {}

aws s3api list-object-versions \
  --bucket ${ENV}-backups-${ACCOUNT_ID} \
  --output json \
  --query 'DeleteMarkers[].{Key:Key,VersionId:VersionId}' | \
  jq -r '.[] | "--key \(.Key) --version-id \(.VersionId)"' | \
  xargs -I {} aws s3api delete-object --bucket ${ENV}-backups-${ACCOUNT_ID} {}
```

### Step 2: Export Important Data

Before deleting resources, export any data you may need later.

#### 2.1 Export DynamoDB Tables (Optional)

If you need to preserve data from DynamoDB tables:

```bash
# List all tables for the environment
aws dynamodb list-tables --output json | jq -r '.TableNames[] | select(startswith("'${ENV}'-"))'

# Export a specific table (example: users table)
aws dynamodb scan \
  --table-name ${ENV}-users \
  --output json > ${ENV}-users-backup.json

# Repeat for other tables as needed:
# - ${ENV}-farms
# - ${ENV}-images
# - ${ENV}-disease-analyses
# - ${ENV}-market-prices
# - ${ENV}-sensor-data
# - ${ENV}-sensor-aggregates
# - ${ENV}-optimizations
# - ${ENV}-chat-messages
# - ${ENV}-alerts
```

#### 2.2 Export CloudWatch Logs (Optional)

```bash
# List log groups
aws logs describe-log-groups \
  --log-group-name-prefix /aws/lambda/${ENV}- \
  --query 'logGroups[].logGroupName' \
  --output table

# Export logs for a specific Lambda function (example)
aws logs create-export-task \
  --log-group-name /aws/lambda/${ENV}-auth-login \
  --from $(date -d '30 days ago' +%s)000 \
  --to $(date +%s)000 \
  --destination ${ENV}-backups-${ACCOUNT_ID} \
  --destination-prefix cloudwatch-logs/
```

### Step 3: Delete Cognito Users

Cognito User Pools with users may require manual cleanup or confirmation.

#### 3.1 List Cognito User Pools

```bash
# Find the user pool for your environment
aws cognito-idp list-user-pools --max-results 60 --output json | \
  jq -r '.UserPools[] | select(.Name | contains("'${ENV}'")) | {Id: .Id, Name: .Name}'
```

#### 3.2 List Users in the Pool

```bash
# Set the user pool ID from the previous command
export USER_POOL_ID="your-user-pool-id"

# List all users
aws cognito-idp list-users \
  --user-pool-id ${USER_POOL_ID} \
  --output table
```

#### 3.3 Delete Users (Optional)

If you want to manually delete users before stack deletion:

```bash
# Delete a specific user
aws cognito-idp admin-delete-user \
  --user-pool-id ${USER_POOL_ID} \
  --username user@example.com

# Or delete all users (use with caution!)
aws cognito-idp list-users \
  --user-pool-id ${USER_POOL_ID} \
  --output json | \
  jq -r '.Users[].Username' | \
  xargs -I {} aws cognito-idp admin-delete-user \
    --user-pool-id ${USER_POOL_ID} \
    --username {}
```

**Note**: CDK will delete the User Pool even with users present, but manual deletion can speed up the process.

### Step 4: Destroy CDK Stacks

Now destroy all CDK stacks in the correct order.

#### 4.1 List All Stacks

First, see what stacks exist for your environment:

```bash
# List all CloudFormation stacks
aws cloudformation list-stacks \
  --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE \
  --query 'StackSummaries[?contains(StackName, `'${ENV}'`)].StackName' \
  --output table
```

You should see stacks like:
- `{env}-monitoring-stack`
- `{env}-websocket-stack`
- `{env}-api-stack`
- `{env}-iot-stack`
- `{env}-ai-stack`
- `{env}-compute-stack`
- `{env}-auth-stack`
- `{env}-storage-stack`
- `{env}-secrets-stack`
- `{env}-network-stack`
- `{env}-pipeline-stack` (if deployed)

#### 4.2 Destroy All Stacks

The easiest way is to destroy all stacks at once:

```bash
# Navigate to the project root
cd aws-backend-infrastructure

# Destroy all stacks for the environment
npm run cdk:destroy -- --all --context environment=${ENV} --force
```

**Note**: The `--force` flag skips confirmation prompts. Remove it if you want to confirm each stack deletion.

#### 4.3 Destroy Stacks Individually (Alternative)

If you prefer to destroy stacks one by one in the correct order:

```bash
# Destroy in reverse dependency order
npm run cdk:destroy -- ${ENV}-monitoring-stack --context environment=${ENV} --force
npm run cdk:destroy -- ${ENV}-websocket-stack --context environment=${ENV} --force
npm run cdk:destroy -- ${ENV}-api-stack --context environment=${ENV} --force
npm run cdk:destroy -- ${ENV}-iot-stack --context environment=${ENV} --force
npm run cdk:destroy -- ${ENV}-ai-stack --context environment=${ENV} --force
npm run cdk:destroy -- ${ENV}-compute-stack --context environment=${ENV} --force
npm run cdk:destroy -- ${ENV}-auth-stack --context environment=${ENV} --force
npm run cdk:destroy -- ${ENV}-storage-stack --context environment=${ENV} --force
npm run cdk:destroy -- ${ENV}-secrets-stack --context environment=${ENV} --force
npm run cdk:destroy -- ${ENV}-network-stack --context environment=${ENV} --force
npm run cdk:destroy -- ${ENV}-pipeline-stack --context environment=${ENV} --force
```

#### 4.4 Monitor Deletion Progress

Watch the deletion progress in the AWS Console or via CLI:

```bash
# Watch stack deletion status
watch -n 10 'aws cloudformation list-stacks \
  --stack-status-filter DELETE_IN_PROGRESS DELETE_COMPLETE DELETE_FAILED \
  --query "StackSummaries[?contains(StackName, \"'${ENV}'\")].{Name:StackName,Status:StackStatus}" \
  --output table'
```

### Step 5: Clean Up Remaining Resources

After stack deletion, verify and clean up any remaining resources.

#### 5.1 Check for Remaining S3 Buckets

```bash
# List any remaining buckets
aws s3 ls | grep "${ENV}-"

# If any remain, delete them manually
aws s3 rb s3://${ENV}-remaining-bucket-name --force
```

#### 5.2 Check for Remaining CloudWatch Log Groups

```bash
# List log groups
aws logs describe-log-groups \
  --log-group-name-prefix /aws/lambda/${ENV}- \
  --query 'logGroups[].logGroupName' \
  --output table

# Delete remaining log groups
aws logs describe-log-groups \
  --log-group-name-prefix /aws/lambda/${ENV}- \
  --query 'logGroups[].logGroupName' \
  --output text | \
  xargs -I {} aws logs delete-log-group --log-group-name {}
```

#### 5.3 Check for Remaining IAM Roles

```bash
# List IAM roles created by the stacks
aws iam list-roles \
  --query 'Roles[?contains(RoleName, `'${ENV}'`)].RoleName' \
  --output table

# Note: CDK should clean these up automatically
# Only delete manually if they remain after stack deletion
```

#### 5.4 Check for Remaining Security Groups

```bash
# List security groups
aws ec2 describe-security-groups \
  --filters "Name=tag:Environment,Values=${ENV}" \
  --query 'SecurityGroups[].{ID:GroupId,Name:GroupName}' \
  --output table

# Note: Security groups in use cannot be deleted
# Delete VPC first, then security groups will be removed
```

#### 5.5 Check for Remaining VPCs

```bash
# List VPCs
aws ec2 describe-vpcs \
  --filters "Name=tag:Environment,Values=${ENV}" \
  --query 'Vpcs[].{ID:VpcId,CIDR:CidrBlock}' \
  --output table

# If VPC remains, delete it manually (after all dependencies are removed)
# aws ec2 delete-vpc --vpc-id vpc-xxxxx
```

#### 5.6 Check for Remaining ElastiCache Clusters

```bash
# List ElastiCache clusters
aws elasticache describe-cache-clusters \
  --query 'CacheClusters[?contains(CacheClusterId, `'${ENV}'`)].CacheClusterId' \
  --output table

# Delete if any remain
# aws elasticache delete-cache-cluster --cache-cluster-id ${ENV}-redis-cluster
```

#### 5.7 Check for Remaining IoT Resources

```bash
# List IoT things
aws iot list-things --output table

# List IoT policies
aws iot list-policies --output table

# Delete IoT things if any remain
# aws iot delete-thing --thing-name sensor-001

# Detach and delete IoT policies
# aws iot detach-policy --policy-name ${ENV}-iot-policy --target arn:aws:iot:region:account:cert/xxx
# aws iot delete-policy --policy-name ${ENV}-iot-policy
```

## Verification Steps

After completing the teardown, verify all resources have been removed.

### Verification Checklist

Run these commands to verify complete cleanup:

#### 1. Verify CloudFormation Stacks

```bash
# Should return no stacks or only DELETE_COMPLETE status
aws cloudformation list-stacks \
  --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE ROLLBACK_COMPLETE \
  --query 'StackSummaries[?contains(StackName, `'${ENV}'`)].{Name:StackName,Status:StackStatus}' \
  --output table
```

**Expected**: No stacks with CREATE_COMPLETE or UPDATE_COMPLETE status

#### 2. Verify S3 Buckets

```bash
# Should return no buckets
aws s3 ls | grep "${ENV}-"
```

**Expected**: No output

#### 3. Verify DynamoDB Tables

```bash
# Should return no tables
aws dynamodb list-tables --output json | \
  jq -r '.TableNames[] | select(startswith("'${ENV}'-"))'
```

**Expected**: No output

#### 4. Verify Lambda Functions

```bash
# Should return no functions
aws lambda list-functions \
  --query 'Functions[?contains(FunctionName, `'${ENV}'`)].FunctionName' \
  --output table
```

**Expected**: No functions listed

#### 5. Verify API Gateway APIs

```bash
# Should return no APIs
aws apigateway get-rest-apis \
  --query 'items[?contains(name, `'${ENV}'`)].{Name:name,ID:id}' \
  --output table
```

**Expected**: No APIs listed

#### 6. Verify Cognito User Pools

```bash
# Should return no user pools
aws cognito-idp list-user-pools --max-results 60 \
  --query 'UserPools[?contains(Name, `'${ENV}'`)].{Name:Name,ID:Id}' \
  --output table
```

**Expected**: No user pools listed

#### 7. Verify CloudWatch Log Groups

```bash
# Should return no log groups
aws logs describe-log-groups \
  --log-group-name-prefix /aws/lambda/${ENV}- \
  --query 'logGroups[].logGroupName' \
  --output table
```

**Expected**: No log groups listed

#### 8. Verify IAM Roles

```bash
# Should return no roles (or only AWS-managed roles)
aws iam list-roles \
  --query 'Roles[?contains(RoleName, `'${ENV}'`)].RoleName' \
  --output table
```

**Expected**: No custom roles listed

#### 9. Verify VPCs

```bash
# Should return no VPCs (or only default VPC)
aws ec2 describe-vpcs \
  --filters "Name=tag:Environment,Values=${ENV}" \
  --query 'Vpcs[].{ID:VpcId,CIDR:CidrBlock}' \
  --output table
```

**Expected**: No custom VPCs listed

#### 10. Verify ElastiCache Clusters

```bash
# Should return no clusters
aws elasticache describe-cache-clusters \
  --query 'CacheClusters[?contains(CacheClusterId, `'${ENV}'`)].CacheClusterId' \
  --output table
```

**Expected**: No clusters listed

### Complete Verification Script

Run this comprehensive verification script:

```bash
#!/bin/bash

ENV=${1:-dev}
echo "Verifying teardown for environment: ${ENV}"
echo "================================================"

echo -e "\n1. Checking CloudFormation stacks..."
STACKS=$(aws cloudformation list-stacks \
  --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE \
  --query 'StackSummaries[?contains(StackName, `'${ENV}'`)].StackName' \
  --output text)
if [ -z "$STACKS" ]; then
  echo "✓ No active stacks found"
else
  echo "✗ Found active stacks: $STACKS"
fi

echo -e "\n2. Checking S3 buckets..."
BUCKETS=$(aws s3 ls | grep "${ENV}-" | wc -l)
if [ "$BUCKETS" -eq 0 ]; then
  echo "✓ No S3 buckets found"
else
  echo "✗ Found $BUCKETS S3 bucket(s)"
fi

echo -e "\n3. Checking DynamoDB tables..."
TABLES=$(aws dynamodb list-tables --output json | \
  jq -r '.TableNames[] | select(startswith("'${ENV}'-"))' | wc -l)
if [ "$TABLES" -eq 0 ]; then
  echo "✓ No DynamoDB tables found"
else
  echo "✗ Found $TABLES DynamoDB table(s)"
fi

echo -e "\n4. Checking Lambda functions..."
FUNCTIONS=$(aws lambda list-functions \
  --query 'Functions[?contains(FunctionName, `'${ENV}'`)].FunctionName' \
  --output text | wc -w)
if [ "$FUNCTIONS" -eq 0 ]; then
  echo "✓ No Lambda functions found"
else
  echo "✗ Found $FUNCTIONS Lambda function(s)"
fi

echo -e "\n5. Checking API Gateway APIs..."
APIS=$(aws apigateway get-rest-apis \
  --query 'items[?contains(name, `'${ENV}'`)].id' \
  --output text | wc -w)
if [ "$APIS" -eq 0 ]; then
  echo "✓ No API Gateway APIs found"
else
  echo "✗ Found $APIS API(s)"
fi

echo -e "\n6. Checking Cognito User Pools..."
POOLS=$(aws cognito-idp list-user-pools --max-results 60 \
  --query 'UserPools[?contains(Name, `'${ENV}'`)].Id' \
  --output text | wc -w)
if [ "$POOLS" -eq 0 ]; then
  echo "✓ No Cognito User Pools found"
else
  echo "✗ Found $POOLS User Pool(s)"
fi

echo -e "\n7. Checking CloudWatch Log Groups..."
LOGS=$(aws logs describe-log-groups \
  --log-group-name-prefix /aws/lambda/${ENV}- \
  --query 'logGroups[].logGroupName' \
  --output text | wc -w)
if [ "$LOGS" -eq 0 ]; then
  echo "✓ No CloudWatch Log Groups found"
else
  echo "✗ Found $LOGS Log Group(s)"
fi

echo -e "\n================================================"
echo "Verification complete!"
```

Save this as `verify-teardown.sh` and run:

```bash
chmod +x verify-teardown.sh
./verify-teardown.sh dev
```

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: Stack Deletion Fails - S3 Bucket Not Empty

**Error**: 
```
The bucket you tried to delete is not empty. You must delete all versions in the bucket.
```

**Solution**:
```bash
# Empty the bucket including all versions
aws s3api list-object-versions \
  --bucket ${ENV}-farm-images-${ACCOUNT_ID} \
  --output json | \
  jq -r '.Versions[],.DeleteMarkers[] | "--key \(.Key) --version-id \(.VersionId)"' | \
  xargs -I {} aws s3api delete-object --bucket ${ENV}-farm-images-${ACCOUNT_ID} {}

# Then retry stack deletion
npm run cdk:destroy -- ${ENV}-storage-stack --context environment=${ENV} --force
```

#### Issue 2: Stack Deletion Fails - Resource in Use

**Error**:
```
Resource is in use and cannot be deleted
```

**Solution**:
Check for dependencies and delete dependent resources first:

```bash
# Check what's using the resource
aws cloudformation describe-stack-resources \
  --stack-name ${ENV}-network-stack \
  --output table

# Delete dependent stacks first
npm run cdk:destroy -- ${ENV}-compute-stack --context environment=${ENV} --force
npm run cdk:destroy -- ${ENV}-network-stack --context environment=${ENV} --force
```

#### Issue 3: Lambda Functions Still Exist

**Error**:
Lambda functions remain after stack deletion

**Solution**:
```bash
# List remaining functions
aws lambda list-functions \
  --query 'Functions[?contains(FunctionName, `'${ENV}'`)].FunctionName' \
  --output text

# Delete manually
aws lambda delete-function --function-name ${ENV}-function-name
```

#### Issue 4: VPC Deletion Fails - Network Interfaces in Use

**Error**:
```
The vpc has dependencies and cannot be deleted
```

**Solution**:
```bash
# Find and delete network interfaces
aws ec2 describe-network-interfaces \
  --filters "Name=vpc-id,Values=vpc-xxxxx" \
  --query 'NetworkInterfaces[].NetworkInterfaceId' \
  --output text | \
  xargs -I {} aws ec2 delete-network-interface --network-interface-id {}

# Wait a few minutes, then retry VPC deletion
```

#### Issue 5: ElastiCache Cluster Won't Delete

**Error**:
ElastiCache cluster deletion hangs

**Solution**:
```bash
# Check cluster status
aws elasticache describe-cache-clusters \
  --cache-cluster-id ${ENV}-redis-cluster

# Force delete if stuck
aws elasticache delete-cache-cluster \
  --cache-cluster-id ${ENV}-redis-cluster \
  --final-snapshot-identifier ${ENV}-redis-final-snapshot
```

#### Issue 6: IAM Roles Won't Delete

**Error**:
```
Cannot delete entity, must detach all policies first
```

**Solution**:
```bash
# List attached policies
aws iam list-attached-role-policies --role-name ${ENV}-role-name

# Detach policies
aws iam detach-role-policy \
  --role-name ${ENV}-role-name \
  --policy-arn arn:aws:iam::aws:policy/PolicyName

# Delete inline policies
aws iam list-role-policies --role-name ${ENV}-role-name --output text | \
  xargs -I {} aws iam delete-role-policy --role-name ${ENV}-role-name --policy-name {}

# Delete role
aws iam delete-role --role-name ${ENV}-role-name
```

#### Issue 7: CDK Bootstrap Stack Remains

**Question**: Should I delete the CDK bootstrap stack?

**Answer**: 
The CDK bootstrap stack (`CDKToolkit`) is shared across all CDK applications in your account/region. **Do not delete it** unless you're sure no other CDK applications are using it.

If you want to remove it:
```bash
# Only do this if you're certain no other CDK apps exist
aws cloudformation delete-stack --stack-name CDKToolkit
```

## Cost Considerations

### Costs During Teardown

- **S3 Storage**: You're charged for storage until buckets are emptied
- **DynamoDB**: On-demand tables stop charging immediately after deletion
- **Lambda**: No charges after functions are deleted
- **CloudWatch Logs**: Logs continue to incur storage charges until deleted
- **ElastiCache**: Charges stop after cluster deletion (can take 10-15 minutes)

### Estimated Teardown Time

- **Small environment** (dev): 10-15 minutes
- **Medium environment** (staging): 15-25 minutes
- **Large environment** (prod): 20-30 minutes

### Post-Teardown Verification

Wait 24-48 hours after teardown, then check your AWS Cost Explorer to verify no ongoing charges:

```bash
# Check recent costs
aws ce get-cost-and-usage \
  --time-period Start=$(date -d '7 days ago' +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity DAILY \
  --metrics BlendedCost \
  --group-by Type=SERVICE
```

## Quick Teardown Script

For a fast teardown (use with caution!), save this as `quick-teardown.sh`:

```bash
#!/bin/bash

set -e

ENV=${1:-dev}
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "⚠️  WARNING: This will delete ALL resources for environment: ${ENV}"
echo "Account ID: ${ACCOUNT_ID}"
read -p "Are you sure? Type 'yes' to continue: " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Teardown cancelled"
  exit 0
fi

echo "Starting teardown..."

# Step 1: Empty S3 buckets
echo "Emptying S3 buckets..."
aws s3 rm s3://${ENV}-farm-images-${ACCOUNT_ID} --recursive 2>/dev/null || true
aws s3 rm s3://${ENV}-backups-${ACCOUNT_ID} --recursive 2>/dev/null || true

# Step 2: Delete object versions
echo "Deleting S3 object versions..."
for BUCKET in ${ENV}-farm-images-${ACCOUNT_ID} ${ENV}-backups-${ACCOUNT_ID}; do
  aws s3api list-object-versions --bucket ${BUCKET} --output json 2>/dev/null | \
    jq -r '.Versions[],.DeleteMarkers[] | "--key \(.Key) --version-id \(.VersionId)"' | \
    xargs -I {} aws s3api delete-object --bucket ${BUCKET} {} 2>/dev/null || true
done

# Step 3: Destroy CDK stacks
echo "Destroying CDK stacks..."
cd aws-backend-infrastructure
npm run cdk:destroy -- --all --context environment=${ENV} --force

# Step 4: Clean up remaining log groups
echo "Cleaning up CloudWatch log groups..."
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/${ENV}- --query 'logGroups[].logGroupName' --output text | \
  xargs -I {} aws logs delete-log-group --log-group-name {} 2>/dev/null || true

echo "✓ Teardown complete!"
echo "Run the verification script to confirm all resources are deleted."
```

Usage:
```bash
chmod +x quick-teardown.sh
./quick-teardown.sh dev
```

## Summary

This teardown guide provides comprehensive instructions for safely removing all AWS resources. Key points:

1. **Always backup data first** - Teardown is irreversible
2. **Empty S3 buckets** before stack deletion
3. **Follow the correct order** - Destroy dependent resources first
4. **Verify complete cleanup** - Use the verification checklist
5. **Monitor costs** - Ensure no ongoing charges after teardown

For questions or issues, refer to the troubleshooting section or consult the AWS documentation.

---

**Related Documentation**:
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Cost Estimation Guide](./COST_ESTIMATION_GUIDE.md)
- [Testing Guide](./TESTING_GUIDE.md)
