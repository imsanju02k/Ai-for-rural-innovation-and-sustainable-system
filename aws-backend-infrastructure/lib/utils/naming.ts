/**
 * Utility functions for consistent resource naming across the infrastructure
 */

/**
 * Generate a resource name with environment prefix
 * @param environment - Environment name (dev, staging, prod)
 * @param resourceType - Type of resource (e.g., 'lambda', 'table', 'bucket')
 * @param resourceName - Specific name for the resource
 * @returns Formatted resource name
 */
export function getResourceName(
    environment: string,
    resourceType: string,
    resourceName: string
): string {
    return `${environment}-${resourceType}-${resourceName}`;
}

/**
 * Generate a Lambda function name
 * @param environment - Environment name
 * @param functionName - Function name
 * @returns Formatted Lambda function name
 */
export function getLambdaName(environment: string, functionName: string): string {
    return `${environment}-${functionName}`;
}

/**
 * Generate a DynamoDB table name
 * @param environment - Environment name
 * @param tableName - Table name
 * @returns Formatted table name
 */
export function getTableName(environment: string, tableName: string): string {
    return `${environment}-${tableName}`;
}

/**
 * Generate an S3 bucket name (must be globally unique and lowercase)
 * @param environment - Environment name
 * @param bucketPurpose - Purpose of the bucket
 * @param accountId - AWS account ID for uniqueness
 * @returns Formatted bucket name
 */
export function getBucketName(
    environment: string,
    bucketPurpose: string,
    accountId?: string
): string {
    const suffix = accountId ? `-${accountId}` : '';
    return `${environment}-${bucketPurpose}${suffix}`.toLowerCase();
}

/**
 * Generate an API Gateway name
 * @param environment - Environment name
 * @param apiName - API name
 * @returns Formatted API name
 */
export function getApiName(environment: string, apiName: string): string {
    return `${environment}-${apiName}`;
}

/**
 * Generate a Cognito User Pool name
 * @param environment - Environment name
 * @param poolName - Pool name
 * @returns Formatted user pool name
 */
export function getUserPoolName(environment: string, poolName: string): string {
    return `${environment}-${poolName}`;
}

/**
 * Generate an IAM role name
 * @param environment - Environment name
 * @param roleName - Role name
 * @returns Formatted role name
 */
export function getRoleName(environment: string, roleName: string): string {
    return `${environment}-${roleName}`;
}

/**
 * Generate a CloudWatch log group name
 * @param environment - Environment name
 * @param serviceName - Service name
 * @returns Formatted log group name
 */
export function getLogGroupName(environment: string, serviceName: string): string {
    return `/aws/${environment}/${serviceName}`;
}

/**
 * Generate an IoT policy name
 * @param environment - Environment name
 * @param policyName - Policy name
 * @returns Formatted IoT policy name
 */
export function getIoTPolicyName(environment: string, policyName: string): string {
    return `${environment}-${policyName}`;
}

/**
 * Generate a stack name
 * @param environment - Environment name
 * @param stackName - Stack name
 * @returns Formatted stack name
 */
export function getStackName(environment: string, stackName: string): string {
    return `${environment}-${stackName}`;
}
