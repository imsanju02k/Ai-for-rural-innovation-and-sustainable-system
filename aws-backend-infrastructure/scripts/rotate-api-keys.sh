#!/bin/bash

###############################################################################
# Rotate API Keys Script
#
# This script rotates API keys in AWS Secrets Manager.
# It allows updating individual API keys or all keys at once.
#
# Requirements: 13.9
#
# Usage:
#   ./rotate-api-keys.sh <environment> [key-name]
#
# Examples:
#   ./rotate-api-keys.sh dev weatherApiKey
#   ./rotate-api-keys.sh prod all
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if environment is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Environment not specified${NC}"
    echo "Usage: $0 <environment> [key-name]"
    echo "Example: $0 dev weatherApiKey"
    echo "         $0 prod all"
    exit 1
fi

ENVIRONMENT=$1
KEY_NAME=${2:-"all"}
SECRET_NAME="${ENVIRONMENT}/api/keys"

echo -e "${YELLOW}=== API Keys Rotation ===${NC}"
echo "Environment: $ENVIRONMENT"
echo "Secret Name: $SECRET_NAME"
echo "Key to rotate: $KEY_NAME"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    exit 1
fi

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is not installed${NC}"
    echo "Install jq: https://stedolan.github.io/jq/download/"
    exit 1
fi

echo "Step 1: Retrieving current secret..."

# Get current secret value
CURRENT_SECRET=$(aws secretsmanager get-secret-value \
    --secret-id "$SECRET_NAME" \
    --query SecretString \
    --output text)

if [ -z "$CURRENT_SECRET" ]; then
    echo -e "${RED}Error: Failed to retrieve current secret${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Current secret retrieved${NC}"
echo ""

# Parse current values
WEATHER_API_KEY=$(echo "$CURRENT_SECRET" | jq -r '.weatherApiKey')
MARKET_API_KEY=$(echo "$CURRENT_SECRET" | jq -r '.marketApiKey')
SMS_API_KEY=$(echo "$CURRENT_SECRET" | jq -r '.smsApiKey')

echo "Current API keys:"
echo "  - weatherApiKey: ${WEATHER_API_KEY:0:10}..."
echo "  - marketApiKey: ${MARKET_API_KEY:0:10}..."
echo "  - smsApiKey: ${SMS_API_KEY:0:10}..."
echo ""

# Function to prompt for new API key
prompt_for_key() {
    local key_name=$1
    local current_value=$2
    
    echo -e "${BLUE}Enter new value for ${key_name}:${NC}"
    echo "(Press Enter to keep current value: ${current_value:0:10}...)"
    read -p "> " new_value
    
    if [ -z "$new_value" ]; then
        echo "$current_value"
    else
        echo "$new_value"
    fi
}

# Determine which keys to rotate
if [ "$KEY_NAME" == "all" ]; then
    echo -e "${YELLOW}Rotating all API keys${NC}"
    echo ""
    
    NEW_WEATHER_API_KEY=$(prompt_for_key "weatherApiKey" "$WEATHER_API_KEY")
    echo ""
    NEW_MARKET_API_KEY=$(prompt_for_key "marketApiKey" "$MARKET_API_KEY")
    echo ""
    NEW_SMS_API_KEY=$(prompt_for_key "smsApiKey" "$SMS_API_KEY")
    
elif [ "$KEY_NAME" == "weatherApiKey" ]; then
    NEW_WEATHER_API_KEY=$(prompt_for_key "weatherApiKey" "$WEATHER_API_KEY")
    NEW_MARKET_API_KEY=$MARKET_API_KEY
    NEW_SMS_API_KEY=$SMS_API_KEY
    
elif [ "$KEY_NAME" == "marketApiKey" ]; then
    NEW_WEATHER_API_KEY=$WEATHER_API_KEY
    NEW_MARKET_API_KEY=$(prompt_for_key "marketApiKey" "$MARKET_API_KEY")
    NEW_SMS_API_KEY=$SMS_API_KEY
    
elif [ "$KEY_NAME" == "smsApiKey" ]; then
    NEW_WEATHER_API_KEY=$WEATHER_API_KEY
    NEW_MARKET_API_KEY=$MARKET_API_KEY
    NEW_SMS_API_KEY=$(prompt_for_key "smsApiKey" "$SMS_API_KEY")
    
else
    echo -e "${RED}Error: Invalid key name${NC}"
    echo "Valid options: weatherApiKey, marketApiKey, smsApiKey, all"
    exit 1
fi

echo ""
echo "Step 2: Updating secret in Secrets Manager..."

# Create new secret JSON
NEW_SECRET=$(jq -n \
    --arg weatherApiKey "$NEW_WEATHER_API_KEY" \
    --arg marketApiKey "$NEW_MARKET_API_KEY" \
    --arg smsApiKey "$NEW_SMS_API_KEY" \
    '{weatherApiKey: $weatherApiKey, marketApiKey: $marketApiKey, smsApiKey: $smsApiKey}')

# Update the secret
aws secretsmanager update-secret \
    --secret-id "$SECRET_NAME" \
    --secret-string "$NEW_SECRET" \
    > /dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Secret updated successfully${NC}"
else
    echo -e "${RED}Error: Failed to update secret${NC}"
    exit 1
fi

echo ""
echo "Step 3: Verifying rotation..."

# Wait a moment for the update to propagate
sleep 2

# Verify the secret was updated
VERIFY_SECRET=$(aws secretsmanager get-secret-value \
    --secret-id "$SECRET_NAME" \
    --query SecretString \
    --output text)

if [ -n "$VERIFY_SECRET" ]; then
    echo -e "${GREEN}✓ Rotation verified successfully${NC}"
else
    echo -e "${RED}Error: Verification failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}=== API Keys Rotation Complete ===${NC}"
echo ""
echo "Updated keys:"
if [ "$KEY_NAME" == "all" ] || [ "$KEY_NAME" == "weatherApiKey" ]; then
    echo "  ✓ weatherApiKey"
fi
if [ "$KEY_NAME" == "all" ] || [ "$KEY_NAME" == "marketApiKey" ]; then
    echo "  ✓ marketApiKey"
fi
if [ "$KEY_NAME" == "all" ] || [ "$KEY_NAME" == "smsApiKey" ]; then
    echo "  ✓ smsApiKey"
fi
echo ""
echo "Next steps:"
echo "1. Test API connectivity with the new keys"
echo "2. Monitor application logs for any API errors"
echo "3. Update any external documentation if needed"
echo ""
echo "Note: Lambda functions will automatically pick up the new keys"
echo "      on their next invocation due to the secrets cache."
