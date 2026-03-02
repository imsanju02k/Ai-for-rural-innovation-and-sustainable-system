/**
 * Auth Register Lambda Handler
 * Handles user registration with Cognito and DynamoDB
 */

import {
    CognitoIdentityProviderClient,
    SignUpCommand,
    AdminConfirmSignUpCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { putItem } from '../../../shared/utils/dynamodb';
import {
    created,
    badRequest,
    conflict,
    internalServerError,
    getRequestId,
    parseBody,
} from '../../../shared/utils/response';
import {
    isValidEmail,
    isValidPassword,
    isValidPhoneNumber,
    validateRequiredFields,
} from '../../../shared/utils/validation';

const cognitoClient = new CognitoIdentityProviderClient({});

const USER_POOL_ID = process.env.USER_POOL_ID!;
const USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID!;
const USERS_TABLE = process.env.USERS_TABLE!;

interface RegisterRequest {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role?: 'farmer' | 'advisor' | 'admin';
}

/**
 * Lambda handler for user registration
 */
export const handler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const requestId = getRequestId(event);

    try {
        // Parse and validate request body
        const body = parseBody<RegisterRequest>(event.body);
        if (!body) {
            return badRequest('Invalid request body', requestId);
        }

        // Validate required fields
        const { valid, missingFields } = validateRequiredFields(body, [
            'email',
            'password',
            'name',
        ]);
        if (!valid) {
            return badRequest(
                `Missing required fields: ${missingFields.join(', ')}`,
                requestId
            );
        }

        const { email, password, name, phone, role = 'farmer' } = body;

        // Validate email format
        if (!isValidEmail(email)) {
            return badRequest('Invalid email format', requestId);
        }

        // Validate password strength
        if (!isValidPassword(password)) {
            return badRequest(
                'Password must be at least 8 characters and contain uppercase, lowercase, number, and special character',
                requestId
            );
        }

        // Validate phone number if provided
        if (phone && !isValidPhoneNumber(phone)) {
            return badRequest('Invalid phone number format', requestId);
        }

        // Validate role
        if (!['farmer', 'advisor', 'admin'].includes(role)) {
            return badRequest('Invalid role. Must be farmer, advisor, or admin', requestId);
        }

        // Generate userId
        const userId = uuidv4();

        // Register user in Cognito
        try {
            await cognitoClient.send(
                new SignUpCommand({
                    ClientId: USER_POOL_CLIENT_ID,
                    Username: email,
                    Password: password,
                    UserAttributes: [
                        { Name: 'email', Value: email },
                        { Name: 'name', Value: name },
                        { Name: 'custom:userId', Value: userId },
                        { Name: 'custom:role', Value: role },
                        ...(phone ? [{ Name: 'phone_number', Value: phone }] : []),
                    ],
                })
            );
        } catch (error: any) {
            console.error('Cognito SignUp error:', {
                requestId,
                error: error.message,
                code: error.name,
            });

            // Handle specific Cognito errors
            if (error.name === 'UsernameExistsException') {
                return conflict('Email already registered', requestId);
            }
            if (error.name === 'InvalidPasswordException') {
                return badRequest('Password does not meet requirements', requestId);
            }
            if (error.name === 'InvalidParameterException') {
                return badRequest(error.message, requestId);
            }

            throw error;
        }

        // Store user metadata in DynamoDB
        const timestamp = new Date().toISOString();
        const userRecord = {
            userId,
            email,
            name,
            ...(phone && { phone }),
            role,
            preferences: {
                language: 'en',
                notifications: {
                    email: true,
                    sms: false,
                    push: true,
                },
            },
            createdAt: timestamp,
            updatedAt: timestamp,
        };

        try {
            await putItem(USERS_TABLE, userRecord);
        } catch (error: any) {
            console.error('DynamoDB putItem error:', {
                requestId,
                error: error.message,
                userId,
            });
            throw error;
        }

        // Return success response
        return created(
            {
                userId,
                email,
                message: 'Verification email sent',
            },
            { 'X-Request-Id': requestId }
        );
    } catch (error: any) {
        console.error('Registration error:', {
            requestId,
            error: error.message,
            stack: error.stack,
        });

        return internalServerError(
            'An error occurred during registration',
            requestId
        );
    }
};
