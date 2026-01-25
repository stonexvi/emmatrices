import { useState } from "react";
import { gameApi } from '../../utils/gameApi';

export default function PlayerMinimalView({ gameCode, playerId, playerInfo, gameState, roundData, isHost, currentPhase }) {
  // gameState, playerInfo, roundData, and currentPhase are passed in from GameController
  const [advancing, setAdvancing] = useState(false);
  
  const game = gameState?.game;
  const player = playerInfo;
  const currentRound = game?.currentRound;
  const scores = gameState?.scores || [];
  const playerScore = scores.find(s => s.playerId === playerId);
  const phaseStatus = gameState?.phaseStatus;

  // Get player's current round score
  const currentRoundScore = playerScore?.roundScores?.[currentRound] || 0;

  // Helper to convert coordinate to percentage
  const coordToPercent = (coord) => {
    return ((coord + 50) / 100) * 100;
  };

  const handleContinue = async () => {
    if (advancing) return;
    
    setAdvancing(true);
    
    const timeoutId = setTimeout(() => {
      console.warn('Advance timeout - re-enabling button');
      setAdvancing(false);
    }, 3000);
    
    try {
      await gameApi.advancePhase(gameCode, playerId);
      setAdvancing(false);
      clearTimeout(timeoutId);
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Error advancing:', err);
      alert('Failed to advance. Please try again.');
      setAdvancing(false);
    }
  };

  const getPhaseMessage = () => {
    const phase = game?.currentPhase;
    
    if (phase === 'placing') {
      const hasPlaced = gameState?.hasPlacedMark;
      return {
        title: hasPlaced ? 'Mark Placed!' : 'Place Your Mark',
        subtitle: hasPlaced 
          ? `Waiting for other players... (${phaseStatus?.playersReady || 0}/${phaseStatus?.playersTotal || 0})`
          : 'Tap the grid on your screen to place',
        color: 'from-blue-50 to-cyan-50'
      };
    }
    
    if (phase === 'guessing') {
      const gameMode = phaseStatus?.gameMode;
      
      if (gameMode === 'headtohead') {
        // In head-to-head, everyone guesses
        return {
          title: 'Make Your Guess',
          subtitle: `Guesses in: ${phaseStatus?.playersReady || 0}/2`,
          color: 'from-orange-50 to-red-50'
        };
      } else {
        // In standard mode, check if this player is the target
        const isTarget = phaseStatus?.targetPlayerId === playerId;
        
        if (isTarget) {
          return {
            title: "It's Your Turn!",
            subtitle: 'Others are guessing where you placed yourself',
            color: 'from-yellow-50 to-orange-50'
          };
        } else {
          return {
            title: 'Make Your Guess',
            subtitle: `Guesses in: ${phaseStatus?.playersReady || 0}/${phaseStatus?.playersTotal || 0}`,
            color: 'from-orange-50 to-red-50'
          };
        }
      }
    }
    
    if (phase === 'revealing' || phase === 'round_scoreboard') {
      return {
        title: 'Look at the Display!',
        subtitle: 'Reveals happening now',
        color: 'from-purple-50 to-pink-50'
      };
    }
    
    return {
      emoji: '🎮',
      title: 'Game in Progress',
      subtitle: 'Look at the display',
      color: 'from-gray-50 to-gray-100'
    };
  };

  const phaseInfo = getPhaseMessage();

  if (!game || !player) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-gray-600">Loading game...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${phaseInfo.color} py-8 px-4`}>
      <div className="max-w-md mx-auto space-y-6">
        
        {/* Display Indicator */}
        <div className="bg-white rounded-2xl shadow-lg p-4 text-center">
          <div className="text-xl text-purple-600 font-semibold mb-1">Watch the Display</div>
          <div className="text-xs text-gray-600">Look at the main screen for game updates</div>
        </div>

        {/* Player Info Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg"
              style={{ backgroundColor: player.color }}
            >
              {player.initials}
            </div>
            <div className="flex-1">
              <div className="text-2xl font-bold text-gray-800">{player.name}</div>
              <div className="text-gray-600">Round {currentRound} of {game.settings?.roundCount || 5}</div>
            </div>
          </div>
          
          {/* Score Display */}
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-800">
                {Math.round(parseFloat(playerScore?.totalPoints || 0))}
              </div>
              <div className="text-sm text-gray-600">Total Points</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                +{Math.round(parseFloat(currentRoundScore))}
              </div>
              <div className="text-sm text-gray-600">This Round</div>
            </div>
          </div>
        </div>

        {/* Personal Stats Card (if relevant) */}
        {roundData && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="font-semibold text-gray-800 mb-3">Info</h3>
            <div className="space-y-2 text-sm">              
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-gray-600">Game Code</span>
                <span className="text-purple-600 font-bold text-lg">{game.gameCode}</span>
              </div>
            </div>
          </div>
        )}

        {/* Game Over State */}
        {game.status === 'finished' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Game Complete!</h2>
            <p className="text-gray-600 mb-4">Check the display for final standings</p>
            <div className="text-3xl font-bold text-purple-600">
              {parseFloat(playerScore?.totalPoints || 0)} points
            </div>
          </div>
        )}

        {/* Continue button */}
        {isHost && (
          <button
            onClick={handleContinue}
            disabled={advancing}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition duration-200 shadow-md"
          >
            {advancing ? 'Advancing...' : 'Continue'}
          </button>
        )}
      </div>
    </div>
  );
}
