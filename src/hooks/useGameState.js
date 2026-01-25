import { useState, useEffect } from 'react';
import { gameApi } from '../utils/gameApi';

export function useGameState(gameCode, playerId = null, displayId = null) {
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!gameCode) return;

    let mounted = true;

    const fetchGameState = async () => {
      try {
        const state = await gameApi.getGameState(gameCode, playerId, displayId);
        if (mounted) {
          setGameState(state);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          console.error('Error fetching game state:', err);
          setError(err.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Initial fetch
    fetchGameState();

    // Poll every 2 seconds for updates
    const interval = setInterval(fetchGameState, 2000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [gameCode, playerId, displayId]);

  return { gameState, loading, error };
}
