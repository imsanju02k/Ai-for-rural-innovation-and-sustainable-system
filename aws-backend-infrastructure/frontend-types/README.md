# AI Rural Platform - TypeScript Types

TypeScript type definitions for the AI Rural Innovation Platform backend API.

## Installation

### Option 1: Local Package (Recommended for Development)

```bash
# In your frontend project
npm install ../aws-backend-infrastructure/frontend-types
```

### Option 2: Copy Types Directly

Copy the `index.ts` file to your frontend project:

```bash
cp aws-backend-infrastructure/frontend-types/index.ts frontend/src/types/api.ts
```

## Usage

```typescript
import {
  Farm,
  CreateFarmRequest,
  DiseaseDetectionResponse,
  MarketPrice,
  ChatMessageRequest,
  SensorData,
  Alert,
} from '@ai-rural-platform/types';

// Use types in your API calls
async function createFarm(data: CreateFarmRequest): Promise<Farm> {
  const response = await fetch('/api/farms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

// Type-safe state management
interface AppState {
  farms: Farm[];
  alerts: Alert[];
  sensorData: SensorData[];
}
```

## Available Types

### Authentication
- `RegisterRequest`, `RegisterResponse`
- `LoginRequest`, `LoginResponse`
- `RefreshTokenRequest`, `RefreshTokenResponse`

### Farm Management
- `Farm`, `CreateFarmRequest`, `UpdateFarmRequest`
- `FarmListResponse`

### Disease Detection
- `Image`, `UploadUrlRequest`, `UploadUrlResponse`
- `DiseaseDetectionRequest`, `DiseaseDetectionResponse`
- `DiseaseResult`, `DiseaseAnalysis`

### Market Prices
- `MarketPrice`, `MarketPricesResponse`
- `CommodityPriceResponse`, `PriceHistory`

### Resource Optimization
- `OptimizationRequest`, `OptimizationResponse`
- `Optimization`, `OptimizationRecommendations`

### Advisory Chat
- `ChatMessageRequest`, `ChatMessageResponse`
- `ChatMessage`, `ChatHistoryResponse`

### IoT Sensors
- `SensorData`, `SensorDevice`
- `SensorDataResponse`, `SensorStatistics`

### Alerts
- `Alert`, `AlertsResponse`
- `AcknowledgeAlertRequest`, `AcknowledgeAlertResponse`

### WebSocket
- `WebSocketMessage`, `WebSocketSubscribeMessage`

## Building

```bash
npm run build
```

This will generate JavaScript files and type declarations in the `dist` directory.

## License

MIT
