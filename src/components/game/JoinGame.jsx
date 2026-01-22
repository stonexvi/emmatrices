import { useState, useEffect } from 'react';
import { gameApi } from '../../utils/gameApi';

const colorOptions = [
  { value: '#2563eb', name: 'Blue' },
  { value: '#dc2626', name: 'Red' },
  { value: '#16a34a', name: 'Green' },
  { value: '#9333ea', name: 'Purple' },
  { value: '#ea580c', name: 'Orange' },
  { value: '#0891b2', name: 'Cyan' },
  { value: '#db2777', name: 'Pink' },
  { value: '#65a30d', name: 'Lime' },
  { value: '#0e7490', name: 'Teal' },
];

export default function JoinGame({ onJoined, onBack }) {
  const [gameCode, setGameCode] = useState('');
  const [name, setName] = useState('');
  const [initials, setInitials] = useState('');
  const [color, setColor] = useState(colorOptions[0].value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pre-fill from localStorage if available
  useEffect(() => {
    const savedGameCode = localStorage.getItem('currentGameCode');
    const savedName = localStorage.getItem('gamePlayerName');
    const savedInitials = localStorage.getItem('gamePlayerInitials');
    const savedColor = localStorage.getItem('gamePlayerColor');

    if (savedGameCode) setGameCode(savedGameCode);
    if (savedName) setName(savedName);
    if (savedInitials) setInitials(savedInitials);
    if (savedColor) setColor(savedColor);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await gameApi.joinGame(gameCode.toUpperCase(), name, initials, color);
      
      if (result.error) {
        setError(result.error);
      } else {
        // Save to localStorage for convenience
        localStorage.setItem('currentGameCode', gameCode.toUpperCase());
        localStorage.setItem('gamePlayerId', result.playerId);
        localStorage.setItem('gamePlayerName', name);
        localStorage.setItem('gamePlayerInitials', initials);
        localStorage.setItem('gamePlayerColor', color);
        
        // isHost comes from backend
        onJoined(gameCode.toUpperCase(), result.playerId, result.isHost);
      }
    } catch (err) {
      setError(err.message || 'Failed to join game');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <button
          onClick={onBack}
          className="mb-4 text-gray-600 hover:text-gray-800 flex items-center gap-2"
        >
          ← Back
        </button>

        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
          Join Game
        </h1>
        <p className="text-gray-600 mb-8 text-center">
          Enter your details to join
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

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
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-center text-2xl font-bold tracking-widest uppercase"
              placeholder="ABCD"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="Enter your name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Your Initials (2-3 letters)
            </label>
            <input
              type="text"
              value={initials}
              onChange={(e) => setInitials(e.target.value.toUpperCase())}
              maxLength={3}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 uppercase"
              placeholder="AB"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Your Color
            </label>
            <div className="grid grid-cols-3 gap-2">
              {colorOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setColor(option.value)}
                  className={`p-3 rounded-lg border-2 transition ${
                    color === option.value
                      ? 'border-gray-800 scale-105'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: option.value }}
                >
                  <div className="text-white font-bold text-xs">{option.name}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-lg transition duration-200"
          >
            {loading ? 'Joining...' : 'Join Game'}
          </button>
        </form>
      </div>
    </div>
  );
}