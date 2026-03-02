/**
 * DynamoDB Helper Functions
 * Provides simplified interfaces for common DynamoDB operations
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
    DynamoDBDocumentClient,
    GetCommand,
    PutCommand,
    QueryCommand,
    UpdateCommand,
    DeleteCommand,
    GetCommandInput,
    PutCommandInput,
    QueryCommandInput,
    UpdateCommandInput,
    DeleteCommandInput,
} from '@aws-sdk/lib-dynamodb';

// Initialize DynamoDB Document Client
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

/**
 * Get an item from DynamoDB
 */
export async function getItem<T = any>(
    tableName: string,
    key: Record<string, any>
): Promise<T | null> {
    const params: GetCommandInput = {
        TableName: tableName,
        Key: key,
    };

    try {
        const result = await docClient.send(new GetCommand(params));
        return (result.Item as T) || null;
    } catch (error) {
        console.error('DynamoDB getItem error:', error);
        throw error;
    }
}

/**
 * Put an item into DynamoDB
 */
export async function putItem(
    tableName: string,
    item: Record<string, any>
): Promise<void> {
    const params: PutCommandInput = {
        TableName: tableName,
        Item: item,
    };

    try {
        await docClient.send(new PutCommand(params));
    } catch (error) {
        console.error('DynamoDB putItem error:', error);
        throw error;
    }
}

/**
 * Query items from DynamoDB
 */
export async function queryItems<T = any>(
    tableName: string,
    keyConditionExpression: string,
    expressionAttributeValues: Record<string, any>,
    options?: {
        indexName?: string;
        filterExpression?: string;
        expressionAttributeNames?: Record<string, string>;
        limit?: number;
        scanIndexForward?: boolean;
        exclusiveStartKey?: Record<string, any>;
    }
): Promise<{ items: T[]; lastEvaluatedKey?: Record<string, any> }> {
    const params: QueryCommandInput = {
        TableName: tableName,
        KeyConditionExpression: keyConditionExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ...options,
    };

    try {
        const result = await docClient.send(new QueryCommand(params));
        return {
            items: (result.Items as T[]) || [],
            lastEvaluatedKey: result.LastEvaluatedKey,
        };
    } catch (error) {
        console.error('DynamoDB queryItems error:', error);
        throw error;
    }
}

/**
 * Update an item in DynamoDB
 */
export async function updateItem(
    tableName: string,
    key: Record<string, any>,
    updateExpression: string,
    expressionAttributeValues: Record<string, any>,
    options?: {
        expressionAttributeNames?: Record<string, string>;
        conditionExpression?: string;
        returnValues?: 'NONE' | 'ALL_OLD' | 'UPDATED_OLD' | 'ALL_NEW' | 'UPDATED_NEW';
    }
): Promise<Record<string, any> | undefined> {
    const params: UpdateCommandInput = {
        TableName: tableName,
        Key: key,
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: options?.returnValues || 'ALL_NEW',
        ...options,
    };

    try {
        const result = await docClient.send(new UpdateCommand(params));
        return result.Attributes;
    } catch (error) {
        console.error('DynamoDB updateItem error:', error);
        throw error;
    }
}

/**
 * Delete an item from DynamoDB
 */
export async function deleteItem(
    tableName: string,
    key: Record<string, any>
): Promise<void> {
    const params: DeleteCommandInput = {
        TableName: tableName,
        Key: key,
    };

    try {
        await docClient.send(new DeleteCommand(params));
    } catch (error) {
        console.error('DynamoDB deleteItem error:', error);
        throw error;
    }
}

/**
 * Build update expression from object
 * Converts { name: 'John', age: 30 } to:
 * - UpdateExpression: 'SET #name = :name, #age = :age'
 * - ExpressionAttributeNames: { '#name': 'name', '#age': 'age' }
 * - ExpressionAttributeValues: { ':name': 'John', ':age': 30 }
 */
export function buildUpdateExpression(updates: Record<string, any>): {
    updateExpression: string;
    expressionAttributeNames: Record<string, string>;
    expressionAttributeValues: Record<string, any>;
} {
    const setExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    Object.entries(updates).forEach(([key, value]) => {
        const nameKey = `#${key}`;
        const valueKey = `:${key}`;

        setExpressions.push(`${nameKey} = ${valueKey}`);
        expressionAttributeNames[nameKey] = key;
        expressionAttributeValues[valueKey] = value;
    });

    return {
        updateExpression: `SET ${setExpressions.join(', ')}`,
        expressionAttributeNames,
        expressionAttributeValues,
    };
}
