/**
 * Configuration Validator
 * 
 * Validates required environment variables at Lambda startup.
 * Logs errors for missing configuration and fails fast if critical config is missing.
 * 
 * Requirements: 13.6, 13.7
 */

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

export interface ConfigRequirement {
    name: string;
    required: boolean;
    description: string;
    validator?: (value: string) => boolean;
    defaultValue?: string;
}

/**
 * Standard configuration requirements for Lambda functions
 */
export const STANDARD_CONFIG_REQUIREMENTS: ConfigRequirement[] = [
    {
        name: 'ENVIRONMENT',
        required: true,
        description: 'Deployment environment (dev, staging, prod)',
        validator: (value) => ['dev', 'staging', 'prod'].includes(value),
    },
    {
        name: 'AWS_REGION',
        required: true,
        description: 'AWS region for deployment',
        validator: (value) => /^[a-z]{2}-[a-z]+-\d{1}$/.test(value),
    },
    {
        name: 'LOG_LEVEL',
        required: false,
        description: 'Logging level (DEBUG, INFO, WARN, ERROR)',
        defaultValue: 'INFO',
        validator: (value) => ['DEBUG', 'INFO', 'WARN', 'ERROR'].includes(value),
    },
];

/**
 * Validate environment configuration
 * 
 * @param requirements - Array of configuration requirements to validate
 * @returns Validation result with errors and warnings
 */
export function validateConfig(requirements: ConfigRequirement[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const requirement of requirements) {
        const value = process.env[requirement.name];

        // Check if required variable is missing
        if (requirement.required && !value) {
            errors.push(
                `Missing required environment variable: ${requirement.name} - ${requirement.description}`
            );
            continue;
        }

        // Use default value if not provided
        if (!value && requirement.defaultValue) {
            process.env[requirement.name] = requirement.defaultValue;
            warnings.push(
                `Using default value for ${requirement.name}: ${requirement.defaultValue}`
            );
            continue;
        }

        // Validate value if validator is provided
        if (value && requirement.validator && !requirement.validator(value)) {
            errors.push(
                `Invalid value for ${requirement.name}: "${value}" - ${requirement.description}`
            );
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Validate configuration and fail fast if critical config is missing
 * 
 * @param requirements - Array of configuration requirements to validate
 * @throws Error if validation fails
 */
export function validateConfigOrFail(requirements: ConfigRequirement[]): void {
    const result = validateConfig(requirements);

    // Log warnings
    if (result.warnings.length > 0) {
        console.warn('Configuration warnings:');
        result.warnings.forEach((warning) => console.warn(`  ⚠️  ${warning}`));
    }

    // Log errors and fail if validation failed
    if (!result.isValid) {
        console.error('Configuration validation failed:');
        result.errors.forEach((error) => console.error(`  ❌ ${error}`));

        throw new Error(
            `Configuration validation failed with ${result.errors.length} error(s). ` +
            'Lambda function cannot start with invalid configuration.'
        );
    }

    console.log('✓ Configuration validation passed');
}

/**
 * Get a required environment variable or throw an error
 * 
 * @param name - Environment variable name
 * @param description - Description of the variable (for error message)
 * @returns The environment variable value
 * @throws Error if the variable is not set
 */
export function getRequiredEnv(name: string, description?: string): string {
    const value = process.env[name];

    if (!value) {
        const message = description
            ? `Missing required environment variable: ${name} - ${description}`
            : `Missing required environment variable: ${name}`;

        console.error(`❌ ${message}`);
        throw new Error(message);
    }

    return value;
}

/**
 * Get an optional environment variable with a default value
 * 
 * @param name - Environment variable name
 * @param defaultValue - Default value if not set
 * @returns The environment variable value or default
 */
export function getOptionalEnv(name: string, defaultValue: string): string {
    return process.env[name] || defaultValue;
}

/**
 * Validate DynamoDB table name format
 * 
 * @param tableName - Table name to validate
 * @returns true if valid, false otherwise
 */
export function isValidTableName(tableName: string): boolean {
    // DynamoDB table names must be 3-255 characters
    // Can contain: a-z, A-Z, 0-9, underscore, hyphen, period
    return /^[a-zA-Z0-9_.-]{3,255}$/.test(tableName);
}

/**
 * Validate S3 bucket name format
 * 
 * @param bucketName - Bucket name to validate
 * @returns true if valid, false otherwise
 */
export function isValidBucketName(bucketName: string): boolean {
    // S3 bucket names must be 3-63 characters
    // Can contain: lowercase letters, numbers, hyphens
    // Must start and end with letter or number
    return /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(bucketName);
}

/**
 * Validate AWS region format
 * 
 * @param region - Region to validate
 * @returns true if valid, false otherwise
 */
export function isValidRegion(region: string): boolean {
    // AWS region format: us-east-1, eu-west-2, etc.
    return /^[a-z]{2}-[a-z]+-\d{1}$/.test(region);
}

/**
 * Create a configuration validator for a specific Lambda function
 * 
 * @param functionName - Name of the Lambda function
 * @param additionalRequirements - Additional configuration requirements
 * @returns Validation function
 */
export function createConfigValidator(
    functionName: string,
    additionalRequirements: ConfigRequirement[] = []
): () => void {
    return () => {
        console.log(`Validating configuration for ${functionName}...`);

        const allRequirements = [
            ...STANDARD_CONFIG_REQUIREMENTS,
            ...additionalRequirements,
        ];

        validateConfigOrFail(allRequirements);
    };
}

/**
 * Example usage in a Lambda function:
 * 
 * ```typescript
 * import { createConfigValidator } from './shared/utils/config-validator';
 * 
 * const validateConfig = createConfigValidator('FarmCreateFunction', [
 *   {
 *     name: 'FARMS_TABLE_NAME',
 *     required: true,
 *     description: 'DynamoDB table name for farms',
 *     validator: isValidTableName,
 *   },
 *   {
 *     name: 'MAX_FARM_SIZE',
 *     required: false,
 *     description: 'Maximum farm size in acres',
 *     defaultValue: '10000',
 *     validator: (value) => !isNaN(Number(value)) && Number(value) > 0,
 *   },
 * ]);
 * 
 * // Call at Lambda initialization (outside handler)
 * validateConfig();
 * 
 * export const handler = async (event: any) => {
 *   // Handler code...
 * };
 * ```
 */
