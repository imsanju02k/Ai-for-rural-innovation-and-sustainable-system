# Frontend Integration for Deployment

This document provides deployment-specific instructions for integrating the React frontend with the AWS backend infrastructure. For comprehensive integration details, see [FRONTEND_INTEGRATION_GUIDE.md](./FRONTEND_INTEGRATION_GUIDE.md).

## Configuration File Locations

After deploying the backend infrastructure, configuration files are generated in the following locations:

### Generated Configuration Files

```
aws-backend-infrastructure/
├── frontend-config/                    # Generated at runtime
│   ├── config.dev.json                # Development environment config
│   ├── config.staging.json            # Staging environment config
│   ├── config.prod.json               # Production environment config
│   ├── amplify-config.dev.ts          # AWS Amplify config (dev)
│   ├── amplify-config.staging.ts      # AWS Amplify config (staging)
│   └── amplify-config.prod.ts         # AWS Amplify config (prod)
├── frontend-types/                     # TypeScript type definitions
│   ├── index.ts                       # API types
│   ├── package.json                   # Package config
│   └── README.md                      # Types documentation
└── docs/
    └── api/
        ├── openapi.yaml               # OpenAPI specification
        └── postman-collection.json    # Postman collection
```

### Configuration File Contents

**config.{env}.json** - Basic configuration with all backend endpoints:
```json
{
  "apiEndpoint": "https://api-{env}.farmplatform.example.com",
  "region": "us-east-1",
  "userPoolId": "us-east-1_ABC123DEF",
  "userPoolClientId": "1a2b3c4d5e6f7g8h9i0j",
  "s3Bucket": "{env}-farm-images-123456789012",
  "iotEndpoint": "a1b2c3d4e5f6g7.iot.us-east-1.amazonaws.com",
  "websocketEndpoint": "wss://ws-{env}.farmplatform.example.com",
  "environment": "dev|staging|prod"
}
```

**amplify-config.{env}.ts** - AWS Amplify configuration with Auth, API, and Storage settings.

## AWS Amplify Setup

### Step 1: Install Dependencies

In your React application directory:

```bash
npm install aws-amplify @aws-amplify/ui-react
```

### Step 2: Copy Configuration Files

Copy the generated configuration files to your React app:

```bash
# From the backend infrastructure directory
cd aws-backend-infrastructure

# Generate configuration for your environment (dev, staging, or prod)
npm run generate:frontend-config -- --environment dev
npm run generate:amplify-config -- --environment dev

# Copy to your React app
cp frontend-config/config.dev.json ../your-react-app/src/config/
cp frontend-config/amplify-config.dev.ts ../your-react-app/src/config/
```

### Step 3: Configure Amplify in Your App

Add the following to your React app's entry point (`src/index.tsx` or `src/App.tsx`):

```typescript
import { Amplify } from 'aws-amplify';
import { amplifyConfig } from './config/amplify-config.dev';

// Configure Amplify before rendering your app
Amplify.configure(amplifyConfig);

// Your app code...
```

### Step 4: Verify Configuration

Create a simple test component to verify the configuration:

```typescript
import { getCurrentUser } from 'aws-amplify/auth';
import { useEffect, useState } from 'react';

function ConfigTest() {
  const [status, setStatus] = useState('Checking configuration...');

  useEffect(() => {
    async function checkConfig() {
      try {
        await getCurrentUser();
        setStatus('✓ Configuration successful - User authenticated');
      } catch (error) {
        setStatus('✓ Configuration successful - No user logged in (expected)');
      }
    }
    checkConfig();
  }, []);

  return <div>{status}</div>;
}
```

## Code Examples

### Authentication Example

```typescript
import { signIn, signUp, signOut, getCurrentUser } from 'aws-amplify/auth';

// User Registration
export async function registerUser(email: string, password: string, name: string) {
  try {
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
    
    console.log('Registration successful:', userId);
    return { success: true, userId, needsVerification: !isSignUpComplete };
  } catch (error: any) {
    console.error('Registration failed:', error);
    throw new Error(error.message || 'Registration failed');
  }
}

// User Login
export async function loginUser(email: string, password: string) {
  try {
    const { isSignedIn } = await signIn({
      username: email,
      password,
    });
    
    if (isSignedIn) {
      const user = await getCurrentUser();
      console.log('Login successful:', user.username);
      return { success: true, user };
    }
  } catch (error: any) {
    console.error('Login failed:', error);
    throw new Error(error.message || 'Login failed');
  }
}

// User Logout
export async function logoutUser() {
  try {
    await signOut();
    console.log('Logout successful');
    return { success: true };
  } catch (error: any) {
    console.error('Logout failed:', error);
    throw new Error(error.message || 'Logout failed');
  }
}
```

