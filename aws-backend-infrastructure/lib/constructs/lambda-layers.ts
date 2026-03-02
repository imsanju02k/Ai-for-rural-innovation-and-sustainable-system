/**
 * Lambda Layers Construct
 * Creates and manages Lambda layers for shared dependencies and utilities
 */

import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import * as path from 'path';

export interface LambdaLayersProps {
    environment: string;
}

export class LambdaLayers extends Construct {
    public readonly commonDependenciesLayer: lambda.LayerVersion;
    public readonly sharedUtilitiesLayer: lambda.LayerVersion;

    constructor(scope: Construct, id: string, props: LambdaLayersProps) {
        super(scope, id);

        const { environment } = props;

        // Common Dependencies Layer
        // Includes AWS SDK v3, lodash, date-fns, zod
        this.commonDependenciesLayer = new lambda.LayerVersion(
            this,
            'CommonDependenciesLayer',
            {
                layerVersionName: `${environment}-common-dependencies`,
                code: lambda.Code.fromAsset(
                    path.join(__dirname, '../lambda/layers/common-dependencies'),
                    {
                        bundling: {
                            image: lambda.Runtime.NODEJS_20_X.bundlingImage,
                            command: [
                                'bash',
                                '-c',
                                [
                                    'mkdir -p /asset-output/nodejs',
                                    'cp package.json /asset-output/nodejs/',
                                    'cd /asset-output/nodejs',
                                    'npm install --production',
                                    'rm package.json',
                                ].join(' && '),
                            ],
                        },
                    }
                ),
                compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
                description: 'Common dependencies: AWS SDK v3, lodash, date-fns, zod',
                removalPolicy: cdk.RemovalPolicy.RETAIN,
            }
        );

        // Shared Utilities Layer
        // Includes shared utilities, models, and middleware
        this.sharedUtilitiesLayer = new lambda.LayerVersion(
            this,
            'SharedUtilitiesLayer',
            {
                layerVersionName: `${environment}-shared-utilities`,
                code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/shared'), {
                    bundling: {
                        image: lambda.Runtime.NODEJS_20_X.bundlingImage,
                        command: [
                            'bash',
                            '-c',
                            [
                                'mkdir -p /asset-output/nodejs/node_modules/shared',
                                'cp -r . /asset-output/nodejs/node_modules/shared/',
                                'cd /asset-output/nodejs/node_modules/shared',
                                'npm install --production',
                            ].join(' && '),
                        ],
                    },
                }),
                compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
                description: 'Shared utilities, models, and middleware',
                removalPolicy: cdk.RemovalPolicy.RETAIN,
            }
        );

        // Add tags
        cdk.Tags.of(this.commonDependenciesLayer).add('Layer', 'CommonDependencies');
        cdk.Tags.of(this.sharedUtilitiesLayer).add('Layer', 'SharedUtilities');
        cdk.Tags.of(this.commonDependenciesLayer).add('Environment', environment);
        cdk.Tags.of(this.sharedUtilitiesLayer).add('Environment', environment);
    }

    /**
     * Get all layers as an array
     */
    public getAllLayers(): lambda.ILayerVersion[] {
        return [this.commonDependenciesLayer, this.sharedUtilitiesLayer];
    }
}
