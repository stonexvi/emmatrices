export default function RevealedMatrix({ roundData, gameData, gameState }) {
  const matrixLabels = roundData?.matrixLabels || {};
  const [xLabelLeft, xLabelRight] = (matrixLabels.xLabel || '/ ').split('/').map(s => s.trim());
  const [yLabelBottom, yLabelTop] = (matrixLabels.yLabel || '/ ').split('/').map(s => s.trim());
  
  const gameMode = gameState?.phaseStatus?.gameMode || 'standard';
  const currentPlayerIndex = gameData?.currentPlayerIndex;
  const playerOrder = gameData?.playerOrder || [];
  
  // Get the TARGET player (the one being guessed)
  const targetPlayerId = playerOrder[currentPlayerIndex];
  const targetPlayer = gameData.players.find(p => p.playerId === targetPlayerId);
  const targetMark = roundData?.playerMarks?.[targetPlayerId];
  
  // Get all guesses for this target
  const guesses = gameState?.currentGuesses || [];
  
  // Coordinate conversion
  const coordToPercent = (coord) => ((coord + 50) / 100) * 100;
  
  return (
    <div className="flex flex-col items-center">
      {/* Top label */}
      <div className="mb-3 text-lg font-semibold text-gray-700">{yLabelTop}</div>
      
      <div className="flex items-center w-full max-w-4xl gap-4">
        {/* Left label */}
        <div className="w-12 m:w-16 md:w-24 text-sm md:text-base font-semibold text-gray-700 text-right">
          {xLabelLeft}
        </div>
        
        {/* SVG Matrix */}
        <div className="flex-1">
          <svg
            viewBox="0 0 500 500"
            className="w-full rounded-lg shadow-lg"
            style={{ aspectRatio: '1 / 1', backgroundColor: 'white' }}
          >
            {/* Axes */}
            <line x1="0" y1="250" x2="500" y2="250" stroke="#9ca3af" strokeWidth="2" />
            <line x1="250" y1="0" x2="250" y2="500" stroke="#9ca3af" strokeWidth="2" />
            
            {/* Target player's actual mark */}
            {targetMark && targetPlayer && (
              <g>
                <line 
                  x1={coordToPercent(targetMark.x) * 5 - 10} 
                  y1={coordToPercent(-targetMark.y) * 5 - 10} 
                  x2={coordToPercent(targetMark.x) * 5 + 10} 
                  y2={coordToPercent(-targetMark.y) * 5 + 10} 
                  stroke={targetPlayer.color} 
                  strokeWidth="4" 
                  strokeLinecap="round" 
                />
                <line 
                  x1={coordToPercent(targetMark.x) * 5 + 10} 
                  y1={coordToPercent(-targetMark.y) * 5 - 10} 
                  x2={coordToPercent(targetMark.x) * 5 - 10} 
                  y2={coordToPercent(-targetMark.y) * 5 + 10} 
                  stroke={targetPlayer.color} 
                  strokeWidth="4" 
                  strokeLinecap="round" 
                />
                <text 
                  x={coordToPercent(targetMark.x) * 5} 
                  y={coordToPercent(-targetMark.y) * 5 + 25} 
                  fontSize="14" 
                  fontWeight="bold" 
                  fill={targetPlayer.color} 
                  textAnchor="middle"
                >
                  {targetPlayer.initials}
                </text>
              </g>
            )}
            
            {/* All guesses with lines to target */}
            {targetMark && guesses.map(guess => {
              const guesser = gameData.players.find(p => p.playerId === guess.guessingPlayerId);
              
              if (!guesser) return null;
              
              // Guess coordinates (already in -50 to +50 range from backend)
              const guessX = parseFloat(guess.guessX) * 5 + 250;
              const guessY = 250 - parseFloat(guess.guessY) * 5;
              
              // Target coordinates
              const targetX = coordToPercent(targetMark.x) * 5;
              const targetY = coordToPercent(-targetMark.y) * 5;
              
              // Calculate rank for this guess
              const sortedGuesses = [...guesses]
                .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
              const rank = sortedGuesses.findIndex(g => g.guessingPlayerId === guess.guessingPlayerId) + 1;
              
              // Medal/rank styling
              const getRankStyle = () => {
                if (rank === 1) return { color: '#FFD700' };
                if (rank === 2) return { color: '#C0C0C0' };
                if (rank === 3) return { color: '#CD7F32' };
                return { color: '#9ca3af' };
              };
              
              const rankStyle = getRankStyle();
              
              return (
                <g key={guess.guessingPlayerId}>
                  {/* Line from guess to target - RENDER FIRST (under everything) */}
                  <line 
                    x1={guessX} 
                    y1={guessY} 
                    x2={targetX} 
                    y2={targetY} 
                    stroke={rankStyle.color} 
                    strokeWidth="2" 
                    strokeDasharray="5,5"
                    opacity="0.8"
                  />
                  
                  {/* Guess X mark (not circle) */}
                  <line 
                    x1={guessX - 8} 
                    y1={guessY - 8} 
                    x2={guessX + 8} 
                    y2={guessY + 8} 
                    stroke={guesser.color} 
                    strokeWidth="3" 
                    strokeLinecap="round" 
                  />
                  <line 
                    x1={guessX + 8} 
                    y1={guessY - 8} 
                    x2={guessX - 8} 
                    y2={guessY + 8} 
                    stroke={guesser.color} 
                    strokeWidth="3" 
                    strokeLinecap="round" 
                  />
                  
                  {/* Rank indicator */}
                  <circle 
                    cx={guessX + 15} 
                    cy={guessY - 15} 
                    r="12" 
                    fill="white" 
                    stroke={rankStyle.color} 
                    strokeWidth="2"
                  />
                  <text 
                    x={guessX + 15} 
                    y={guessY - 11} 
                    fontSize="10" 
                    fontWeight="bold" 
                    fill={rankStyle.color} 
                    textAnchor="middle"
                  >
                    {rank}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        
        {/* Right label */}
        <div className="w-12 m:w-16 md:w-24 text-sm md:text-base font-semibold text-gray-700">
          {xLabelRight}
        </div>
      </div>
      
      {/* Bottom label */}
      <div className="mt-3 text-lg font-semibold text-gray-700">{yLabelBottom}</div>
    </div>
  );
}
