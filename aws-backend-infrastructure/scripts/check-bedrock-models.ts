#!/usr/bin/env ts-node
/**
 * Check which Bedrock models are available and accessible
 */

import { BedrockClient, ListFoundationModelsCommand } from '@aws-sdk/client-bedrock';

const REGION = process.env.AWS_REGION || 'us-east-1';

async function checkBedrockModels(): Promise<void> {
    console.log('🔍 Checking available Bedrock models...\n');
    console.log(`Region: ${REGION}\n`);

    const client = new BedrockClient({ region: REGION });

    try {
        const command = new ListFoundationModelsCommand({});
        const response = await client.send(command);

        if (!response.modelSummaries || response.modelSummaries.length === 0) {
            console.log('❌ No models found');
            return;
        }

        console.log(`✅ Found ${response.modelSummaries.length} foundation models\n`);

        // Filter for Anthropic Claude models
        const claudeModels = response.modelSummaries.filter(
            (model) => model.providerName === 'Anthropic'
        );

        if (claudeModels.length > 0) {
            console.log('🤖 Anthropic Claude Models:');
            claudeModels.forEach((model) => {
                console.log(`  - ${model.modelId}`);
                console.log(`    Name: ${model.modelName}`);
                console.log(`    Status: ${model.modelLifecycle?.status || 'ACTIVE'}`);
                console.log(`    Input Modalities: ${model.inputModalities?.join(', ')}`);
                console.log(`    Output Modalities: ${model.outputModalities?.join(', ')}`);
                console.log('');
            });
        } else {
            console.log('⚠️  No Anthropic Claude models found');
        }

        // Show all available models
        console.log('\n📋 All Available Models by Provider:');
        const modelsByProvider = response.modelSummaries.reduce((acc, model) => {
            const provider = model.providerName || 'Unknown';
            if (!acc[provider]) {
                acc[provider] = [];
            }
            acc[provider].push(model.modelId || 'Unknown');
            return acc;
        }, {} as Record<string, string[]>);

        Object.entries(modelsByProvider).forEach(([provider, models]) => {
            console.log(`\n${provider}:`);
            models.forEach((modelId) => {
                console.log(`  - ${modelId}`);
            });
        });

    } catch (error) {
        console.error('❌ Failed to list Bedrock models');
        if (error instanceof Error) {
            console.error(`Error: ${error.message}`);
        }
        throw error;
    }
}

checkBedrockModels()
    .then(() => {
        console.log('\n✨ Check completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Check failed:', error);
        process.exit(1);
    });