### API Integration Example

```typescript
import { get, post, put, del } from 'aws-amplify/api';

const API_NAME = 'FarmAPI';

// Create a farm
export async function createFarm(farmData: {
  name: string;
  location: { latitude: number; longitude: number; address: string };
  cropTypes: string[];
  acreage: number;
  soilType: string;
}) {
  try {
    const response = await post({
      apiName: API_NAME,
      path: '/farms',
      options: {
        body: farmData,
      },
    }).response;
    
    const farm = await response.body.json();
    console.log('Farm created:', farm.farmId);
    return farm;
  } catch (error: any) {
    console.error('Failed to create farm:', error);
    throw error;
  }
}

// Get all farms
export async function getFarms() {
  try {
    const response = await get({
      apiName: API_NAME,
      path: '/farms',
    }).response;
    
    const data = await response.body.json();
    return data.farms;
  } catch (error: any) {
    console.error('Failed to fetch farms:', error);
    throw error;
  }
}

// Update a farm
export async function updateFarm(farmId: string, updates: Partial<{
  name: string;
  cropTypes: string[];
  acreage: number;
}>) {
  try {
    const response = await put({
      apiName: API_NAME,
      path: `/farms/${farmId}`,
      options: {
        body: updates,
      },
    }).response;
    
    const farm = await response.body.json();
    console.log('Farm updated:', farm.farmId);
    return farm;
  } catch (error: any) {
    console.error('Failed to update farm:', error);
    throw error;
  }
}

// Delete a farm
export async function deleteFarm(farmId: string) {
  try {
    await del({
      apiName: API_NAME,
      path: `/farms/${farmId}`,
    }).response;
    
    console.log('Farm deleted:', farmId);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete farm:', error);
    throw error;
  }
}
```

### Disease Detection Example

```typescript
import { post, get } from 'aws-amplify/api';
import { uploadData } from 'aws-amplify/storage';

const API_NAME = 'FarmAPI';

// Upload image and trigger disease detection
export async function detectDisease(file: File, farmId: string, cropType: string) {
  try {
    // Step 1: Get pre-signed upload URL
    const urlResponse = await post({
      apiName: API_NAME,
      path: '/images/upload-url',
      options: {
        body: {
          farmId,
          fileName: file.name,
          contentType: file.type,
        },
      },
    }).response;
    
    const { uploadUrl, imageId } = await urlResponse.body.json();
    
    // Step 2: Upload image to S3
    await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });
    
    // Step 3: Trigger disease detection
    const analysisResponse = await post({
      apiName: API_NAME,
      path: '/disease-detection/analyze',
      options: {
        body: {
          imageId,
          farmId,
          cropType,
        },
      },
    }).response;
    
    const analysis = await analysisResponse.body.json();
    console.log('Disease detection complete:', analysis.analysisId);
    return analysis;
  } catch (error: any) {
    console.error('Disease detection failed:', error);
    throw error;
  }
}

// Get disease detection history
export async function getDiseaseHistory(farmId?: string) {
  try {
    const path = farmId 
      ? `/disease-detection/history?farmId=${farmId}`
      : '/disease-detection/history';
    
    const response = await get({
      apiName: API_NAME,
      path,
    }).response;
    
    const data = await response.body.json();
    return data.analyses;
  } catch (error: any) {
    console.error('Failed to fetch disease history:', error);
    throw error;
  }
}
```

### Advisory Chatbot Example

