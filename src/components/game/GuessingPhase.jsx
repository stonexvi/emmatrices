import { useState, useEffect } from 'react';
import { gameApi } from '../../utils/gameApi';
import { useAutoAdvance } from '../../hooks/useAutoAdvance';

export default function GuessingPhase({ 
  gameCode, 
  playerId, 
  playerInitials, 
  playerColor, 
  roundData, 
  gameData,
  gameState,
  isHost,
  onComplete 
}) {
  const [hasGuessed, setHasGuessed] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [timeLeft, setTimeLeft] = useState(20);
  const [submitting, setSubmitting] = useState(false);
  const [showRandomNotification, setShowRandomNotification] = useState(false);
  const [showSubmitButton, setShowSubmitButton] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(null);

  // Determine target based on game mode
  const gameMode = gameData.settings?.gameMode || 'standard';
  let targetPlayerId;
  
  if (gameMode === 'headtohead') {
    // Head-to-head: guess the OTHER player
    const playerOrder = gameData.playerOrder || [];
    if (playerOrder.length === 2) {
      targetPlayerId = playerOrder.find(pid => pid !== playerId);
    }
  } else {
    // Standard mode: use current target
    const targetPlayerIndex = gameData.currentPlayerIndex;
    targetPlayerId = gameData.playerOrder[targetPlayerIndex];
  }

  const targetPlayer = gameData.players.find(p => p.playerId === targetPlayerId);

  const isGuessingOwnPosition = targetPlayerId === playerId;

  const [xLabelLeft, xLabelRight] = roundData.matrixLabels.xLabel.split('/').map(s => s.trim());
  const [yLabelBottom, yLabelTop] = roundData.matrixLabels.yLabel.split('/').map(s => s.trim());

  const phaseStatus = gameState?.phaseStatus;
  
  useAutoAdvance(gameCode, playerId, isHost, phaseStatus, 1000);

  const useTimers = gameData.settings?.useTimers || false;

  useEffect(() => {
    if (hasGuessed || isGuessingOwnPosition || !useTimers) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (!hasGuessed) {
            handleSubmit(selectedPosition); // Use selected or random
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [hasGuessed, isGuessingOwnPosition, selectedPosition, useTimers]);

  useEffect(() => {
    setShowSubmitButton(!hasGuessed && !isGuessingOwnPosition);
  }, [hasGuessed, isGuessingOwnPosition]);

  useEffect(() => {
    if (showRandomNotification) {
      const timeout = setTimeout(() => {
        setShowRandomNotification(false);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [showRandomNotification]);

  const handleCanvasMove = (e) => {
    if (hasGuessed) return;

    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    
    const moveX = e.clientX - rect.left;
    const moveY = e.clientY - rect.top;
    
    setCursorPosition({ x: moveX, y: moveY });
  };

  const handleCanvasLeave = () => {
    setCursorPosition(null);
  };

  const handleCanvasClick = (e) => {
    if (hasGuessed || isGuessingOwnPosition) return;

    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    const x = ((clickX / rect.width) - 0.5) * 100;
    const y = ((0.5 - (clickY / rect.height)) * 100);
    
    const clampedX = Math.max(-50, Math.min(50, x));
    const clampedY = Math.max(-50, Math.min(50, y));

    setSelectedPosition({
      x: Math.round(clampedX * 10) / 10,
      y: Math.round(clampedY * 10) / 10
    });
  };

  const handleSubmit = async (position = selectedPosition) => {
    if (hasGuessed || isGuessingOwnPosition) return;

    const isRandom = !position;
    let finalPosition = position;

    setSubmitting(true);
    try {
      const result = await gameApi.submitGuess(
        gameCode,
        gameData.currentRound,
        playerId,
        targetPlayerId,
        finalPosition?.x,
        finalPosition?.y,
        isRandom
      );
      
      setHasGuessed(true);
      
      if (isRandom && result.guess) {
        setSelectedPosition(result.guess);
        setShowRandomNotification(true);
      }
    } catch (err) {
      console.error('Error submitting guess:', err);
      alert('Failed to submit guess');
    } finally {
      setSubmitting(false);
    }
  };

  const coordToPercent = (coord) => {
    return ((coord + 50) / 100) * 100;
  };

  if (isGuessingOwnPosition) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            It's your turn!
          </h2>
          <p className="text-gray-600">
            Other players are guessing where you placed yourself.
          </p>
          {phaseStatus?.allPlayersReady ? (
            <p className="text-sm text-green-600 font-semibold mt-4">
              ✓ All guesses submitted! Revealing soon...
            </p>
          ) : (
            <p className="text-sm text-gray-500 mt-4">
              Waiting for all guesses... ({phaseStatus?.playersReady}/{phaseStatus?.playersTotal})
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">
            Where did {targetPlayer?.name} place themselves?
          </h1>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: targetPlayer?.color }}
            >
              {targetPlayer?.initials}
            </div>
          </div>
          
          {!hasGuessed && useTimers && (
            <div className="flex items-center justify-center gap-4">
              <div className="text-3xl font-bold text-orange-600">
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </div>
            </div>
          )}

          {hasGuessed && !phaseStatus?.allPlayersReady && (
            <div className="text-center text-green-600 font-medium">
              ✓ Guess submitted! Waiting for others... ({phaseStatus?.playersReady}/{phaseStatus?.playersTotal})
            </div>
          )}

          {phaseStatus?.allPlayersReady && (
            <div className="text-center text-green-600 font-bold animate-pulse">
              ✓ All guesses submitted! Revealing...
            </div>
          )}
        </div>

        {showRandomNotification && (
          <div className="mb-6 p-4 bg-yellow-100 border-2 border-yellow-400 rounded-xl animate-fade-in">
            <p className="text-yellow-800 font-semibold text-center">🎲 Random Guess Placed</p>
            <p className="text-sm text-yellow-700 text-center mt-1">Time ran out - a random position was selected for you</p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex flex-col items-center">
            <div className="mb-3 text-sm font-semibold text-gray-700">{yLabelTop}</div>

            <div className="flex items-center gap-4 w-full">
              <div className="w-16 text-xs font-semibold text-gray-700 text-right">{xLabelLeft}</div>

              <div className="flex-1 max-w-xl mx-auto">
                <div
                  onClick={handleCanvasClick}
                  onMouseMove={handleCanvasMove}
                  onMouseLeave={handleCanvasLeave}
                  className="relative bg-white rounded-lg shadow-lg w-full"
                  style={{ 
                    aspectRatio: '1 / 1', 
                    width: '100%', 
                    maxWidth: 'min(600px, 90vw)', 
                    margin: '0 auto',
                    cursor: (!hasGuessed) ? 'none' : 'default'  // Hide native cursor only
                  }}
                >
                  <div className="absolute left-0 w-full bg-gray-400" style={{ height: '2px', top: '50%', transform: 'translateY(-50%)' }} />
                  <div className="absolute top-0 h-full bg-gray-400" style={{ width: '2px', left: '50%', transform: 'translateX(-50%)' }} />

                  {selectedPosition && (
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        left: `${coordToPercent(selectedPosition.x)}%`,
                        top: `${coordToPercent(-selectedPosition.y)}%`,
                      }}
                    >
                      <div style={{ transform: 'translate(-50%, -50%)', position: 'relative' }}>
                        <svg width="20" height="20">
                          <line x1="2" y1="2" x2="18" y2="18" stroke={playerColor} strokeWidth="3" strokeLinecap="round" />
                          <line x1="18" y1="2" x2="2" y2="18" stroke={playerColor} strokeWidth="3" strokeLinecap="round" />
                        </svg>
                        <div 
                          className="text-xs font-bold text-center absolute"
                          style={{ 
                            color: playerColor,
                            top: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {targetPlayer?.initials}?
                        </div>
                      </div>
                    </div>
                  )}
                  {cursorPosition && !hasGuessed && (
                    <div
                      className="absolute pointer-events-none z-50"
                      style={{
                        left: `${cursorPosition.x}px`,
                        top: `${cursorPosition.y}px`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      <svg width="20" height="20" style={{ display: 'block' }}>
                        <line x1="2" y1="2" x2="18" y2="18" stroke={playerColor} strokeWidth="3" strokeLinecap="round" opacity="0.4" />
                        <line x1="18" y1="2" x2="2" y2="18" stroke={playerColor} strokeWidth="3" strokeLinecap="round" opacity="0.4" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              <div className="w-16 text-xs font-semibold text-gray-700 text-left">{xLabelRight}</div>
            </div>

            <div className="mt-3 text-sm font-semibold text-gray-700">{yLabelBottom}</div>
          </div>

          {showSubmitButton && selectedPosition && (
            <button
              onClick={() => handleSubmit()}
              disabled={submitting}
              className="mt-6 w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-lg transition duration-200"
            >
              {submitting ? 'Submitting...' : 'Submit Guess'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
