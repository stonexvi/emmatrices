import { useGameState } from '../../hooks/useGameState';
import PlacementPhase from './PlacementPhase';
import GuessingPhase from './GuessingPhase';
import RevealPhase from './RevealPhase';
import ScoringPhase from './ScoringPhase';
import RoundScoreboard from './RoundScoreboard';

export default function DisplayController({ gameCode, displayId }) {
  const { gameState, loading, error } = useGameState(gameCode, null, displayId);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📺</div>
          <div className="text-gray-600">Loading game display...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-red-600 text-center">Display Error: {error}</div>
        </div>
      </div>
    );
  }

  const game = gameState?.game;

  if (!game) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-gray-600">Waiting for game data...</div>
      </div>
    );
  }

  // Lobby phase for displays
  if (game.status === 'lobby') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6 text-center">
            <div className="text-6xl mb-4">📺</div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Display Connected
            </h1>
            <p className="text-xl text-gray-600 mb-4">
              Game Code: <span className="font-bold text-purple-600">{game.gameCode}</span>
            </p>
            <p className="text-gray-600">
              Waiting for host to start the game...
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Players</h2>
            <div className="space-y-3">
              {game.players.map((player) => (
                <div
                  key={player.playerId}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl"
                    style={{ backgroundColor: player.color }}
                  >
                    {player.initials}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800 text-lg">{player.name}</div>
                    {player.isHost && (
                      <div className="text-sm text-purple-600 font-medium">Host</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Game finished
  if (game.status === 'finished') {
    const scores = gameState?.scores || [];
    const sortedScores = [...scores].sort((a, b) => 
      parseFloat(b.totalPoints || 0) - parseFloat(a.totalPoints || 0)
    );
    const winner = sortedScores[0];
    const winnerPlayer = game.players.find(p => p.playerId === winner?.playerId);

    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6 text-center">
            <h1 className="text-5xl font-bold text-gray-800 mb-4">
              Game Complete!
            </h1>
            {winnerPlayer && (
              <div className="flex flex-col items-center gap-4">
                <div 
                  className="w-32 h-32 rounded-full flex items-center justify-center text-white font-bold text-4xl"
                  style={{ backgroundColor: winnerPlayer.color }}
                >
                  {winnerPlayer.initials}
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-800">{winnerPlayer.name} wins!</div>
                  <div className="text-2xl text-gray-600">{Math.round(parseFloat(winner.totalPoints))} points</div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Final Standings</h2>
            <div className="space-y-4">
              {sortedScores.map((score, index) => {
                const player = game.players.find(p => p.playerId === score.playerId);
                if (!player) return null;

                const isTop3 = index < 3;
                const bgColor = index === 0 ? '#FFD70020' : index === 1 ? '#C0C0C020' : index === 2 ? '#CD7F3220' : 'transparent';

                return (
                  <div 
                    key={score.playerId}
                    className="flex items-center justify-between p-6 rounded-lg border-2"
                    style={{ 
                      backgroundColor: bgColor,
                      borderColor: isTop3 ? (index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32') : '#e5e7eb'
                    }}
                  >
                    <div className="flex items-center gap-6">
                      <div className="text-4xl font-bold text-gray-400 w-12">
                        {index + 1}
                      </div>
                      <div 
                        className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl"
                        style={{ backgroundColor: player.color }}
                      >
                        {player.initials}
                      </div>
                      <div className="font-semibold text-gray-800 text-2xl">{player.name}</div>
                    </div>
                    <div className="text-5xl font-bold text-gray-800">
                      {Math.round(parseFloat(score.totalPoints || 0))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // During game - show current phase
  const roundData = gameState?.currentRound;
  if (!roundData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-gray-600">Waiting for round data...</div>
      </div>
    );
  }

  const currentPhase = game.currentPhase;

  // Display shows full view for all phases
  // Note: We pass null for playerId/playerInitials/playerColor since display doesn't have them
  // The components will need to handle this gracefully

  switch (currentPhase) {
    case 'placing':
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 text-center">
              <div className="text-4xl font-bold text-gray-800 mb-2">
                Players are placing their marks...
              </div>
              <div className="text-xl text-gray-600">
                {gameState.phaseStatus?.playersReady || 0} / {gameState.phaseStatus?.playersTotal || 0} ready
              </div>
            </div>
            <PlacementPhase
              gameCode={gameCode}
              playerId={null}
              playerInitials={null}
              playerColor={null}
              roundData={roundData}
              gameData={game}
              gameState={gameState}
              isHost={false}
              isDisplay={true}
            />
          </div>
        </div>
      );

    case 'guessing':
      return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 text-center">
              <div className="text-4xl font-bold text-gray-800 mb-2">
                Players are guessing...
              </div>
              <div className="text-xl text-gray-600">
                {gameState.phaseStatus?.playersReady || 0} / {gameState.phaseStatus?.playersTotal || 0} guesses in
              </div>
            </div>
            <GuessingPhase
              gameCode={gameCode}
              playerId={null}
              playerInitials={null}
              playerColor={null}
              roundData={roundData}
              gameData={game}
              gameState={gameState}
              isHost={false}
              isDisplay={true}
            />
          </div>
        </div>
      );

    case 'revealing':
      return (
        <RevealPhase
          gameCode={gameCode}
          playerId={displayId}
          isHost={false}
          roundData={roundData}
          gameData={game}
          gameState={gameState}
          isDisplay={true}
        />
      );

    case 'scoring':
      return (
        <ScoringPhase
          gameCode={gameCode}
          playerId={displayId}
          isHost={false}
          roundData={roundData}
          gameData={game}
          gameState={gameState}
          isDisplay={true}
        />
      );

    case 'round_scoreboard':
      return (
        <RoundScoreboard
          gameCode={gameCode}
          playerId={null}
          isHost={false}
          roundData={roundData}
          gameData={game}
          gameState={gameState}
          isDisplay={true}
        />
      );

    default:
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
            <div className="text-gray-600">Unknown phase: {currentPhase}</div>
          </div>
        </div>
      );
  }
}
