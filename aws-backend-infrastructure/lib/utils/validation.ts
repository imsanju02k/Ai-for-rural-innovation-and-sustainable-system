/**
 * Utility functions for validating configuration and inputs
 */

/**
 * Validation result interface
 */
export interface ValidationResult {
    valid: boolean;
    errors: string[];
}

/**
 * Validate environment name
 * @param environment - Environment name to validate
 * @returns Validation result
 */
export function validateEnvironment(environment: string): ValidationResult {
    const validEnvironments = ['dev', 'development', 'staging', 'stage', 'prod', 'production'];
    const errors: string[] = [];

    if (!environment) {
        errors.push('Environment is required');
    } else if (!validEnvironments.includes(environment.toLowerCase())) {
        errors.push(
            `Invalid environment: ${environment}. Valid values are: ${validEnvironments.join(', ')}`
        );
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Validate AWS region
 * @param region - AWS region to validate
 * @returns Validation result
 */
export function validateRegion(region: string): ValidationResult {
    const errors: string[] = [];

    if (!region) {
        errors.push('Region is required');
    } else if (!/^[a-z]{2}-[a-z]+-\d{1}$/.test(region)) {
        errors.push(`Invalid AWS region format: ${region}`);
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Validate AWS account ID
 * @param accountId - AWS account ID to validate
 * @returns Validation result
 */
export function validateAccountId(accountId: string): ValidationResult {
    const errors: string[] = [];

    if (!accountId) {
        errors.push('Account ID is required');
    } else if (!/^\d{12}$/.test(accountId)) {
        errors.push(`Invalid AWS account ID: ${accountId}. Must be 12 digits`);
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Validate resource name
 * @param name - Resource name to validate
 * @param maxLength - Maximum length allowed
 * @returns Validation result
 */
export function validateResourceName(name: string, maxLength: number = 64): ValidationResult {
    const errors: string[] = [];

    if (!name) {
        errors.push('Resource name is required');
    } else {
        if (name.length > maxLength) {
            errors.push(`Resource name exceeds maximum length of ${maxLength} characters`);
        }
        if (!/^[a-zA-Z0-9-_]+$/.test(name)) {
            errors.push('Resource name can only contain alphanumeric characters, hyphens, and underscores');
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Validate S3 bucket name
 * @param bucketName - Bucket name to validate
 * @returns Validation result
 */
export function validateBucketName(bucketName: string): ValidationResult {
    const errors: string[] = [];

    if (!bucketName) {
        errors.push('Bucket name is required');
    } else {
        if (bucketName.length < 3 || bucketName.length > 63) {
            errors.push('Bucket name must be between 3 and 63 characters');
        }
        if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(bucketName)) {
            errors.push(
                'Bucket name must start and end with lowercase letter or number, and contain only lowercase letters, numbers, and hyphens'
            );
        }
        if (/\.\./.test(bucketName)) {
            errors.push('Bucket name cannot contain consecutive periods');
        }
        if (/^\d+\.\d+\.\d+\.\d+$/.test(bucketName)) {
            errors.push('Bucket name cannot be formatted as an IP address');
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Validate Lambda memory size
 * @param memorySize - Memory size in MB
 * @returns Validation result
 */
export function validateLambdaMemory(memorySize: number): ValidationResult {
    const errors: string[] = [];

    if (memorySize < 128 || memorySize > 10240) {
        errors.push('Lambda memory size must be between 128 MB and 10240 MB');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Validate Lambda timeout
 * @param timeout - Timeout in seconds
 * @returns Validation result
 */
export function validateLambdaTimeout(timeout: number): ValidationResult {
    const errors: string[] = [];

    if (timeout < 1 || timeout > 900) {
        errors.push('Lambda timeout must be between 1 and 900 seconds');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Validate configuration object
 * @param config - Configuration object to validate
 * @returns Validation result
 */
export function validateConfig(config: any): ValidationResult {
    const errors: string[] = [];

    // Validate environment
    if (config.environment) {
        const envResult = validateEnvironment(config.environment);
        errors.push(...envResult.errors);
    } else {
        errors.push('Configuration must include environment');
    }

    // Validate region
    if (config.region) {
        const regionResult = validateRegion(config.region);
        errors.push(...regionResult.errors);
    } else {
        errors.push('Configuration must include region');
    }

    // Validate Lambda config
    if (config.lambda) {
        if (config.lambda.memorySize) {
            const memResult = validateLambdaMemory(config.lambda.memorySize);
            errors.push(...memResult.errors);
        }
        if (config.lambda.timeout) {
            const timeoutResult = validateLambdaTimeout(config.lambda.timeout);
            errors.push(...timeoutResult.errors);
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
