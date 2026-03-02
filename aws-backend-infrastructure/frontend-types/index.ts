/**
 * TypeScript Type Definitions for AWS Backend Infrastructure
 * 
 * This file contains all the TypeScript interfaces and types for the
 * AI Rural Innovation Platform backend API.
 * 
 * Generated for frontend integration.
 */

// ============================================================================
// Common Types
// ============================================================================

export interface ApiResponse<T> {
    data?: T;
    error?: ApiError;
}

export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, any>;
    requestId: string;
    timestamp: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    count: number;
    nextToken?: string;
}

export interface Location {
    latitude: number;
    longitude: number;
    address: string;
}

// ============================================================================
// Authentication Types
// ============================================================================

export interface RegisterRequest {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role: 'farmer' | 'advisor' | 'admin';
}

export interface RegisterResponse {
    userId: string;
    email: string;
    message: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    userId: string;
    role: 'farmer' | 'advisor' | 'admin';
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface RefreshTokenResponse {
    accessToken: string;
    expiresIn: number;
}

// ============================================================================
// User Types
// ============================================================================

export interface User {
    userId: string;
    email: string;
    name: string;
    phone?: string;
    role: 'farmer' | 'advisor' | 'admin';
    preferences: UserPreferences;
    createdAt: string;
    updatedAt: string;
}

export interface UserPreferences {
    language: string;
    notifications: {
        email: boolean;
        sms: boolean;
        push: boolean;
    };
}

// ============================================================================
// Farm Types
// ============================================================================

export interface Farm {
    farmId: string;
    userId: string;
    name: string;
    location: Location;
    cropTypes: string[];
    acreage: number;
    soilType: string;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;
}

export interface CreateFarmRequest {
    name: string;
    location: Location;
    cropTypes: string[];
    acreage: number;
    soilType: string;
}

export interface UpdateFarmRequest {
    name?: string;
    location?: Location;
    cropTypes?: string[];
    acreage?: number;
    soilType?: string;
}

export interface FarmListResponse {
    farms: Farm[];
    count: number;
}

// ============================================================================
// Image and Disease Detection Types
// ============================================================================

export interface Image {
    imageId: string;
    userId: string;
    farmId: string;
    s3Key: string;
    s3Bucket: string;
    fileName: string;
    contentType: string;
    fileSize: number;
    uploadedAt: string;
    status: 'uploaded' | 'processing' | 'analyzed' | 'failed';
}

export interface UploadUrlRequest {
    farmId: string;
    fileName: string;
    contentType: string;
}

export interface UploadUrlResponse {
    uploadUrl: string;
    imageId: string;
    expiresIn: number;
}

export interface DiseaseDetectionRequest {
    imageId: string;
    farmId: string;
    cropType: string;
}

export interface DiseaseResult {
    diseaseName: string;
    confidence: number;
    severity: 'low' | 'moderate' | 'high' | 'critical';
    affectedArea: string;
    recommendations: string[];
}

export interface DiseaseAnalysis {
    analysisId: string;
    imageId: string;
    userId: string;
    farmId: string;
    cropType: string;
    results: DiseaseResult[];
    isUncertain: boolean;
    modelVersion: string;
    processingTimeMs: number;
    analyzedAt: string;
}

export interface DiseaseDetectionResponse {
    analysisId: string;
    imageId: string;
    results: DiseaseResult[];
    isUncertain: boolean;
    analyzedAt: string;
    processingTimeMs: number;
}

export interface DiseaseHistoryResponse {
    analyses: Array<{
        analysisId: string;
        imageId: string;
        farmId: string;
        diseaseName: string;
        confidence: number;
        analyzedAt: string;
    }>;
    count: number;
    nextToken?: string;
}

// ============================================================================
// Market Price Types
// ============================================================================

export interface MarketLocation {
    name: string;
    latitude: number;
    longitude: number;
    distance?: number;
}

export interface MarketPrice {
    priceId: string;
    commodity: string;
    price: number;
    unit: string;
    marketLocation: MarketLocation;
    timestamp: string;
    isStale: boolean;
}

export interface MarketPricesResponse {
    prices: MarketPrice[];
    count: number;
    lastUpdated: string;
}

export interface PriceHistory {
    price: number;
    timestamp: string;
}

export interface CommodityPriceResponse {
    commodity: string;
    currentPrice: number;
    unit: string;
    priceHistory: PriceHistory[];
    trend: 'increasing' | 'decreasing' | 'stable';
    changePercent: number;
}

// ============================================================================
// Resource Optimization Types
// ============================================================================

export interface OptimizationRequest {
    farmId: string;
    optimizationType: 'water' | 'fertilizer' | 'schedule';
    parameters: {
        cropType: string;
        currentStage: string;
        soilMoisture?: number;
        weatherForecast?: string;
        [key: string]: any;
    };
}

export interface IrrigationSchedule {
    time: string;
    duration: number;
    unit: string;
}

export interface EstimatedSavings {
    water?: number;
    fertilizer?: number;
    unit: string;
    costSavings: number;
    currency: string;
}

export interface OptimizationRecommendations {
    dailyWaterRequirement?: number;
    unit?: string;
    irrigationSchedule?: IrrigationSchedule[];
    fertilizerAmount?: number;
    fertilizerType?: string;
    applicationSchedule?: string[];
    estimatedSavings: EstimatedSavings;
}

export interface Optimization {
    optimizationId: string;
    farmId: string;
    userId: string;
    type: 'water' | 'fertilizer' | 'schedule';
    parameters: Record<string, any>;
    recommendations: OptimizationRecommendations;
    estimatedSavings: EstimatedSavings;
    calculatedAt: string;
}

export interface OptimizationResponse {
    optimizationId: string;
    farmId: string;
    type: 'water' | 'fertilizer' | 'schedule';
    recommendations: OptimizationRecommendations;
    calculatedAt: string;
}

export interface OptimizationHistoryResponse {
    optimizations: Array<{
        optimizationId: string;
        type: string;
        estimatedSavings: EstimatedSavings;
        calculatedAt: string;
    }>;
    count: number;
}

// ============================================================================
// Advisory Chat Types
// ============================================================================

export interface ChatMessageRequest {
    message: string;
    farmId?: string;
    includeContext: boolean;
}

export interface ChatRecommendation {
    type: string;
    action: string;
    timeframe: string;
}

export interface ChatMessageResponse {
    messageId: string;
    response: string;
    recommendations: ChatRecommendation[];
    sources: string[];
    timestamp: string;
    processingTimeMs: number;
}

export interface ChatMessage {
    messageId: string;
    userId: string;
    farmId?: string;
    role: 'user' | 'assistant';
    content: string;
    metadata?: {
        sources?: string[];
        recommendations?: ChatRecommendation[];
        processingTimeMs?: number;
    };
    timestamp: string;
}

export interface ChatHistoryResponse {
    messages: Array<{
        messageId: string;
        role: 'user' | 'assistant';
        content: string;
        timestamp: string;
    }>;
    count: number;
    hasMore: boolean;
}

// ============================================================================
// IoT Sensor Types
// ============================================================================

export interface SensorData {
    deviceId: string;
    farmId: string;
    userId: string;
    sensorType: 'temperature' | 'humidity' | 'soil_moisture' | 'ph' | 'light_intensity';
    value: number;
    unit: string;
    timestamp: string;
}

export interface SensorDataResponse {
    data: SensorData[];
    count: number;
    aggregation: 'raw' | 'hourly' | 'daily';
}

export interface SensorStatistics {
    min: number;
    max: number;
    avg: number;
    period: string;
}

export interface SensorDevice {
    deviceId: string;
    farmId: string;
    sensorType: string;
    status: 'active' | 'inactive' | 'offline';
    lastReading: {
        value: number;
        unit: string;
        timestamp: string;
    };
    statistics: SensorStatistics;
}

// ============================================================================
// Alert Types
// ============================================================================

export interface Alert {
    alertId: string;
    userId: string;
    farmId: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    status: 'active' | 'acknowledged' | 'resolved';
    metadata?: Record<string, any>;
    createdAt: string;
    acknowledgedAt?: string;
    acknowledgedBy?: string;
    note?: string;
    resolvedAt?: string;
}

export interface AlertsResponse {
    alerts: Alert[];
    count: number;
}

export interface AcknowledgeAlertRequest {
    note?: string;
}

export interface AcknowledgeAlertResponse {
    alertId: string;
    status: 'acknowledged';
    acknowledgedAt: string;
    acknowledgedBy: string;
    note?: string;
}

// ============================================================================
// WebSocket Types
// ============================================================================

export interface WebSocketMessage {
    type: 'sensor_update' | 'alert' | 'notification' | 'connection' | 'error';
    payload: any;
    timestamp: string;
}

export interface WebSocketSubscribeMessage {
    action: 'subscribe';
    farmId: string;
    topics: Array<'sensors' | 'alerts' | 'notifications'>;
}

export interface WebSocketUnsubscribeMessage {
    action: 'unsubscribe';
    farmId: string;
    topics: Array<'sensors' | 'alerts' | 'notifications'>;
}

// ============================================================================
// Error Codes
// ============================================================================

export enum ErrorCode {
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    UNAUTHORIZED = 'UNAUTHORIZED',
    FORBIDDEN = 'FORBIDDEN',
    NOT_FOUND = 'NOT_FOUND',
    CONFLICT = 'CONFLICT',
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
    GATEWAY_TIMEOUT = 'GATEWAY_TIMEOUT',
}

// ============================================================================
// API Client Helper Types
// ============================================================================

export interface ApiClientConfig {
    baseUrl: string;
    region: string;
    getAuthToken: () => Promise<string | null>;
}

export interface RequestOptions {
    headers?: Record<string, string>;
    queryParams?: Record<string, string | number | boolean>;
    body?: any;
}
