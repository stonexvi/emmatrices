import json
import boto3
import random
import string
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
games_table = dynamodb.Table('MatrixGames')

def generate_game_code():
    """Generate a unique 4-character game code"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))

def lambda_handler(event, context):
    """
    Create a new game and return the game code
    
    POST /games
    Body: {
        "hostName": "Alice",
        "hostInitials": "AB",
        "hostColor": "#2563eb"
    }
    """
    try:
        body = json.loads(event['body'])
        
        host_name = body['hostName']
        host_initials = body['hostInitials']
        host_color = body['hostColor']
        
        # Generate unique game code
        game_code = generate_game_code()
        
        # Check if code already exists (very unlikely)
        max_attempts = 5
        for _ in range(max_attempts):
            try:
                response = games_table.get_item(Key={'gameCode': game_code})
                if 'Item' not in response:
                    break
                game_code = generate_game_code()
            except Exception:
                break
        
        # Create player ID for host
        host_player_id = f"player_{int(datetime.now().timestamp() * 1000)}"
        
        # Create game
        game = {
            'gameCode': game_code,
            'hostPlayerId': host_player_id,
            'players': [{
                'playerId': host_player_id,
                'name': host_name,
                'initials': host_initials,
                'color': host_color,
                'connected': True,
                'isHost': True
            }],
            'status': 'lobby',
            'currentRound': 0,
            'currentPhase': 'lobby',
            'currentMatrixId': None,
            'currentPlayerIndex': 0,
            'playerOrder': [],
            'createdAt': Decimal(str(datetime.now().timestamp())),
            'updatedAt': Decimal(str(datetime.now().timestamp())),
            'settings': {
                'roundCount': 5,
                'placementTimer': 30,
                'guessingTimer': 20
            }
        }
        
        games_table.put_item(Item=game)
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'gameCode': game_code,
                'playerId': host_player_id,
                'game': game
            }, default=str)
        }
        
    except Exception as e:
        print(f"Error creating game: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'error': str(e)})
        }
