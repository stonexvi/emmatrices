import { useGameState } from '../../hooks/useGameState';
import PlacementPhase from './PlacementPhase';
import GuessingPhase from './GuessingPhase';
import RevealPhase from './RevealPhase';
import ScoringPhase from './ScoringPhase';
import RoundScoreboard from './RoundScoreboard';
import PlayerMinimalView from './PlayerMinimalView';
import { gameApi } from '../../utils/gameApi';

export default function GameController({ gameCode, playerId, isHost }) {
  const { gameState, loading, error } = useGameState(gameCode, playerId);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-gray-600">Loading game...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-red-600 text-center">Error: {error}</div>
        </div>
      </div>
    );
  }

  const game = gameState?.game;
  const playerInfo = game?.players.find(p => p.playerId === playerId);

  if (!game || !playerInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-gray-600">Waiting for game data...</div>
      </div>
    );
  }

  // CHECK IF DISPLAY MODE IS ACTIVE
  const hasDisplays = gameState?.hasDisplays;
  const currentPhase = game.currentPhase;

  // If displays are connected, show minimal view ONLY during reveal and scoring phases
  if (hasDisplays && (currentPhase === 'revealing' || currentPhase === 'scoring' || currentPhase === 'round_scoreboard')) {
    const roundData = gameState?.currentRound;
    return (
      <PlayerMinimalView
        gameCode={gameCode}
        playerId={playerId}
        playerInfo={playerInfo}
        gameState={gameState}
        roundData={roundData}
        currentPhase={currentPhase}
        isHost={isHost}
      />
    );
  }

  // NO DISPLAYS or PLACEMENT/GUESSING PHASES - Show full game view (original behavior)

  // CHECK GAME STATUS FIRST - before checking roundData
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
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6 text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Game Complete!
            </h1>
            {winnerPlayer && (
              <div className="flex flex-col items-center gap-4">
                <div 
                  className="w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-3xl"
                  style={{ backgroundColor: winnerPlayer.color }}
                >
                  {winnerPlayer.initials}
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">{winnerPlayer.name} wins!</div>
                  <div className="text-lg text-gray-600">{Math.round(parseFloat(winner.totalPoints))} points</div>
                </div>
              </div>
            )}
          </div>

          {/* Final Standings */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Final Standings</h2>
            <div className="space-y-3">
              {sortedScores.map((score, index) => {
                const player = game.players.find(p => p.playerId === score.playerId);
                if (!player) return null;

                const isTop3 = index < 3;
                const bgColor = index === 0 ? '#FFD70020' : index === 1 ? '#C0C0C020' : index === 2 ? '#CD7F3220' : 'transparent';

                return (
                  <div 
                    key={score.playerId}
                    className="flex items-center justify-between p-4 rounded-lg border-2"
                    style={{ 
                      backgroundColor: bgColor,
                      borderColor: isTop3 ? (index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32') : '#e5e7eb'
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-3xl font-bold text-gray-400 w-10">
                        {index + 1}
                      </div>
                      <div 
                        className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl"
                        style={{ backgroundColor: player.color }}
                      >
                        {player.initials}
                      </div>
                      <div className="font-semibold text-gray-800 text-xl">{player.name}</div>
                    </div>
                    <div className="text-4xl font-bold text-gray-800">
                      {Math.round(parseFloat(score.totalPoints || 0))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Play Again Button */}
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 rounded-lg transition duration-200 shadow-lg text-lg"
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  // NOW check for roundData - only needed if game is still playing
  const roundData = gameState?.currentRound;
  if (!roundData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-gray-600">Waiting for round data...</div>
      </div>
    );
  }

  switch (currentPhase) {
    case 'placing':
      return (
        <PlacementPhase
          gameCode={gameCode}
          playerId={playerId}
          playerInitials={playerInfo.initials}
          playerColor={playerInfo.color}
          roundData={roundData}
          gameData={game}
          gameState={gameState}
          isHost={isHost}
        />
      );

    case 'guessing':
      return (
        <GuessingPhase
          gameCode={gameCode}
          playerId={playerId}
          playerInitials={playerInfo.initials}
          playerColor={playerInfo.color}
          roundData={roundData}
          gameData={game}
          gameState={gameState}
          isHost={isHost}
        />
      );

    case 'revealing':
      return (
        <RevealPhase
          gameCode={gameCode}
          playerId={playerId}
          isHost={isHost}
          roundData={roundData}
          gameData={game}
          gameState={gameState}
        />
      );

    case 'scoring':
      return (
        <ScoringPhase
          gameCode={gameCode}
          playerId={playerId}
          isHost={isHost}
          roundData={roundData}
          gameData={game}
          gameState={gameState}
          isDisplay={false}
        />
      );

    case 'round_scoreboard':
      return (
        <RoundScoreboard
          gameCode={gameCode}
          playerId={playerId}
          isHost={isHost}
          roundData={roundData}
          gameData={game}
          gameState={gameState}
        />
      );

    default:
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
            <div className="text-gray-600">Unknown phase: {currentPhase}</div>
            {isHost && (
              <button
                onClick={async () => {
                  try {
                    await gameApi.advancePhase(gameCode, playerId);
                  } catch (err) {
                    console.error('Error advancing:', err);
                  }
                }}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
              >
                Advance (Host)
              </button>
            )}
          </div>
        </div>
      );
  }
}
