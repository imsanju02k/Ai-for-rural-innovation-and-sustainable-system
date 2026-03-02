/**
 * Test data generators for creating mock data
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a mock user
 */
export function generateMockUser(overrides?: Partial<any>) {
  return {
    userId: uuidv4(),
    email: `test-${Date.now()}@example.com`,
    name: 'Test User',
    phone: '+1234567890',
    role: 'farmer',
    preferences: {
      language: 'en',
      notifications: {
        email: true,
        sms: false,
        push: true,
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Generate a mock farm
 */
export function generateMockFarm(userId?: string, overrides?: Partial<any>) {
  return {
    userId: userId || uuidv4(),
    farmId: uuidv4(),
    name: `Test Farm ${Date.now()}`,
    location: {
      latitude: 28.6139,
      longitude: 77.2090,
      address: 'Test Address, Test City',
    },
    cropTypes: ['wheat', 'rice'],
    acreage: 15.5,
    soilType: 'loamy',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Generate a mock image
 */
export function generateMockImage(userId?: string, farmId?: string, overrides?: Partial<any>) {
  const imageId = uuidv4();
  return {
    userId: userId || uuidv4(),
    imageId,
    farmId: farmId || uuidv4(),
    s3Key: `${userId}/${farmId}/${Date.now()}_${imageId}.jpg`,
    s3Bucket: 'test-farm-images',
    fileName: 'test-image.jpg',
    contentType: 'image/jpeg',
    fileSize: 1024000,
    uploadedAt: new Date().toISOString(),
    status: 'uploaded',
    ...overrides,
  };
}

/**
 * Generate a mock disease analysis
 */
export function generateMockDiseaseAnalysis(imageId?: string, overrides?: Partial<any>) {
  return {
    analysisId: uuidv4(),
    imageId: imageId || uuidv4(),
    userId: uuidv4(),
    farmId: uuidv4(),
    cropType: 'wheat',
    results: [
      {
        diseaseName: 'Wheat Rust',
        confidence: 0.87,
        severity: 'moderate',
        affectedArea: 'leaves',
        recommendations: [
          'Apply fungicide containing propiconazole',
          'Remove infected plants to prevent spread',
        ],
      },
    ],
    isUncertain: false,
    modelVersion: 'v1.0',
    processingTimeMs: 3420,
    analyzedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Generate mock market price data
 */
export function generateMockMarketPrice(commodity?: string, overrides?: Partial<any>) {
  return {
    priceId: uuidv4(),
    commodity: commodity || 'wheat',
    price: 2500,
    unit: 'INR/quintal',
    marketLocation: {
      name: 'Test Mandi',
      latitude: 28.9845,
      longitude: 77.7064,
      distance: 12.5,
    },
    source: 'test-source',
    timestamp: new Date().toISOString(),
    ttl: Math.floor(Date.now() / 1000) + 86400,
    ...overrides,
  };
}

/**
 * Generate mock sensor data
 */
export function generateMockSensorData(deviceId?: string, farmId?: string, overrides?: Partial<any>) {
  return {
    deviceId: deviceId || `sensor-${Date.now()}`,
    farmId: farmId || uuidv4(),
    userId: uuidv4(),
    sensorType: 'soil_moisture',
    value: 45.2,
    unit: 'percent',
    timestamp: new Date().toISOString(),
    ttl: Math.floor(Date.now() / 1000) + 7776000, // 90 days
    ...overrides,
  };
}

/**
 * Generate mock optimization recommendation
 */
export function generateMockOptimization(farmId?: string, overrides?: Partial<any>) {
  return {
    optimizationId: uuidv4(),
    farmId: farmId || uuidv4(),
    userId: uuidv4(),
    type: 'water',
    parameters: {
      cropType: 'wheat',
      currentStage: 'vegetative',
      soilMoisture: 45,
      weatherForecast: 'sunny',
    },
    recommendations: {
      dailyWaterRequirement: 25,
      unit: 'mm',
      irrigationSchedule: [
        {
          time: '06:00',
          duration: 45,
          unit: 'minutes',
        },
      ],
      estimatedSavings: {
        water: 30,
        unit: 'percent',
        costSavings: 450,
        currency: 'INR',
      },
    },
    calculatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Generate mock chat message
 */
export function generateMockChatMessage(userId?: string, role: 'user' | 'assistant' = 'user', overrides?: Partial<any>) {
  return {
    messageId: uuidv4(),
    userId: userId || uuidv4(),
    farmId: uuidv4(),
    role,
    content: role === 'user' ? 'What is the best time to plant wheat?' : 'The optimal time to plant wheat is...',
    metadata: role === 'assistant' ? {
      sources: ['historical_weather_data', 'farm_profile'],
      recommendations: [],
      processingTimeMs: 2340,
    } : undefined,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Generate mock alert
 */
export function generateMockAlert(userId?: string, farmId?: string, overrides?: Partial<any>) {
  return {
    alertId: uuidv4(),
    userId: userId || uuidv4(),
    farmId: farmId || uuidv4(),
    type: 'soil_moisture_low',
    severity: 'high',
    message: 'Soil moisture has dropped below 30% in Field A',
    status: 'active',
    metadata: {},
    createdAt: new Date().toISOString(),
    acknowledgedAt: null,
    acknowledgedBy: null,
    note: null,
    resolvedAt: null,
    ...overrides,
  };
}

/**
 * Generate a random number within a range
 */
export function randomNumber(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Generate a random integer within a range
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(randomNumber(min, max));
}

/**
 * Generate a random element from an array
 */
export function randomElement<T>(array: T[]): T {
  return array[randomInt(0, array.length)];
}

/**
 * Generate a random date within a range
 */
export function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}
