#!/usr/bin/env node
/**
 * Generate OpenAPI Specification
 * 
 * This script generates a complete OpenAPI 3.0 specification for the API
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

const openApiSpec = {
    openapi: '3.0.3',
    info: {
        title: 'AI Rural Innovation Platform API',
        description: `RESTful API for the AI Rural Innovation Platform backend infrastructure.
    
This API provides endpoints for:
- User authentication and authorization
- Farm management
- Disease detection using AI
- Market price predictions
- Resource optimization recommendations
- Advisory chatbot
- IoT sensor data management
- Alert notifications`,
        version: '1.0.0',
        contact: {
            name: 'API Support',
            email: 'support@farmplatform.example.com',
        },
        license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT',
        },
    },
    servers: [
        {
            url: 'https://api.farmplatform.example.com',
            description: 'Production server',
        },
        {
            url: 'https://api-staging.farmplatform.example.com',
            description: 'Staging server',
        },
        {
            url: 'https://api-dev.farmplatform.example.com',
            description: 'Development server',
        },
    ],
    tags: [
        { name: 'Authentication', description: 'User authentication and authorization' },
        { name: 'Farms', description: 'Farm management operations' },
        { name: 'Disease Detection', description: 'Crop disease detection using AI' },
        { name: 'Market Prices', description: 'Market price data and predictions' },
        { name: 'Optimization', description: 'Resource optimization recommendations' },
        { name: 'Advisory', description: 'AI-powered advisory chatbot' },
        { name: 'Sensors', description: 'IoT sensor data management' },
        { name: 'Alerts', description: 'Alert notifications and management' },
    ],
    security: [{ BearerAuth: [] }],
    paths: {
        '/auth/register': {
            post: {
                tags: ['Authentication'],
                summary: 'Register a new user',
                description: 'Create a new user account with email and password',
                security: [],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/RegisterRequest' },
                            example: {
                                email: 'farmer@example.com',
                                password: 'SecurePass123!',
                                name: 'John Farmer',
                                phone: '+1234567890',
                                role: 'farmer',
                            },
                        },
                    },
                },
                responses: {
                    '201': {
                        description: 'User registered successfully',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/RegisterResponse' },
                            },
                        },
                    },
                    '400': { $ref: '#/components/responses/BadRequest' },
                    '409': { $ref: '#/components/responses/Conflict' },
                },
            },
        },
        '/auth/login': {
            post: {
                tags: ['Authentication'],
                summary: 'Login user',
                description: 'Authenticate user and return JWT tokens',
                security: [],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/LoginRequest' },
                            example: {
                                email: 'farmer@example.com',
                                password: 'SecurePass123!',
                            },
                        },
                    },
                },
                responses: {
                    '200': {
                        description: 'Login successful',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/LoginResponse' },
                            },
                        },
                    },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                },
            },
        },
        '/farms': {
            get: {
                tags: ['Farms'],
                summary: 'List all farms',
                description: 'Get all farms for the authenticated user',
                responses: {
                    '200': {
                        description: 'List of farms',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/FarmListResponse' },
                            },
                        },
                    },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                },
            },
            post: {
                tags: ['Farms'],
                summary: 'Create a new farm',
                description: 'Create a new farm profile',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/CreateFarmRequest' },
                        },
                    },
                },
                responses: {
                    '201': {
                        description: 'Farm created successfully',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Farm' },
                            },
                        },
                    },
                    '400': { $ref: '#/components/responses/BadRequest' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                },
            },
        },
        '/disease-detection/analyze': {
            post: {
                tags: ['Disease Detection'],
                summary: 'Analyze image for diseases',
                description: 'Analyze an uploaded image for crop diseases using AI',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/DiseaseDetectionRequest' },
                        },
                    },
                },
                responses: {
                    '200': {
                        description: 'Analysis complete',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/DiseaseDetectionResponse' },
                            },
                        },
                    },
                    '400': { $ref: '#/components/responses/BadRequest' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '503': { $ref: '#/components/responses/ServiceUnavailable' },
                },
            },
        },
        '/market-prices': {
            get: {
                tags: ['Market Prices'],
                summary: 'Get market prices',
                description: 'Retrieve current market prices for commodities',
                parameters: [
                    {
                        name: 'commodity',
                        in: 'query',
                        schema: { type: 'string' },
                        description: 'Filter by commodity name',
                    },
                ],
                responses: {
                    '200': {
                        description: 'Market prices retrieved',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/MarketPricesResponse' },
                            },
                        },
                    },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                },
            },
        },
        '/advisory/chat': {
            post: {
                tags: ['Advisory'],
                summary: 'Send chat message',
                description: 'Send a message to the AI advisory chatbot',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ChatMessageRequest' },
                        },
                    },
                },
                responses: {
                    '200': {
                        description: 'Chat response',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ChatMessageResponse' },
                            },
                        },
                    },
                    '400': { $ref: '#/components/responses/BadRequest' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '429': { $ref: '#/components/responses/RateLimitExceeded' },
                },
            },
        },
    },
    components: {
        securitySchemes: {
            BearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        },
        schemas: {
            RegisterRequest: {
                type: 'object',
                required: ['email', 'password', 'name', 'role'],
                properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 8 },
                    name: { type: 'string' },
                    phone: { type: 'string' },
                    role: { type: 'string', enum: ['farmer', 'advisor', 'admin'] },
                },
            },
            RegisterResponse: {
                type: 'object',
                properties: {
                    userId: { type: 'string', format: 'uuid' },
                    email: { type: 'string' },
                    message: { type: 'string' },
                },
            },
            LoginRequest: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string' },
                },
            },
            LoginResponse: {
                type: 'object',
                properties: {
                    accessToken: { type: 'string' },
                    refreshToken: { type: 'string' },
                    expiresIn: { type: 'integer' },
                    userId: { type: 'string', format: 'uuid' },
                    role: { type: 'string' },
                },
            },
            Farm: {
                type: 'object',
                properties: {
                    farmId: { type: 'string', format: 'uuid' },
                    userId: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    location: { $ref: '#/components/schemas/Location' },
                    cropTypes: { type: 'array', items: { type: 'string' } },
                    acreage: { type: 'number' },
                    soilType: { type: 'string' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                },
            },
            CreateFarmRequest: {
                type: 'object',
                required: ['name', 'location', 'cropTypes', 'acreage'],
                properties: {
                    name: { type: 'string' },
                    location: { $ref: '#/components/schemas/Location' },
                    cropTypes: { type: 'array', items: { type: 'string' } },
                    acreage: { type: 'number' },
                    soilType: { type: 'string' },
                },
            },
            FarmListResponse: {
                type: 'object',
                properties: {
                    farms: { type: 'array', items: { $ref: '#/components/schemas/Farm' } },
                    count: { type: 'integer' },
                },
            },
            Location: {
                type: 'object',
                required: ['latitude', 'longitude', 'address'],
                properties: {
                    latitude: { type: 'number', minimum: -90, maximum: 90 },
                    longitude: { type: 'number', minimum: -180, maximum: 180 },
                    address: { type: 'string' },
                },
            },
            DiseaseDetectionRequest: {
                type: 'object',
                required: ['imageId', 'farmId', 'cropType'],
                properties: {
                    imageId: { type: 'string', format: 'uuid' },
                    farmId: { type: 'string', format: 'uuid' },
                    cropType: { type: 'string' },
                },
            },
            DiseaseDetectionResponse: {
                type: 'object',
                properties: {
                    analysisId: { type: 'string', format: 'uuid' },
                    imageId: { type: 'string', format: 'uuid' },
                    results: { type: 'array', items: { $ref: '#/components/schemas/DiseaseResult' } },
                    isUncertain: { type: 'boolean' },
                    analyzedAt: { type: 'string', format: 'date-time' },
                    processingTimeMs: { type: 'integer' },
                },
            },
            DiseaseResult: {
                type: 'object',
                properties: {
                    diseaseName: { type: 'string' },
                    confidence: { type: 'number', minimum: 0, maximum: 1 },
                    severity: { type: 'string', enum: ['low', 'moderate', 'high', 'critical'] },
                    affectedArea: { type: 'string' },
                    recommendations: { type: 'array', items: { type: 'string' } },
                },
            },
            MarketPricesResponse: {
                type: 'object',
                properties: {
                    prices: { type: 'array', items: { $ref: '#/components/schemas/MarketPrice' } },
                    count: { type: 'integer' },
                    lastUpdated: { type: 'string', format: 'date-time' },
                },
            },
            MarketPrice: {
                type: 'object',
                properties: {
                    priceId: { type: 'string', format: 'uuid' },
                    commodity: { type: 'string' },
                    price: { type: 'number' },
                    unit: { type: 'string' },
                    marketLocation: { $ref: '#/components/schemas/MarketLocation' },
                    timestamp: { type: 'string', format: 'date-time' },
                    isStale: { type: 'boolean' },
                },
            },
            MarketLocation: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    latitude: { type: 'number' },
                    longitude: { type: 'number' },
                    distance: { type: 'number' },
                },
            },
            ChatMessageRequest: {
                type: 'object',
                required: ['message', 'includeContext'],
                properties: {
                    message: { type: 'string' },
                    farmId: { type: 'string', format: 'uuid' },
                    includeContext: { type: 'boolean' },
                },
            },
            ChatMessageResponse: {
                type: 'object',
                properties: {
                    messageId: { type: 'string', format: 'uuid' },
                    response: { type: 'string' },
                    recommendations: { type: 'array', items: { $ref: '#/components/schemas/ChatRecommendation' } },
                    sources: { type: 'array', items: { type: 'string' } },
                    timestamp: { type: 'string', format: 'date-time' },
                    processingTimeMs: { type: 'integer' },
                },
            },
            ChatRecommendation: {
                type: 'object',
                properties: {
                    type: { type: 'string' },
                    action: { type: 'string' },
                    timeframe: { type: 'string' },
                },
            },
            ApiError: {
                type: 'object',
                properties: {
                    error: {
                        type: 'object',
                        properties: {
                            code: { type: 'string' },
                            message: { type: 'string' },
                            details: { type: 'object' },
                            requestId: { type: 'string' },
                            timestamp: { type: 'string', format: 'date-time' },
                        },
                    },
                },
            },
        },
        responses: {
            BadRequest: {
                description: 'Bad Request - Invalid input parameters',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ApiError' },
                        example: {
                            error: {
                                code: 'VALIDATION_ERROR',
                                message: 'Invalid farm coordinates',
                                details: {
                                    field: 'location.latitude',
                                    value: 95.0,
                                    constraint: 'Must be between -90 and 90',
                                },
                                requestId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
                                timestamp: '2024-01-15T10:30:00Z',
                            },
                        },
                    },
                },
            },
            Unauthorized: {
                description: 'Unauthorized - Missing or invalid authentication',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ApiError' },
                    },
                },
            },
            Forbidden: {
                description: 'Forbidden - Insufficient permissions',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ApiError' },
                    },
                },
            },
            NotFound: {
                description: 'Not Found - Resource does not exist',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ApiError' },
                    },
                },
            },
            Conflict: {
                description: 'Conflict - Resource already exists',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ApiError' },
                    },
                },
            },
            RateLimitExceeded: {
                description: 'Too Many Requests - Rate limit exceeded',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ApiError' },
                    },
                },
            },
            ServiceUnavailable: {
                description: 'Service Unavailable - External service unavailable',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ApiError' },
                    },
                },
            },
        },
    },
};

// Generate YAML file
const outputDir = path.join(__dirname, '..', 'docs', 'api');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const yamlContent = yaml.dump(openApiSpec, { lineWidth: -1 });
fs.writeFileSync(path.join(outputDir, 'openapi.yaml'), yamlContent);

// Generate JSON file
fs.writeFileSync(
    path.join(outputDir, 'openapi.json'),
    JSON.stringify(openApiSpec, null, 2)
);

console.log('✅ OpenAPI specification generated successfully!');
console.log(`📁 YAML: ${path.join(outputDir, 'openapi.yaml')}`);
console.log(`📁 JSON: ${path.join(outputDir, 'openapi.json')}`);
