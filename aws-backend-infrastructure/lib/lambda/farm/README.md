# Farm Management Lambda Functions

This directory contains Lambda functions for managing farm resources in the AI Rural Innovation Platform.

## Functions

### 1. farm-create
**Endpoint**: `POST /farms`  
**Description**: Creates a new farm for the authenticated user.

**Request Body**:
```json
{
  "name": "Green Valley Farm",
  "location": {
    "latitude": 28.6139,
    "longitude": 77.2090,
    "address": "Village Rampur, District Meerut, UP"
  },
  "cropTypes": ["wheat", "rice", "sugarcane"],
  "acreage": 15.5,
  "soilType": "loamy"
}
```

**Response** (201 Created):
```json
{
  "farmId": "uuid-v4",
  "userId": "uuid-v4",
  "name": "Green Valley Farm",
  "location": {...},
  "cropTypes": [...],
  "acreage": 15.5,
  "soilType": "loamy",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Validation**:
- `name`: Required, 1-200 characters
- `location.latitude`: Required, -90 to 90
- `location.longitude`: Required, -180 to 180
- `cropTypes`: Required, array with at least 1 item
- `acreage`: Required, positive number
- `soilType`: Optional string

---

### 2. farm-list
**Endpoint**: `GET /farms`  
**Description**: Retrieves all farms for the authenticated user.

**Query Parameters**:
- `limit` (optional): Number of farms to return (default: 50)
- `nextToken` (optional): Pagination token for next page

**Response** (200 OK):
```json
{
  "farms": [
    {
      "farmId": "uuid-v4",
      "name": "Green Valley Farm",
      "location": {...},
      "cropTypes": [...],
      "acreage": 15.5,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "count": 1,
  "nextToken": "base64-encoded-token"
}
```

**Features**:
- Pagination support
- Filters out soft-deleted farms
- Returns most recent farms first

---

### 3. farm-get
**Endpoint**: `GET /farms/{farmId}`  
**Description**: Retrieves a specific farm by ID.

**Path Parameters**:
- `farmId`: UUID of the farm

**Response** (200 OK):
```json
{
  "farmId": "uuid-v4",
  "userId": "uuid-v4",
  "name": "Green Valley Farm",
  "location": {...},
  "cropTypes": [...],
  "acreage": 15.5,
  "soilType": "loamy",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Error Responses**:
- `400`: Invalid farm ID format
- `403`: User does not own the farm
- `404`: Farm not found or deleted

---

### 4. farm-update
**Endpoint**: `PUT /farms/{farmId}`  
**Description**: Updates an existing farm.

**Path Parameters**:
- `farmId`: UUID of the farm

**Request Body** (all fields optional):
```json
{
  "name": "Green Valley Farm Updated",
  "location": {
    "latitude": 28.6139,
    "longitude": 77.2090,
    "address": "Updated address"
  },
  "cropTypes": ["wheat", "rice", "sugarcane", "corn"],
  "acreage": 16.0,
  "soilType": "clay-loam"
}
```

**Response** (200 OK):
```json
{
  "farmId": "uuid-v4",
  "userId": "uuid-v4",
  "name": "Green Valley Farm Updated",
  "location": {...},
  "cropTypes": [...],
  "acreage": 16.0,
  "soilType": "clay-loam",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-16T14:20:00Z"
}
```

**Features**:
- Partial updates supported
- Ownership verification
- Automatic `updatedAt` timestamp

**Error Responses**:
- `400`: Invalid input or no updates provided
- `403`: User does not own the farm
- `404`: Farm not found or deleted

---

### 5. farm-delete
**Endpoint**: `DELETE /farms/{farmId}`  
**Description**: Soft-deletes a farm by setting the `deletedAt` timestamp.

**Path Parameters**:
- `farmId`: UUID of the farm

**Response** (200 OK):
```json
{
  "message": "Farm deleted successfully",
  "farmId": "uuid-v4",
  "deletedAt": "2024-01-20T09:15:00Z"
}
```

**Features**:
- Soft-delete (data preserved)
- Ownership verification
- Deleted farms excluded from list/get operations

**Error Responses**:
- `400`: Invalid farm ID format
- `403`: User does not own the farm
- `404`: Farm not found or already deleted

---

## Environment Variables

All farm Lambda functions require the following environment variable:

- `FARMS_TABLE`: Name of the DynamoDB table for farms

## Authentication

All endpoints require authentication via JWT token in the `Authorization` header:
```
Authorization: Bearer <jwt-token>
```

The user ID is extracted from the JWT token by the API Gateway authorizer.

## Database Schema

**Table**: `{env}-farms`

**Partition Key**: `userId` (String)  
**Sort Key**: `farmId` (String)

**GSI-1**: 
- Partition Key: `farmId`
- Purpose: Direct farm lookup by ID

**Attributes**:
- `userId`: String (UUID)
- `farmId`: String (UUID)
- `name`: String
- `location`: Map (latitude, longitude, address)
- `cropTypes`: List<String>
- `acreage`: Number
- `soilType`: String (optional)
- `deletedAt`: String (ISO 8601, nullable)
- `createdAt`: String (ISO 8601)
- `updatedAt`: String (ISO 8601)

## Error Handling

All functions follow standardized error response format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {...},
    "requestId": "uuid-v4",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

## Logging

All functions log the following information:
- Request ID
- User ID
- Farm ID (where applicable)
- Operation result (success/failure)
- Error details (on failure)

## Dependencies

- `@aws-sdk/client-dynamodb`: DynamoDB client
- `@aws-sdk/lib-dynamodb`: DynamoDB document client
- `zod`: Schema validation
- Shared utilities from `../shared`

## Testing

Each function includes a `package.json` with test scripts:

```bash
npm test        # Run tests
npm run build   # Build TypeScript
```

## Requirements Mapping

These Lambda functions implement **Requirement 3.2** from the requirements document:
- Farm CRUD operations
- User ownership verification
- Soft-delete functionality
- Pagination support
