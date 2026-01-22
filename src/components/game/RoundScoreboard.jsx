import { useState } from 'react';
import { gameApi } from '../../utils/gameApi';

export default function RoundScoreboard({ 
  gameCode, 
  playerId, 
  isHost, 
  roundData, 
  gameData, 
  gameState 
}) {
  const [advancing, setAdvancing] = useState(false);
  
  const currentRound = gameData.currentRound;
  const totalRounds = gameData.settings.roundCount;
  const isLastRound = currentRound >= totalRounds;

  const [xLabelLeft, xLabelRight] = roundData.matrixLabels.xLabel.split('/').map(s => s.trim());
  const [yLabelBottom, yLabelTop] = roundData.matrixLabels.yLabel.split('/').map(s => s.trim());

  const scores = gameState.scores || [];
  
  const sortedScores = [...scores].sort((a, b) => 
    parseFloat(b.totalPoints || 0) - parseFloat(a.totalPoints || 0)
  );

  const coordToPercent = (coord) => {
    return ((coord + 50) / 100) * 100;
  };

  const handleContinue = async () => {
    if (advancing) return;
    
    setAdvancing(true);
    try {
      await gameApi.advancePhase(gameCode, playerId);
    } catch (err) {
      console.error('Error advancing:', err);
      alert('Failed to advance. Please try again.');
      setAdvancing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Round {currentRound} Complete!
          </h1>
          <p className="text-gray-600">
            {isLastRound ? 'Game finished!' : `Starting round ${currentRound + 1} next`}
          </p>
        </div>

        {/* Matrix with all marks */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
            All Player Positions
          </h2>
          <div className="flex flex-col items-center">
            <div className="mb-3 text-sm font-semibold text-gray-700">{yLabelTop}</div>

            <div className="flex items-center gap-4 w-full">
              <div className="w-16 text-xs font-semibold text-gray-700 text-right">{xLabelLeft}</div>

              <div className="flex-1" style={{ maxWidth: '400px', margin: '0 auto' }}>
                <svg
                  viewBox="0 0 500 500"
                  className="w-full rounded-lg shadow-lg"
                  style={{ aspectRatio: '1 / 1', backgroundColor: 'white' }}
                >
                  <line x1="0" y1="250" x2="500" y2="250" stroke="#9ca3af" strokeWidth="2" />
                  <line x1="250" y1="0" x2="250" y2="500" stroke="#9ca3af" strokeWidth="2" />

                  {gameData.players.map((player) => {
                    const mark = roundData.playerMarks[player.playerId];
                    if (!mark) return null;

                    const x = coordToPercent(mark.x) * 5;
                    const y = coordToPercent(-mark.y) * 5;

                    return (
                      <g key={player.playerId}>
                        <line x1={x - 10} y1={y - 10} x2={x + 10} y2={y + 10} stroke={player.color} strokeWidth="4" strokeLinecap="round" />
                        <line x1={x + 10} y1={y - 10} x2={x - 10} y2={y + 10} stroke={player.color} strokeWidth="4" strokeLinecap="round" />
                        <text 
                          x={x} 
                          y={y + 25} 
                          fontSize="14" 
                          fontWeight="bold" 
                          fill={player.color} 
                          textAnchor="middle"
                        >
                          {player.initials}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div className="w-16 text-xs font-semibold text-gray-700 text-left">{xLabelRight}</div>
            </div>

            <div className="mt-3 text-sm font-semibold text-gray-700">{yLabelBottom}</div>
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            {gameData.players.map((player) => (
              <div key={player.playerId} className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                  style={{ backgroundColor: player.color }}
                >
                  {player.initials}
                </div>
                <span className="text-sm font-medium text-gray-700">{player.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scores table */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Leaderboard</h2>
          <div className="space-y-2">
            {sortedScores.map((score, index) => {
              const player = gameData.players.find(p => p.playerId === score.playerId);
              if (!player) return null;

              const isTop3 = index < 3;
              const bgColor = index === 0 ? '#FFD70020' : index === 1 ? '#C0C0C020' : index === 2 ? '#CD7F3220' : 'transparent';

              return (
                <div 
                  key={score.playerId}
                  className="flex items-center justify-between p-4 rounded-lg border-2"
                  style={{ 
                    backgroundColor: bgColor,
                    borderColor: isTop3 ? (index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32') : '#e5e7eb'
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold text-gray-400 w-8">
                      {index + 1}
                    </div>
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: player.color }}
                    >
                      {player.initials}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{player.name}</div>
                      <div className="text-sm text-gray-500">
                        Round {currentRound}: +{score.roundScores?.[currentRound.toString()] || 0} pts
                      </div>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-800">
                    {Math.round(parseFloat(score.totalPoints || 0))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Continue button */}
        {isHost && (
          <button
            onClick={handleContinue}
            disabled={advancing}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-lg transition duration-200 shadow-lg text-lg"
          >
            {advancing 
              ? 'Advancing...' 
              : (isLastRound ? 'View Final Results' : `Start Round ${currentRound + 1}`)
            }
          </button>
        )}

        {!isHost && (
          <div className="text-center text-gray-600 text-lg">
            Waiting for host to continue...
          </div>
        )}
      </div>
    </div>
  );
}