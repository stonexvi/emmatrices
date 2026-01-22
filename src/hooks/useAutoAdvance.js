import { useEffect, useRef } from 'react';
import { gameApi } from '../utils/gameApi';

export function useAutoAdvance(gameCode, playerId, isHost, phaseStatus, delayMs = 3000) {
  const hasAdvancedRef = useRef(false);
  const timeoutRef = useRef(null);
  const lastReadyStateRef = useRef(false);
  const lastPhaseRef = useRef(null);

  useEffect(() => {
    const shouldAdvance = phaseStatus?.allPlayersReady;
    const phase = phaseStatus?.phase;
    
    // Reset if phase changed
    if (phase !== lastPhaseRef.current) {
      console.log('Phase changed, resetting auto-advance');
      hasAdvancedRef.current = false;
      lastReadyStateRef.current = false;
      lastPhaseRef.current = phase;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
    
    // Only auto-advance for placement and guessing
    const canAutoAdvance = phase === 'placing' || phase === 'guessing';
    
    console.log('Auto-advance check:', {
      phase,
      shouldAdvance,
      canAutoAdvance,
      isHost,
      hasAdvanced: hasAdvancedRef.current,
      lastReadyState: lastReadyStateRef.current
    });
    
    // If not ready, clear any existing timeout
    if (!shouldAdvance || !canAutoAdvance) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // Only host can trigger advance
    if (!isHost) {
      console.log('Not host, waiting for phase change...');
      return;
    }

    // Already advanced or already started countdown
    if (hasAdvancedRef.current || lastReadyStateRef.current) {
      console.log('Already advancing or advanced');
      return;
    }

    // Mark that we've started the countdown
    lastReadyStateRef.current = true;

    console.log(`Starting ${delayMs}ms countdown to auto-advance from ${phase}...`);

    timeoutRef.current = setTimeout(async () => {
      try {
        console.log(`AUTO-ADVANCING from ${phase}!`);
        console.log('gameCode:', gameCode);
        console.log('playerId:', playerId);
        
        const result = await gameApi.advancePhase(gameCode, playerId);
        console.log('Advance result:', result);
        hasAdvancedRef.current = true;
      } catch (err) {
        console.error('Auto-advance failed:', err);
        console.error('Error details:', err.message);
        // Reset so it can retry
        hasAdvancedRef.current = false;
        lastReadyStateRef.current = false;
      }
    }, delayMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [gameCode, playerId, isHost, phaseStatus?.allPlayersReady, phaseStatus?.phase, delayMs]);
  // ^ Only depend on the actual values, not the whole object
}