```typescript
import { post, get } from 'aws-amplify/api';

const API_NAME = 'FarmAPI';

// Send message to advisory chatbot
export async function sendChatMessage(message: string, farmId?: string) {
  try {
    const response = await post({
      apiName: API_NAME,
      path: '/advisory/chat',
      options: {
        body: {
          message,
          farmId,
          includeContext: true,
        },
      },
    }).response;
    
    const data = await response.body.json();
    console.log('Chat response received:', data.messageId);
    return data;
  } catch (error: any) {
    console.error('Chat request failed:', error);
    throw error;
  }
}

// Get chat history
export async function getChatHistory(limit: number = 50) {
  try {
    const response = await get({
      apiName: API_NAME,
      path: `/advisory/history?limit=${limit}`,
    }).response;
    
    const data = await response.body.json();
    return data.messages;
  } catch (error: any) {
    console.error('Failed to fetch chat history:', error);
    throw error;
  }
}
```

## WebSocket Connection

### WebSocket Configuration

The WebSocket endpoint is provided in the configuration file:

```json
{
  "websocketEndpoint": "wss://ws-{env}.farmplatform.example.com"
}
```

### WebSocket Client Implementation

```typescript
import config from './config/config.dev.json';

export class RealtimeClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageHandlers: Map<string, (data: any) => void> = new Map();

  constructor(private accessToken: string) {}

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Include access token in connection URL
        const url = `${config.websocketEndpoint}?token=${this.accessToken}`;
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket closed');
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Subscribe to real-time updates for a farm
   */
  subscribe(farmId: string, topics: string[] = ['sensors', 'alerts']) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action: 'subscribe',
        farmId,
        topics,
      }));
      console.log(`Subscribed to topics for farm ${farmId}:`, topics);
    } else {
      console.error('WebSocket not connected');
    }
  }

  /**
   * Unsubscribe from updates
   */
  unsubscribe(farmId: string, topics?: string[]) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action: 'unsubscribe',
        farmId,
        topics,
      }));
      console.log(`Unsubscribed from farm ${farmId}`);
    }
  }

  /**
   * Register a handler for specific message types
   */
  on(messageType: string, handler: (data: any) => void) {
    this.messageHandlers.set(messageType, handler);
  }

  /**
   * Remove a message handler
   */
  off(messageType: string) {
    this.messageHandlers.delete(messageType);
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.messageHandlers.clear();
      console.log('WebSocket disconnected');
    }
  }

  private handleMessage(message: any) {
    const { type, payload } = message;
    
    // Call registered handler for this message type
    const handler = this.messageHandlers.get(type);
    if (handler) {
      handler(payload);
    } else {
      console.log('Unhandled message type:', type);
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(
        this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
        30000
      );
      
      console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
      setTimeout(() => this.connect(), delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }
}
```

### React Hook for Real-time Data

```typescript
import { useState, useEffect, useCallback } from 'react';
import { RealtimeClient } from './RealtimeClient';
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';

interface SensorData {
  deviceId: string;
  sensorType: string;
  value: number;
  unit: string;
  timestamp: string;
}

interface Alert {
  alertId: string;
  type: string;
  severity: string;
  message: string;
  createdAt: string;
}

export function useRealtimeData(farmId: string) {
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [connected, setConnected] = useState(false);
  const [client, setClient] = useState<RealtimeClient | null>(null);

  useEffect(() => {
    let realtimeClient: RealtimeClient | null = null;

    async function initializeWebSocket() {
      try {
        // Get access token
        const session = await fetchAuthSession();
        const accessToken = session.tokens?.accessToken?.toString();
        
        if (!accessToken) {
          console.error('No access token available');
          return;
        }

        // Create and connect client
        realtimeClient = new RealtimeClient(accessToken);
        
        // Register message handlers
        realtimeClient.on('sensor_update', (data: SensorData) => {
          setSensorData((prev) => [...prev.slice(-99), data]); // Keep last 100
        });

        realtimeClient.on('alert', (data: Alert) => {
          setAlerts((prev) => [data, ...prev]);
        });

        // Connect and subscribe
        await realtimeClient.connect();
        realtimeClient.subscribe(farmId, ['sensors', 'alerts']);
        
        setClient(realtimeClient);
        setConnected(true);
      } catch (error) {
        console.error('Failed to initialize WebSocket:', error);
        setConnected(false);
      }
    }

    initializeWebSocket();

    // Cleanup on unmount
    return () => {
      if (realtimeClient) {
        realtimeClient.disconnect();
      }
    };
  }, [farmId]);

  const clearSensorData = useCallback(() => {
    setSensorData([]);
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  return {
    sensorData,
    alerts,
    connected,
    clearSensorData,
    clearAlerts,
  };
}
```

