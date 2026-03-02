/**
 * Lambda Authorizer for API Gateway
 * 
 * Validates JWT tokens from Cognito User Pool
 * Extracts user claims (userId, role)
 * Returns IAM policy for API Gateway
 * 
 * Requirements: 2.7, 2.8
 */

import {
    APIGatewayAuthorizerResult,
    APIGatewayTokenAuthorizerEvent,
    PolicyDocument,
    Statement,
} from 'aws-lambda';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

// Environment variables
const USER_POOL_ID = process.env.USER_POOL_ID!;
const CLIENT_ID = process.env.CLIENT_ID!;
const REGION = process.env.AWS_REGION || 'us-east-1';

// Create JWT verifier
const verifier = CognitoJwtVerifier.create({
    userPoolId: USER_POOL_ID,
    tokenUse: 'access',
    clientId: CLIENT_ID,
});

/**
 * Lambda handler for token authorization
 */
export const handler = async (
    event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> => {
    console.log('Authorizer invoked', {
        methodArn: event.methodArn,
        type: event.type,
    });

    try {
        // Extract token from Authorization header
        const token = extractToken(event.authorizationToken);
        
        if (!token) {
            console.error('No token provided');
            throw new Error('Unauthorized');
        }

        // Verify JWT token
        const payload = await verifier.verify(token);
        
        console.log('Token verified successfully', {
            sub: payload.sub,
            username: payload.username,
        });

        // Extract user information
        const userId = payload.sub;
        const username = String(payload.username || payload['cognito:username'] || 'unknown');
        const role = String(payload['custom:role'] || 'farmer'); // Default role

        // Generate IAM policy
        const policy = generatePolicy(
            userId,
            'Allow',
            event.methodArn,
            {
                userId,
                username,
                role,
            }
        );

        console.log('Authorization successful', {
            principalId: userId,
            effect: 'Allow',
        });

        return policy;

    } catch (error) {
        console.error('Authorization failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
        });

        // Return deny policy for invalid tokens (Requirement 2.8)
        throw new Error('Unauthorized');
    }
};

/**
 * Extract token from Authorization header
 * Supports "Bearer <token>" format
 */
function extractToken(authorizationToken: string): string | null {
    if (!authorizationToken) {
        return null;
    }

    const parts = authorizationToken.split(' ');
    
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
        return parts[1];
    }

    // If no "Bearer" prefix, assume the entire string is the token
    return authorizationToken;
}

/**
 * Generate IAM policy for API Gateway
 */
function generatePolicy(
    principalId: string,
    effect: 'Allow' | 'Deny',
    resource: string,
    context?: Record<string, string>
): APIGatewayAuthorizerResult {
    const policyDocument: PolicyDocument = {
        Version: '2012-10-17',
        Statement: [],
    };

    const statement: Statement = {
        Action: 'execute-api:Invoke',
        Effect: effect,
        Resource: resource,
    };

    policyDocument.Statement.push(statement);

    const authResponse: APIGatewayAuthorizerResult = {
        principalId,
        policyDocument,
    };

    // Add context if provided
    if (context) {
        authResponse.context = context;
    }

    return authResponse;
}
