/**
 * Seed test data for integration tests
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import {
  generateMockUser,
  generateMockFarm,
  generateMockImage,
  generateMockDiseaseAnalysis,
  generateMockMarketPrice,
  generateMockSensorData,
} from '../../utils/test-data-generators';

const region = process.env.AWS_REGION || 'us-east-1';
const testPrefix = 'test-integration';

export class TestDataSeeder {
  private docClient: DynamoDBDocumentClient;
  
  constructor() {
    const client = new DynamoDBClient({ region });
    this.docClient = DynamoDBDocumentClient.from(client);
  }
  
  /**
   * Seed all test data
   */
  async seedAll() {
    console.log('Seeding test data...');
    
    const userId = await this.seedUsers();
    const farmId = await this.seedFarms(userId);
    const imageId = await this.seedImages(userId, farmId);
    await this.seedDiseaseAnalyses(imageId);
    await this.seedMarketPrices();
    await this.seedSensorData(farmId);
    
    console.log('Test data seeding complete');
    
    return { userId, farmId, imageId };
  }
  
  /**
   * Seed test users
   */
  async seedUsers(): Promise<string> {
    const user = generateMockUser({
      email: 'test-integration@example.com',
      name: 'Integration Test User',
    });
    
    await this.docClient.send(new PutCommand({
      TableName: `${testPrefix}-users`,
      Item: user,
    }));
    
    console.log(`Seeded user: ${user.userId}`);
    return user.userId;
  }
  
  /**
   * Seed test farms
   */
  async seedFarms(userId: string): Promise<string> {
    const farm = generateMockFarm(userId, {
      name: 'Integration Test Farm',
    });
    
    await this.docClient.send(new PutCommand({
      TableName: `${testPrefix}-farms`,
      Item: farm,
    }));
    
    console.log(`Seeded farm: ${farm.farmId}`);
    return farm.farmId;
  }
  
  /**
   * Seed test images
   */
  async seedImages(userId: string, farmId: string): Promise<string> {
    const image = generateMockImage(userId, farmId, {
      fileName: 'test-disease-image.jpg',
    });
    
    await this.docClient.send(new PutCommand({
      TableName: `${testPrefix}-images`,
      Item: image,
    }));
    
    console.log(`Seeded image: ${image.imageId}`);
    return image.imageId;
  }
  
  /**
   * Seed test disease analyses
   */
  async seedDiseaseAnalyses(imageId: string): Promise<void> {
    const analysis = generateMockDiseaseAnalysis(imageId);
    
    await this.docClient.send(new PutCommand({
      TableName: `${testPrefix}-disease-analyses`,
      Item: analysis,
    }));
    
    console.log(`Seeded disease analysis: ${analysis.analysisId}`);
  }
  
  /**
   * Seed test market prices
   */
  async seedMarketPrices(): Promise<void> {
    const commodities = ['wheat', 'rice', 'corn', 'tomato'];
    
    for (const commodity of commodities) {
      const price = generateMockMarketPrice(commodity);
      
      // Note: Market prices table uses commodity as partition key and timestamp as sort key
      // For integration tests, we'll skip this as the table structure is different
      console.log(`Would seed market price for: ${commodity}`);
    }
  }
  
  /**
   * Seed test sensor data
   */
  async seedSensorData(farmId: string): Promise<void> {
    const sensorTypes = ['soil_moisture', 'temperature', 'humidity'];
    
    for (const sensorType of sensorTypes) {
      const sensorData = generateMockSensorData(`sensor-${sensorType}-001`, farmId, {
        sensorType,
      });
      
      await this.docClient.send(new PutCommand({
        TableName: `${testPrefix}-sensor-data`,
        Item: sensorData,
      }));
      
      console.log(`Seeded sensor data: ${sensorData.deviceId}`);
    }
  }
  
  /**
   * Clean up all test data
   */
  async cleanup() {
    console.log('Cleaning up test data...');
    // Cleanup will be handled by deleting tables in teardown
    console.log('Test data cleanup complete');
  }
}

// Export singleton instance
export const testDataSeeder = new TestDataSeeder();
