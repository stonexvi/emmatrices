import { useState, useEffect } from 'react';
import { gameApi } from '../../utils/gameApi';
import { useAutoAdvance } from '../../hooks/useAutoAdvance';

export default function PlacementPhase({ 
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
  const [hasPlaced, setHasPlaced] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmButton, setShowConfirmButton] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(null);

  const useTimers = gameData.settings?.useTimers || false;

  const [xLabelLeft, xLabelRight] = roundData.matrixLabels.xLabel.split('/').map(s => s.trim());
  const [yLabelBottom, yLabelTop] = roundData.matrixLabels.yLabel.split('/').map(s => s.trim());

  const phaseStatus = gameState?.phaseStatus;
  
  useAutoAdvance(gameCode, playerId, isHost, phaseStatus, 3000);

  useEffect(() => {
    if (roundData.playerMarks && roundData.playerMarks[playerId]) {
      setHasPlaced(true);
      const mark = roundData.playerMarks[playerId];
      setSelectedPosition({ x: mark.x, y: mark.y });
    }
  }, [roundData, playerId]);

  // Timer countdown
  useEffect(() => {
    if (hasPlaced || !useTimers) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (selectedPosition) {
            handleConfirm();
          }
          // If no position, player just doesn't place (not random for placement)
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [hasPlaced, selectedPosition, useTimers]);

  // Show confirm button when position selected
  useEffect(() => {
    setShowConfirmButton(!!selectedPosition && !hasPlaced);
  }, [selectedPosition, hasPlaced]);

  const handleCanvasMove = (e) => {
    if (hasPlaced) return;

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
    if (hasPlaced) return;

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

  const handleConfirm = async () => {
    if (!selectedPosition || hasPlaced) return;

    setSubmitting(true);
    try {
      await gameApi.placeMark(
        gameCode,
        gameData.currentRound,
        playerId,
        selectedPosition.x,
        selectedPosition.y
      );
      setHasPlaced(true);
    } catch (err) {
      console.error('Error placing mark:', err);
      alert('Failed to place mark');
    } finally {
      setSubmitting(false);
    }
  };

  const coordToPercent = (coord) => {
    return ((coord + 50) / 100) * 100;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">
            Place Yourself on the Matrix
          </h1>
          <div className="text-center text-gray-600 mb-4">
            Round {gameData.currentRound} of {gameData.settings.roundCount}
          </div>
          
          {!hasPlaced && useTimers && (
            <div className="flex items-center justify-center gap-4">
              <div className="text-3xl font-bold text-blue-600">
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </div>
            </div>
          )}

          {hasPlaced && !phaseStatus?.allPlayersReady && (
            <div className="text-center text-green-600 font-medium">
              ✓ Waiting for others... ({phaseStatus?.playersReady}/{phaseStatus?.playersTotal})
            </div>
          )}

          {phaseStatus?.allPlayersReady && (
            <div className="text-center text-green-600 font-bold text-xl animate-pulse">
              ✓ All players ready! Advancing in 3 seconds...
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex flex-col items-center">
            <div className="mb-3 text-sm font-semibold text-gray-700">{yLabelTop}</div>

            <div className="flex items-center gap-4 w-full">
              <div className="w-16 text-xs font-semibold text-gray-700 text-right">{xLabelLeft}</div>

              <div className="flex-1 mx-auto">
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
                    cursor: (!hasPlaced) ? 'none' : 'default'  // Hide native cursor only
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
                          {playerInitials}
                        </div>
                      </div>
                    </div>
                  )}
                  {cursorPosition && !hasPlaced && (
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
          {showConfirmButton && (
            <button
              onClick={handleConfirm}
              disabled={submitting}
              className="mt-6 w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-lg transition duration-200"
            >
              {submitting ? 'Confirming...' : 'Confirm Position'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}