import { useState } from 'react';
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

export default function HostSetup({ onGameCreated, onBack }) {
  const [name, setName] = useState('');
  const [initials, setInitials] = useState('');
  const [color, setColor] = useState(colorOptions[0].value);
  const [gameMode, setGameMode] = useState('standard');
  const [roundCount, setRoundCount] = useState(5);
  const [useTimers, setUseTimers] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await gameApi.createGame(name, initials, color, useTimers, roundCount, gameMode);
      localStorage.setItem('currentGameCode', result.gameCode);
      localStorage.setItem('gamePlayerId', result.playerId);
      localStorage.setItem('gamePlayerName', name);
      localStorage.setItem('gamePlayerInitials', initials);
      localStorage.setItem('gamePlayerColor', color);
      onGameCreated(result.gameCode, result.playerId, true);
    } catch (err) {
      console.error('Error creating game:', err);
      alert('Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <button
          onClick={onBack}
          className="mb-4 text-gray-600 hover:text-gray-800 flex items-center gap-2"
        >
          ← Back
        </button>

        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
          Host New Game
        </h1>
        <p className="text-gray-600 mb-8 text-center">
          Set up your player profile
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
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
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 uppercase"
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

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Game Mode
            </label>
            <select
              value={gameMode}
              onChange={(e) => setGameMode(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
            >
              <option value="standard">Standard (3+ players)</option>
              <option value="headtohead">Head-to-Head (2 players)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {gameMode === 'headtohead' 
                ? 'Quick 1v1 mode - closest guess wins the round'
                : 'Full multiplayer with scoring tiers'
              }
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Number of Rounds
            </label>
            <select
              value={roundCount}
              onChange={(e) => setRoundCount(parseInt(e.target.value))}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
            >
              <option value={3}>3 Rounds (Quick Game)</option>
              <option value={5}>5 Rounds (Standard)</option>
              <option value={7}>7 Rounds (Extended)</option>
              <option value={10}>10 Rounds (Full Game)</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-3 p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition">
              <input
                type="checkbox"
                checked={useTimers}
                onChange={(e) => setUseTimers(e.target.checked)}
                className="w-5 h-5 text-green-600"
              />
              <div>
                <div className="font-semibold text-gray-800">Enable Timers</div>
                <div className="text-sm text-gray-600">
                  30s for placement, 20s for guessing (useful for testing)
                </div>
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-lg transition duration-200"
          >
            {loading ? 'Creating...' : 'Create Game'}
          </button>
        </form>
      </div>
    </div>
  );
}