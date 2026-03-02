# Advisory Chatbot Lambda Functions

This directory contains Lambda functions for the AI-powered advisory chatbot service.

## Functions

### advisory-chat
Handles chat message processing with Amazon Bedrock (Claude 3).
- Validates chat message input
- Loads conversation history (last 10 messages)
- Retrieves user context (farms, crops, sensor data)
- Builds prompt with context and conversation history
- Calls Amazon Bedrock for response
- Parses response for recommendations and citations
- Stores messages in ChatMessages table
- Returns response within 2 seconds

### advisory-history
Retrieves conversation history for a user.
- Queries ChatMessages table by userId
- Supports pagination with limit and before parameters
- Returns conversation history

## Requirements
- Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.7, 7.8, 7.9

## Technology
- Runtime: Node.js 20.x
- AI Service: Amazon Bedrock (Claude 3)
- Database: DynamoDB (ChatMessages table)
- Response Time Target: < 2 seconds
