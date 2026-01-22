import json
import boto3
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
games_table = dynamodb.Table('MatrixGames')

def lambda_handler(event, context):
    """
    Join an existing game
    
    POST /games/{gameCode}/join
    Body: {
        "playerName": "Bob",
        "playerInitials": "BT",
        "playerColor": "#dc2626"
    }
    """
    try:
        game_code = event['pathParameters']['gameCode'].upper()
        body = json.loads(event['body'])
        
        player_name = body['playerName']
        player_initials = body['playerInitials']
        player_color = body['playerColor']
        
        # Get game
        response = games_table.get_item(Key={'gameCode': game_code})
        
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Game not found'})
            }
        
        game = response['Item']
        
        # Check if game is still in lobby
        if game['status'] != 'lobby':
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Game already started'})
            }
        
        # Check if player limit reached (max 8 players)
        if len(game['players']) >= 8:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Game is full'})
            }
        
        # Create player ID
        player_id = f"player_{int(datetime.now().timestamp() * 1000)}"
        
        # Add player to game
        new_player = {
            'playerId': player_id,
            'name': player_name,
            'initials': player_initials,
            'color': player_color,
            'connected': True,
            'isHost': False
        }
        
        game['players'].append(new_player)
        game['updatedAt'] = Decimal(str(datetime.now().timestamp()))
        
        # Update game in DynamoDB
        games_table.put_item(Item=game)
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'playerId': player_id,
                'game': game
            }, default=str)
        }
        
    except Exception as e:
        print(f"Error joining game: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }
