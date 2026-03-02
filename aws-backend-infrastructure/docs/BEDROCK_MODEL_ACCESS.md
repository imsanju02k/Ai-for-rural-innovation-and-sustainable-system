# Amazon Bedrock Model Access Setup

## Overview

Amazon Bedrock requires explicit model access to be granted before you can invoke foundation models. This is a one-time setup per AWS account and region.

## Current Status

✅ **AIStack Deployed**: IAM roles and permissions are configured
✅ **Bedrock API Access**: API connectivity verified
⚠️ **Model Access**: Requires manual approval through AWS Console

## Required Models

For the AI Rural Innovation Platform, we need access to the following Anthropic Claude models:

1. **Claude 3 Haiku** (`anthropic.claude-3-haiku-20240307-v1:0`)
   - Use case: Fast, cost-effective responses for simple queries
   - Required for: Quick advisory responses, basic recommendations

2. **Claude 3 Sonnet** (`anthropic.claude-3-sonnet-20240229-v1:0`)
   - Use case: Balanced performance for most AI features
   - Required for: Disease detection, market predictions, advisory chat

3. **Claude 3.5 Sonnet** (`anthropic.claude-3-5-sonnet-20240620-v1:0`)
   - Use case: Advanced reasoning for complex agricultural analysis
   - Required for: Resource optimization, complex disease diagnosis

## How to Request Model Access

### Step 1: Open AWS Bedrock Console

1. Navigate to the [AWS Bedrock Console](https://console.aws.amazon.com/bedrock/)
2. Ensure you're in the correct region (us-east-1 for dev environment)

### Step 2: Request Model Access

1. In the left navigation pane, click **"Model access"**
2. Click **"Manage model access"** or **"Edit"** button
3. Find the Anthropic section
4. Check the boxes for:
   - ☑️ Claude 3 Haiku
   - ☑️ Claude 3 Sonnet
   - ☑️ Claude 3.5 Sonnet
5. Click **"Request model access"** or **"Save changes"**

### Step 3: Fill Out Use Case Form (if required)

Some models may require a use case description:

**Suggested Use Case Description:**
```
AI-powered agricultural platform for rural farmers providing:
- Crop disease detection and diagnosis from images
- Market price predictions and recommendations
- Agricultural advisory chatbot for farming guidance
- Resource optimization (water, fertilizer) recommendations
- Real-time IoT sensor data analysis

This is a development/testing environment for a hackathon project 
demonstrating AI capabilities for agricultural innovation.
```

### Step 4: Wait for Approval

- Most models are approved instantly
- Some models may take up to 15 minutes
- You'll receive an email notification when access is granted

### Step 5: Verify Access

Run the test script to verify model access:

```bash
cd aws-backend-infrastructure
npx ts-node scripts/test-bedrock.ts
```

Expected output:
```
✅ Model invocation successful!
✅ Agricultural advisory test successful!
🎉 All Bedrock tests passed!
```

## Alternative: Using AWS CLI

You can also request model access using the AWS CLI:

```bash
# Check current model access status
aws bedrock list-foundation-models \
  --region us-east-1 \
  --query "modelSummaries[?providerName=='Anthropic'].[modelId,modelName]" \
  --output table

# Note: Model access requests must be done through the console
# The CLI doesn't support requesting access programmatically
```

## Troubleshooting

### Error: "Model use case details have not been submitted"

**Solution**: Follow the steps above to request model access through the AWS Console.

### Error: "AccessDeniedException"

**Possible causes:**
1. Model access not yet granted
2. IAM permissions missing
3. Wrong region

**Solution:**
1. Verify model access in Bedrock console
2. Check IAM role has `bedrock:InvokeModel` permission
3. Ensure you're using the correct region

### Error: "ThrottlingException"

**Solution**: You've exceeded the rate limit. Wait a moment and try again.

### Models Still Not Working After 15 Minutes

**Solution:**
1. Check your email for approval status
2. Verify in Bedrock console that status shows "Access granted"
3. Try a different model (e.g., Claude 3 Haiku instead of Sonnet)
4. Contact AWS Support if issue persists

## Cost Considerations

### Pricing (as of 2024)

**Claude 3 Haiku:**
- Input: $0.25 per 1M tokens
- Output: $1.25 per 1M tokens
- Best for: High-volume, simple queries

**Claude 3 Sonnet:**
- Input: $3.00 per 1M tokens
- Output: $15.00 per 1M tokens
- Best for: Balanced performance

**Claude 3.5 Sonnet:**
- Input: $3.00 per 1M tokens
- Output: $15.00 per 1M tokens
- Best for: Complex reasoning

### Estimated Costs for Dev Environment

Assuming 1,000 API calls per day with average 500 tokens per request:

- **Daily cost**: ~$0.50 - $2.00
- **Monthly cost**: ~$15 - $60

**Tip**: Use Claude 3 Haiku for development and testing to minimize costs.

## Next Steps

After model access is granted:

1. ✅ Run `npx ts-node scripts/test-bedrock.ts` to verify
2. ✅ Test disease detection Lambda function
3. ✅ Test advisory chatbot Lambda function
4. ✅ Test market prediction Lambda function
5. ✅ Deploy remaining stacks (IoTStack, MonitoringStack)

## References

- [Amazon Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [Anthropic Claude Models](https://docs.anthropic.com/claude/docs)
- [Bedrock Pricing](https://aws.amazon.com/bedrock/pricing/)
- [Model Access Management](https://docs.aws.amazon.com/bedrock/latest/userguide/model-access.html)
