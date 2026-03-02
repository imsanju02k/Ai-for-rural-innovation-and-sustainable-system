# Operations Runbook

## Overview

This operations runbook provides comprehensive procedures for monitoring, maintaining, and troubleshooting the AWS Backend Infrastructure for the AI Rural Innovation Platform. It covers day-to-day operations, incident response, backup and recovery, and scaling procedures.

**Target Audience:** DevOps engineers, SREs, on-call engineers, and operations teams

**Requirements:** Non-functional - Reliability

---

## Table of Contents

- [System Architecture Overview](#system-architecture-overview)
- [Monitoring Procedures](#monitoring-procedures)
- [Incident Response](#incident-response)
- [Backup and Recovery](#backup-and-recovery)
- [Scaling Procedures](#scaling-procedures)
- [Maintenance Procedures](#maintenance-procedures)
- [Troubleshooting Guide](#troubleshooting-guide)
- [Emergency Contacts](#emergency-contacts)
- [Appendix](#appendix)

---

## System Architecture Overview

### Core Components

**API Layer:**
- Amazon API Gateway (REST API)
- Lambda Authorizer for authentication
- Rate limiting: 1,000 requests/minute per user

**Compute Layer:**
- 20+ Lambda functions (Node.js 20.x, ARM64)
- Lambda layers for shared dependencies
- Memory: 256 MB - 1024 MB
- Timeout: 10s - 60s

**Data Layer:**
- DynamoDB tables (10 tables with GSIs)
- ElastiCache Redis cluster (caching)
- S3 buckets (images, backups)

**AI/ML Services:**
- Amazon Bedrock (Claude 3 Sonnet)
- Amazon Rekognition (image analysis)

**IoT Layer:**
- AWS IoT Core (MQTT)
- X.509 certificate authentication
- IoT Rules Engine

**Authentication:**
- Amazon Cognito User Pool
- JWT tokens (24-hour expiry)
- Role-based access control

**Monitoring:**
- CloudWatch Logs (30-day retention)
- CloudWatch Metrics and Dashboards
- CloudWatch Alarms
- AWS X-Ray (distributed tracing)
- SNS notifications

### Environment Details


| Environment | Purpose | API Endpoint | Cognito Pool |
|-------------|---------|--------------|--------------|
| Development | Testing and development | `https://dev-api.example.com` | `dev-user-pool` |
| Staging | Pre-production validation | `https://staging-api.example.com` | `staging-user-pool` |
| Production | Live system | `https://api.example.com` | `prod-user-pool` |

### Key Metrics

**Performance Targets:**
- API response time: <1s (p95)
- DynamoDB read latency: <20ms (p99)
- DynamoDB write latency: <50ms (p99)
- Disease detection: <5s
- Advisory chat: <2s
- System uptime: 99.9%

**Capacity Limits:**
- Lambda concurrent executions: 1,000 (default)
- API Gateway rate limit: 1,000 req/min per user
- DynamoDB: On-demand (auto-scaling)
- IoT Core: 1,000 messages/second

---

## Monitoring Procedures

### Daily Monitoring Tasks

**Morning Health Check (15 minutes)**

1. **Review CloudWatch Dashboard**
   - Navigate to CloudWatch → Dashboards → `prod-farm-platform-dashboard`
   - Check all widgets for anomalies
   - Verify all metrics are reporting

2. **Check Active Alarms**
   ```bash
   aws cloudwatch describe-alarms \
     --state-value ALARM \
     --query 'MetricAlarms[*].[AlarmName,StateReason]' \
     --output table
   ```

3. **Review Error Rates**
   - API Gateway 4XX errors: Should be <5%
   - API Gateway 5XX errors: Should be <1%
   - Lambda errors: Should be <0.5%

4. **Check System Health**
   ```bash
   # Run health check script
   ./scripts/health-check.sh --environment prod
   ```

5. **Review Cost Trends**
   - Navigate to AWS Cost Explorer
   - Compare yesterday's spend to average
   - Investigate any anomalies >20% variance

**Weekly Monitoring Tasks (30 minutes)**


1. **Review CloudWatch Logs Insights**
   - Run saved queries for error patterns
   - Identify top errors by frequency
   - Check for new error types

2. **Analyze Performance Trends**
   - Lambda duration trends
   - DynamoDB throttling events
   - API Gateway latency percentiles

3. **Review Security Events**
   - CloudTrail logs for unauthorized access attempts
   - Cognito failed login attempts
   - WAF blocked requests

4. **Capacity Planning**
   - Review Lambda concurrent execution trends
   - Check DynamoDB consumed capacity
   - Monitor S3 storage growth
   - Review ElastiCache memory usage

5. **Cost Analysis**
   - Review weekly cost by service
   - Identify cost optimization opportunities
   - Verify budget alerts are configured

**Monthly Monitoring Tasks (2 hours)**

1. **Comprehensive Performance Review**
   - Generate monthly performance report
   - Compare against SLAs
   - Identify degradation trends

2. **Security Audit**
   - Review IAM policies and roles
   - Check for unused access keys
   - Verify MFA enabled for all users
   - Review security group rules

3. **Backup Verification**
   - Test DynamoDB point-in-time recovery
   - Verify S3 backup replication
   - Test restore procedures

4. **Dependency Updates**
   - Check for Lambda runtime updates
   - Review npm package vulnerabilities
   - Plan dependency upgrade schedule

5. **Documentation Review**
   - Update runbooks with new procedures
   - Document any workarounds or issues
   - Review and update contact information

### CloudWatch Dashboards

**Main Dashboard: `prod-farm-platform-dashboard`**

Widgets:
- API Gateway request count (last 24h)
- API Gateway error rates (4XX, 5XX)
- API Gateway latency (p50, p95, p99)
- Lambda invocations by function
- Lambda errors and throttles
- Lambda duration (p95, p99)
- DynamoDB consumed capacity
- DynamoDB throttled requests
- S3 bucket size
- ElastiCache CPU and memory
- Bedrock API calls and errors
- IoT Core message count

**Access:**
```bash
# Open dashboard in browser
aws cloudwatch get-dashboard \
  --dashboard-name prod-farm-platform-dashboard
```


### CloudWatch Alarms

**Critical Alarms (Immediate Response Required)**

| Alarm Name | Metric | Threshold | Action |
|------------|--------|-----------|--------|
| `prod-api-5xx-errors-high` | API Gateway 5XX errors | >5% over 5 min | Page on-call engineer |
| `prod-lambda-errors-critical` | Lambda errors | >10 errors/min | Page on-call engineer |
| `prod-dynamodb-throttling` | DynamoDB throttled requests | >10/min | Auto-scale, notify team |
| `prod-bedrock-errors-high` | Bedrock API errors | >20% over 5 min | Notify AI team |
| `prod-iot-connection-failures` | IoT connection failures | >50/min | Notify IoT team |

**Warning Alarms (Review Within 1 Hour)**

| Alarm Name | Metric | Threshold | Action |
|------------|--------|-----------|--------|
| `prod-api-4xx-errors-elevated` | API Gateway 4XX errors | >10% over 15 min | Review logs |
| `prod-lambda-duration-high` | Lambda duration | >10s (p95) | Optimize function |
| `prod-elasticache-memory-high` | ElastiCache memory | >80% | Consider scaling |
| `prod-s3-storage-growth` | S3 storage size | >1TB | Review lifecycle policies |
| `prod-cost-anomaly` | Daily cost | >20% variance | Investigate usage |

**Monitoring Alarms (Review Daily)**

| Alarm Name | Metric | Threshold | Action |
|------------|--------|-----------|--------|
| `prod-api-latency-elevated` | API Gateway latency | >1s (p95) | Monitor trend |
| `prod-cognito-failed-logins` | Failed login attempts | >100/hour | Check for attacks |
| `prod-lambda-concurrent-high` | Concurrent executions | >800 | Plan capacity increase |

### CloudWatch Logs Insights Queries

**Top Errors (Last 24 Hours)**

```sql
fields @timestamp, @message, level, error
| filter level = "ERROR"
| stats count() as error_count by error
| sort error_count desc
| limit 20
```

**Slow API Requests (>1 Second)**

```sql
fields @timestamp, requestId, duration, path, method
| filter duration > 1000
| sort duration desc
| limit 50
```

**Failed Authentication Attempts**

```sql
fields @timestamp, userId, email, ipAddress
| filter eventType = "AUTH_FAILED"
| stats count() as attempts by ipAddress
| sort attempts desc
```

**Lambda Cold Starts**

```sql
fields @timestamp, functionName, @initDuration
| filter @type = "REPORT" and @initDuration > 0
| stats count() as cold_starts, avg(@initDuration) as avg_init_time by functionName
| sort cold_starts desc
```

**DynamoDB Throttling Events**

```sql
fields @timestamp, tableName, operation
| filter errorType = "ProvisionedThroughputExceededException"
| stats count() as throttle_count by tableName, operation
| sort throttle_count desc
```


### X-Ray Tracing

**Accessing Traces**

1. Navigate to AWS X-Ray console
2. Select time range (last 1 hour, 6 hours, 24 hours)
3. Filter by:
   - HTTP status code (e.g., 5XX errors)
   - Response time (e.g., >1 second)
   - Specific service (e.g., disease-detect Lambda)

**Common Trace Patterns**

- **Successful request:** API Gateway → Lambda → DynamoDB → Response
- **AI request:** API Gateway → Lambda → Bedrock → DynamoDB → Response
- **Image processing:** S3 Upload → Lambda → Rekognition → Bedrock → DynamoDB

**Analyzing Slow Requests**

1. Filter traces by response time >1s
2. Identify bottleneck service (longest segment)
3. Check for:
   - Cold starts (high initialization time)
   - External API latency (Bedrock, Rekognition)
   - Database query performance
   - Network issues

### Metrics to Monitor

**API Gateway Metrics**

```bash
# Get API Gateway metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name Count \
  --dimensions Name=ApiName,Value=prod-farm-api \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

**Lambda Metrics**

```bash
# Get Lambda error rate
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --dimensions Name=FunctionName,Value=prod-disease-detect \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

**DynamoDB Metrics**

```bash
# Get DynamoDB consumed capacity
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=prod-users \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

---

## Incident Response

### Incident Severity Levels

**SEV-1: Critical (Production Down)**
- Complete service outage
- Data loss or corruption
- Security breach
- Response time: Immediate
- Escalation: Page on-call engineer + manager

**SEV-2: High (Major Degradation)**
- Significant performance degradation
- Feature unavailable
- High error rates (>10%)
- Response time: Within 15 minutes
- Escalation: Notify on-call engineer

**SEV-3: Medium (Minor Issues)**
- Intermittent errors
- Performance degradation (<10% impact)
- Non-critical feature issues
- Response time: Within 1 hour
- Escalation: Create ticket, notify team

**SEV-4: Low (Monitoring Alert)**
- Warning thresholds exceeded
- Potential future issues
- Response time: Next business day
- Escalation: Create ticket


### Incident Response Workflow

**1. Detection and Alerting**

- CloudWatch alarm triggers
- User reports issue
- Monitoring dashboard shows anomaly
- Automated health check fails

**2. Initial Assessment (5 minutes)**

```bash
# Quick health check
./scripts/health-check.sh --environment prod

# Check active alarms
aws cloudwatch describe-alarms --state-value ALARM

# Check recent deployments
aws cloudformation describe-stack-events \
  --stack-name prod-APIStack \
  --max-items 20

# Check CloudWatch dashboard
# Open: https://console.aws.amazon.com/cloudwatch/dashboards
```

**3. Triage and Classification**

- Determine severity level
- Identify affected components
- Estimate user impact
- Decide on escalation

**4. Communication**

- Update status page (if available)
- Notify stakeholders via Slack/email
- Create incident ticket
- Start incident timeline documentation

**5. Investigation**

- Review CloudWatch Logs
- Analyze X-Ray traces
- Check recent changes (deployments, config updates)
- Review metrics for anomalies

**6. Mitigation**

- Apply immediate fix if known
- Rollback recent deployment if needed
- Scale resources if capacity issue
- Disable problematic feature if necessary

**7. Resolution**

- Verify fix resolves issue
- Monitor for recurrence
- Update status page
- Notify stakeholders

**8. Post-Incident Review**

- Document root cause
- Create action items
- Update runbooks
- Schedule post-mortem meeting

### Common Incident Scenarios

**Scenario 1: High API Error Rate (5XX)**

**Symptoms:**
- CloudWatch alarm: `prod-api-5xx-errors-high`
- Users reporting "Internal Server Error"
- Dashboard shows spike in 5XX errors

**Investigation Steps:**

1. **Check Lambda errors:**
   ```bash
   aws logs tail /aws/lambda/prod-disease-detect --follow --filter-pattern "ERROR"
   ```

2. **Review recent deployments:**
   ```bash
   aws cloudformation describe-stack-events \
     --stack-name prod-ComputeStack \
     --max-items 20
   ```

3. **Check X-Ray for failing traces:**
   - Filter by HTTP 5XX status
   - Identify failing Lambda function
   - Review error details

4. **Check external service status:**
   - Bedrock API status
   - Rekognition API status
   - DynamoDB service health

**Resolution:**

- **If recent deployment:** Rollback using `./scripts/rollback.sh --environment prod`
- **If Lambda error:** Fix code and redeploy
- **If external service issue:** Implement circuit breaker, notify users
- **If capacity issue:** Increase Lambda concurrency limit


**Scenario 2: DynamoDB Throttling**

**Symptoms:**
- CloudWatch alarm: `prod-dynamodb-throttling`
- Slow API responses
- Lambda timeout errors
- Dashboard shows throttled requests

**Investigation Steps:**

1. **Identify throttled table:**
   ```bash
   aws cloudwatch get-metric-statistics \
     --namespace AWS/DynamoDB \
     --metric-name UserErrors \
     --dimensions Name=TableName,Value=prod-users \
     --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
     --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
     --period 60 \
     --statistics Sum
   ```

2. **Check consumed capacity:**
   ```bash
   aws dynamodb describe-table --table-name prod-users \
     --query 'Table.BillingModeSummary'
   ```

3. **Review access patterns:**
   - Check for hot partition keys
   - Review GSI usage
   - Identify inefficient queries

**Resolution:**

- **Immediate:** Tables are on-demand mode, should auto-scale
- **If hot partition:** Redesign partition key or add randomization
- **If GSI issue:** Review and optimize GSI queries
- **If scan operation:** Replace with query operation

**Scenario 3: Lambda Timeout Errors**

**Symptoms:**
- CloudWatch alarm: `prod-lambda-duration-high`
- Users reporting slow responses
- Lambda timeout errors in logs

**Investigation Steps:**

1. **Identify slow function:**
   ```bash
   aws logs insights query \
     --log-group-name /aws/lambda/prod-disease-detect \
     --start-time $(date -u -d '1 hour ago' +%s) \
     --end-time $(date -u +%s) \
     --query-string 'fields @timestamp, @duration | sort @duration desc | limit 20'
   ```

2. **Check for cold starts:**
   ```bash
   aws logs insights query \
     --log-group-name /aws/lambda/prod-disease-detect \
     --query-string 'filter @type = "REPORT" | stats count(@initDuration > 0) as cold_starts'
   ```

3. **Review X-Ray traces:**
   - Identify bottleneck (Bedrock, Rekognition, DynamoDB)
   - Check for network issues
   - Review external API latency

**Resolution:**

- **If cold starts:** Increase memory or enable provisioned concurrency
- **If external API slow:** Implement timeout and retry logic
- **If code issue:** Optimize algorithm, add caching
- **If timeout too low:** Increase Lambda timeout setting

**Scenario 4: Bedrock API Errors**

**Symptoms:**
- CloudWatch alarm: `prod-bedrock-errors-high`
- Disease detection failures
- Chat responses failing
- "AI service unavailable" errors

**Investigation Steps:**

1. **Check Bedrock service health:**
   - Visit AWS Service Health Dashboard
   - Check Bedrock API status

2. **Review error logs:**
   ```bash
   aws logs tail /aws/lambda/prod-advisory-chat --follow \
     --filter-pattern "BedrockError"
   ```

3. **Check rate limits:**
   - Review Bedrock quotas
   - Check if hitting token limits
   - Verify model access enabled

**Resolution:**

- **If service outage:** Enable circuit breaker, notify users
- **If rate limit:** Implement request queuing, increase quota
- **If model access:** Enable model in Bedrock console
- **If token limit:** Optimize prompts, reduce token usage


**Scenario 5: IoT Device Connection Failures**

**Symptoms:**
- CloudWatch alarm: `prod-iot-connection-failures`
- Sensor data not updating
- Device offline notifications

**Investigation Steps:**

1. **Check IoT Core metrics:**
   ```bash
   aws cloudwatch get-metric-statistics \
     --namespace AWS/IoT \
     --metric-name Connect.ClientError \
     --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
     --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
     --period 300 \
     --statistics Sum
   ```

2. **Review IoT logs:**
   ```bash
   aws logs tail AWSIotLogsV2 --follow
   ```

3. **Check device certificates:**
   - Verify certificates not expired
   - Check certificate status
   - Review IoT policy permissions

**Resolution:**

- **If certificate expired:** Rotate device certificates
- **If policy issue:** Update IoT policy
- **If network issue:** Check device connectivity
- **If IoT Core issue:** Check AWS service health

### Incident Communication Templates

**Initial Notification (SEV-1/SEV-2)**

```
Subject: [SEV-X] Production Incident - [Brief Description]

We are currently investigating an issue affecting [component/feature].

Impact: [Description of user impact]
Start Time: [Timestamp]
Status: Investigating

We will provide updates every 30 minutes.

Incident Commander: [Name]
```

**Update Notification**

```
Subject: [SEV-X] Update - [Brief Description]

Update as of [Timestamp]:

Current Status: [Investigating/Mitigating/Resolved]
Actions Taken: [List of actions]
Next Steps: [Planned actions]

Next update in 30 minutes or when status changes.
```

**Resolution Notification**

```
Subject: [RESOLVED] [Brief Description]

The incident has been resolved as of [Timestamp].

Root Cause: [Brief explanation]
Resolution: [What was done]
Impact Duration: [Duration]

A detailed post-mortem will be shared within 48 hours.
```

---

## Backup and Recovery

### Backup Strategy

**DynamoDB Tables**

- **Point-in-Time Recovery (PITR):** Enabled on all production tables
- **Recovery Window:** Last 35 days
- **RPO (Recovery Point Objective):** 5 minutes
- **RTO (Recovery Time Objective):** 30 minutes

**Manual Backups:**
- Frequency: Daily at 02:00 UTC
- Retention: 7 days
- Location: S3 bucket `prod-backups-{account-id}`

**S3 Buckets**

- **Versioning:** Enabled on all buckets
- **Cross-Region Replication:** Enabled for production
- **Lifecycle Policies:**
  - Images: Transition to Glacier after 90 days
  - Backups: Delete after 90 days
- **RPO:** Real-time (versioning)
- **RTO:** Immediate (versioning), 3-5 hours (Glacier)

**Configuration Backups**

- **CloudFormation Templates:** Stored in Git repository
- **Lambda Code:** Stored in Git repository
- **Environment Variables:** Stored in AWS Secrets Manager
- **Frequency:** On every deployment
- **Retention:** Indefinite (Git history)


### Recovery Procedures

**DynamoDB Point-in-Time Recovery**

**Scenario:** Accidental data deletion or corruption

**Steps:**

1. **Identify recovery point:**
   ```bash
   # Check available recovery points
   aws dynamodb describe-continuous-backups \
     --table-name prod-users
   ```

2. **Restore table:**
   ```bash
   # Restore to specific point in time
   aws dynamodb restore-table-to-point-in-time \
     --source-table-name prod-users \
     --target-table-name prod-users-restored \
     --restore-date-time 2024-01-15T10:30:00Z
   ```

3. **Wait for restore to complete:**
   ```bash
   aws dynamodb wait table-exists --table-name prod-users-restored
   ```

4. **Verify restored data:**
   ```bash
   # Compare record counts
   aws dynamodb describe-table --table-name prod-users \
     --query 'Table.ItemCount'
   
   aws dynamodb describe-table --table-name prod-users-restored \
     --query 'Table.ItemCount'
   
   # Sample data verification
   aws dynamodb scan --table-name prod-users-restored --max-items 5
   ```

5. **Swap tables (requires maintenance window):**
   ```bash
   # Stop application traffic
   aws apigateway update-stage \
     --rest-api-id {API_ID} \
     --stage-name prod \
     --patch-operations op=replace,path=/throttle/rateLimit,value=0
   
   # Rename tables (manual process via console or script)
   # 1. Rename prod-users to prod-users-backup
   # 2. Rename prod-users-restored to prod-users
   
   # Resume application traffic
   aws apigateway update-stage \
     --rest-api-id {API_ID} \
     --stage-name prod \
     --patch-operations op=replace,path=/throttle/rateLimit,value=1000
   ```

6. **Monitor application:**
   - Check CloudWatch metrics
   - Run smoke tests
   - Monitor error rates

**DynamoDB Manual Backup Restore**

**Scenario:** Restore from scheduled backup

**Steps:**

1. **List available backups:**
   ```bash
   aws dynamodb list-backups --table-name prod-users
   ```

2. **Restore from backup:**
   ```bash
   aws dynamodb restore-table-from-backup \
     --target-table-name prod-users-restored \
     --backup-arn arn:aws:dynamodb:region:account:table/prod-users/backup/01234567890123-abcdefgh
   ```

3. **Follow steps 3-6 from PITR procedure above**

**S3 Object Recovery**

**Scenario:** Accidental file deletion or corruption

**Steps:**

1. **List object versions:**
   ```bash
   aws s3api list-object-versions \
     --bucket prod-farm-images-{account-id} \
     --prefix {userId}/{farmId}/
   ```

2. **Restore specific version:**
   ```bash
   aws s3api copy-object \
     --bucket prod-farm-images-{account-id} \
     --copy-source prod-farm-images-{account-id}/{key}?versionId={version-id} \
     --key {key}
   ```

3. **Restore from Glacier (if archived):**
   ```bash
   # Initiate restore (takes 3-5 hours)
   aws s3api restore-object \
     --bucket prod-farm-images-{account-id} \
     --key {key} \
     --restore-request Days=7,GlacierJobParameters={Tier=Standard}
   
   # Check restore status
   aws s3api head-object \
     --bucket prod-farm-images-{account-id} \
     --key {key}
   
   # Download when ready
   aws s3 cp s3://prod-farm-images-{account-id}/{key} ./restored-file
   ```


**Lambda Function Recovery**

**Scenario:** Corrupted Lambda function or configuration

**Steps:**

1. **Rollback to previous version:**
   ```bash
   # List function versions
   aws lambda list-versions-by-function \
     --function-name prod-disease-detect
   
   # Update alias to previous version
   aws lambda update-alias \
     --function-name prod-disease-detect \
     --name live \
     --function-version {previous-version}
   ```

2. **Restore from Git:**
   ```bash
   # Checkout previous commit
   git checkout {commit-hash}
   
   # Redeploy
   cdk deploy prod-ComputeStack
   ```

**Complete System Recovery**

**Scenario:** Complete infrastructure failure or region outage

**Steps:**

1. **Deploy to backup region:**
   ```bash
   # Deploy all stacks to backup region
   cdk deploy --all --context environment=prod --context region=us-west-2
   ```

2. **Restore DynamoDB tables:**
   ```bash
   # Use cross-region backup replication
   # Or restore from S3 backups
   ./scripts/restore-dynamodb.sh --region us-west-2
   ```

3. **Update DNS:**
   ```bash
   # Update Route 53 to point to new region
   aws route53 change-resource-record-sets \
     --hosted-zone-id {ZONE_ID} \
     --change-batch file://dns-update.json
   ```

4. **Verify system health:**
   ```bash
   ./scripts/health-check.sh --environment prod --region us-west-2
   ```

### Backup Verification

**Monthly Backup Testing**

1. **Test DynamoDB restore:**
   ```bash
   # Restore a table to test environment
   aws dynamodb restore-table-to-point-in-time \
     --source-table-name prod-users \
     --target-table-name test-users-restore \
     --restore-date-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S)
   
   # Verify data integrity
   ./scripts/verify-backup.sh --table test-users-restore
   
   # Clean up
   aws dynamodb delete-table --table-name test-users-restore
   ```

2. **Test S3 restore:**
   ```bash
   # Restore sample files from Glacier
   ./scripts/test-s3-restore.sh --bucket prod-farm-images-{account-id}
   ```

3. **Document results:**
   - Restore time
   - Data integrity verification
   - Issues encountered
   - Update RTO/RPO estimates

---

## Scaling Procedures

### Horizontal Scaling

**Lambda Functions**

Lambda functions automatically scale horizontally. Monitor and adjust:

**Check current concurrency:**
```bash
aws lambda get-function-concurrency \
  --function-name prod-disease-detect
```

**Increase concurrency limit:**
```bash
# Increase reserved concurrency
aws lambda put-function-concurrency \
  --function-name prod-disease-detect \
  --reserved-concurrent-executions 500
```

**Enable provisioned concurrency (for predictable workloads):**
```bash
aws lambda put-provisioned-concurrency-config \
  --function-name prod-disease-detect \
  --provisioned-concurrent-executions 10 \
  --qualifier live
```

**DynamoDB Tables**

Tables use on-demand capacity mode for automatic scaling.

**Monitor consumed capacity:**
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=prod-users \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum,Average,Maximum
```

**Switch to provisioned capacity (for cost optimization):**
```bash
# Only if usage is predictable and >1M requests/month
aws dynamodb update-table \
  --table-name prod-users \
  --billing-mode PROVISIONED \
  --provisioned-throughput ReadCapacityUnits=100,WriteCapacityUnits=50
```


**ElastiCache Redis**

**Check current usage:**
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/ElastiCache \
  --metric-name DatabaseMemoryUsagePercentage \
  --dimensions Name=CacheClusterId,Value=prod-redis-cluster \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average,Maximum
```

**Scale up (vertical scaling):**
```bash
# Modify cache cluster to larger instance type
aws elasticache modify-cache-cluster \
  --cache-cluster-id prod-redis-cluster \
  --cache-node-type cache.t4g.medium \
  --apply-immediately
```

**Add read replicas (horizontal scaling):**
```bash
# Add replica node
aws elasticache increase-replica-count \
  --replication-group-id prod-redis-replication-group \
  --new-replica-count 2 \
  --apply-immediately
```

### Vertical Scaling

**Lambda Memory Optimization**

**Analyze current usage:**
```bash
# Use CloudWatch Logs Insights
aws logs insights query \
  --log-group-name /aws/lambda/prod-disease-detect \
  --start-time $(date -u -d '24 hours ago' +%s) \
  --end-time $(date -u +%s) \
  --query-string 'filter @type = "REPORT" | stats avg(@memorySize / 1024 / 1024) as avg_memory_mb, max(@memorySize / 1024 / 1024) as max_memory_mb'
```

**Update Lambda memory:**
```bash
# Increase memory (also increases CPU proportionally)
aws lambda update-function-configuration \
  --function-name prod-disease-detect \
  --memory-size 2048
```

**Use Lambda Power Tuning:**
```bash
# Deploy Lambda Power Tuning tool
# https://github.com/alexcasalboni/aws-lambda-power-tuning

# Run optimization
./scripts/optimize-lambda-memory.sh --function prod-disease-detect
```

### API Gateway Scaling

**Increase throttle limits:**
```bash
# Update stage throttle settings
aws apigateway update-stage \
  --rest-api-id {API_ID} \
  --stage-name prod \
  --patch-operations \
    op=replace,path=/throttle/rateLimit,value=2000 \
    op=replace,path=/throttle/burstLimit,value=4000
```

**Enable caching:**
```bash
# Enable API Gateway caching (reduces backend load)
aws apigateway update-stage \
  --rest-api-id {API_ID} \
  --stage-name prod \
  --patch-operations \
    op=replace,path=/cacheClusterEnabled,value=true \
    op=replace,path=/cacheClusterSize,value=0.5
```

### Scaling Triggers and Thresholds

**When to Scale Up:**

| Metric | Threshold | Action |
|--------|-----------|--------|
| Lambda concurrent executions | >80% of limit | Increase reserved concurrency |
| Lambda duration | >8s (p95) | Increase memory or optimize code |
| DynamoDB throttling | >10 events/hour | Already auto-scales, investigate hot partitions |
| ElastiCache memory | >80% | Scale up instance or add replicas |
| API Gateway 429 errors | >1% | Increase rate limits |
| Bedrock throttling | >5% | Request quota increase |

**When to Scale Down:**

| Metric | Threshold | Action |
|--------|-----------|--------|
| Lambda concurrent executions | <20% of limit for 7 days | Reduce reserved concurrency |
| ElastiCache memory | <40% for 7 days | Scale down instance |
| Provisioned concurrency | <50% utilization | Reduce or remove |

### Capacity Planning

**Monthly Review:**

1. **Analyze growth trends:**
   ```bash
   # API request growth
   aws cloudwatch get-metric-statistics \
     --namespace AWS/ApiGateway \
     --metric-name Count \
     --dimensions Name=ApiName,Value=prod-farm-api \
     --start-time $(date -u -d '30 days ago' +%Y-%m-%dT%H:%M:%S) \
     --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
     --period 86400 \
     --statistics Sum
   ```

2. **Project future capacity needs:**
   - Calculate month-over-month growth rate
   - Estimate capacity needs for next 3 months
   - Plan scaling actions

3. **Review cost implications:**
   - Estimate cost of scaling up
   - Identify optimization opportunities
   - Balance cost vs performance


### Auto-Scaling Configuration

**Lambda Auto-Scaling**

Lambda automatically scales, but you can configure:

```typescript
// In CDK stack
const scalableTarget = new applicationautoscaling.ScalableTarget(this, 'ScalableTarget', {
  serviceNamespace: applicationautoscaling.ServiceNamespace.LAMBDA,
  maxCapacity: 100,
  minCapacity: 5,
  resourceId: `function:${lambdaFunction.functionName}:provisioned-concurrency`,
  scalableDimension: 'lambda:function:ProvisionedConcurrentExecutions',
});

scalableTarget.scaleToTrackMetric('TargetTracking', {
  targetValue: 0.7, // 70% utilization
  predefinedMetric: applicationautoscaling.PredefinedMetric.LAMBDA_PROVISIONED_CONCURRENCY_UTILIZATION,
});
```

**DynamoDB Auto-Scaling (if using provisioned mode)**

```typescript
// In CDK stack
const readScaling = table.autoScaleReadCapacity({
  minCapacity: 5,
  maxCapacity: 100,
});

readScaling.scaleOnUtilization({
  targetUtilizationPercent: 70,
});

const writeScaling = table.autoScaleWriteCapacity({
  minCapacity: 5,
  maxCapacity: 100,
});

writeScaling.scaleOnUtilization({
  targetUtilizationPercent: 70,
});
```

---

## Maintenance Procedures

### Routine Maintenance

**Weekly Tasks (30 minutes)**

1. **Review and rotate logs:**
   ```bash
   # Export old logs to S3
   ./scripts/export-logs.sh --days 7
   ```

2. **Update dependencies:**
   ```bash
   # Check for npm package updates
   npm outdated
   
   # Update non-breaking changes
   npm update
   ```

3. **Review security advisories:**
   ```bash
   # Check for vulnerabilities
   npm audit
   
   # Fix vulnerabilities
   npm audit fix
   ```

4. **Clean up old resources:**
   ```bash
   # Delete old Lambda versions (keep last 5)
   ./scripts/cleanup-lambda-versions.sh
   
   # Delete old CloudFormation stacks
   ./scripts/cleanup-old-stacks.sh
   ```

**Monthly Tasks (2 hours)**

1. **Rotate secrets:**
   ```bash
   # Rotate database credentials
   ./scripts/rotate-secrets.sh --secret prod-db-credentials
   
   # Rotate API keys
   ./scripts/rotate-secrets.sh --secret prod-api-keys
   ```

2. **Review IAM policies:**
   ```bash
   # Check for unused IAM roles
   aws iam get-credential-report
   
   # Review and remove unused policies
   ./scripts/audit-iam.sh
   ```

3. **Update SSL certificates:**
   ```bash
   # Check certificate expiration
   aws acm list-certificates
   
   # Renew if needed (ACM auto-renews)
   ```

4. **Backup verification:**
   - Test DynamoDB restore
   - Test S3 restore from Glacier
   - Document results

5. **Performance optimization:**
   - Review slow queries
   - Optimize Lambda functions
   - Update caching strategies

**Quarterly Tasks (4 hours)**

1. **Disaster recovery drill:**
   - Simulate region failure
   - Test complete system recovery
   - Document lessons learned

2. **Security audit:**
   - Review all IAM policies
   - Check for exposed secrets
   - Review security group rules
   - Run penetration tests

3. **Cost optimization review:**
   - Analyze cost trends
   - Identify optimization opportunities
   - Implement cost-saving measures

4. **Documentation update:**
   - Update runbooks
   - Update architecture diagrams
   - Review and update contact information


### Deployment Maintenance

**Pre-Deployment Checklist**

- [ ] All tests passing (unit, integration, smoke)
- [ ] Security scan completed
- [ ] Code review approved
- [ ] Deployment plan documented
- [ ] Rollback plan prepared
- [ ] Stakeholders notified
- [ ] Maintenance window scheduled (if needed)
- [ ] Backup taken
- [ ] Monitoring alerts configured

**Deployment Process**

1. **Deploy to development:**
   ```bash
   cdk deploy --all --context environment=dev
   ```

2. **Run integration tests:**
   ```bash
   npm run test:integration
   ```

3. **Deploy to staging:**
   ```bash
   cdk deploy --all --context environment=staging
   ```

4. **Run smoke tests:**
   ```bash
   npm run test:smoke
   ```

5. **Manual approval for production**

6. **Deploy to production:**
   ```bash
   cdk deploy --all --context environment=prod
   ```

7. **Monitor deployment:**
   - Watch CloudFormation events
   - Monitor CloudWatch metrics
   - Check for errors in logs

8. **Run production smoke tests:**
   ```bash
   npm run test:smoke -- --environment prod
   ```

9. **Monitor for 1 hour:**
   - Watch error rates
   - Check performance metrics
   - Review user feedback

**Post-Deployment Checklist**

- [ ] All stacks deployed successfully
- [ ] Smoke tests passing
- [ ] No increase in error rates
- [ ] Performance metrics normal
- [ ] Monitoring alerts working
- [ ] Documentation updated
- [ ] Stakeholders notified
- [ ] Deployment documented

### Patching and Updates

**Lambda Runtime Updates**

**Check for runtime updates:**
```bash
# List Lambda functions with old runtimes
aws lambda list-functions \
  --query 'Functions[?Runtime==`nodejs18.x`].[FunctionName,Runtime]' \
  --output table
```

**Update runtime:**
```bash
# Update in CDK code
# Change: runtime: lambda.Runtime.NODEJS_18_X
# To: runtime: lambda.Runtime.NODEJS_20_X

# Deploy
cdk deploy prod-ComputeStack
```

**Dependency Updates**

**Check for updates:**
```bash
# Check npm packages
npm outdated

# Check for security vulnerabilities
npm audit
```

**Update dependencies:**
```bash
# Update package.json
npm update

# Run tests
npm test

# Deploy
cdk deploy --all
```

**AWS Service Updates**

- Subscribe to AWS service announcements
- Review AWS What's New blog
- Test new features in development
- Plan migration to new services

---

## Troubleshooting Guide

### Common Issues

**Issue: API Gateway 403 Forbidden**

**Symptoms:**
- Users receiving 403 errors
- Authentication appears to be failing

**Diagnosis:**
```bash
# Check Lambda authorizer logs
aws logs tail /aws/lambda/prod-auth-verify --follow

# Check Cognito user pool status
aws cognito-idp describe-user-pool --user-pool-id {POOL_ID}

# Test JWT token
./scripts/test-auth.sh --token {JWT_TOKEN}
```

**Solutions:**
- Verify JWT token is valid and not expired
- Check Lambda authorizer is returning correct IAM policy
- Verify Cognito user pool configuration
- Check API Gateway authorizer configuration


**Issue: Lambda Function Timing Out**

**Symptoms:**
- Lambda timeout errors in logs
- Slow API responses
- Task timed out after X seconds

**Diagnosis:**
```bash
# Check Lambda duration
aws logs insights query \
  --log-group-name /aws/lambda/prod-disease-detect \
  --query-string 'filter @type = "REPORT" | stats avg(@duration), max(@duration), pct(@duration, 95)'

# Check X-Ray traces
# Navigate to X-Ray console and filter by duration >10s
```

**Solutions:**
- Increase Lambda timeout setting
- Increase Lambda memory (also increases CPU)
- Optimize code (reduce external API calls)
- Implement caching
- Check for cold starts (enable provisioned concurrency)

**Issue: DynamoDB ProvisionedThroughputExceededException**

**Symptoms:**
- DynamoDB throttling errors
- Slow database operations
- Lambda retries exhausted

**Diagnosis:**
```bash
# Check consumed capacity
aws dynamodb describe-table --table-name prod-users

# Check for hot partitions
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name UserErrors \
  --dimensions Name=TableName,Value=prod-users
```

**Solutions:**
- Tables should be on-demand mode (auto-scales)
- If hot partition: redesign partition key
- Implement exponential backoff in code
- Use batch operations where possible
- Review and optimize query patterns

**Issue: S3 Access Denied**

**Symptoms:**
- 403 errors when accessing S3
- Image upload/download failures

**Diagnosis:**
```bash
# Check bucket policy
aws s3api get-bucket-policy --bucket prod-farm-images-{account-id}

# Check IAM role permissions
aws iam get-role-policy --role-name prod-lambda-execution-role --policy-name S3Access

# Test pre-signed URL
curl -I {PRESIGNED_URL}
```

**Solutions:**
- Verify IAM role has S3 permissions
- Check bucket policy allows access
- Verify pre-signed URL not expired
- Check CORS configuration for browser uploads

**Issue: Bedrock InvokeModel Throttling**

**Symptoms:**
- ThrottlingException errors
- AI features failing
- "Service unavailable" messages

**Diagnosis:**
```bash
# Check Bedrock metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Bedrock \
  --metric-name Invocations \
  --dimensions Name=ModelId,Value=anthropic.claude-3-sonnet

# Check error logs
aws logs tail /aws/lambda/prod-advisory-chat --follow \
  --filter-pattern "ThrottlingException"
```

**Solutions:**
- Request quota increase from AWS Support
- Implement request queuing
- Add exponential backoff and retry logic
- Implement circuit breaker pattern
- Cache common responses
- Optimize prompts to reduce token usage

**Issue: ElastiCache Connection Timeout**

**Symptoms:**
- Redis connection errors
- Cache misses
- Slow API responses

**Diagnosis:**
```bash
# Check ElastiCache status
aws elasticache describe-cache-clusters \
  --cache-cluster-id prod-redis-cluster

# Check security group rules
aws ec2 describe-security-groups \
  --group-ids {SECURITY_GROUP_ID}

# Test connection from Lambda
./scripts/test-redis-connection.sh
```

**Solutions:**
- Verify security group allows Lambda access
- Check ElastiCache cluster is running
- Verify Lambda is in same VPC
- Check Redis connection string is correct
- Increase connection timeout in code


**Issue: IoT Device Not Connecting**

**Symptoms:**
- Device connection failures
- No sensor data received
- MQTT connection errors

**Diagnosis:**
```bash
# Check IoT Core logs
aws logs tail AWSIotLogsV2 --follow

# Check device certificate status
aws iot describe-certificate --certificate-id {CERT_ID}

# Check IoT policy
aws iot get-policy --policy-name {POLICY_NAME}

# Test MQTT connection
mosquitto_pub -h {IOT_ENDPOINT} \
  --cert device.crt \
  --key device.key \
  --cafile AmazonRootCA1.pem \
  -t "farm/test/sensors/data" \
  -m '{"test": "message"}'
```

**Solutions:**
- Verify device certificate is active and not expired
- Check IoT policy allows required actions
- Verify device is using correct endpoint
- Check network connectivity from device
- Verify certificate and private key match

### Debugging Tools

**CloudWatch Logs Insights Queries**

Save these queries for quick debugging:

**Find errors by Lambda function:**
```sql
fields @timestamp, @message, level, error, requestId
| filter level = "ERROR"
| sort @timestamp desc
| limit 100
```

**Find slow requests:**
```sql
fields @timestamp, requestId, duration, path
| filter duration > 1000
| sort duration desc
| limit 50
```

**Find authentication failures:**
```sql
fields @timestamp, userId, email, ipAddress, errorMessage
| filter eventType = "AUTH_FAILED"
| stats count() as failures by ipAddress
| sort failures desc
```

**AWS CLI Commands**

**Get Lambda function configuration:**
```bash
aws lambda get-function-configuration \
  --function-name prod-disease-detect
```

**Get API Gateway stage configuration:**
```bash
aws apigateway get-stage \
  --rest-api-id {API_ID} \
  --stage-name prod
```

**Get DynamoDB table details:**
```bash
aws dynamodb describe-table --table-name prod-users
```

**Get recent CloudFormation events:**
```bash
aws cloudformation describe-stack-events \
  --stack-name prod-APIStack \
  --max-items 20
```

**X-Ray Trace Analysis**

1. Navigate to X-Ray console
2. Select time range
3. Filter by:
   - HTTP status code
   - Response time
   - Error type
4. Analyze trace map for bottlenecks
5. Review individual traces for details

---

## Emergency Contacts

### On-Call Rotation

| Role | Primary | Secondary | Escalation |
|------|---------|-----------|------------|
| On-Call Engineer | [Name/Phone] | [Name/Phone] | DevOps Lead |
| DevOps Lead | [Name/Phone] | [Name/Phone] | Engineering Manager |
| Engineering Manager | [Name/Phone] | [Name/Phone] | CTO |
| Security Lead | [Name/Phone] | [Name/Phone] | CISO |

### Escalation Path

**SEV-1 (Critical):**
1. On-Call Engineer (immediate)
2. DevOps Lead (if not resolved in 15 min)
3. Engineering Manager (if not resolved in 30 min)
4. CTO (if not resolved in 1 hour)

**SEV-2 (High):**
1. On-Call Engineer (within 15 min)
2. DevOps Lead (if not resolved in 1 hour)
3. Engineering Manager (if not resolved in 4 hours)

**SEV-3 (Medium):**
1. On-Call Engineer (within 1 hour)
2. DevOps Lead (next business day)

### External Contacts

**AWS Support:**
- Support Portal: https://console.aws.amazon.com/support/
- Phone: 1-866-987-7247 (US)
- Enterprise Support: [Account-specific number]
- TAM (Technical Account Manager): [Name/Email]

**Third-Party Services:**
- Monitoring Service: [Contact info]
- Security Service: [Contact info]
- Incident Management: [PagerDuty/Opsgenie]

### Communication Channels

**Internal:**
- Slack: #prod-incidents, #devops-alerts
- Email: devops@company.com
- Incident Management: [Tool/URL]

**External:**
- Status Page: https://status.example.com
- Support Email: support@company.com
- Twitter: @company_status


---

## Appendix

### Useful Scripts

**Health Check Script**

Location: `scripts/health-check.sh`

```bash
#!/bin/bash
# Quick health check for all services

ENVIRONMENT=${1:-prod}

echo "Running health check for $ENVIRONMENT environment..."

# Check API Gateway
echo "Checking API Gateway..."
curl -s -o /dev/null -w "%{http_code}" https://${ENVIRONMENT}-api.example.com/health

# Check Lambda functions
echo "Checking Lambda functions..."
aws lambda list-functions --query 'Functions[?starts_with(FunctionName, `'${ENVIRONMENT}'`)].FunctionName' --output text | \
while read func; do
  aws lambda get-function --function-name $func --query 'Configuration.State' --output text
done

# Check DynamoDB tables
echo "Checking DynamoDB tables..."
aws dynamodb list-tables --query 'TableNames[?starts_with(@, `'${ENVIRONMENT}'`)]' --output text | \
while read table; do
  aws dynamodb describe-table --table-name $table --query 'Table.TableStatus' --output text
done

# Check CloudWatch alarms
echo "Checking CloudWatch alarms..."
aws cloudwatch describe-alarms --state-value ALARM --query 'MetricAlarms[*].AlarmName' --output text

echo "Health check complete!"
```

**Cost Report Script**

Location: `scripts/cost-report.sh`

```bash
#!/bin/bash
# Generate daily cost report

START_DATE=$(date -u -d '1 day ago' +%Y-%m-%d)
END_DATE=$(date -u +%Y-%m-%d)

aws ce get-cost-and-usage \
  --time-period Start=$START_DATE,End=$END_DATE \
  --granularity DAILY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE \
  --output table
```

**Backup Script**

Location: `scripts/backup-dynamodb.sh`

```bash
#!/bin/bash
# Create on-demand backup of all DynamoDB tables

ENVIRONMENT=${1:-prod}
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

aws dynamodb list-tables --query 'TableNames[?starts_with(@, `'${ENVIRONMENT}'`)]' --output text | \
while read table; do
  echo "Backing up $table..."
  aws dynamodb create-backup \
    --table-name $table \
    --backup-name "${table}-backup-${TIMESTAMP}"
done

echo "Backup complete!"
```

### CloudWatch Alarm Definitions

**API Gateway Error Rate Alarm**

```typescript
new cloudwatch.Alarm(this, 'ApiGateway5xxAlarm', {
  metric: apiGateway.metricServerError({
    statistic: 'Average',
    period: Duration.minutes(5),
  }),
  threshold: 0.05, // 5%
  evaluationPeriods: 1,
  alarmDescription: 'API Gateway 5XX error rate exceeds 5%',
  actionsEnabled: true,
  alarmActions: [snsTopicCritical],
});
```

**Lambda Error Alarm**

```typescript
new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
  metric: lambdaFunction.metricErrors({
    statistic: 'Sum',
    period: Duration.minutes(5),
  }),
  threshold: 10,
  evaluationPeriods: 1,
  alarmDescription: 'Lambda function errors exceed threshold',
  actionsEnabled: true,
  alarmActions: [snsTopicCritical],
});
```

**DynamoDB Throttling Alarm**

```typescript
new cloudwatch.Alarm(this, 'DynamoDBThrottlingAlarm', {
  metric: table.metricUserErrors({
    statistic: 'Sum',
    period: Duration.minutes(5),
  }),
  threshold: 10,
  evaluationPeriods: 1,
  alarmDescription: 'DynamoDB throttling detected',
  actionsEnabled: true,
  alarmActions: [snsTopicWarning],
});
```

### Performance Benchmarks

**API Response Times (Target)**

| Endpoint | p50 | p95 | p99 |
|----------|-----|-----|-----|
| GET /farms | 100ms | 300ms | 500ms |
| POST /farms | 150ms | 400ms | 600ms |
| POST /disease-detection/analyze | 2s | 4s | 5s |
| POST /advisory/chat | 1s | 1.8s | 2s |
| GET /market-prices | 50ms | 150ms | 300ms |
| POST /optimization/calculate | 500ms | 900ms | 1s |

**Database Performance (Target)**

| Operation | p50 | p95 | p99 |
|-----------|-----|-----|-----|
| DynamoDB GetItem | 5ms | 15ms | 20ms |
| DynamoDB PutItem | 10ms | 30ms | 50ms |
| DynamoDB Query | 8ms | 20ms | 30ms |
| ElastiCache GET | 1ms | 3ms | 5ms |
| ElastiCache SET | 2ms | 5ms | 8ms |


### Service Limits and Quotas

**AWS Lambda**

| Resource | Default Limit | Adjustable |
|----------|---------------|------------|
| Concurrent executions | 1,000 | Yes (request increase) |
| Function timeout | 900s (15 min) | No |
| Memory allocation | 128 MB - 10,240 MB | No |
| Deployment package size | 50 MB (zipped), 250 MB (unzipped) | No |
| /tmp storage | 512 MB - 10,240 MB | No |

**API Gateway**

| Resource | Default Limit | Adjustable |
|----------|---------------|------------|
| Throttle rate | 10,000 req/s | Yes |
| Burst rate | 5,000 req | Yes |
| Integration timeout | 29s | No |
| Payload size | 10 MB | No |

**DynamoDB**

| Resource | Default Limit | Adjustable |
|----------|---------------|------------|
| On-demand throughput | 40,000 RCU, 40,000 WCU | Auto-scales |
| Table size | Unlimited | N/A |
| Item size | 400 KB | No |
| GSI per table | 20 | No |

**Amazon Bedrock**

| Resource | Default Limit | Adjustable |
|----------|---------------|------------|
| Requests per minute | Varies by model | Yes (request increase) |
| Tokens per request | 200,000 (Claude 3) | No |
| Concurrent requests | 10 | Yes |

**Request Quota Increase**

```bash
# Via AWS CLI
aws service-quotas request-service-quota-increase \
  --service-code lambda \
  --quota-code L-B99A9384 \
  --desired-value 2000

# Or via AWS Console:
# Service Quotas → AWS services → Lambda → Request quota increase
```

### Monitoring Checklist

**Daily:**
- [ ] Review CloudWatch dashboard
- [ ] Check active alarms
- [ ] Review error rates
- [ ] Run health check script
- [ ] Review cost trends

**Weekly:**
- [ ] Review CloudWatch Logs Insights queries
- [ ] Analyze performance trends
- [ ] Review security events
- [ ] Capacity planning review
- [ ] Cost analysis

**Monthly:**
- [ ] Comprehensive performance review
- [ ] Security audit
- [ ] Backup verification
- [ ] Dependency updates
- [ ] Documentation review

**Quarterly:**
- [ ] Disaster recovery drill
- [ ] Full security audit
- [ ] Cost optimization review
- [ ] Architecture review

### Runbook Maintenance

**Review Schedule:**
- Monthly: Update contact information and on-call rotation
- Quarterly: Review and update procedures based on incidents
- Annually: Complete runbook review and update

**Version History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-01-15 | DevOps Team | Initial version |
| 1.1 | TBD | TBD | Updates based on operational experience |

**Feedback:**
- Submit feedback via: devops@company.com
- Create issues in: [Internal documentation repo]
- Discuss in: #devops Slack channel

---

## Quick Reference

### Emergency Commands

**Stop all traffic:**
```bash
aws apigateway update-stage \
  --rest-api-id {API_ID} \
  --stage-name prod \
  --patch-operations op=replace,path=/throttle/rateLimit,value=0
```

**Rollback deployment:**
```bash
./scripts/rollback.sh --environment prod
```

**Check system health:**
```bash
./scripts/health-check.sh --environment prod
```

**View recent errors:**
```bash
aws logs tail /aws/lambda/prod-disease-detect --follow --filter-pattern "ERROR"
```

**Check active alarms:**
```bash
aws cloudwatch describe-alarms --state-value ALARM
```

### Important URLs

- **AWS Console:** https://console.aws.amazon.com/
- **CloudWatch Dashboard:** https://console.aws.amazon.com/cloudwatch/dashboards
- **X-Ray Console:** https://console.aws.amazon.com/xray/
- **Cost Explorer:** https://console.aws.amazon.com/cost-management/
- **Service Health:** https://status.aws.amazon.com/
- **Documentation:** [Internal wiki/docs URL]
- **Status Page:** https://status.example.com

### Key Metrics Dashboard

Monitor these metrics continuously:

1. **API Gateway:** Request count, error rate, latency
2. **Lambda:** Invocations, errors, duration, concurrent executions
3. **DynamoDB:** Consumed capacity, throttled requests, latency
4. **Bedrock:** API calls, errors, token usage
5. **ElastiCache:** CPU, memory, connections
6. **IoT Core:** Messages, connection failures
7. **Cost:** Daily spend, month-to-date spend

### Support Resources

- **AWS Documentation:** https://docs.aws.amazon.com/
- **AWS Support:** https://console.aws.amazon.com/support/
- **Internal Wiki:** [URL]
- **Team Slack:** #devops, #prod-incidents
- **Runbook Repository:** [Git repo URL]

---

## Document Information

**Document Owner:** DevOps Team  
**Last Updated:** January 2024  
**Review Frequency:** Quarterly  
**Classification:** Internal Use Only  

**Related Documents:**
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Rollback Procedures](./ROLLBACK_PROCEDURES.md)
- [Cost Estimation Guide](./COST_ESTIMATION_GUIDE.md)
- [Testing Guide](./TESTING_GUIDE.md)
- [Frontend Integration Guide](./FRONTEND_INTEGRATION_GUIDE.md)

**Revision History:**
- v1.0 (2024-01-15): Initial operations runbook created
- Future updates will be tracked here

---

**End of Operations Runbook**
