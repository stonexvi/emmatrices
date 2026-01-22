import json
import boto3
import random
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
games_table = dynamodb.Table('MatrixGames')
rounds_table = dynamodb.Table('MatrixGameRounds')

# Import the matrix definitions
MATRICES = [
    {"id": 1, "xLabel": "Introvert / Extrovert", "yLabel": "Morning Person / Night Owl"},
    {"id": 2, "xLabel": "Coffee / Tea", "yLabel": "Sweet / Savory"},
    {"id": 3, "xLabel": "Beach / Mountains", "yLabel": "Hot Weather / Cold Weather"},
    {"id": 4, "xLabel": "Cats / Dogs", "yLabel": "Stay Home / Go Out"},
    {"id": 5, "xLabel": "Fiction / Non-fiction", "yLabel": "Physical Books / E-books"},
    # ... (include all 30 matrices or load from a config)
]

def lambda_handler(event, context):
    """
    Start the game (host only)
    
    POST /games/{gameCode}/start
    Body: {
        "playerId": "player_123"
    }
    """
    try:
        game_code = event['pathParameters']['gameCode'].upper()
        body = json.loads(event['body'])
        player_id = body['playerId']
        
        # Get game
        response = games_table.get_item(Key={'gameCode': game_code})
        
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Game not found'})
            }
        
        game = response['Item']
        
        # Verify player is host
        if game['hostPlayerId'] != player_id:
            return {
                'statusCode': 403,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Only host can start game'})
            }
        
        # Need at least 2 players
        if len(game['players']) < 2:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Need at least 2 players'})
            }
        
        # Shuffle player order for the game
        player_ids = [p['playerId'] for p in game['players']]
        random.shuffle(player_ids)
        
        # Select random matrix for round 1
        matrix = random.choice(MATRICES)
        
        # Update game state
        game['status'] = 'playing'
        game['currentPhase'] = 'placing'
        game['currentRound'] = 1
        game['currentMatrixId'] = matrix['id']
        game['currentPlayerIndex'] = 0
        game['playerOrder'] = player_ids
        game['updatedAt'] = Decimal(str(datetime.now().timestamp()))
        game['phaseStartTime'] = Decimal(str(datetime.now().timestamp()))
        
        # Save game
        games_table.put_item(Item=game)
        
        # Create round record
        round_record = {
            'gameCode': game_code,
            'roundNumber': 1,
            'matrixId': matrix['id'],
            'matrixLabels': {
                'xLabel': matrix['xLabel'],
                'yLabel': matrix['yLabel']
            },
            'playerMarks': {},
            'completed': False
        }
        
        rounds_table.put_item(Item=round_record)
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'game': game,
                'matrix': matrix
            }, default=str)
        }
        
    except Exception as e:
        print(f"Error starting game: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }
