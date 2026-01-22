import json
import boto3
import math
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
games_table = dynamodb.Table('MatrixGames')
guesses_table = dynamodb.Table('MatrixGameGuesses')
rounds_table = dynamodb.Table('MatrixGameRounds')

def calculate_distance(x1, y1, x2, y2):
    """Calculate Euclidean distance between two points"""
    return math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)

def lambda_handler(event, context):
    """
    Submit a guess for where a player placed their mark
    
    POST /games/{gameCode}/rounds/{roundNumber}/guess
    Body: {
        "guessingPlayerId": "player_123",
        "targetPlayerId": "player_456",
        "x": 10.5,
        "y": 20.3
    }
    """
    try:
        game_code = event['pathParameters']['gameCode'].upper()
        round_number = int(event['pathParameters']['roundNumber'])
        body = json.loads(event['body'])
        
        guessing_player_id = body['guessingPlayerId']
        target_player_id = body['targetPlayerId']
        guess_x = body['x']
        guess_y = body['y']
        
        # Get game
        game_response = games_table.get_item(Key={'gameCode': game_code})
        if 'Item' not in game_response:
            return {
                'statusCode': 404,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Game not found'})
            }
        
        game = game_response['Item']
        
        # Verify game is in guessing phase
        if game['currentPhase'] != 'guessing':
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Not in guessing phase'})
            }
        
        # Verify round number
        if game['currentRound'] != round_number:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid round number'})
            }
        
        # Verify target player is current target
        current_target = game['playerOrder'][game['currentPlayerIndex']]
        if current_target != target_player_id:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Not the current target player'})
            }
        
        # Can't guess your own position
        if guessing_player_id == target_player_id:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Cannot guess your own position'})
            }
        
        # Get round data to calculate distance
        round_key = {'gameCode': game_code, 'roundNumber': round_number}
        round_response = rounds_table.get_item(Key=round_key)
        
        if 'Item' not in round_response:
            return {
                'statusCode': 404,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Round not found'})
            }
        
        round_data = round_response['Item']
        
        # Get actual mark position
        if target_player_id not in round_data.get('playerMarks', {}):
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Target player has not placed mark'})
            }
        
        actual_mark = round_data['playerMarks'][target_player_id]
        actual_x = float(actual_mark['x'])
        actual_y = float(actual_mark['y'])
        
        # Calculate distance
        distance = calculate_distance(guess_x, guess_y, actual_x, actual_y)
        
        # Store guess
        composite_key = f"{game_code}#{round_number}#{target_player_id}"
        
        guess_record = {
            'compositeKey': composite_key,
            'guessingPlayerId': guessing_player_id,
            'guessX': Decimal(str(guess_x)),
            'guessY': Decimal(str(guess_y)),
            'distance': Decimal(str(distance)),
            'points': 0,  # Will be calculated during reveal
            'revealed': False,
            'timestamp': Decimal(str(datetime.now().timestamp()))
        }
        
        guesses_table.put_item(Item=guess_record)
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'success': True})
        }
        
    except Exception as e:
        print(f"Error submitting guess: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }
