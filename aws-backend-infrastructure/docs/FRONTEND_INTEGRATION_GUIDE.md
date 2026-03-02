# Frontend Integration Guide

Complete guide for integrating the React frontend with the AWS backend infrastructure.

## Overview

This guide covers all aspects of connecting your React application to the AWS backend, including:
- Configuration setup
- Authentication
- API integration
- Real-time WebSocket connections
- Type-safe development with TypeScript

## Quick Start

### 1. Generate Configuration Files

After deploying the backend infrastructure, generate the frontend configuration:

```bash
cd aws-backend-infrastructure

# Generate basic config
npm run generate:frontend-config -- --environment dev

# Generate AWS Amplify config
npm run generate:amplify-config -- --environment dev

# Generate OpenAPI spec
npm run generate:openapi
```

This creates:
- `frontend-config/config.dev.json` - Basic configuration
- `frontend-config/amplify-config.dev.ts` - AWS Amplify configuration
- `docs/api/openapi.yaml` - API specification
- `docs/api/postman-collection.json` - Postman collection

### 2. Install TypeScript Types

```bash
cd your-react-app

# Option 1: Install as local package
npm install ../aws-backend-infrastructure/frontend-types

# Option 2: Copy types directly
cp ../aws-backend-infrastructure/frontend-types/index.ts src/types/api.ts
```

### 3. Configure AWS Amplify

```typescript
// src/index.tsx or src/App.tsx
import { Amplify } from 'aws-amplify';
import { amplifyConfig } from './config/amplify-config.dev';

Amplify.configure(amplifyConfig);
```

## Configuration Files

### Basic Configuration (config.json)

```json
{
  "apiEndpoint": "https://api-dev.farmplatform.example.com",
  "region": "us-east-1",
  "userPoolId": "us-east-1_ABC123DEF",
  "userPoolClientId": "1a2b3c4d5e6f7g8h9i0j",
  "s3Bucket": "dev-farm-images-123456789012",
  "iotEndpoint": "a1b2c3d4e5f6g7.iot.us-east-1.amazonaws.com",
  "environment": "dev",
  "websocketEndpoint": "wss://ws-dev.farmplatform.example.com"
}
```

### AWS Amplify Configuration

```typescript
import { Amplify } from 'aws-amplify';

export const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_ABC123DEF',
      userPoolClientId: '1a2b3c4d5e6f7g8h9i0j',
      loginWith: {
        email: true,
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
        endpoint: 'https://api-dev.farmplatform.example.com',
        region: 'us-east-1',
      },
    },
  },
  Storage: {
    S3: {
      bucket: 'dev-farm-images-123456789012',
      region: 'us-east-1',
    },
  },
};

Amplify.configure(amplifyConfig);
```

## Authentication

### Using AWS Amplify Auth

```typescript
import { signIn, signUp, signOut, getCurrentUser } from 'aws-amplify/auth';

// Sign up
async function registerUser(email: string, password: string, name: string) {
  const { isSignUpComplete, userId } = await signUp({
    username: email,
    password,
    options: {
      userAttributes: {
        email,
        name,
      },
    },
  });
  return { userId, isSignUpComplete };
}

// Sign in
async function loginUser(email: string, password: string) {
  const { isSignedIn } = await signIn({
    username: email,
    password,
  });
  return isSignedIn;
}

// Sign out
async function logoutUser() {
  await signOut();
}

// Get current user
async function getUser() {
  const user = await getCurrentUser();
  return user;
}
```

### React Auth Context

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, signIn, signOut } from 'aws-amplify/auth';

