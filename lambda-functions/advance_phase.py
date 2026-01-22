import json
import boto3
import random
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
games_table = dynamodb.Table('MatrixGames')
rounds_table = dynamodb.Table('MatrixGameRounds')
guesses_table = dynamodb.Table('MatrixGameGuesses')
scores_table = dynamodb.Table('MatrixGameScores')

# Matrix definitions (same as start_game)
MATRICES = [
    {"id": 1, "xLabel": "Introvert / Extrovert", "yLabel": "Morning Person / Night Owl"},
    {"id": 2, "xLabel": "Coffee / Tea", "yLabel": "Sweet / Savory"},
    {"id": 3, "xLabel": "Beach / Mountains", "yLabel": "Hot Weather / Cold Weather"},
    {"id": 4, "xLabel": "Cats / Dogs", "yLabel": "Stay Home / Go Out"},
    {"id": 5, "xLabel": "Fiction / Non-fiction", "yLabel": "Physical Books / E-books"},
    # Add all 30 matrices...
]

def calculate_round_scores(game_code, round_number, target_player_id):
    """Calculate scores for all guesses in this round for this target player"""
    composite_key = f"{game_code}#{round_number}#{target_player_id}"
    
    # Get all guesses for this target player
    response = guesses_table.query(
        KeyConditionExpression='compositeKey = :ck',
        ExpressionAttributeValues={':ck': composite_key}
    )
    
    guesses = response.get('Items', [])
    
    # Sort by distance (closest first)
    guesses.sort(key=lambda g: float(g['distance']))
    
    # Award points: 1st=5pts, 2nd=3pts, 3rd=1pt
    point_values = [5, 3, 1]
    
    for i, guess in enumerate(guesses):
        points = point_values[i] if i < len(point_values) else 0
        guess['points'] = Decimal(str(points))
        guess['rank'] = i + 1
        
        # Update guess with points
        guesses_table.update_item(
            Key={
                'compositeKey': composite_key,
                'guessingPlayerId': guess['guessingPlayerId']
            },
            UpdateExpression='SET points = :p, #r = :rank',
            ExpressionAttributeNames={'#r': 'rank'},
            ExpressionAttributeValues={
                ':p': guess['points'],
                ':rank': guess['rank']
            }
        )
        
        # Update player's total score
        try:
            scores_table.update_item(
                Key={
                    'gameCode': game_code,
                    'playerId': guess['guessingPlayerId']
                },
                UpdateExpression='ADD totalPoints :p',
                ExpressionAttributeValues={':p': guess['points']}
            )
        except:
            # Create score record if doesn't exist
            scores_table.put_item(Item={
                'gameCode': game_code,
                'playerId': guess['guessingPlayerId'],
                'totalPoints': guess['points'],
                'roundScores': [guess['points']]
            })
    
    return guesses

def lambda_handler(event, context):
    """
    Advance to next phase (host only)
    
    POST /games/{gameCode}/advance
    Body: {
        "playerId": "player_123"
    }
    
    Phase flow:
    lobby → placing → guessing → revealing → scoring → [next player or next round]
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
                'body': json.dumps({'error': 'Only host can advance phase'})
            }
        
        current_phase = game['currentPhase']
        new_phase = None
        
        # Determine next phase
        if current_phase == 'placing':
            # Move to guessing phase for first player
            game['currentPlayerIndex'] = 0
            new_phase = 'guessing'
            
        elif current_phase == 'guessing':
            # Move to revealing phase
            new_phase = 'revealing'
            
            # Calculate scores for this player's guesses
            target_player_id = game['playerOrder'][game['currentPlayerIndex']]
            calculate_round_scores(game_code, game['currentRound'], target_player_id)
            
        elif current_phase == 'revealing':
            # Move to scoring or next player
            new_phase = 'scoring'
            
        elif current_phase == 'scoring':
            # Check if more players to guess
            if game['currentPlayerIndex'] < len(game['playerOrder']) - 1:
                # Next player
                game['currentPlayerIndex'] += 1
                new_phase = 'guessing'
            else:
                # Round complete - check if more rounds
                if game['currentRound'] < game['settings']['roundCount']:
                    # Next round
                    game['currentRound'] += 1
                    game['currentPlayerIndex'] = 0
                    
                    # Select new random matrix
                    used_matrices = []  # TODO: track used matrices
                    available = [m for m in MATRICES if m['id'] not in used_matrices]
                    if not available:
                        available = MATRICES
                    
                    new_matrix = random.choice(available)
                    game['currentMatrixId'] = new_matrix['id']
                    
                    # Create new round record
                    new_round = {
                        'gameCode': game_code,
                        'roundNumber': game['currentRound'],
                        'matrixId': new_matrix['id'],
                        'matrixLabels': {
                            'xLabel': new_matrix['xLabel'],
                            'yLabel': new_matrix['yLabel']
                        },
                        'playerMarks': {},
                        'completed': False
                    }
                    rounds_table.put_item(Item=new_round)
                    
                    new_phase = 'placing'
                else:
                    # Game over
                    game['status'] = 'finished'
                    new_phase = 'finished'
        
        # Update game
        game['currentPhase'] = new_phase
        game['updatedAt'] = Decimal(str(datetime.now().timestamp()))
        game['phaseStartTime'] = Decimal(str(datetime.now().timestamp()))
        
        games_table.put_item(Item=game)
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'success': True,
                'newPhase': new_phase,
                'game': game
            }, default=str)
        }
        
    except Exception as e:
        print(f"Error advancing phase: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }
