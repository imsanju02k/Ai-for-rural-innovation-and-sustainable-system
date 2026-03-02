# Integration Example: User Registration and Login

This example demonstrates the complete user registration and login flow.

## Prerequisites

- API endpoint URL
- Valid email address
- Strong password (min 8 chars, uppercase, lowercase, number, special character)

## Step 1: Register a New User

### Request

```bash
curl -X POST https://api-dev.farmplatform.example.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "farmer@example.com",
    "password": "SecurePass123!",
    "name": "John Farmer",
    "phone": "+1234567890",
    "role": "farmer"
  }'
```

### Response (201 Created)

```json
{
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "email": "farmer@example.com",
  "message": "Verification email sent"
}
```

### TypeScript Example

```typescript
import { RegisterRequest, RegisterResponse } from '@ai-rural-platform/types';

async function registerUser(data: RegisterRequest): Promise<RegisterResponse> {
  const response = await fetch('https://api-dev.farmplatform.example.com/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message);
  }

  return response.json();
}

// Usage
const result = await registerUser({
  email: 'farmer@example.com',
  password: 'SecurePass123!',
  name: 'John Farmer',
  phone: '+1234567890',
  role: 'farmer',
});

console.log('User registered:', result.userId);
```

### React Example

```tsx
import React, { useState } from 'react';
import { RegisterRequest } from '@ai-rural-platform/types';

function RegisterForm() {
  const [formData, setFormData] = useState<RegisterRequest>({
    email: '',
    password: '',
    name: '',
    phone: '',
    role: 'farmer',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error.message);
      }

      const result = await response.json();
      console.log('Registration successful:', result);
      // Redirect to login or verification page
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        required
      />
      <input
        type="text"
        placeholder="Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Registering...' : 'Register'}
      </button>
      {error && <div className="error">{error}</div>}
    </form>
  );
}
```

## Step 2: Login

### Request

```bash
curl -X POST https://api-dev.farmplatform.example.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "farmer@example.com",
    "password": "SecurePass123!"
  }'
```

### Response (200 OK)

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "role": "farmer"
}
```

### TypeScript Example

```typescript
import { LoginRequest, LoginResponse } from '@ai-rural-platform/types';

async function loginUser(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await fetch('https://api-dev.farmplatform.example.com/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message);
  }

  const result = await response.json();
  
  // Store tokens securely
  localStorage.setItem('accessToken', result.accessToken);
  localStorage.setItem('refreshToken', result.refreshToken);
  localStorage.setItem('userId', result.userId);
  
  return result;
}

// Usage
const loginResult = await loginUser({
  email: 'farmer@example.com',
  password: 'SecurePass123!',
});

console.log('Login successful:', loginResult.userId);
```

### React with Context Example

```tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { LoginResponse } from '@ai-rural-platform/types';

interface AuthContextType {
  user: LoginResponse | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<LoginResponse | null>(null);

  useEffect(() => {
    // Check for existing token on mount
    const token = localStorage.getItem('accessToken');
    const userId = localStorage.getItem('userId');
    if (token && userId) {
      // Validate token and restore user session
      // This is simplified - you should validate the token
      setUser({
        accessToken: token,
        refreshToken: localStorage.getItem('refreshToken') || '',
        expiresIn: 3600,
        userId,
        role: 'farmer',
      });
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error.message);
    }

    const result = await response.json();
    
    localStorage.setItem('accessToken', result.accessToken);
    localStorage.setItem('refreshToken', result.refreshToken);
    localStorage.setItem('userId', result.userId);
    
    setUser(result);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
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

// Usage in a component
function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      // Redirect to dashboard
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit">Login</button>
    </form>
  );
}
```

## Step 3: Using the Access Token

Once logged in, include the access token in all API requests:

```typescript
async function makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('accessToken');
  
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 401) {
    // Token expired, try to refresh
    await refreshToken();
    // Retry the request
    return makeAuthenticatedRequest(endpoint, options);
  }

  return response;
}
```

## Step 4: Token Refresh

```typescript
async function refreshToken(): Promise<void> {
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    // Refresh failed, logout user
    localStorage.clear();
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  const result = await response.json();
  localStorage.setItem('accessToken', result.accessToken);
}
```

## Error Handling

```typescript
interface ApiError {
  error: {
    code: string;
    message: string;
    details?: any;
    requestId: string;
    timestamp: string;
  };
}

async function handleApiError(response: Response): Promise<never> {
  const error: ApiError = await response.json();
  
  switch (error.error.code) {
    case 'VALIDATION_ERROR':
      throw new Error(`Validation failed: ${error.error.message}`);
    case 'UNAUTHORIZED':
      // Redirect to login
      window.location.href = '/login';
      throw new Error('Please login to continue');
    case 'RATE_LIMIT_EXCEEDED':
      throw new Error('Too many requests. Please try again later.');
    default:
      throw new Error(error.error.message || 'An error occurred');
  }
}
```

## Complete Flow Example

```typescript
async function completeAuthFlow() {
  try {
    // 1. Register
    const registerResult = await registerUser({
      email: 'farmer@example.com',
      password: 'SecurePass123!',
      name: 'John Farmer',
      role: 'farmer',
    });
    console.log('Registered:', registerResult.userId);

    // 2. Login
    const loginResult = await loginUser({
      email: 'farmer@example.com',
      password: 'SecurePass123!',
    });
    console.log('Logged in:', loginResult.userId);

    // 3. Make authenticated request
    const farms = await makeAuthenticatedRequest('/api/farms');
    console.log('Farms:', await farms.json());

  } catch (error) {
    console.error('Auth flow failed:', error);
  }
}
```
