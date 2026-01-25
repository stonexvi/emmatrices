const GAME_API_BASE_URL = import.meta.env.VITE_GAME_API_URL || 'http://localhost:3000/dev';

export const gameApi = {
  async createGame(hostName, hostInitials, hostColor, useTimers = false, roundCount = 5, gameMode = 'standard') {
    const response = await fetch(`${GAME_API_BASE_URL}/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hostName,
        hostInitials,
        hostColor,
        useTimers,
        roundCount,
        gameMode
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create game');
    }

    return response.json();
  },

  async joinGame(gameCode, playerName, playerInitials, playerColor) {
    const response = await fetch(`${GAME_API_BASE_URL}/games/${gameCode}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerName,
        playerInitials,
        playerColor
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to join game');
    }

    return response.json();
  },

  async joinAsDisplay(gameCode, displayName) {
    const response = await fetch(`${GAME_API_BASE_URL}/games/${gameCode}/display`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayName
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to join as display');
    }

    return response.json();
  },

  async startGame(gameCode, playerId) {
    const response = await fetch(`${GAME_API_BASE_URL}/games/${gameCode}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId })
    });

    if (!response.ok) {
      throw new Error('Failed to start game');
    }

    return response.json();
  },

  async getGameState(gameCode, playerId = null, displayId = null) {
    const params = new URLSearchParams();
    if (playerId) params.append('playerId', playerId);
    if (displayId) params.append('displayId', displayId);
    
    const response = await fetch(
      `${GAME_API_BASE_URL}/games/${gameCode}?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error('Failed to get game state');
    }

    return response.json();
  },

  async placeMark(gameCode, roundNumber, playerId, x, y) {
    const response = await fetch(
      `${GAME_API_BASE_URL}/games/${gameCode}/rounds/${roundNumber}/place`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, x, y })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to place mark');
    }

    return response.json();
  },

  async submitGuess(gameCode, roundNumber, guessingPlayerId, targetPlayerId, x, y, isRandom = false) {
    const response = await fetch(
      `${GAME_API_BASE_URL}/games/${gameCode}/rounds/${roundNumber}/guess`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guessingPlayerId,
          targetPlayerId,
          x,
          y,
          isRandom
        })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to submit guess');
    }

    return response.json();
  },

  async advancePhase(gameCode, playerId) {
    const response = await fetch(
      `${GAME_API_BASE_URL}/games/${gameCode}/advance`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to advance phase');
    }

    return response.json();
  }
};
