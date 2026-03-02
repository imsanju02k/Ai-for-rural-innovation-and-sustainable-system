# Secrets Rotation Procedures

This document describes the procedures for rotating secrets and credentials in AWS Secrets Manager.

**Requirements: 13.9**

## Overview

The system stores sensitive credentials in AWS Secrets Manager:
- Database credentials
- API keys for external services
- Encryption keys

Regular rotation of these secrets is a security best practice to minimize the impact of potential credential compromise.

## Rotation Schedule

### Recommended Rotation Intervals

| Secret Type | Development | Staging | Production |
|-------------|-------------|---------|------------|
| Database Passwords | 90 days | 60 days | 30 days |
| API Keys | Manual | 90 days | 60 days |
| Encryption Keys | Manual | 180 days | 90 days |

### Production Rotation Schedule

For production environments, we recommend:
- **Monthly**: Database passwords
- **Quarterly**: API keys (or when compromised)
- **Quarterly**: Encryption keys
- **Immediately**: Any secret suspected of being compromised

## Rotation Scripts

### 1. Database Password Rotation

**Script**: `scripts/rotate-database-password.sh`

**Usage**:
```bash
./scripts/rotate-database-password.sh <environment>
```

**Example**:
```bash
# Rotate development database password
./scripts/rotate-database-password.sh dev

# Rotate production database password
./scripts/rotate-database-password.sh prod
```

**What it does**:
1. Retrieves the current database credentials
2. Generates a new secure password (32 characters)
3. Updates the secret in Secrets Manager
4. Verifies the rotation was successful

**Post-rotation steps**:
- Lambda functions automatically pick up the new password on next invocation
- Monitor CloudWatch logs for any authentication errors
- Test database connectivity

### 2. API Keys Rotation

**Script**: `scripts/rotate-api-keys.sh`

**Usage**:
```bash
./scripts/rotate-api-keys.sh <environment> [key-name]
```

**Examples**:
```bash
# Rotate a specific API key
./scripts/rotate-api-keys.sh dev weatherApiKey

# Rotate all API keys
./scripts/rotate-api-keys.sh prod all
```

**Available key names**:
- `weatherApiKey` - Weather service API key
- `marketApiKey` - Market data API key
- `smsApiKey` - SMS notification service API key
- `all` - Rotate all keys

**What it does**:
1. Retrieves the current API keys
2. Prompts for new values (or keeps current if Enter is pressed)
3. Updates the secret in Secrets Manager
4. Verifies the rotation was successful

**Post-rotation steps**:
- Test API connectivity with external services
- Monitor CloudWatch logs for API errors
- Update any external documentation

### 3. Encryption Keys Rotation

**Manual Process** (requires careful planning):

Encryption key rotation is more complex because:
- Existing encrypted data must be re-encrypted with the new key
- Or a key versioning system must be implemented

**Steps**:
1. Generate a new encryption key
2. Update the secret in Secrets Manager
3. Implement a migration process to re-encrypt data
4. Verify all data is accessible with the new key

**AWS CLI command**:
```bash
# Generate new key
NEW_KEY=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)

# Update secret
aws secretsmanager update-secret \
  --secret-id "${ENVIRONMENT}/encryption/keys" \
  --secret-string "{\"masterKey\":\"$NEW_KEY\",\"algorithm\":\"AES-256-GCM\"}"
```

## Emergency Rotation

If a secret is compromised or suspected of being compromised:

### Immediate Actions

1. **Rotate the secret immediately**:
   ```bash
   ./scripts/rotate-database-password.sh prod
   # or
   ./scripts/rotate-api-keys.sh prod all
   ```

2. **Invalidate all active sessions** (if applicable):
   - Clear Lambda function caches
   - Restart affected services

3. **Monitor for unauthorized access**:
   - Check CloudWatch logs
   - Review CloudTrail for suspicious API calls
   - Check AWS GuardDuty findings

4. **Notify the team**:
   - Alert security team
   - Document the incident
   - Update incident response procedures

### Post-Incident Review

1. Investigate how the secret was compromised
2. Update security procedures
3. Review access logs
4. Consider additional security measures

## Automated Rotation (Production)

For production environments, consider implementing automated rotation using AWS Lambda:

### Setup Automated Rotation

1. **Create a rotation Lambda function**:
   ```typescript
   // Example rotation function
   export const handler = async (event: any) => {
     const secretId = event.SecretId;
     const token = event.ClientRequestToken;
     const step = event.Step;
     
     switch (step) {
       case 'createSecret':
         // Generate new secret
         break;
       case 'setSecret':
         // Update the secret
         break;
       case 'testSecret':
         // Test the new secret
         break;
       case 'finishSecret':
         // Mark rotation as complete
         break;
     }
   };
   ```

