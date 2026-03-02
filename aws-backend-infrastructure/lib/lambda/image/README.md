# Image Processing Lambda Functions

This directory contains Lambda functions for handling image uploads, processing, and downloads for the AI Rural Innovation Platform.

## Functions

### 1. image-upload-url

**Purpose**: Generates pre-signed S3 upload URLs for image uploads.

**Trigger**: API Gateway (POST /images/upload-url)

**Functionality**:
- Validates request parameters (farmId, fileName, contentType)
- Verifies file type is JPEG, PNG, or HEIC
- Generates unique imageId
- Creates pre-signed S3 upload URL with 15-minute expiry
- Stores image metadata in DynamoDB Images table
- Returns upload URL and imageId to client

**Environment Variables**:
- `IMAGES_TABLE`: DynamoDB table name for image metadata
- `S3_BUCKET`: S3 bucket name for image storage

**Request Format**:
```json
{
  "farmId": "uuid-v4",
  "fileName": "crop_disease_photo.jpg",
  "contentType": "image/jpeg"
}
```

**Response Format**:
```json
{
  "uploadUrl": "https://s3.amazonaws.com/...",
  "imageId": "uuid-v4",
  "expiresIn": 900
}
```

**Requirements**: 4.2, 4.3, 4.5

---

### 2. image-process

**Purpose**: Processes S3 upload events to validate and update image metadata.

**Trigger**: S3 ObjectCreated event

**Functionality**:
- Triggered automatically when image is uploaded to S3
- Validates uploaded image file size (max 10MB)
- Validates content type
- Updates image metadata with actual file size
- Updates image status in DynamoDB (processing/failed)
- Logs errors for failed uploads

**Environment Variables**:
- `IMAGES_TABLE`: DynamoDB table name for image metadata

**Processing Flow**:
1. Receive S3 event notification
2. Get file metadata from S3 (size, content type)
3. Validate file size (max 10MB)
4. Validate content type (JPEG, PNG, HEIC)
5. Update DynamoDB with file size and status
6. Log success or failure

**Requirements**: 4.4, 4.5

---

### 3. image-download-url

**Purpose**: Generates pre-signed S3 download URLs for images.

**Trigger**: API Gateway (GET /images/{imageId}/download-url)

**Functionality**:
- Validates imageId parameter
- Retrieves image metadata from DynamoDB
- Verifies user ownership
- Checks image status (must not be 'failed')
- Generates pre-signed S3 download URL with 5-minute expiry
- Returns download URL and image metadata

**Environment Variables**:
- `IMAGES_TABLE`: DynamoDB table name for image metadata

**Path Parameters**:
- `imageId`: UUID of the image

**Response Format**:
```json
{
  "downloadUrl": "https://s3.amazonaws.com/...",
  "imageId": "uuid-v4",
  "fileName": "crop_disease_photo.jpg",
  "contentType": "image/jpeg",
  "fileSize": 2048576,
  "expiresIn": 300
}
```

**Requirements**: 4.8

---

## Data Flow

### Upload Flow
```
Client → API Gateway → image-upload-url Lambda
                           ↓
                    Generate pre-signed URL
                           ↓
                    Store metadata in DynamoDB
                           ↓
                    Return URL to client
                           ↓
Client uploads directly to S3 using pre-signed URL
                           ↓
                    S3 triggers image-process Lambda
                           ↓
                    Validate and update metadata
```

### Download Flow
```
Client → API Gateway → image-download-url Lambda
                           ↓
                    Retrieve metadata from DynamoDB
                           ↓
                    Verify ownership
                           ↓
                    Generate pre-signed URL
                           ↓
                    Return URL to client
                           ↓
Client downloads directly from S3 using pre-signed URL
```

## S3 Bucket Structure

Images are stored in S3 with the following key structure:
```
/{userId}/{farmId}/{timestamp}_{imageId}.{extension}

Example:
/a1b2c3d4-e5f6-7890-abcd-ef1234567890/f9e8d7c6-b5a4-3210-fedc-ba0987654321/2024-01-15T10-30-45-123Z_img123.jpg
```

## DynamoDB Schema

**Images Table**:
- Partition Key: `userId` (String)
- Sort Key: `imageId` (String)
- Attributes:
  - `farmId`: String (UUID)
  - `s3Key`: String
  - `s3Bucket`: String
  - `fileName`: String
  - `contentType`: String
  - `fileSize`: Number
  - `uploadedAt`: String (ISO 8601)
  - `status`: String (uploaded|processing|analyzed|failed)
  - `errorMessage`: String (optional)
  - `updatedAt`: String (ISO 8601)

## Error Handling

All functions implement comprehensive error handling:
- Input validation errors (400)
- Authentication errors (401)
- Authorization errors (403)
- Not found errors (404)
- Internal server errors (500)

Errors are logged with context for debugging and monitoring.

## Security

- All functions require authentication via JWT tokens
- User ownership is verified before generating download URLs
- Pre-signed URLs have short expiry times (5-15 minutes)
- S3 bucket policies restrict access to authorized users
- File type and size validation prevents malicious uploads

## Testing

Unit tests should cover:
- Request validation
- File type validation
- File size validation
- Pre-signed URL generation
- User ownership verification
- Error handling scenarios

Integration tests should verify:
- End-to-end upload flow
- S3 trigger processing
- Download URL generation
- DynamoDB updates

## Dependencies

- `@aws-sdk/client-s3`: S3 operations
- `@aws-sdk/s3-request-presigner`: Pre-signed URL generation
- `@aws-sdk/client-dynamodb`: DynamoDB operations
- `@aws-sdk/lib-dynamodb`: DynamoDB Document Client
- `uuid`: UUID generation
- `zod`: Schema validation

## Future Enhancements

- Automatic image optimization (resize, compress)
- Thumbnail generation
- Image format conversion
- Virus scanning
- Automatic disease detection trigger
- Image metadata extraction (EXIF data)
