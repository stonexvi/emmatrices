import { useState, useEffect, useCallback, useRef } from 'react';
import { gameApi } from '../utils/gameApi';

export function useGameState(gameCode, playerId) {
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pollingInterval = useRef(null);

  const fetchGameState = useCallback(async () => {
    if (!gameCode || !playerId) return;

    try {
      const state = await gameApi.getGameState(gameCode, playerId);
      setGameState(state);
      setError(null);
    } catch (err) {
      console.error('Error fetching game state:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [gameCode, playerId]);

  // Start polling
  useEffect(() => {
    if (!gameCode || !playerId) return;

    // Initial fetch
    fetchGameState();

    // Poll every 2 seconds
    pollingInterval.current = setInterval(fetchGameState, 2000);

    // Cleanup
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [gameCode, playerId, fetchGameState]);

  // Force refresh
  const refresh = useCallback(() => {
    fetchGameState();
  }, [fetchGameState]);

  return {
    gameState,
    loading,
    error,
    refresh
  };
}