2. **Configure rotation schedule**:
   ```bash
   aws secretsmanager rotate-secret \
     --secret-id prod/database/credentials \
     --rotation-lambda-arn arn:aws:lambda:region:account:function:rotation-function \
     --rotation-rules AutomaticallyAfterDays=30
   ```

3. **Monitor rotation**:
   - Set up CloudWatch alarms for rotation failures
   - Review rotation logs regularly
   - Test rotation in staging first

## Secrets Cache Management

Lambda functions cache secrets for 5 minutes to reduce API calls. After rotation:

### Cache Behavior

- **Automatic refresh**: Secrets are automatically refreshed after 5 minutes
- **Force refresh**: Use the `forceRefresh` parameter in the secrets utility
- **Clear cache**: Lambda container restart clears the cache

### Testing After Rotation

```typescript
// In Lambda function
import { getSecret, clearSecretsCache } from './shared/utils/secrets';

// Force refresh after rotation
const secret = await getSecret('prod/database/credentials', true);

// Or clear entire cache
clearSecretsCache();
```

## Monitoring and Alerts

### CloudWatch Metrics

Monitor these metrics:
- `secretsmanager:GetSecretValue` - API call count
- Lambda function errors after rotation
- Authentication failures

### CloudWatch Alarms

Set up alarms for:
- Failed secret retrievals
- Increased error rates after rotation
- Unauthorized access attempts

### Example Alarm

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name "SecretsManagerErrors" \
  --alarm-description "Alert on Secrets Manager errors" \
  --metric-name Errors \
  --namespace AWS/SecretsManager \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold
```

## Best Practices

1. **Test in lower environments first**
   - Always test rotation in dev/staging before production
   - Verify application functionality after rotation

2. **Schedule during maintenance windows**
   - Rotate production secrets during low-traffic periods
   - Notify stakeholders in advance

3. **Document all rotations**
   - Keep a log of when secrets were rotated
   - Document any issues encountered

4. **Use strong secrets**
   - Minimum 32 characters for passwords
   - Use cryptographically secure random generation
   - Avoid predictable patterns

5. **Limit access to secrets**
   - Use IAM policies to restrict access
   - Follow principle of least privilege
   - Audit secret access regularly

6. **Monitor after rotation**
   - Watch CloudWatch logs for 24 hours
   - Check application metrics
   - Verify no authentication errors

## Troubleshooting

### Common Issues

#### 1. Lambda functions still using old secret

**Cause**: Secrets cache not expired yet

**Solution**:
- Wait 5 minutes for cache to expire
- Or redeploy Lambda functions to clear cache
- Or use `forceRefresh` parameter

#### 2. Authentication errors after rotation

**Cause**: Secret not propagated or incorrect format

**Solution**:
```bash
# Verify secret value
aws secretsmanager get-secret-value \
  --secret-id prod/database/credentials \
  --query SecretString \
  --output text | jq .

# Check Lambda function logs
aws logs tail /aws/lambda/function-name --follow
```

#### 3. Rotation script fails

**Cause**: Missing permissions or AWS CLI not configured

**Solution**:
```bash
# Check AWS credentials
aws sts get-caller-identity

# Verify IAM permissions
aws secretsmanager describe-secret --secret-id prod/database/credentials
```

## Security Considerations

1. **Never log secret values**
   - Mask secrets in logs
   - Use CloudWatch Logs Insights to search for potential leaks

2. **Secure rotation scripts**
   - Store scripts in version control
   - Restrict execution permissions
   - Audit script usage

3. **Backup before rotation**
   - Secrets Manager maintains version history
   - Can rollback if needed

4. **Compliance requirements**
   - Follow organizational security policies
   - Document rotation for audit purposes
   - Maintain rotation logs

## Rollback Procedure

If rotation causes issues:

### 1. Identify the previous version

```bash
aws secretsmanager list-secret-version-ids \
  --secret-id prod/database/credentials
```

### 2. Restore previous version

```bash
aws secretsmanager update-secret-version-stage \
  --secret-id prod/database/credentials \
  --version-stage AWSCURRENT \
  --move-to-version-id <previous-version-id>
```

### 3. Verify rollback

```bash
aws secretsmanager get-secret-value \
  --secret-id prod/database/credentials \
  --query SecretString \
  --output text
```

### 4. Clear Lambda caches

Redeploy or restart Lambda functions to pick up the rolled-back secret.

## Additional Resources

- [AWS Secrets Manager Documentation](https://docs.aws.amazon.com/secretsmanager/)
- [AWS Secrets Manager Best Practices](https://docs.aws.amazon.com/secretsmanager/latest/userguide/best-practices.html)
- [Rotating AWS Secrets Manager Secrets](https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotating-secrets.html)

## Support

For issues or questions:
1. Check CloudWatch logs
2. Review this documentation
3. Contact the DevOps team
4. Create an incident ticket for production issues
