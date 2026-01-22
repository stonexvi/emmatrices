import { useState, useEffect } from 'react';
import { gameApi } from '../../utils/gameApi';

const PODIUM_COLORS = {
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32'
};

export default function RevealPhase({ 
  gameCode, 
  playerId, 
  isHost, 
  roundData, 
  gameData, 
  gameState 
}) {
  const gameMode = gameData.settings?.gameMode || 'standard';
  
  const [animationStage, setAnimationStage] = useState('guesses');
  const [revealedGuessIndex, setRevealedGuessIndex] = useState(-1);
  const [currentLineStep, setCurrentLineStep] = useState('none');
  const [currentRankRevealing, setCurrentRankRevealing] = useState(3);
  const [guessOpacities, setGuessOpacities] = useState({});
  const [linesDrawn, setLinesDrawn] = useState([]);
  const [animatingLineKey, setAnimatingLineKey] = useState(0);
  const [advancing, setAdvancing] = useState(false);
  
  // Head-to-head specific state
  const [h2hRevealedMarks, setH2hRevealedMarks] = useState([]);
  const [h2hRevealedGuesses, setH2hRevealedGuesses] = useState([]); // Track which guesses are visible
  const [h2hAnimatingLine, setH2hAnimatingLine] = useState(null);

  const targetPlayerIndex = gameData.currentPlayerIndex;
  const targetPlayerId = gameData.playerOrder[targetPlayerIndex];
  const targetPlayer = gameData.players.find(p => p.playerId === targetPlayerId);
  
  const actualMark = roundData.playerMarks[targetPlayerId];
  const guesses = gameState.currentGuesses || [];
  
  const rankedGuesses = [...guesses]
    .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))
    .slice(0, 3)
    .map((guess, index) => ({
      ...guess,
      rank: index + 1,
      color: index === 0 ? PODIUM_COLORS.gold : index === 1 ? PODIUM_COLORS.silver : PODIUM_COLORS.bronze
    }));

  const [xLabelLeft, xLabelRight] = roundData.matrixLabels.xLabel.split('/').map(s => s.trim());
  const [yLabelBottom, yLabelTop] = roundData.matrixLabels.yLabel.split('/').map(s => s.trim());

  // Main animation sequence - STANDARD MODE (unchanged)
  useEffect(() => {
    if (gameMode !== 'standard') return; // Skip if not standard mode
    
    if (animationStage === 'guesses') {
      if (revealedGuessIndex < guesses.length - 1) {
        const timer = setTimeout(() => {
          setRevealedGuessIndex(prev => prev + 1);
        }, 2500);
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => {
          setAnimationStage('target');
        }, 2500);
        return () => clearTimeout(timer);
      }
    } else if (animationStage === 'target') {
      const timer = setTimeout(() => {
        setAnimationStage('lines');
        setCurrentLineStep('drawing');
        setAnimatingLineKey(prev => prev + 1);
      }, 1500);
      return () => clearTimeout(timer);
    } else if (animationStage === 'lines') {
      if (currentLineStep === 'drawing') {
        const timer = setTimeout(() => {
          setCurrentLineStep('highlighting');
          
          const rankedGuessesSorted = [...guesses]
            .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))
            .slice(0, 3)
            .map((guess, index) => ({
              ...guess,
              rank: index + 1,
            }));
          
          const guessForRank = rankedGuessesSorted.find(g => g.rank === currentRankRevealing);
          if (guessForRank) {
            setGuessOpacities(prev => ({
              ...prev,
              [guessForRank.guessingPlayerId]: 1
            }));
            
            setLinesDrawn(prev => [...prev, currentRankRevealing]);
          }
        }, 1500);
        return () => clearTimeout(timer);
      } else if (currentLineStep === 'highlighting') {
        const timer = setTimeout(() => {
          if (currentRankRevealing > 1) {
            setCurrentRankRevealing(prev => prev - 1);
            setCurrentLineStep('drawing');
            setAnimatingLineKey(prev => prev + 1);
          } else {
            setAnimationStage('complete');
          }
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [animationStage, revealedGuessIndex, currentLineStep, currentRankRevealing, guesses.length]);

  // Head-to-head animation sequence
  useEffect(() => {
    if (gameMode !== 'headtohead' || guesses.length !== 2) return;
    
    const guess1 = guesses[0];
    const guess2 = guesses[1];
    const distance1 = parseFloat(guess1.distance);
    const distance2 = parseFloat(guess2.distance);
    const distanceDiff = Math.abs(distance1 - distance2);
    const isCloseOrTie = distanceDiff < 5; // Within 5 units = "close"
    
    // Determine winner/loser
    let winnerGuess = null;
    let loserGuess = null;
    
    if (distance1 < distance2) {
      winnerGuess = guess1;
      loserGuess = guess2;
    } else if (distance2 < distance1) {
      winnerGuess = guess2;
      loserGuess = guess1;
    }
    
    if (animationStage === 'guesses') {
      // Show first guess
      setH2hRevealedGuesses([guess1.guessingPlayerId]);
      const timer = setTimeout(() => {
        setAnimationStage('show_guess2');
      }, 1000);
      return () => clearTimeout(timer);
    } else if (animationStage === 'show_guess2') {
      // Show second guess
      setH2hRevealedGuesses([guess1.guessingPlayerId, guess2.guessingPlayerId]);
      const timer = setTimeout(() => {
        setAnimationStage('pause');
      }, 1000);
      return () => clearTimeout(timer);
    } else if (animationStage === 'pause') {
      // Pause for discussion (1.5 seconds)
      const timer = setTimeout(() => {
        if (isCloseOrTie) {
          // Draw both lines simultaneously
          setAnimationStage('draw_both_lines');
        } else {
          // Draw loser's line first
          setAnimationStage('draw_loser_line');
        }
      }, 1500);
      return () => clearTimeout(timer);
    } else if (animationStage === 'draw_both_lines') {
      // Animate both lines simultaneously
      const target1 = gameData.playerOrder.find(pid => pid !== guess1.guessingPlayerId);
      const target2 = gameData.playerOrder.find(pid => pid !== guess2.guessingPlayerId);
      setH2hAnimatingLine({ simultaneous: true });
      setAnimatingLineKey(prev => prev + 1);
      
      // Show marks slightly before line completes (at 1.2s of 1.5s animation)
      const markTimer = setTimeout(() => {
        setH2hRevealedMarks([target1, target2]);
      }, 1200);
      
      const timer = setTimeout(() => {
        setH2hAnimatingLine(null);
        setAnimationStage('complete');
      }, 1500);
      
      return () => {
        clearTimeout(timer);
        clearTimeout(markTimer);
      };
    } else if (animationStage === 'draw_loser_line' && loserGuess) {
      // Animate loser's line
      const loserTargetId = gameData.playerOrder.find(pid => pid !== loserGuess.guessingPlayerId);
      setH2hAnimatingLine({ from: loserGuess.guessingPlayerId, to: loserTargetId });
      setAnimatingLineKey(prev => prev + 1);
      
      // Show mark slightly before line completes
      const markTimer = setTimeout(() => {
        setH2hRevealedMarks([loserTargetId]);
      }, 1200);
      
      const timer = setTimeout(() => {
        setH2hAnimatingLine(null);
        setAnimationStage('draw_winner_line');
      }, 1500);
      
      return () => {
        clearTimeout(timer);
        clearTimeout(markTimer);
      };
    } else if (animationStage === 'draw_winner_line' && winnerGuess) {
      // Animate winner's line
      const winnerTargetId = gameData.playerOrder.find(pid => pid !== winnerGuess.guessingPlayerId);
      setH2hAnimatingLine({ from: winnerGuess.guessingPlayerId, to: winnerTargetId });
      setAnimatingLineKey(prev => prev + 1);
      
      // Show mark slightly before line completes
      const markTimer = setTimeout(() => {
        setH2hRevealedMarks(prev => [...prev, winnerTargetId]);
      }, 1200);
      
      const timer = setTimeout(() => {
        setH2hAnimatingLine(null);
        setAnimationStage('complete');
      }, 1500);
      
      return () => {
        clearTimeout(timer);
        clearTimeout(markTimer);
      };
    }
  }, [animationStage, guesses, gameMode, gameData.playerOrder]);

  const coordToPercent = (coord) => {
    return ((coord + 50) / 100) * 100;
  };

  const getGuessPlayer = (guessingPlayerId) => {
    return gameData.players.find(p => p.playerId === guessingPlayerId);
  };

  const getGuessOpacity = (guess) => {
    if (gameMode === 'headtohead') {
      // Head-to-head: show guess only if it's been revealed, then keep it visible
      return h2hRevealedGuesses.includes(guess.guessingPlayerId) ? 1 : 0;
    }
    
    // Standard mode (unchanged)
    const guessingPlayerId = guess.guessingPlayerId;
    
    if (animationStage === 'lines' || animationStage === 'complete') {
      return guessOpacities[guessingPlayerId] || 0.3;
    }
    
    if (animationStage === 'guesses') {
      const guessIndex = guesses.findIndex(g => g.guessingPlayerId === guessingPlayerId);
      if (guessIndex < revealedGuessIndex) {
        return 0.3;
      } else if (guessIndex === revealedGuessIndex) {
        return 1;
      }
      return 0;
    }
    
    if (animationStage === 'target') {
      return 0.3;
    }
    
    return 0;
  };

  const shouldShowInitials = (guess) => {
    if (gameMode === 'headtohead') return false; // Don't show fading initials in h2h
    
    if (animationStage === 'guesses') {
      const guessIndex = guesses.findIndex(g => g.guessingPlayerId === guess.guessingPlayerId);
      return guessIndex === revealedGuessIndex;
    }
    return false;
  };

  const handleContinue = async () => {
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

  // HEAD-TO-HEAD SCORING DISPLAY
  const renderHeadToHeadScoring = () => {
    if (guesses.length !== 2) return null;

    const guess1 = guesses[0];
    const guess2 = guesses[1];
    const player1 = getGuessPlayer(guess1.guessingPlayerId);
    const player2 = getGuessPlayer(guess2.guessingPlayerId);
    
    const distance1 = parseFloat(guess1.distance);
    const distance2 = parseFloat(guess2.distance);
    
    let winner = null;
    let isTie = false;
    
    if (distance1 < distance2) {
      winner = player1;
    } else if (distance2 < distance1) {
      winner = player2;
    } else {
      isTie = true;
    }

    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 animate-fade-in">
        <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Round Result</h2>
        
        <div className="space-y-3 mb-6">
          <div 
            className={`flex items-center justify-between p-4 rounded-lg border-2 ${
              winner?.playerId === player1?.playerId ? 'border-green-500 bg-green-50' : 'border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: player1?.color }}
              >
                {player1?.initials}
              </div>
              <div>
                <div className="font-semibold text-gray-800">{player1?.name}</div>
                <div className="text-sm text-gray-500">Distance: {distance1.toFixed(1)} units</div>
              </div>
            </div>
            {winner?.playerId === player1?.playerId && (
              <div className="text-2xl font-bold text-green-600">+1</div>
            )}
          </div>

          <div 
            className={`flex items-center justify-between p-4 rounded-lg border-2 ${
              winner?.playerId === player2?.playerId ? 'border-green-500 bg-green-50' : 'border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: player2?.color }}
              >
                {player2?.initials}
              </div>
              <div>
                <div className="font-semibold text-gray-800">{player2?.name}</div>
                <div className="text-sm text-gray-500">Distance: {distance2.toFixed(1)} units</div>
              </div>
            </div>
            {winner?.playerId === player2?.playerId && (
              <div className="text-2xl font-bold text-green-600">+1</div>
            )}
          </div>
        </div>

        <div className="text-center p-4 bg-gray-50 rounded-lg">
          {isTie ? (
            <div>
              <div className="text-xl font-bold text-gray-700 mb-1">It's a Tie!</div>
              <div className="text-sm text-gray-600">No points awarded this round</div>
            </div>
          ) : (
            <div>
              <div className="text-xl font-bold text-gray-800 mb-1">
                {winner?.name} wins this round!
              </div>
              <div className="text-sm text-gray-600">Closest guess wins 1 point</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // STANDARD MODE SCORING DISPLAY (unchanged)
  const renderStandardScoring = () => {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 animate-fade-in">
        <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Scoring</h2>
        
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Best Guesses</h3>
          <div className="space-y-3">
            {rankedGuesses.map((rankedGuess) => {
              const player = getGuessPlayer(rankedGuess.guessingPlayerId);
              const points = rankedGuess.rank === 1 ? 5 : rankedGuess.rank === 2 ? 3 : 1;
              const rankText = rankedGuess.rank === 1 ? '1st' : rankedGuess.rank === 2 ? '2nd' : '3rd';

              return (
                <div 
                  key={rankedGuess.guessingPlayerId}
                  className="flex items-center justify-between p-4 rounded-lg"
                  style={{ backgroundColor: `${rankedGuess.color}20` }}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: rankedGuess.color }}
                    >
                      {rankText}
                    </div>
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: player?.color }}
                    >
                      {player?.initials}
                    </div>
                    <div className="font-semibold text-gray-800">{player?.name}</div>
                  </div>
                  <div className="text-2xl font-bold" style={{ color: rankedGuess.color }}>
                    +{points}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {(() => {
          const distance_thresholds = [
            { max_distance: 15, points: 2 },
          ];
          
          let targetBonus = 0;
          let closeGuessCount = 0;
          
          guesses.forEach(guess => {
            const distance = parseFloat(guess.distance);
            for (const threshold of distance_thresholds) {
              if (distance <= threshold.max_distance) {
                targetBonus += threshold.points;
                closeGuessCount++;
                break;
              }
            }
          });
          
          if (targetBonus > 0) {
            return (
              <div className="pt-6 border-t-2 border-gray-200">
                <h3 className="text-sm font-semibold text-gray-600 mb-3">Proximity Bonus</h3>
                <div 
                  className="flex items-center justify-between p-4 rounded-lg"
                  style={{ backgroundColor: `${targetPlayer.color}20` }}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: targetPlayer.color }}
                    >
                      {targetPlayer.initials}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{targetPlayer.name}</div>
                      <div className="text-xs text-gray-500">{closeGuessCount} close guess{closeGuessCount !== 1 ? 'es' : ''}</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    +{targetBonus}
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })()}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 text-center mb-4">
            {gameMode === 'headtohead' ? 'Who Guessed Closer?' : `Where is ${targetPlayer?.name}?`}
          </h1>
          {gameMode === 'headtohead' ? (
            <div className="text-center text-gray-600">
              Both players guessed each other's positions
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl"
                style={{ backgroundColor: targetPlayer?.color }}
              >
                {targetPlayer?.initials}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col items-center">
            <div className="mb-3 text-sm font-semibold text-gray-700">{yLabelTop}</div>

            <div className="flex items-center gap-4 w-full">
              <div className="w-16 text-xs font-semibold text-gray-700 text-right">{xLabelLeft}</div>

              <div className="flex-1 max-w-xl mx-auto">
                <svg
                  viewBox="0 0 500 500"
                  className="w-full rounded-lg shadow-lg"
                  style={{ aspectRatio: '1 / 1', width: '100%', maxWidth: 'min(600px, 90vw)', margin: '0 auto', backgroundColor: 'white' }}
                >
                  <line x1="0" y1="250" x2="500" y2="250" stroke="#9ca3af" strokeWidth="2" />
                  <line x1="250" y1="0" x2="250" y2="500" stroke="#9ca3af" strokeWidth="2" />

                  {/* STANDARD MODE: Draw completed lines */}
                  {gameMode === 'standard' && (animationStage === 'lines' || animationStage === 'complete') && actualMark && 
                    linesDrawn.map((rank) => {
                      const rankedGuess = rankedGuesses.find(g => g.rank === rank);
                      if (!rankedGuess) return null;

                      const guess = guesses.find(g => g.guessingPlayerId === rankedGuess.guessingPlayerId);
                      if (!guess) return null;

                      const x1 = coordToPercent(actualMark.x) * 5;
                      const y1 = coordToPercent(-actualMark.y) * 5;
                      const x2 = coordToPercent(parseFloat(guess.guessX)) * 5;
                      const y2 = coordToPercent(-parseFloat(guess.guessY)) * 5;

                      return (
                        <line
                          key={`line-complete-${rank}`}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke={rankedGuess.color}
                          strokeWidth="3"
                          strokeDasharray="8 4"
                        />
                      );
                    })
                  }

                  {/* STANDARD MODE: Draw animating line */}
                  {gameMode === 'standard' && animationStage === 'lines' && currentLineStep === 'drawing' && actualMark && (() => {
                    const rankedGuess = rankedGuesses.find(g => g.rank === currentRankRevealing);
                    if (!rankedGuess) return null;

                    const guess = guesses.find(g => g.guessingPlayerId === rankedGuess.guessingPlayerId);
                    if (!guess) return null;

                    const x1 = coordToPercent(actualMark.x) * 5;
                    const y1 = coordToPercent(-actualMark.y) * 5;
                    const x2 = coordToPercent(parseFloat(guess.guessX)) * 5;
                    const y2 = coordToPercent(-parseFloat(guess.guessY)) * 5;

                    return (
                      <path
                        key={`line-animating-${animatingLineKey}`}
                        d={`M ${x1} ${y1} L ${x2} ${y2}`}
                        stroke={rankedGuess.color}
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                        pathLength="100"
                        strokeDasharray="100"
                        strokeDashoffset="100"
                        style={{
                          animation: 'drawPath 1.5s ease-out forwards'
                        }}
                      />
                    );
                  })()}

                  {/* HEAD-TO-HEAD: Draw lines */}
                  {gameMode === 'headtohead' && guesses.length === 2 && (() => {
                    // Check if we're in simultaneous animation mode
                    const isSimultaneous = h2hAnimatingLine?.simultaneous;
                    
                    return guesses.map((guess) => {
                      const guesser = getGuessPlayer(guess.guessingPlayerId);
                      if (!guesser) return null;

                      const targetId = gameData.playerOrder.find(pid => pid !== guess.guessingPlayerId);
                      const targetMark = roundData.playerMarks[targetId];
                      if (!targetMark) return null;

                      // Coordinates: FROM guess TO target
                      const x1 = coordToPercent(parseFloat(guess.guessX)) * 5;
                      const y1 = coordToPercent(-parseFloat(guess.guessY)) * 5;
                      const x2 = coordToPercent(targetMark.x) * 5;
                      const y2 = coordToPercent(-targetMark.y) * 5;

                      // Check if this line should be animating
                      const isAnimating = isSimultaneous || 
                        (h2hAnimatingLine && h2hAnimatingLine.from === guess.guessingPlayerId && h2hAnimatingLine.to === targetId);

                      // Check if this line should be shown as completed
                      const isCompleted = h2hRevealedMarks.includes(targetId) && !isAnimating;

                      if (isAnimating) {
                        // Animated line (solid, drawing)
                        return (
                          <path
                            key={`h2h-line-animating-${guess.guessingPlayerId}`}
                            d={`M ${x1} ${y1} L ${x2} ${y2}`}
                            stroke={guesser.color}
                            strokeWidth="3"
                            fill="none"
                            strokeLinecap="round"
                            pathLength="100"
                            strokeDasharray="100"
                            strokeDashoffset="100"
                            style={{
                              animation: 'drawPath 1.5s ease-out forwards'
                            }}
                          />
                        );
                      } else if (isCompleted) {
                        // Static completed line (dashed)
                        return (
                          <line
                            key={`h2h-line-static-${guess.guessingPlayerId}`}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke={guesser.color}
                            strokeWidth="3"
                            strokeDasharray="8 4"
                          />
                        );
                      }

                      return null;
                    });
                  })()}

                  {/* STANDARD MODE: Guesses */}
                  {gameMode === 'standard' && guesses.map((guess) => {
                    const player = getGuessPlayer(guess.guessingPlayerId);
                    if (!player) return null;

                    const x = coordToPercent(parseFloat(guess.guessX)) * 5;
                    const y = coordToPercent(-parseFloat(guess.guessY)) * 5;
                    const opacity = getGuessOpacity(guess);
                    const showInitials = shouldShowInitials(guess);

                    return (
                      <g key={guess.guessingPlayerId} opacity={opacity} className="transition-opacity duration-300">
                        <line x1={x - 10} y1={y - 10} x2={x + 10} y2={y + 10} stroke={player.color} strokeWidth="3" strokeLinecap="round" />
                        <line x1={x + 10} y1={y - 10} x2={x - 10} y2={y + 10} stroke={player.color} strokeWidth="3" strokeLinecap="round" />
                        
                        {showInitials && (
                          <text 
                            x={x} 
                            y={y + 20} 
                            fontSize="12" 
                            fontWeight="bold" 
                            fill={player.color} 
                            textAnchor="middle"
                            className="animate-fade-out-initials"
                          >
                            {targetPlayer.initials}?
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* HEAD-TO-HEAD: Show both guesses */}
                  {gameMode === 'headtohead' && guesses.map((guess) => {
                    const player = getGuessPlayer(guess.guessingPlayerId);
                    if (!player) return null;

                    // Find the target this player is guessing
                    const targetId = gameData.playerOrder.find(pid => pid !== guess.guessingPlayerId);
                    const targetPlayerForGuess = gameData.players.find(p => p.playerId === targetId);

                    const x = coordToPercent(parseFloat(guess.guessX)) * 5;
                    const y = coordToPercent(-parseFloat(guess.guessY)) * 5;
                    const opacity = getGuessOpacity(guess);

                    return (
                      <g key={`guess-${guess.guessingPlayerId}`} opacity={opacity} className="transition-opacity duration-500">
                        <line x1={x - 8} y1={y - 8} x2={x + 8} y2={y + 8} stroke={player.color} strokeWidth="2" strokeLinecap="round" />
                        <line x1={x + 8} y1={y - 8} x2={x - 8} y2={y + 8} stroke={player.color} strokeWidth="2" strokeLinecap="round" />
                        <text 
                          x={x} 
                          y={y + 20} 
                          fontSize="11" 
                          fontWeight="bold" 
                          fill={player.color} 
                          textAnchor="middle"
                        >
                          {targetPlayerForGuess?.initials}?
                        </text>
                      </g>
                    );
                  })}

                  {/* STANDARD MODE: Target mark */}
                  {gameMode === 'standard' && (animationStage === 'target' || animationStage === 'lines' || animationStage === 'complete') && actualMark && (
                    <g className="animate-fade-in">
                      <line 
                        x1={coordToPercent(actualMark.x) * 5 - 10} 
                        y1={coordToPercent(-actualMark.y) * 5 - 10} 
                        x2={coordToPercent(actualMark.x) * 5 + 10} 
                        y2={coordToPercent(-actualMark.y) * 5 + 10} 
                        stroke={targetPlayer.color} 
                        strokeWidth="4" 
                        strokeLinecap="round" 
                      />
                      <line 
                        x1={coordToPercent(actualMark.x) * 5 + 10} 
                        y1={coordToPercent(-actualMark.y) * 5 - 10} 
                        x2={coordToPercent(actualMark.x) * 5 - 10} 
                        y2={coordToPercent(-actualMark.y) * 5 + 10} 
                        stroke={targetPlayer.color} 
                        strokeWidth="4" 
                        strokeLinecap="round" 
                      />
                      <text 
                        x={coordToPercent(actualMark.x) * 5} 
                        y={coordToPercent(-actualMark.y) * 5 + 25} 
                        fontSize="14" 
                        fontWeight="bold" 
                        fill={targetPlayer.color} 
                        textAnchor="middle"
                      >
                        {targetPlayer.initials}
                      </text>
                    </g>
                  )}

                  {/* HEAD-TO-HEAD: Show actual marks when revealed */}
                  {gameMode === 'headtohead' && gameData.players.map((player) => {
                    const mark = roundData.playerMarks[player.playerId];
                    if (!mark) return null;

                    const x = coordToPercent(mark.x) * 5;
                    const y = coordToPercent(-mark.y) * 5;

                    // Check if this mark should be visible
                    const isRevealed = h2hRevealedMarks.includes(player.playerId);

                    return (
                      <g key={`actual-${player.playerId}`} opacity={isRevealed ? 1 : 0} className="transition-opacity duration-500">
                        <line 
                          x1={x - 10} 
                          y1={y - 10} 
                          x2={x + 10} 
                          y2={y + 10} 
                          stroke={player.color} 
                          strokeWidth="4" 
                          strokeLinecap="round" 
                        />
                        <line 
                          x1={x + 10} 
                          y1={y - 10} 
                          x2={x - 10} 
                          y2={y + 10} 
                          stroke={player.color} 
                          strokeWidth="4" 
                          strokeLinecap="round" 
                        />
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
        </div>

        {/* Scoring */}
        {animationStage === 'complete' && (
          gameMode === 'headtohead' ? renderHeadToHeadScoring() : renderStandardScoring()
        )}

        {/* Continue button */}
        {animationStage === 'complete' && isHost && (
          <button
            onClick={handleContinue}
            disabled={advancing}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition duration-200 shadow-md"
          >
            {advancing ? 'Advancing...' : 'Continue'}
          </button>
        )}

        {animationStage === 'complete' && !isHost && (
          <div className="text-center text-gray-600">
            Waiting for host to continue...
          </div>
        )}
      </div>
    </div>
  );
}
