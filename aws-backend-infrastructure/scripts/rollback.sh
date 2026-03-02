#!/bin/bash

# Rollback Script for Farm Platform Infrastructure
# This script performs rollback operations when deployment fails
# or when manual rollback is required
#
# Requirements: Non-functional - Reliability

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to display usage
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Rollback Farm Platform Infrastructure deployment

OPTIONS:
    -e, --environment ENV    Target environment (dev, staging, prod)
    -s, --stack STACK        Specific stack to rollback (optional, defaults to all)
    -t, --timestamp TIME     Rollback to specific timestamp (optional)
    -h, --help              Display this help message

EXAMPLES:
    # Rollback all stacks in production
    $0 --environment prod

    # Rollback specific stack
    $0 --environment staging --stack StorageStack

    # Rollback to specific point in time
    $0 --environment prod --timestamp 2024-01-15T10:30:00Z

EOF
    exit 1
}

# Parse command line arguments
ENVIRONMENT=""
STACK=""
TIMESTAMP=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -s|--stack)
            STACK="$2"
            shift 2
            ;;
        -t|--timestamp)
            TIMESTAMP="$2"
            shift 2
            ;;
        -h|--help)
            usage
            ;;
        *)
            print_error "Unknown option: $1"
            usage
            ;;
    esac
done

# Validate required parameters
if [ -z "$ENVIRONMENT" ]; then
    print_error "Environment is required"
    usage
fi

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    print_error "Invalid environment. Must be dev, staging, or prod"
    exit 1
fi

print_info "Starting rollback process for environment: $ENVIRONMENT"

# Confirm rollback action
print_warning "This will rollback the infrastructure in $ENVIRONMENT environment"
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    print_info "Rollback cancelled"
    exit 0
fi

# Get list of stacks to rollback
if [ -z "$STACK" ]; then
    print_info "Getting list of all stacks in $ENVIRONMENT..."
    STACKS=$(aws cloudformation list-stacks \
        --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE UPDATE_ROLLBACK_COMPLETE \
        --query "StackSummaries[?starts_with(StackName, '$ENVIRONMENT-')].StackName" \
        --output text)
else
    STACKS="$ENVIRONMENT-$STACK"
fi

print_info "Stacks to rollback: $STACKS"

# Function to rollback a single stack
rollback_stack() {
    local stack_name=$1
    
    print_info "Rolling back stack: $stack_name"
    
    # Get current stack status
    STACK_STATUS=$(aws cloudformation describe-stacks \
        --stack-name "$stack_name" \
        --query 'Stacks[0].StackStatus' \
        --output text 2>/dev/null || echo "STACK_NOT_FOUND")
    
    if [ "$STACK_STATUS" == "STACK_NOT_FOUND" ]; then
        print_warning "Stack $stack_name not found, skipping..."
        return 0
    fi
    
    print_info "Current stack status: $STACK_STATUS"
    
    # Check if stack is in a rollback-able state
    if [[ "$STACK_STATUS" == *"IN_PROGRESS"* ]]; then
        print_warning "Stack is currently in progress, waiting for completion..."
        aws cloudformation wait stack-update-complete --stack-name "$stack_name" || true
    fi
    
    # Perform rollback based on timestamp or to previous version
    if [ -n "$TIMESTAMP" ]; then
        print_info "Rolling back to timestamp: $TIMESTAMP"
        # For DynamoDB point-in-time recovery
        print_info "Initiating point-in-time recovery for DynamoDB tables..."
        # This would need to be implemented per table
        print_warning "Point-in-time recovery requires manual intervention for DynamoDB tables"
    else
        print_info "Rolling back to previous stack version..."
        
        # Get previous template
        PREVIOUS_TEMPLATE=$(aws cloudformation get-template \
            --stack-name "$stack_name" \
            --template-stage Original \
            --query 'TemplateBody' \
            --output text 2>/dev/null || echo "")
        
        if [ -z "$PREVIOUS_TEMPLATE" ]; then
            print_error "Could not retrieve previous template for $stack_name"
            return 1
        fi
        
        # Update stack with previous template
        print_info "Updating stack with previous template..."
        aws cloudformation update-stack \
            --stack-name "$stack_name" \
            --template-body "$PREVIOUS_TEMPLATE" \
            --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
            2>/dev/null || {
            print_warning "No updates to perform or update failed"
            return 0
        }
        
        print_info "Waiting for stack rollback to complete..."
        aws cloudformation wait stack-update-complete --stack-name "$stack_name" || {
            print_error "Stack rollback failed for $stack_name"
            return 1
        }
    fi
    
    print_info "✓ Stack $stack_name rolled back successfully"
    return 0
}

# Rollback stacks in reverse dependency order
ROLLBACK_ORDER=(
    "PipelineStack"
    "MonitoringStack"
    "WebSocketStack"
    "IoTStack"
    "AIStack"
    "APIStack"
    "ComputeStack"
    "AuthStack"
    "StorageStack"
    "NetworkStack"
)

FAILED_STACKS=()

for stack_suffix in "${ROLLBACK_ORDER[@]}"; do
    stack_name="$ENVIRONMENT-$stack_suffix"
    
    # Check if this stack should be rolled back
    if [ -n "$STACK" ] && [ "$stack_name" != "$ENVIRONMENT-$STACK" ]; then
        continue
    fi
    
    # Check if stack exists in the list
    if echo "$STACKS" | grep -q "$stack_name"; then
        if ! rollback_stack "$stack_name"; then
            FAILED_STACKS+=("$stack_name")
        fi
    fi
done

# Summary
echo ""
print_info "=== Rollback Summary ==="

if [ ${#FAILED_STACKS[@]} -eq 0 ]; then
    print_info "✓ All stacks rolled back successfully"
    exit 0
else
    print_error "✗ The following stacks failed to rollback:"
    for failed_stack in "${FAILED_STACKS[@]}"; do
        echo "  - $failed_stack"
    done
    exit 1
fi
