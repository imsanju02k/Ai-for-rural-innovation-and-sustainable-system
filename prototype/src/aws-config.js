// AWS Amplify Configuration
// Auto-generated for development environment
// Generated at: ${new Date().toISOString()}

export const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_wBAvFZ0SK',
      userPoolClientId: 'bcav3ls91uen7iiplno5rd03n',
      identityPoolId: 'us-east-1:c9686f9b-cab7-46e4-a5b2-a905c133b486',
      loginWith: {
        email: true,
      },
      signUpVerificationMethod: 'code',
      userAttributes: {
        email: {
          required: true,
        },
        name: {
          required: true,
        },
      },
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: true,
      },
    },
  },
  API: {
    REST: {
      FarmAPI: {
        endpoint: 'https://hkwp4iwhu6.execute-api.us-east-1.amazonaws.com/dev',
        region: 'us-east-1',
      },
    },
  },
  Storage: {
    S3: {
      bucket: 'dev-farm-images-339712928283',
      region: 'us-east-1',
    },
  },
};

export default awsConfig;
