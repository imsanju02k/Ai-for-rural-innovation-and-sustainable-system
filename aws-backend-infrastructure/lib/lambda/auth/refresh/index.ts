/**
 * Auth Refresh Lambda Handler
 * Handles token refresh using Cognito refresh token
 */

import {
    CognitoIdentityProviderClient,
    InitiateAuthCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    ok,
    badRequest,
    unauthorized,
    internalServerError,
    getRequestId,
    parseBody,
} from '../../../shared/utils/response';
import { validateRequiredFields } from '../../../shared/utils/validation';

const cognitoClient = new CognitoIdentityProviderClient({});

const USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID!;

interface RefreshRequest {
    refreshToken: string;
}

/**
 * Lambda handler for token refresh
 */
export const handler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const requestId = getRequestId(event);

    try {
        // Parse and validate request body
        const body = parseBody<RefreshRequest>(event.body);
        if (!body) {
            return badRequest('Invalid request body', requestId);
        }

        // Validate required fields
        const { valid, missingFields } = validateRequiredFields(body, ['refreshToken']);
        if (!valid) {
            return badRequest(
                `Missing required fields: ${missingFields.join(', ')}`,
                requestId
            );
        }

        const { refreshToken } = body;

        // Validate refresh token format (basic check)
        if (typeof refreshToken !== 'string' || refreshToken.trim().length === 0) {
            return badRequest('Invalid refresh token format', requestId);
        }

        // Refresh tokens with Cognito
        let authResult;
        try {
            const authCommand = new InitiateAuthCommand({
                AuthFlow: 'REFRESH_TOKEN_AUTH',
                ClientId: USER_POOL_CLIENT_ID,
                AuthParameters: {
                    REFRESH_TOKEN: refreshToken,
                },
            });

            const authResponse = await cognitoClient.send(authCommand);
            authResult = authResponse.AuthenticationResult;

            if (!authResult) {
                return unauthorized('Token refresh failed', requestId);
            }
        } catch (error: any) {
            console.error('Cognito token refresh error:', {
                requestId,
                error: error.message,
                code: error.name,
            });

            // Handle specific Cognito errors
            if (error.name === 'NotAuthorizedException') {
                return unauthorized('Invalid or expired refresh token', requestId);
            }
            if (error.name === 'TooManyRequestsException') {
                return unauthorized(
                    'Too many refresh attempts. Please try again later.',
                    requestId
                );
            }

            throw error;
        }

        // Return success response with new access token
        return ok(
            {
                accessToken: authResult.AccessToken,
                idToken: authResult.IdToken,
                expiresIn: authResult.ExpiresIn || 3600,
                tokenType: authResult.TokenType || 'Bearer',
            },
            { 'X-Request-Id': requestId }
        );
    } catch (error: any) {
        console.error('Token refresh error:', {
            requestId,
            error: error.message,
            stack: error.stack,
        });

        return internalServerError(
            'An error occurred during token refresh',
            requestId
        );
    }
};
