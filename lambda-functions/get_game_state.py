import json
import boto3
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
games_table = dynamodb.Table('MatrixGames')
rounds_table = dynamodb.Table('MatrixGameRounds')
guesses_table = dynamodb.Table('MatrixGameGuesses')
scores_table = dynamodb.Table('MatrixGameScores')

def decimal_default(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError

def lambda_handler(event, context):
    """
    Get current game state (polling endpoint)
    
    GET /games/{gameCode}?playerId={playerId}
    """
    try:
        game_code = event['pathParameters']['gameCode'].upper()
        player_id = event['queryStringParameters'].get('playerId')
        
        # Get game
        response = games_table.get_item(Key={'gameCode': game_code})
        
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Game not found'})
            }
        
        game = response['Item']
        
        # Build response with current state
        state = {
            'game': game,
            'isHost': game['hostPlayerId'] == player_id
        }
        
        # If in playing mode, get current round data
        if game['status'] == 'playing':
            round_key = {
                'gameCode': game_code,
                'roundNumber': int(game['currentRound'])
            }
            round_response = rounds_table.get_item(Key=round_key)
            
            if 'Item' in round_response:
                round_data = round_response['Item']
                state['currentRound'] = round_data
                
                # Get player's mark status for this round
                if player_id in round_data.get('playerMarks', {}):
                    state['hasPlacedMark'] = True
                else:
                    state['hasPlacedMark'] = False
                
                # If in guessing phase, check if player has guessed
                if game['currentPhase'] == 'guessing':
                    target_player_id = game['playerOrder'][game['currentPlayerIndex']]
                    guess_key = f"{game_code}#{game['currentRound']}#{target_player_id}"
                    
                    try:
                        guess_response = guesses_table.get_item(
                            Key={
                                'compositeKey': guess_key,
                                'guessingPlayerId': player_id
                            }
                        )
                        state['hasGuessed'] = 'Item' in guess_response
                    except:
                        state['hasGuessed'] = False
        
        # Get scores
        try:
            scores_response = scores_table.query(
                KeyConditionExpression='gameCode = :gc',
                ExpressionAttributeValues={':gc': game_code}
            )
            state['scores'] = scores_response.get('Items', [])
        except:
            state['scores'] = []
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps(state, default=decimal_default)
        }
        
    except Exception as e:
        print(f"Error getting game state: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }
