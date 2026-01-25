import { useState, useEffect } from 'react';
import { gameApi } from '../../utils/gameApi';
import RevealedMatrix from './RevealedMatrix';

export default function ScoringPhase({ gameCode, playerId, isHost, roundData, gameData, gameState, isDisplay }) {
  const [advancing, setAdvancing] = useState(false);
  
  // NO auto-advance from scoring - Host must manually continue
  
  const handleAdvance = async () => {
    if (advancing) return;
    
    setAdvancing(true);
    
    const timeoutId = setTimeout(() => {
      console.warn('Advance timeout - re-enabling button');
      setAdvancing(false);
    }, 10000);
    
    try {
      await gameApi.advancePhase(gameCode, playerId);
      clearTimeout(timeoutId);
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Error advancing:', err);
      alert('Failed to advance. Please try again.');
      setAdvancing(false);
    }
  };
  
  const scores = gameState?.scores || [];
  const currentRound = gameData?.currentRound;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Matrix Display */}
        <div className="bg-white rounded-2xl shadow-lg p-3 md:p-6 mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4 md:mb-6 text-gray-800">
            Scores Updated!
          </h2>
          
          <RevealedMatrix
            roundData={roundData}
            gameData={gameData}
            gameState={gameState}
          />
        </div>
        
        {/* Score Display */}
        <div className="bg-white rounded-2xl shadow-lg p-3 md:p-6 mb-6">
          <h3 className="text-xl md:text-2xl font-bold text-center mb-4 text-gray-800">
            Round {currentRound} Results
          </h3>
          
          <div className="space-y-3 max-w-2xl mx-auto">
            {scores
              .map(score => {
                const player = gameData.players.find(p => p.playerId === score.playerId);
                if (!player) return null;
                
                const roundScore = score.roundScores?.[currentRound] || 0;
                
                return {
                  ...score,
                  player,
                  roundScore: parseFloat(roundScore)
                };
              })
              .filter(Boolean)
              .sort((a, b) => b.roundScore - a.roundScore) // Sort by THIS ROUND'S score
              .map(({ player, roundScore, totalPoints }, index) => (
                <div 
                  key={player.playerId} 
                  className="flex items-center justify-between p-3 md:p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200"
                >
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="text-2xl font-bold text-gray-400 w-8">
                      {index + 1}
                    </div>
                    <div 
                      className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-base"
                      style={{ backgroundColor: player.color }}
                    >
                      {player.initials}
                    </div>
                    <div className="font-semibold text-base md:text-lg">{player.name}</div>
                  </div>
                  
                  <div className="flex items-center gap-4 md:gap-6">
                    <div className="text-right">
                      <div className="text-xl md:text-2xl font-bold text-green-600">
                        +{Math.round(roundScore)}
                      </div>
                      <div className="text-xs text-gray-500">Round</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl md:text-3xl font-bold text-gray-800">
                        {Math.round(parseFloat(totalPoints))}
                      </div>
                      <div className="text-xs text-gray-500">Total</div>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
        
        {/* Continue button for host - always show, even with displays */}
        {isHost && (
          <button
            onClick={handleAdvance}
            disabled={advancing}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 md:py-4 rounded-lg text-base md:text-lg transition duration-200"
          >
            {advancing ? 'Continuing...' : 'Continue'}
          </button>
        )}
      </div>
    </div>
  );
}
