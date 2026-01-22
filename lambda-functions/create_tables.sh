#!/bin/bash

# Script to create DynamoDB tables for Matrix Game Mode
# Run this from AWS CloudShell or with AWS CLI configured

echo "Creating DynamoDB tables for Matrix Game Mode..."

# 1. Games Table
aws dynamodb create-table \
    --table-name MatrixGames \
    --attribute-definitions \
        AttributeName=gameCode,AttributeType=S \
    --key-schema \
        AttributeName=gameCode,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-1

echo "Created MatrixGames table"

# 2. Game Rounds Table
aws dynamodb create-table \
    --table-name MatrixGameRounds \
    --attribute-definitions \
        AttributeName=gameCode,AttributeType=S \
        AttributeName=roundNumber,AttributeType=N \
    --key-schema \
        AttributeName=gameCode,KeyType=HASH \
        AttributeName=roundNumber,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-1

echo "Created MatrixGameRounds table"

# 3. Game Guesses Table
aws dynamodb create-table \
    --table-name MatrixGameGuesses \
    --attribute-definitions \
        AttributeName=compositeKey,AttributeType=S \
        AttributeName=guessingPlayerId,AttributeType=S \
    --key-schema \
        AttributeName=compositeKey,KeyType=HASH \
        AttributeName=guessingPlayerId,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-1

echo "Created MatrixGameGuesses table"

# 4. Game Scores Table
aws dynamodb create-table \
    --table-name MatrixGameScores \
    --attribute-definitions \
        AttributeName=gameCode,AttributeType=S \
        AttributeName=playerId,AttributeType=S \
    --key-schema \
        AttributeName=gameCode,KeyType=HASH \
        AttributeName=playerId,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-1

echo "Created MatrixGameScores table"

echo ""
echo "All tables created successfully!"
echo "Note: Tables use PAY_PER_REQUEST billing (on-demand) to stay within free tier"
echo ""
echo "Next steps:"
echo "1. Deploy Lambda functions"
echo "2. Create API Gateway endpoints"
echo "3. Update frontend with API URLs"
