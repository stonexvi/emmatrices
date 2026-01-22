import { useState, useEffect } from 'react';

export default function MultiplayerLobbySelection({ onHost, onJoin, onBack }) {
  const [hasSavedGame, setHasSavedGame] = useState(false);

  useEffect(() => {
    // Check if user was in a game recently
    const gameCode = localStorage.getItem('currentGameCode');
    const playerName = localStorage.getItem('gamePlayerName');
    setHasSavedGame(!!(gameCode && playerName));
  }, []);

  const handleClearSaved = () => {
    localStorage.removeItem('currentGameCode');
    localStorage.removeItem('gamePlayerId');
    localStorage.removeItem('gamePlayerName');
    localStorage.removeItem('gamePlayerInitials');
    localStorage.removeItem('gamePlayerColor');
    setHasSavedGame(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <button
          onClick={onBack}
          className="mb-4 text-gray-600 hover:text-gray-800 flex items-center gap-2"
        >
          ← Back
        </button>

        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
          Multiplayer Game
        </h1>
        <p className="text-gray-600 mb-8 text-center">
          Host a new game or join an existing one
        </p>

        {/* Previous game notification (optional UX touch) */}
        {hasSavedGame && (
          <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-blue-600">ℹ️</span>
                <p className="text-sm text-blue-700">
                  Your previous game data will be pre-filled
                </p>
              </div>
              <button
                onClick={handleClearSaved}
                className="text-blue-500 hover:text-blue-700 text-sm font-semibold"
                title="Clear saved game"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Host Game */}
        <button
          onClick={onHost}
          className="w-full mb-4 p-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl shadow-lg hover:shadow-xl transition duration-200 text-left"
        >
          <div className="flex items-center gap-4">
            <div className="text-4xl">🎯</div>
            <div>
              <div className="text-xl font-bold">Host Game</div>
              <div className="text-sm text-green-100">
                Create a new game and invite friends
              </div>
            </div>
          </div>
        </button>

        {/* Join Game */}
        <button
          onClick={onJoin}
          className="w-full p-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transition duration-200 text-left"
        >
          <div className="flex items-center gap-4">
            <div className="text-4xl">🚪</div>
            <div>
              <div className="text-xl font-bold">Join Game</div>
              <div className="text-sm text-blue-100">
                {hasSavedGame ? 'Continue or enter a new game code' : 'Enter a 4-character game code'}
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}