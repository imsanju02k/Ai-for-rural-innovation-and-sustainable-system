#!/usr/bin/env node
/**
 * Generate Frontend Configuration
 * 
 * This script generates configuration files for the React frontend by extracting
 * CloudFormation stack outputs from the deployed AWS infrastructure.
 * 
 * Usage:
 *   npm run generate:frontend-config -- --environment dev
 *   npm run generate:frontend-config -- --environment prod --output ../frontend/src/config
 */

import * as fs from 'fs';
import * as path from 'path';
import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';

interface FrontendConfig {
  apiEndpoint: string;
  region: string;
  userPoolId: string;
  userPoolClientId: string;
  identityPoolId?: string;
  s3Bucket: string;
  iotEndpoint: string;
  environment: string;
  websocketEndpoint?: string;
}

interface CliArgs {
  environment: string;
  output?: string;
  region?: string;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const parsed: CliArgs = {
    environment: 'dev',
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--environment' || args[i] === '-e') {
      parsed.environment = args[++i];
    } else if (args[i] === '--output' || args[i] === '-o') {
      parsed.output = args[++i];
    } else if (args[i] === '--region' || args[i] === '-r') {
      parsed.region = args[++i];
    }
  }

  return parsed;
}

async function getStackOutputs(
  stackName: string,
  region: string
): Promise<Record<string, string>> {
  const client = new CloudFormationClient({ region });
  const command = new DescribeStacksCommand({ StackName: stackName });

  try {
    const response = await client.send(command);
    const stack = response.Stacks?.[0];

    if (!stack || !stack.Outputs) {
      throw new Error(`Stack ${stackName} not found or has no outputs`);
    }

    const outputs: Record<string, string> = {};
    for (const output of stack.Outputs) {
      if (output.OutputKey && output.OutputValue) {
        outputs[output.OutputKey] = output.OutputValue;
      }
    }

    return outputs;
  } catch (error) {
    console.error(`Error fetching stack outputs for ${stackName}:`, error);
    throw error;
  }
}

async function generateConfig(args: CliArgs): Promise<void> {
  const { environment, output, region = process.env.AWS_REGION || 'us-east-1' } = args;

  console.log(`Generating frontend configuration for environment: ${environment}`);
  console.log(`Region: ${region}`);

  try {
    // Fetch outputs from all relevant stacks
    const [apiOutputs, authOutputs, storageOutputs, iotOutputs] = await Promise.all([
      getStackOutputs(`${environment}-APIStack`, region),
      getStackOutputs(`${environment}-AuthStack`, region),
      getStackOutputs(`${environment}-StorageStack`, region),
      getStackOutputs(`${environment}-IoTStack`, region),
    ]);

    // Build configuration object
    const config: FrontendConfig = {
      apiEndpoint: apiOutputs.ApiEndpoint || apiOutputs.RestApiEndpoint || '',
      region,
      userPoolId: authOutputs.UserPoolId || '',
      userPoolClientId: authOutputs.UserPoolClientId || '',
      identityPoolId: authOutputs.IdentityPoolId,
      s3Bucket: storageOutputs.ImagesBucketName || '',
      iotEndpoint: iotOutputs.IoTEndpoint || '',
      environment,
      websocketEndpoint: apiOutputs.WebSocketEndpoint,
    };

    // Validate required fields
    const requiredFields: (keyof FrontendConfig)[] = [
      'apiEndpoint',
      'region',
      'userPoolId',
      'userPoolClientId',
      's3Bucket',
      'iotEndpoint',
    ];

    const missingFields = requiredFields.filter((field) => !config[field]);
    if (missingFields.length > 0) {
      throw new Error(`Missing required configuration fields: ${missingFields.join(', ')}`);
    }

    // Determine output path
    const outputDir = output || path.join(__dirname, '..', 'frontend-config');
    const outputPath = path.join(outputDir, `config.${environment}.json`);

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write configuration file
    fs.writeFileSync(outputPath, JSON.stringify(config, null, 2));

    console.log('\n✅ Frontend configuration generated successfully!');
    console.log(`📁 Output: ${outputPath}`);
    console.log('\nConfiguration:');
    console.log(JSON.stringify(config, null, 2));

    // Also create a TypeScript version
    const tsOutputPath = path.join(outputDir, `config.${environment}.ts`);
    const tsContent = `// Auto-generated frontend configuration
// Generated at: ${new Date().toISOString()}
// Environment: ${environment}

export const config = ${JSON.stringify(config, null, 2)} as const;

export default config;
`;

    fs.writeFileSync(tsOutputPath, tsContent);
    console.log(`📁 TypeScript config: ${tsOutputPath}`);

  } catch (error) {
    console.error('\n❌ Error generating frontend configuration:', error);
    process.exit(1);
  }
}

// Main execution
const args = parseArgs();
generateConfig(args).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
