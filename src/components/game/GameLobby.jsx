import { useState, useEffect } from 'react';
import { useGameState } from '../../hooks/useGameState';
import { gameApi } from '../../utils/gameApi';

export default function GameLobby({ gameCode, playerId, isHost, onGameStarted }) {
  const { gameState, loading, error } = useGameState(gameCode, playerId);
  const [starting, setStarting] = useState(false);

  // Check if game has started and transition
  useEffect(() => {
    if (gameState?.game?.status === 'playing' && onGameStarted) {
      onGameStarted();
    }
  }, [gameState, onGameStarted]);

  const handleStartGame = async () => {
    setStarting(true);
    try {
      await gameApi.startGame(gameCode, playerId);
      // Game will automatically transition via polling
    } catch (err) {
      console.error('Error starting game:', err);
      alert('Failed to start game: ' + err.message);
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-gray-600">Loading lobby...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-red-600 text-center">Error: {error}</div>
        </div>
      </div>
    );
  }

  const game = gameState?.game;
  if (!game) return null;

  const players = game.players || [];
  const canStart = isHost && players.length >= 2;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">
          Game Lobby
        </h1>

        {/* Game Code */}
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
          <div className="text-sm text-gray-600 text-center mb-1">Game Code:</div>
          <div className="text-4xl font-bold text-center text-purple-700 tracking-widest">
            {gameCode}
          </div>
          <div className="text-xs text-gray-500 text-center mt-2">
            Share this code with friends to join
          </div>
        </div>

        {/* Players List */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">
            Players ({players.length}):
          </h2>
          <div className="space-y-2">
            {players.map((player, index) => (
              <div 
                key={player.playerId || index}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: player.color }}
                >
                  {player.initials}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">
                    {player.name}
                    {player.isHost && (
                      <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                        HOST
                      </span>
                    )}
                  </div>
                </div>
                {player.connected && (
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Start Game Button (Host Only) */}
        {isHost ? (
          <div>
            {!canStart && (
              <div className="mb-3 text-center text-sm text-gray-500">
                Need at least 2 players to start
              </div>
            )}
            <button
              onClick={handleStartGame}
              disabled={!canStart || starting}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
            >
              {starting ? 'Starting Game...' : 'Start Game'}
            </button>
          </div>
        ) : (
          <div className="text-center text-gray-600">
            Waiting for host to start the game...
          </div>
        )}
      </div>
    </div>
  );
}