### Usage Example in React Component

```typescript
import React from 'react';
import { useRealtimeData } from './hooks/useRealtimeData';

function FarmDashboard({ farmId }: { farmId: string }) {
  const { sensorData, alerts, connected } = useRealtimeData(farmId);

  return (
    <div>
      <h2>Farm Dashboard</h2>
      
      <div>
        Status: {connected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>

      <div>
        <h3>Recent Sensor Data</h3>
        {sensorData.slice(-5).map((data, index) => (
          <div key={index}>
            {data.sensorType}: {data.value} {data.unit}
            <small> ({new Date(data.timestamp).toLocaleTimeString()})</small>
          </div>
        ))}
      </div>

      <div>
        <h3>Active Alerts</h3>
        {alerts.map((alert) => (
          <div key={alert.alertId} className={`alert-${alert.severity}`}>
            <strong>{alert.type}</strong>: {alert.message}
            <small> ({new Date(alert.createdAt).toLocaleTimeString()})</small>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Testing the Integration

### 1. Test Authentication

```bash
# In your React app directory
npm start

# Navigate to your app and test:
# - User registration
# - Email verification
# - User login
# - User logout
```

### 2. Test API Calls

Use the browser console to test API calls:

```javascript
// Test farm creation
const farm = await createFarm({
  name: "Test Farm",
  location: {
    latitude: 28.6139,
    longitude: 77.2090,
    address: "Test Address"
  },
  cropTypes: ["wheat", "rice"],
  acreage: 10,
  soilType: "loamy"
});
console.log('Created farm:', farm);
```

### 3. Test WebSocket Connection

Check the browser console for WebSocket connection logs:
- "WebSocket connected" - Connection successful
- "Subscribed to topics..." - Subscription successful
- Incoming messages for sensor updates and alerts

### 4. Use Postman Collection

Import the generated Postman collection for comprehensive API testing:

```bash
# Collection location
aws-backend-infrastructure/docs/api/postman-collection.json
```

## Troubleshooting

### Configuration Issues

**Problem**: "Amplify is not configured"
- **Solution**: Ensure `Amplify.configure()` is called before any Amplify API usage
- Verify the configuration file path is correct

**Problem**: "Invalid Cognito User Pool ID"
- **Solution**: Regenerate configuration files after backend deployment
- Check that the correct environment is specified

### Authentication Issues

**Problem**: "User is not authenticated"
- **Solution**: Call `signIn()` before making authenticated API requests
- Check that the JWT token hasn't expired (24-hour validity)

**Problem**: "Password does not meet requirements"
- **Solution**: Ensure password has:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character

### API Issues

**Problem**: "CORS error"
- **Solution**: Verify API Gateway CORS configuration includes your frontend domain
- Check that the request includes proper headers

**Problem**: "401 Unauthorized"
- **Solution**: Ensure user is logged in and token is valid
- Check that the Authorization header is included in requests

### WebSocket Issues

**Problem**: "WebSocket connection failed"
- **Solution**: Verify the WebSocket endpoint URL is correct
- Ensure the access token is valid and included in the connection URL
- Check that the WebSocket API is deployed

**Problem**: "Not receiving real-time updates"
- **Solution**: Verify subscription was successful (check console logs)
- Ensure the farmId is correct
- Check that IoT devices are publishing data

## Next Steps

1. **Install TypeScript types** for type-safe development:
   ```bash
   npm install ../aws-backend-infrastructure/frontend-types
   ```

2. **Review integration examples** in `docs/integration-examples/`

3. **Read the comprehensive guide** at [FRONTEND_INTEGRATION_GUIDE.md](./FRONTEND_INTEGRATION_GUIDE.md)

4. **Test all features** using the testing guide at `docs/TESTING_GUIDE.md`

## Additional Resources

- [AWS Amplify Documentation](https://docs.amplify.aws/)
- [API Documentation](./api/README.md)
- [OpenAPI Specification](./api/openapi.yaml)
- [Integration Examples](./integration-examples/)
- [TypeScript Types Documentation](../frontend-types/README.md)
- [Comprehensive Frontend Integration Guide](./FRONTEND_INTEGRATION_GUIDE.md)

