#!/bin/bash

###############################################################################
# Rotate Database Password Script
#
# This script rotates the database password in AWS Secrets Manager.
# It generates a new password and updates the secret.
#
# Requirements: 13.9
#
# Usage:
#   ./rotate-database-password.sh <environment>
#
# Example:
#   ./rotate-database-password.sh dev
#   ./rotate-database-password.sh prod
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if environment is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Environment not specified${NC}"
    echo "Usage: $0 <environment>"
    echo "Example: $0 dev"
    exit 1
fi

ENVIRONMENT=$1
SECRET_NAME="${ENVIRONMENT}/database/credentials"

echo -e "${YELLOW}=== Database Password Rotation ===${NC}"
echo "Environment: $ENVIRONMENT"
echo "Secret Name: $SECRET_NAME"
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

# Confirm rotation
echo -e "${YELLOW}WARNING: This will rotate the database password.${NC}"
echo "Make sure no critical operations are running."
read -p "Do you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Rotation cancelled."
    exit 0
fi

echo ""
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

# Parse current values
USERNAME=$(echo "$CURRENT_SECRET" | jq -r '.username')
ENGINE=$(echo "$CURRENT_SECRET" | jq -r '.engine')

echo "Username: $USERNAME"
echo "Engine: $ENGINE"
echo ""

echo "Step 2: Generating new password..."

# Generate a new secure password (32 characters, alphanumeric)
NEW_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)

if [ -z "$NEW_PASSWORD" ]; then
    echo -e "${RED}Error: Failed to generate new password${NC}"
    exit 1
fi

echo -e "${GREEN}✓ New password generated${NC}"
echo ""

echo "Step 3: Updating secret in Secrets Manager..."

# Create new secret JSON
NEW_SECRET=$(jq -n \
    --arg username "$USERNAME" \
    --arg password "$NEW_PASSWORD" \
    --arg engine "$ENGINE" \
    '{username: $username, password: $password, engine: $engine}')

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
echo "Step 4: Verifying rotation..."

# Wait a moment for the update to propagate
sleep 2

# Verify the secret was updated
VERIFY_SECRET=$(aws secretsmanager get-secret-value \
    --secret-id "$SECRET_NAME" \
    --query SecretString \
    --output text)

VERIFY_PASSWORD=$(echo "$VERIFY_SECRET" | jq -r '.password')

if [ "$VERIFY_PASSWORD" == "$NEW_PASSWORD" ]; then
    echo -e "${GREEN}✓ Rotation verified successfully${NC}"
else
    echo -e "${RED}Error: Verification failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}=== Password Rotation Complete ===${NC}"
echo ""
echo "Next steps:"
echo "1. Update any applications or services using this password"
echo "2. Test database connectivity"
echo "3. Monitor application logs for any authentication errors"
echo ""
echo "Note: Lambda functions will automatically pick up the new password"
echo "      on their next invocation due to the secrets cache."
