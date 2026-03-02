/**
 * Auth Login Lambda Handler
 * Handles user authentication with Cognito
 */

import {
    CognitoIdentityProviderClient,
    InitiateAuthCommand,
    GetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getItem } from '../../../shared/utils/dynamodb';
import {
    ok,
    badRequest,
    unauthorized,
    forbidden,
    internalServerError,
    getRequestId,
    parseBody,
} from '../../../shared/utils/response';
import { isValidEmail, validateRequiredFields } from '../../../shared/utils/validation';

const cognitoClient = new CognitoIdentityProviderClient({});

const USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID!;
const USERS_TABLE = process.env.USERS_TABLE!;

interface LoginRequest {
    email: string;
    password: string;
}

/**
 * Lambda handler for user login
 */
export const handler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const requestId = getRequestId(event);

    try {
        // Parse and validate request body
        const body = parseBody<LoginRequest>(event.body);
        if (!body) {
            return badRequest('Invalid request body', requestId);
        }

        // Validate required fields
        const { valid, missingFields } = validateRequiredFields(body, [
            'email',
            'password',
        ]);
        if (!valid) {
            return badRequest(
                `Missing required fields: ${missingFields.join(', ')}`,
                requestId
            );
        }

        const { email, password } = body;

        // Validate email format
        if (!isValidEmail(email)) {
            return badRequest('Invalid email format', requestId);
        }

        // Authenticate with Cognito using USER_PASSWORD_AUTH flow
        let authResult;
        try {
            const authCommand = new InitiateAuthCommand({
                AuthFlow: 'USER_PASSWORD_AUTH',
                ClientId: USER_POOL_CLIENT_ID,
                AuthParameters: {
                    USERNAME: email,
                    PASSWORD: password,
                },
            });

            const authResponse = await cognitoClient.send(authCommand);
            authResult = authResponse.AuthenticationResult;

            if (!authResult) {
                return unauthorized('Authentication failed', requestId);
            }
        } catch (error: any) {
            console.error('Cognito authentication error:', {
                requestId,
                error: error.message,
                code: error.name,
            });

            // Handle specific Cognito errors
            if (error.name === 'NotAuthorizedException') {
                return unauthorized('Invalid credentials', requestId);
            }
            if (error.name === 'UserNotConfirmedException') {
                return forbidden('Account not verified. Please check your email.', requestId);
            }
            if (error.name === 'UserNotFoundException') {
                return unauthorized('Invalid credentials', requestId);
            }
            if (error.name === 'TooManyRequestsException') {
                return unauthorized('Too many login attempts. Please try again later.', requestId);
            }

            throw error;
        }

        // Get user details from Cognito
        let userId: string;
        let role: string;
        try {
            const getUserCommand = new GetUserCommand({
                AccessToken: authResult.AccessToken!,
            });

            const userResponse = await cognitoClient.send(getUserCommand);
            const userAttributes = userResponse.UserAttributes || [];

            const userIdAttr = userAttributes.find((attr) => attr.Name === 'custom:userId');
            const roleAttr = userAttributes.find((attr) => attr.Name === 'custom:role');

            userId = userIdAttr?.Value || '';
            role = roleAttr?.Value || 'farmer';

            if (!userId) {
                console.error('UserId not found in Cognito attributes', {
                    requestId,
                    email,
                });
                return internalServerError('User data incomplete', requestId);
            }
        } catch (error: any) {
            console.error('Error fetching user details:', {
                requestId,
                error: error.message,
            });
            throw error;
        }

        // Retrieve user metadata from DynamoDB
        let userRecord;
        try {
            userRecord = await getItem(USERS_TABLE, { userId });
            if (!userRecord) {
                console.error('User record not found in DynamoDB', {
                    requestId,
                    userId,
                });
            }
        } catch (error: any) {
            console.error('DynamoDB getItem error:', {
                requestId,
                error: error.message,
                userId,
            });
            // Continue even if DynamoDB fetch fails
        }

        // Return success response with tokens
        return ok(
            {
                accessToken: authResult.AccessToken,
                refreshToken: authResult.RefreshToken,
                idToken: authResult.IdToken,
                expiresIn: authResult.ExpiresIn || 3600,
                tokenType: authResult.TokenType || 'Bearer',
                userId,
                role,
                ...(userRecord && {
                    name: userRecord.name,
                    email: userRecord.email,
                }),
            },
            { 'X-Request-Id': requestId }
        );
    } catch (error: any) {
        console.error('Login error:', {
            requestId,
            error: error.message,
            stack: error.stack,
        });

        return internalServerError('An error occurred during login', requestId);
    }
};
