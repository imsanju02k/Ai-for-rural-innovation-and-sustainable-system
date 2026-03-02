#!/bin/bash

# Deployment script for AWS Backend Infrastructure
# Usage: ./scripts/deploy.sh [environment]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get environment from argument or default to dev
ENVIRONMENT=${1:-dev}

echo -e "${GREEN}Starting deployment for environment: ${ENVIRONMENT}${NC}"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    echo -e "${RED}Error: Invalid environment. Must be dev, staging, or prod${NC}"
    exit 1
fi

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not configured. Run 'aws configure' first.${NC}"
    exit 1
fi

# Get AWS account and region
AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=$(aws configure get region)

echo -e "${YELLOW}AWS Account: ${AWS_ACCOUNT}${NC}"
echo -e "${YELLOW}AWS Region: ${AWS_REGION}${NC}"

# Install dependencies
echo -e "${GREEN}Installing dependencies...${NC}"
npm install

# Run tests
echo -e "${GREEN}Running tests...${NC}"
npm test

# Build TypeScript
echo -e "${GREEN}Building TypeScript...${NC}"
npm run build

# Synthesize CloudFormation templates
echo -e "${GREEN}Synthesizing CDK stacks...${NC}"
npm run cdk:synth -- --context environment=$ENVIRONMENT

# Show diff
echo -e "${GREEN}Showing differences...${NC}"
npm run cdk:diff -- --context environment=$ENVIRONMENT || true

# Confirm deployment
if [[ "$ENVIRONMENT" == "prod" ]]; then
    echo -e "${YELLOW}WARNING: You are about to deploy to PRODUCTION${NC}"
    read -p "Are you sure you want to continue? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo -e "${RED}Deployment cancelled${NC}"
        exit 1
    fi
fi

# Deploy
echo -e "${GREEN}Deploying stacks...${NC}"
npm run cdk:deploy -- --all --context environment=$ENVIRONMENT --require-approval never

# Save outputs
echo -e "${GREEN}Saving outputs...${NC}"
npm run cdk:synth -- --context environment=$ENVIRONMENT > outputs-$ENVIRONMENT.json

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${YELLOW}Outputs saved to: outputs-$ENVIRONMENT.json${NC}"