interface AuthContextType {
  user: any | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    await signIn({ username: email, password });
    await checkUser();
  }

  async function logout() {
    await signOut();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

## API Integration

### Using AWS Amplify API

```typescript
import { get, post, put, del } from 'aws-amplify/api';

// GET request
async function getFarms() {
  const response = await get({
    apiName: 'FarmAPI',
    path: '/farms',
  }).response;
  return response.body.json();
}

// POST request
async function createFarm(farmData: any) {
  const response = await post({
    apiName: 'FarmAPI',
    path: '/farms',
    options: {
      body: farmData,
    },
  }).response;
  return response.body.json();
}

// PUT request
async function updateFarm(farmId: string, updates: any) {
  const response = await put({
    apiName: 'FarmAPI',
    path: `/farms/${farmId}`,
    options: {
      body: updates,
    },
  }).response;
  return response.body.json();
}

// DELETE request
async function deleteFarm(farmId: string) {
  await del({
    apiName: 'FarmAPI',
    path: `/farms/${farmId}`,
  }).response;
}
```

### Type-Safe API Client

```typescript
import { Farm, CreateFarmRequest } from '@ai-rural-platform/types';
import { get, post } from 'aws-amplify/api';

class FarmAPI {
  private apiName = 'FarmAPI';

  async list(): Promise<Farm[]> {
    const response = await get({
      apiName: this.apiName,
      path: '/farms',
    }).response;
    const data = await response.body.json();
    return data.farms;
  }

  async create(farmData: CreateFarmRequest): Promise<Farm> {
    const response = await post({
      apiName: this.apiName,
      path: '/farms',
      options: { body: farmData },
    }).response;
    return response.body.json();
  }

  async get(farmId: string): Promise<Farm> {
    const response = await get({
      apiName: this.apiName,
      path: `/farms/${farmId}`,
    }).response;
    return response.body.json();
  }
}

export const farmAPI = new FarmAPI();
```

## WebSocket Integration

### WebSocket Client

```typescript
class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(
    private url: string,
    private onMessage: (data: any) => void
  ) {}

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.onMessage(data);
    };

    this.ws.onclose = () => {
      console.log('WebSocket closed');
      this.reconnect();
    };
  }

  subscribe(farmId: string, topics: string[]) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action: 'subscribe',
        farmId,
        topics,
      }));
    }
  }

  private reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      setTimeout(() => this.connect(), delay);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
```

### React Hook for Real-time Data

```typescript
import { useState, useEffect } from 'react';

function useRealtimeData(farmId: string) {
  const [data, setData] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const client = new WebSocketClient(
      'wss://ws-dev.farmplatform.example.com',
      (message) => {
        if (message.type === 'sensor_update') {
          setData((prev) => [...prev, message.payload]);
        }
      }
    );

    client.connect();
    client.subscribe(farmId, ['sensors', 'alerts']);
    setConnected(true);

    return () => {
      client.disconnect();
      setConnected(false);
    };
  }, [farmId]);

  return { data, connected };
}
```

## Storage (S3)

### Upload Images

```typescript
import { uploadData } from 'aws-amplify/storage';

async function uploadImage(file: File, farmId: string) {
  const key = `disease-images/${farmId}/${Date.now()}_${file.name}`;
  
  const result = await uploadData({
    key,
    data: file,
    options: {
      contentType: file.type,
    },
  }).result;

  return result;
}
```

### Get Image URL

```typescript
import { getUrl } from 'aws-amplify/storage';

async function getImageUrl(key: string) {
  const url = await getUrl({
    key,
    options: {
      expiresIn: 300, // 5 minutes
    },
  });

  return url.url.toString();
}
```

## Error Handling

```typescript
import { ApiError } from '@ai-rural-platform/types';

async function handleApiCall<T>(apiCall: () => Promise<T>): Promise<T> {
  try {
    return await apiCall();
  } catch (error: any) {
    if (error.response) {
      const apiError: ApiError = await error.response.json();
      
      switch (apiError.error.code) {
        case 'UNAUTHORIZED':
          // Redirect to login
          window.location.href = '/login';
          break;
        case 'VALIDATION_ERROR':
          throw new Error(apiError.error.message);
        case 'RATE_LIMIT_EXCEEDED':
          throw new Error('Too many requests. Please try again later.');
        default:
          throw new Error(apiError.error.message || 'An error occurred');
      }
    }
    throw error;
  }
}
```

## Complete Example

See the integration examples in `docs/integration-examples/`:
- `01-user-registration-login.md` - Authentication flow
- `02-farm-management.md` - CRUD operations
- `03-disease-detection.md` - Image upload and analysis
- `04-advisory-chat.md` - Chatbot integration
- `05-realtime-sensor-data.md` - WebSocket integration

## Testing

### Using Postman

1. Import `docs/api/postman-collection.json`
2. Set environment variables:
   - `baseUrl`: Your API endpoint
   - `accessToken`: JWT token from login
3. Run the collection

### Using curl

```bash
# Login
curl -X POST https://api-dev.farmplatform.example.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

# Use the token
curl -X GET https://api-dev.farmplatform.example.com/farms \
  -H "Authorization: Bearer <token>"
```

## Troubleshooting

### CORS Issues

If you encounter CORS errors, ensure the API Gateway has CORS configured for your frontend domain.

### Authentication Errors

- Verify Cognito User Pool ID and Client ID are correct
- Check that the user has verified their email
- Ensure the JWT token hasn't expired

### WebSocket Connection Issues

- Verify the WebSocket endpoint URL
- Check that the connection is using WSS (not WS)
- Ensure the client is sending the subscribe message after connecting

## Resources

- [AWS Amplify Documentation](https://docs.amplify.aws/)
- [API Documentation](./api/README.md)
- [OpenAPI Specification](./api/openapi.yaml)
- [Integration Examples](./integration-examples/)
- [TypeScript Types](../frontend-types/README.md)

## Support

For issues or questions:
- Check the API documentation
- Review integration examples
- Contact: support@farmplatform.example.com
