import { useState, useEffect } from 'react';
import Matrix from './components/Matrix';
import { matrices } from './data/matrices';
import { api } from './utils/api';

// Game mode components
import ModeSelection from './components/game/ModeSelection';
import MultiplayerLobbySelection from './components/game/MultiplayerLobbySelection';
import HostSetup from './components/game/HostSetup';
import JoinGame from './components/game/JoinGame';
import GameLobby from './components/game/GameLobby';
import GameController from './components/game/GameController';

function App() {
  // Mode state
  const [mode, setMode] = useState('select'); // 'select', 'solo', 'multiplayer'
  const [multiplayerScreen, setMultiplayerScreen] = useState('lobby-select'); // 'lobby-select', 'host-setup', 'join', 'lobby', 'playing'
  
  // Game mode state
  const [gameCode, setGameCode] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [isHost, setIsHost] = useState(false);
  
  // Solo mode state
  const [userName, setUserName] = useState('');
  const [userInitials, setUserInitials] = useState('');
  const [userColor, setUserColor] = useState('#2563eb');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentMatrixIndex, setCurrentMatrixIndex] = useState(0);
  const [completedMatrices, setCompletedMatrices] = useState(new Set());
  
  const [inputName, setInputName] = useState('');
  const [inputInitials, setInputInitials] = useState('');
  const [inputColor, setInputColor] = useState('#2563eb');

  const colorOptions = [
    { value: '#2563eb', name: 'Blue' },
    { value: '#dc2626', name: 'Red' },
    { value: '#16a34a', name: 'Green' },
    { value: '#ca8a04', name: 'Yellow' },
    { value: '#9333ea', name: 'Purple' },
    { value: '#ea580c', name: 'Orange' },
    { value: '#0891b2', name: 'Cyan' },
    { value: '#db2777', name: 'Pink' },
    { value: '#65a30d', name: 'Lime' },
  ];

  // Check if user is logged in for solo mode
  useEffect(() => {
    const savedName = localStorage.getItem('matrixUserName');
    const savedInitials = localStorage.getItem('matrixUserInitials');
    const savedColor = localStorage.getItem('matrixUserColor');
    
    if (savedName && savedInitials) {
      setInputName(savedName);
      setInputInitials(savedInitials);
      setInputColor(savedColor || '#2563eb');
    }
  }, []);

  const loadUserProgress = async (name) => {
    try {
      const response = await api.getUserProgress(name);
      if (response.ok) {
        const data = await response.json();
        setCompletedMatrices(new Set(data.completedMatrices || []));
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const handleSoloLogin = (e) => {
    e.preventDefault();
    
    const name = inputName.trim();
    const initials = inputInitials.trim().toUpperCase();
    
    if (name && initials && initials.length >= 2 && initials.length <= 3) {
      setUserName(name);
      setUserInitials(initials);
      setUserColor(inputColor);
      setIsAuthenticated(true);
      
      localStorage.setItem('matrixUserName', name);
      localStorage.setItem('matrixUserInitials', initials);
      localStorage.setItem('matrixUserColor', inputColor);
      
      loadUserProgress(name);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setMode('select');
    setCurrentMatrixIndex(0);
  };

  const handleMarkPlaced = (matrixId) => {
    setCompletedMatrices(prev => new Set([...prev, matrixId]));
  };

  const goToNext = () => {
    if (currentMatrixIndex < matrices.length - 1) {
      setCurrentMatrixIndex(prev => prev + 1);
    }
  };

  const goToPrevious = () => {
    if (currentMatrixIndex > 0) {
      setCurrentMatrixIndex(prev => prev - 1);
    }
  };

  const goToMatrix = (index) => {
    setCurrentMatrixIndex(index);
  };

  // Mode selection handlers
  const handleSelectSolo = () => {
    setMode('solo');
  };

  const handleSelectMultiplayer = () => {
    setMode('multiplayer');
    setMultiplayerScreen('lobby-select');
  };

  const handleBackToModeSelect = () => {
    setMode('select');
  };

  // Multiplayer handlers
  const handleGameCreated = (code, playerIdVal, hostStatus) => {
    localStorage.setItem('currentGameCode', code);
    localStorage.setItem('gameIsHost', 'true');
    setGameCode(code);
    setPlayerId(playerIdVal);
    setIsHost(hostStatus);
    setMultiplayerScreen('lobby');
  };

  const handleJoined = (code, playerIdVal, hostStatus) => {
    setGameCode(code);
    setPlayerId(playerIdVal);
    setIsHost(hostStatus);
    setMultiplayerScreen('lobby');
  };

  const handleRejoin = (code, playerIdVal) => {
    setGameCode(code);
    setPlayerId(playerIdVal);
    // Determine if host by checking localStorage or game state
    const savedHost = localStorage.getItem('gameIsHost') === 'true';
    setIsHost(savedHost);
    setMultiplayerScreen('playing'); // Go straight to game
  };

  // MULTIPLAYER MODE
  if (mode === 'multiplayer') {
    if (multiplayerScreen === 'lobby-select') {
      return (
        <MultiplayerLobbySelection
          onHost={() => setMultiplayerScreen('host-setup')}
          onJoin={() => setMultiplayerScreen('join')}
          onBack={handleBackToModeSelect}
        />
      );
    }

    if (multiplayerScreen === 'host-setup') {
      return (
        <HostSetup
          onGameCreated={handleGameCreated}
          onBack={() => setMultiplayerScreen('lobby-select')}
        />
      );
    }

    if (multiplayerScreen === 'join') {
      return (
        <JoinGame
          onJoined={handleJoined}
          onBack={() => setMultiplayerScreen('lobby-select')}
        />
      );
    }

    if (multiplayerScreen === 'lobby') {
      // Check if game has started via polling
      return (
        <GameLobby
          gameCode={gameCode}
          playerId={playerId}
          isHost={isHost}
          onGameStarted={() => setMultiplayerScreen('playing')}
        />
      );
    }

    // Playing - handled by GameController via polling
    return (
      <GameController
        gameCode={gameCode}
        playerId={playerId}
        isHost={isHost}
      />
    );
  }

  // SOLO MODE
  if (mode === 'solo') {
    // Solo login
    if (!isAuthenticated) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
            <button
              onClick={handleBackToModeSelect}
              className="mb-4 text-gray-600 hover:text-gray-800 flex items-center gap-2"
            >
              ← Back
            </button>

            <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
              Happy 30th Birthday!
            </h1>
            <p className="text-gray-600 mb-6 text-center">
              Welcome to your special interactive matrix collection!
            </p>
            <p className="text-sm text-gray-500 mb-6 text-center">
              30 unique matrices for 30 amazing years. Place your mark on each matrix to show where you stand!
            </p>
            
            <form onSubmit={handleSoloLogin} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name:
                </label>
                <input
                  id="name"
                  type="text"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>

              <div>
                <label htmlFor="initials" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Initials (2-3 letters):
                </label>
                <input
                  id="initials"
                  type="text"
                  value={inputInitials}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
                    if (value.length <= 3) {
                      setInputInitials(value);
                    }
                  }}
                  placeholder="JD"
                  maxLength={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition uppercase"
                  required
                  pattern="[A-Z]{2,3}"
                />
                <p className="text-xs text-gray-500 mt-1">These will appear below your mark</p>
              </div>

              <div>
                <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Color:
                </label>
                <div className="flex gap-2 flex-wrap">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setInputColor(color.value)}
                      className={`w-12 h-12 rounded-lg border-2 transition-all ${
                        inputColor === color.value 
                          ? 'border-gray-800 scale-110 shadow-lg' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={!inputName.trim() || inputInitials.length < 2}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
              >
                Start Exploring
              </button>
            </form>
          </div>
        </div>
      );
    }

    // Solo mode main app
    const currentMatrix = matrices[currentMatrixIndex];
    const progress = completedMatrices.size;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Matrix {currentMatrixIndex + 1} of {matrices.length}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Welcome, <span className="font-semibold">{userName}</span>!
                  <span className="ml-2 px-2 py-0.5 rounded text-xs font-bold" style={{ backgroundColor: userColor, color: 'white' }}>
                    {userInitials}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">
                    {progress}/{matrices.length}
                  </div>
                  <div className="text-xs text-gray-500">completed</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition duration-200"
                >
                  Logout
                </button>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="mt-4 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(progress / matrices.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Matrix */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <Matrix
              key={currentMatrix.id}
              matrixId={currentMatrix.id}
              xLabel={currentMatrix.xLabel}
              yLabel={currentMatrix.yLabel}
              userName={userName}
              userInitials={userInitials}
              userColor={userColor}
              onMarkPlaced={handleMarkPlaced}
            />
          </div>

          {/* Navigation */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={goToPrevious}
                disabled={currentMatrixIndex === 0}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition duration-200 shadow-md hover:shadow-lg"
              >
                ← Previous
              </button>
              
              <div className="flex gap-2 flex-wrap justify-center">
                {matrices.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToMatrix(index)}
                    className={`w-8 h-8 rounded-full text-xs font-semibold transition duration-200
                      ${index === currentMatrixIndex 
                        ? 'bg-blue-600 text-white shadow-lg' 
                        : completedMatrices.has(matrices[index].id)
                        ? 'bg-green-400 text-white hover:bg-green-500'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                    title={`Matrix ${index + 1}`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={goToNext}
                disabled={currentMatrixIndex === matrices.length - 1}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition duration-200 shadow-md hover:shadow-lg"
              >
                Next →
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500">
            Made with for an Emmazing 30th birthday
          </div>
        </div>
      </div>
    );
  }

  // MODE SELECTION (default)
  return (
    <ModeSelection
      onSelectSolo={handleSelectSolo}
      onSelectMultiplayer={handleSelectMultiplayer}
    />
  );
}

export default App;
