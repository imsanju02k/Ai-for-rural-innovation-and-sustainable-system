/**
 * Mock Bedrock AI responses for testing
 */

export const mockDiseaseDetectionResponse = {
  body: new TextEncoder().encode(JSON.stringify({
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          disease: 'Wheat Rust',
          confidence: 0.87,
          severity: 'moderate',
          affectedArea: 'leaves',
          recommendations: [
            'Apply fungicide containing propiconazole',
            'Remove infected plants to prevent spread',
            'Improve air circulation between plants',
          ],
        }),
      },
    ],
  })),
  contentType: 'application/json',
};

export const mockAdvisoryResponse = {
  body: new TextEncoder().encode(JSON.stringify({
    content: [
      {
        type: 'text',
        text: 'The optimal time to plant wheat in North India is from mid-October to mid-November. Based on your farm location, I recommend planting between October 25 and November 10. Current soil conditions and weather patterns suggest early November would be ideal this year.',
      },
    ],
    stop_reason: 'end_turn',
  })),
  contentType: 'application/json',
};

export const mockMarketPredictionResponse = {
  body: new TextEncoder().encode(JSON.stringify({
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          commodity: 'wheat',
          predictions: [
            {
              horizon: '7-day',
              price: 2550,
              confidenceInterval: { lower: 2500, upper: 2600 },
            },
            {
              horizon: '14-day',
              price: 2600,
              confidenceInterval: { lower: 2520, upper: 2680 },
            },
            {
              horizon: '30-day',
              price: 2650,
              confidenceInterval: { lower: 2500, upper: 2800 },
            },
          ],
        }),
      },
    ],
  })),
  contentType: 'application/json',
};

export const mockResourceOptimizationResponse = {
  body: new TextEncoder().encode(JSON.stringify({
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          type: 'water',
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
        }),
      },
    ],
  })),
  contentType: 'application/json',
};

/**
 * Create a mock Bedrock response with custom content
 */
export function createMockBedrockResponse(content: any) {
  return {
    body: new TextEncoder().encode(JSON.stringify({
      content: [
        {
          type: 'text',
          text: typeof content === 'string' ? content : JSON.stringify(content),
        },
      ],
    })),
    contentType: 'application/json',
  };
}

/**
 * Create a mock Bedrock error response
 */
export function createMockBedrockError(message: string, code: string = 'ValidationException') {
  const error = new Error(message);
  error.name = code;
  return error;
}
