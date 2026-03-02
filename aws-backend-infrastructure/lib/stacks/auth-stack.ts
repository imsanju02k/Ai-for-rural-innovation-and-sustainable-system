import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../config/types';
import { getResourceName } from '../utils/naming';
import { applyTags } from '../utils/tags';
import { LambdaAuthorizerConstruct } from '../constructs/lambda-authorizer';

/**
 * AuthStack - Cognito User Pool and Identity Pool for authentication
 * 
 * Creates:
 * - Cognito User Pool with email sign-in
 * - Password policy enforcement
 * - Email verification
 * - User Pool Client for frontend
 * - Identity Pool for authenticated and unauthenticated access
 * - IAM roles for authenticated users
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.10
 */
export class AuthStack extends cdk.Stack {
    public readonly userPool: cognito.UserPool;
    public readonly userPoolClient: cognito.UserPoolClient;
    public readonly identityPool: cognito.CfnIdentityPool;
    public readonly authenticatedRole: iam.Role;
    public readonly unauthenticatedRole: iam.Role;
    // Note: authorizerFunction moved to ComputeStack to avoid circular dependency

    constructor(scope: Construct, id: string, config: EnvironmentConfig, props?: cdk.StackProps) {
        super(scope, id, props);

        // ===== COGNITO USER POOL =====

        // Create User Pool with email sign-in (Requirement 2.1)
        this.userPool = new cognito.UserPool(this, 'UserPool', {
            userPoolName: getResourceName(config.environment, 'cognito', 'user-pool'),

            // Sign-in configuration - email only (Requirement 2.1)
            signInAliases: {
                email: true,
                username: false,
                phone: false,
            },

            // Self sign-up enabled
            selfSignUpEnabled: true,

            // Email verification (Requirement 2.3)
            autoVerify: {
                email: true,
            },

            // Standard attributes
            standardAttributes: {
                email: {
                    required: true,
                    mutable: true,
                },
                givenName: {
                    required: false,
                    mutable: true,
                },
                familyName: {
                    required: false,
                    mutable: true,
                },
                phoneNumber: {
                    required: false,
                    mutable: true,
                },
            },

            // Custom attributes for role-based access control (Requirement 2.9)
            customAttributes: {
                role: new cognito.StringAttribute({
                    minLen: 1,
                    maxLen: 20,
                    mutable: true,
                }),
            },

            // Password policy (Requirement 2.2)
            // Min 8 chars, uppercase, lowercase, number, special char
            passwordPolicy: {
                minLength: config.cognito.passwordPolicy.minLength,
                requireLowercase: config.cognito.passwordPolicy.requireUppercase,
                requireUppercase: config.cognito.passwordPolicy.requireUppercase,
                requireDigits: config.cognito.passwordPolicy.requireNumbers,
                requireSymbols: config.cognito.passwordPolicy.requireSymbols,
                tempPasswordValidity: cdk.Duration.days(7),
            },

            // Account recovery
            accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,

            // MFA configuration
            mfa: config.cognito.mfaConfiguration === 'REQUIRED'
                ? cognito.Mfa.REQUIRED
                : config.cognito.mfaConfiguration === 'OPTIONAL'
                    ? cognito.Mfa.OPTIONAL
                    : cognito.Mfa.OFF,

            // Email configuration
            email: cognito.UserPoolEmail.withCognito('noreply@farmplatform.example.com'),

            // Email verification message
            userVerification: {
                emailSubject: 'Verify your email for AI Rural Innovation Platform',
                emailBody: 'Thank you for signing up! Your verification code is {####}',
                emailStyle: cognito.VerificationEmailStyle.CODE,
            },

            // Device tracking
            deviceTracking: {
                challengeRequiredOnNewDevice: true,
                deviceOnlyRememberedOnUserPrompt: true,
            },

            // Advanced security (if configured)
            advancedSecurityMode: config.cognito.advancedSecurity === 'ENFORCED'
                ? cognito.AdvancedSecurityMode.ENFORCED
                : config.cognito.advancedSecurity === 'AUDIT'
                    ? cognito.AdvancedSecurityMode.AUDIT
                    : cognito.AdvancedSecurityMode.OFF,

            // Deletion protection for production
            removalPolicy: config.environment === 'prod'
                ? cdk.RemovalPolicy.RETAIN
                : cdk.RemovalPolicy.DESTROY,
        });

        // ===== USER POOL CLIENT =====

        // Create User Pool Client for frontend (Requirement 2.10)
        this.userPoolClient = this.userPool.addClient('UserPoolClient', {
            userPoolClientName: getResourceName(config.environment, 'cognito', 'client'),

            // Auth flows
            authFlows: {
                userPassword: true,
                userSrp: true,
                custom: false,
                adminUserPassword: false,
            },

            // OAuth configuration
            oAuth: {
                flows: {
                    authorizationCodeGrant: true,
                    implicitCodeGrant: false,
                },
                scopes: [
                    cognito.OAuthScope.EMAIL,
                    cognito.OAuthScope.OPENID,
                    cognito.OAuthScope.PROFILE,
                ],
                callbackUrls: [
                    'http://localhost:3000/callback',
                    'https://farmplatform.example.com/callback',
                ],
                logoutUrls: [
                    'http://localhost:3000',
                    'https://farmplatform.example.com',
                ],
            },

            // Token validity (Requirement 2.4)
            // Access tokens valid for 24 hours
            accessTokenValidity: cdk.Duration.hours(24),
            idTokenValidity: cdk.Duration.hours(24),
            refreshTokenValidity: cdk.Duration.days(30),

            // Prevent user existence errors
            preventUserExistenceErrors: true,

            // Enable token revocation
            enableTokenRevocation: true,

            // Read attributes
            readAttributes: new cognito.ClientAttributes()
                .withStandardAttributes({
                    email: true,
                    emailVerified: true,
                    givenName: true,
                    familyName: true,
                    phoneNumber: true,
                })
                .withCustomAttributes('role'),

            // No writeAttributes restriction - allow writing to all configured attributes
            // This allows tests and applications flexibility in attribute management
        });

        // ===== COGNITO IDENTITY POOL =====

        // Create Identity Pool for authenticated and unauthenticated access (Requirement 2.10)
        this.identityPool = new cognito.CfnIdentityPool(this, 'IdentityPool', {
            identityPoolName: getResourceName(config.environment, 'cognito', 'identity-pool'),
            allowUnauthenticatedIdentities: false, // Only allow authenticated users
            cognitoIdentityProviders: [
                {
                    clientId: this.userPoolClient.userPoolClientId,
                    providerName: this.userPool.userPoolProviderName,
                },
            ],
        });

        // ===== IAM ROLES FOR IDENTITY POOL =====

        // Authenticated user role
        this.authenticatedRole = new iam.Role(this, 'AuthenticatedRole', {
            roleName: getResourceName(config.environment, 'iam', 'cognito-authenticated'),
            description: 'IAM role for authenticated Cognito users',
            assumedBy: new iam.FederatedPrincipal(
                'cognito-identity.amazonaws.com',
                {
                    StringEquals: {
                        'cognito-identity.amazonaws.com:aud': this.identityPool.ref,
                    },
                    'ForAnyValue:StringLike': {
                        'cognito-identity.amazonaws.com:amr': 'authenticated',
                    },
                },
                'sts:AssumeRoleWithWebIdentity'
            ),
        });

        // Grant authenticated users access to their own S3 prefix
        this.authenticatedRole.addToPolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    's3:GetObject',
                    's3:PutObject',
                    's3:DeleteObject',
                ],
                resources: [
                    `arn:aws:s3:::${config.environment}-farm-images-*/$\{cognito-identity.amazonaws.com:sub}/*`,
                ],
            })
        );

        // Grant authenticated users access to invoke API Gateway
        this.authenticatedRole.addToPolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['execute-api:Invoke'],
                resources: [`arn:aws:execute-api:${config.region}:${cdk.Aws.ACCOUNT_ID}:*/*/*/*`],
            })
        );

        // Unauthenticated user role (minimal permissions)
        this.unauthenticatedRole = new iam.Role(this, 'UnauthenticatedRole', {
            roleName: getResourceName(config.environment, 'iam', 'cognito-unauthenticated'),
            description: 'IAM role for unauthenticated Cognito users',
            assumedBy: new iam.FederatedPrincipal(
                'cognito-identity.amazonaws.com',
                {
                    StringEquals: {
                        'cognito-identity.amazonaws.com:aud': this.identityPool.ref,
                    },
                    'ForAnyValue:StringLike': {
                        'cognito-identity.amazonaws.com:amr': 'unauthenticated',
                    },
                },
                'sts:AssumeRoleWithWebIdentity'
            ),
        });

        // Attach roles to Identity Pool
        new cognito.CfnIdentityPoolRoleAttachment(this, 'IdentityPoolRoleAttachment', {
            identityPoolId: this.identityPool.ref,
            roles: {
                authenticated: this.authenticatedRole.roleArn,
                unauthenticated: this.unauthenticatedRole.roleArn,
            },
        });

        // Note: Lambda authorizer moved to ComputeStack to avoid circular dependency

        // Apply tags to all resources in this stack
        applyTags(this, config.tags);

        // ===== CLOUDFORMATION OUTPUTS =====

        new cdk.CfnOutput(this, 'UserPoolId', {
            value: this.userPool.userPoolId,
            description: 'Cognito User Pool ID',
        });

        new cdk.CfnOutput(this, 'UserPoolArn', {
            value: this.userPool.userPoolArn,
            description: 'Cognito User Pool ARN',
        });

        new cdk.CfnOutput(this, 'UserPoolClientId', {
            value: this.userPoolClient.userPoolClientId,
            description: 'Cognito User Pool Client ID',
        });

        new cdk.CfnOutput(this, 'IdentityPoolId', {
            value: this.identityPool.ref,
            description: 'Cognito Identity Pool ID',
        });

        new cdk.CfnOutput(this, 'AuthenticatedRoleArn', {
            value: this.authenticatedRole.roleArn,
            description: 'IAM role ARN for authenticated users',
        });

        new cdk.CfnOutput(this, 'UnauthenticatedRoleArn', {
            value: this.unauthenticatedRole.roleArn,
            description: 'IAM role ARN for unauthenticated users',
        });
    }
}
