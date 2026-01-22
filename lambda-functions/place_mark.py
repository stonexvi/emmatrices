import json
import boto3
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
games_table = dynamodb.Table('MatrixGames')
rounds_table = dynamodb.Table('MatrixGameRounds')

def lambda_handler(event, context):
    """
    Place mark on matrix during placement phase
    
    POST /games/{gameCode}/rounds/{roundNumber}/place
    Body: {
        "playerId": "player_123",
        "x": 23.5,
        "y": -12.7
    }
    """
    try:
        game_code = event['pathParameters']['gameCode'].upper()
        round_number = int(event['pathParameters']['roundNumber'])
        body = json.loads(event['body'])
        
        player_id = body['playerId']
        x = body['x']
        y = body['y']
        
        # Get game
        game_response = games_table.get_item(Key={'gameCode': game_code})
        if 'Item' not in game_response:
            return {
                'statusCode': 404,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Game not found'})
            }
        
        game = game_response['Item']
        
        # Verify game is in placing phase
        if game['currentPhase'] != 'placing':
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Not in placement phase'})
            }
        
        # Verify round number matches
        if game['currentRound'] != round_number:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid round number'})
            }
        
        # Get round
        round_key = {'gameCode': game_code, 'roundNumber': round_number}
        round_response = rounds_table.get_item(Key=round_key)
        
        if 'Item' not in round_response:
            return {
                'statusCode': 404,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Round not found'})
            }
        
        round_data = round_response['Item']
        
        # Update player's mark
        if 'playerMarks' not in round_data:
            round_data['playerMarks'] = {}
        
        round_data['playerMarks'][player_id] = {
            'x': Decimal(str(x)),
            'y': Decimal(str(y)),
            'timestamp': Decimal(str(datetime.now().timestamp()))
        }
        
        # Save round
        rounds_table.put_item(Item=round_data)
        
        # Check if all players have placed their marks
        all_placed = len(round_data['playerMarks']) == len(game['players'])
        
        # If all placed and host, could auto-advance to guessing
        # (or wait for host to manually advance)
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'success': True,
                'allPlaced': all_placed
            })
        }
        
    except Exception as e:
        print(f"Error placing mark: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }
