export default function ModeSelection({ onSelectSolo, onSelectMultiplayer, onSelectDisplay }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
          Happy 30th Birthday!
        </h1>
        <p className="text-gray-600 mb-8 text-center">
          How do you want to play?
        </p>

        {/* Solo Mode */}
        <button
          onClick={onSelectSolo}
          className="w-full mb-4 p-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transition duration-200 text-left"
        >
          <div className="flex items-center gap-4">
            <div>
              <div className="text-xl font-bold">Solo Mode</div>
              <div className="text-sm text-blue-100">
                Complete 30 matrices at your own pace
              </div>
            </div>
          </div>
        </button>

        {/* Multiplayer Mode */}
        <button
          onClick={onSelectMultiplayer}
          className="w-full mb-4 p-6 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition duration-200 text-left"
        >
          <div className="flex items-center gap-4">
            <div>
              <div className="text-xl font-bold">Multiplayer Game</div>
              <div className="text-sm text-purple-100">
                Party game - guess where friends placed themselves
              </div>
            </div>
          </div>
        </button>

        {/* Display Mode - NEW */}
        <button
          onClick={onSelectDisplay}
          className="w-full p-6 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition duration-200 text-left"
        >
          <div className="flex items-center gap-4">
            <div>
              <div className="text-xl font-bold">Display Mode</div>
              <div className="text-sm text-indigo-100">
                Connect TV/laptop as main screen for multiplayer
              </div>
            </div>
          </div>
        </button>

        <div className="mt-6 text-center text-sm text-gray-500">
          In multiplayer mode, players take turns being guessed by others
        </div>
      </div>
    </div>
  );
}
