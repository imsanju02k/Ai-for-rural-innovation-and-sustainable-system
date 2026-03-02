/**
 * Mock Cognito authentication responses for testing
 */

export const mockSignUpResponse = {
  UserConfirmed: false,
  UserSub: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
};

export const mockInitiateAuthResponse = {
  AuthenticationResult: {
    AccessToken: 'mock-access-token-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
    RefreshToken: 'mock-refresh-token-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
    IdToken: 'mock-id-token-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
    ExpiresIn: 3600,
    TokenType: 'Bearer',
  },
  ChallengeName: undefined,
};

export const mockGetUserResponse = {
  Username: 'test-user',
  UserAttributes: [
    { Name: 'sub', Value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
    { Name: 'email', Value: 'test@example.com' },
    { Name: 'email_verified', Value: 'true' },
    { Name: 'name', Value: 'Test User' },
    { Name: 'custom:role', Value: 'farmer' },
  ],
};

export const mockAdminGetUserResponse = {
  Username: 'test-user',
  UserAttributes: [
    { Name: 'sub', Value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
    { Name: 'email', Value: 'test@example.com' },
    { Name: 'email_verified', Value: 'true' },
  ],
  UserStatus: 'CONFIRMED',
  Enabled: true,
};

/**
 * Create a mock JWT token for testing
 */
export function createMockJWTToken(userId: string = 'test-user-id', role: string = 'farmer'): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const payload = Buffer.from(JSON.stringify({
    sub: userId,
    'cognito:username': 'test-user',
    'custom:role': role,
    email: 'test@example.com',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
  })).toString('base64');
  const signature = 'mock-signature';
  
  return `${header}.${payload}.${signature}`;
}

/**
 * Create an expired JWT token for testing
 */
export function createExpiredJWTToken(userId: string = 'test-user-id'): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const payload = Buffer.from(JSON.stringify({
    sub: userId,
    'cognito:username': 'test-user',
    email: 'test@example.com',
    exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
    iat: Math.floor(Date.now() / 1000) - 7200,
  })).toString('base64');
  const signature = 'mock-signature';
  
  return `${header}.${payload}.${signature}`;
}

/**
 * Create a mock Cognito error
 */
export function createMockCognitoError(code: string, message: string) {
  const error = new Error(message);
  error.name = code;
  return error;
}
