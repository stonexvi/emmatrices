import { useState } from 'react';
import { gameApi } from '../../utils/gameApi';

export default function DisplayJoin({ onJoined, onBack }) {
  const [gameCode, setGameCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await gameApi.joinAsDisplay(gameCode.toUpperCase(), displayName);
      localStorage.setItem('currentGameCode', result.gameCode);
      localStorage.setItem('displayId', result.displayId);
      localStorage.setItem('displayName', result.displayName);
      onJoined(result.gameCode, result.displayId);
    } catch (err) {
      console.error('Error joining as display:', err);
      alert(err.message || 'Failed to join game as display');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        {onBack && (
          <button
            onClick={onBack}
            className="mb-4 text-gray-600 hover:text-gray-800 flex items-center gap-2"
          >
            ← Back
          </button>
        )}

        <div className="text-center mb-8">
          <div className="text-6xl mb-4">📺</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Join as Display
          </h1>
          <p className="text-gray-600">
            Connect this device as the main display screen
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Game Code
            </label>
            <input
              type="text"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value.toUpperCase())}
              maxLength={4}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-center text-2xl font-bold uppercase tracking-wider"
              placeholder="ABCD"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Display Name (optional)
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
              placeholder="Living Room TV"
            />
            <p className="text-xs text-gray-500 mt-1">
              e.g., "Living Room TV", "Main Screen"
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-lg transition duration-200"
          >
            {loading ? 'Connecting...' : 'Connect as Display'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Display Mode:</strong> This device will show the game for all players. 
            Player phones will only show personal info.
          </p>
        </div>
      </div>
    </div>
  );
}
