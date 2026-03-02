#!/usr/bin/env ts-node
/**
 * Test script to verify Amazon Bedrock access and model invocation
 * 
 * This script tests:
 * 1. Bedrock API connectivity
 * 2. Model access permissions
 * 3. Basic model invocation
 */

import {
    BedrockRuntimeClient,
    InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';

const REGION = process.env.AWS_REGION || 'us-east-1';
const MODEL_ID = 'anthropic.claude-3-haiku-20240307-v1:0'; // Using Haiku for faster/cheaper testing

async function testBedrockAccess(): Promise<void> {
    console.log('🧪 Testing Amazon Bedrock Access...\n');
    console.log(`Region: ${REGION}`);
    console.log(`Model: ${MODEL_ID}\n`);

    const client = new BedrockRuntimeClient({ region: REGION });

    try {
        // Test 1: Simple model invocation
        console.log('Test 1: Basic Model Invocation');
        console.log('Sending test prompt to Claude...');

        const payload = {
            anthropic_version: 'bedrock-2023-05-31',
            max_tokens: 100,
            temperature: 0.7,
            messages: [
                {
                    role: 'user',
                    content: 'Hello! Please respond with a brief greeting to confirm you are working.',
                },
            ],
        };

        const command = new InvokeModelCommand({
            modelId: MODEL_ID,
            contentType: 'application/json',
            accept: 'application/json',
            body: JSON.stringify(payload),
        });

        const startTime = Date.now();
        const response = await client.send(command);
        const duration = Date.now() - startTime;

        const responseBody = JSON.parse(new TextDecoder().decode(response.body));

        console.log('✅ Model invocation successful!');
        console.log(`⏱️  Response time: ${duration}ms`);
        console.log(`📝 Response: ${responseBody.content[0].text}`);
        console.log(`📊 Token usage: ${responseBody.usage.input_tokens} input, ${responseBody.usage.output_tokens} output\n`);

        // Test 2: Agricultural advisory test
        console.log('Test 2: Agricultural Advisory Test');
        console.log('Testing agricultural domain knowledge...');

        const agriPayload = {
            anthropic_version: 'bedrock-2023-05-31',
            max_tokens: 200,
            temperature: 0.7,
            messages: [
                {
                    role: 'user',
                    content: 'What is the best time to plant wheat in North India? Provide a brief answer.',
                },
            ],
        };

        const agriCommand = new InvokeModelCommand({
            modelId: MODEL_ID,
            contentType: 'application/json',
            accept: 'application/json',
            body: JSON.stringify(agriPayload),
        });

        const agriStartTime = Date.now();
        const agriResponse = await client.send(agriCommand);
        const agriDuration = Date.now() - agriStartTime;

        const agriResponseBody = JSON.parse(new TextDecoder().decode(agriResponse.body));

        console.log('✅ Agricultural advisory test successful!');
        console.log(`⏱️  Response time: ${agriDuration}ms`);
        console.log(`📝 Response: ${agriResponseBody.content[0].text}`);
        console.log(`📊 Token usage: ${agriResponseBody.usage.input_tokens} input, ${agriResponseBody.usage.output_tokens} output\n`);

        // Summary
        console.log('🎉 All Bedrock tests passed!');
        console.log('\n✅ Bedrock Access Verification Summary:');
        console.log('  ✓ API connectivity established');
        console.log('  ✓ Model access permissions verified');
        console.log('  ✓ Model invocation working correctly');
        console.log('  ✓ Agricultural domain responses functional');
        console.log(`  ✓ Average response time: ${Math.round((duration + agriDuration) / 2)}ms`);

    } catch (error) {
        console.error('❌ Bedrock test failed!');

        if (error instanceof Error) {
            console.error(`Error: ${error.message}`);

            // Provide helpful error messages
            if (error.message.includes('AccessDeniedException')) {
                console.error('\n💡 Troubleshooting:');
                console.error('  - Ensure Bedrock model access is enabled in your AWS account');
                console.error('  - Check IAM permissions for bedrock:InvokeModel');
                console.error('  - Verify the model ID is correct and available in your region');
            } else if (error.message.includes('ValidationException')) {
                console.error('\n💡 Troubleshooting:');
                console.error('  - Check the model ID format');
                console.error('  - Verify the request payload structure');
            } else if (error.message.includes('ThrottlingException')) {
                console.error('\n💡 Troubleshooting:');
                console.error('  - You may have exceeded the rate limit');
                console.error('  - Wait a moment and try again');
            }
        }

        throw error;
    }
}

// Run the test
testBedrockAccess()
    .then(() => {
        console.log('\n✨ Test completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Test failed with error:', error);
        process.exit(1);
    });
