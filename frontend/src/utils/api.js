// frontend/src/components/PlayerList.js
import React, { useState } from 'react';

function PlayerList({ players, onBuyIn }) {
  const [buyInAmount, setBuyInAmount] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);

  const handleBuyIn = (playerId) => {
    if (!buyInAmount) return;
    onBuyIn(playerId, buyInAmount);
    setBuyInAmount('');
    setSelectedPlayerId(null);
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Players</h3>
      <div className="space-y-4">
        {players.map(player => (
          <div key={player.id} className="flex items-center justify-between border p-4 rounded">
            <div>
              <p className="font-medium">{player.name}</p>
              <p className="text-sm text-gray-600">
                Total Buy-in: ${player.totalBuyIn || 0}
              </p>
            </div>
            
            <div className="flex gap-2">
              {selectedPlayerId === player.id ? (
                <>
                  <input
                    type="number"
                    value={buyInAmount}
                    onChange={(e) => setBuyInAmount(e.target.value)}
                    placeholder="Amount"
                    className="w-24 px-2 py-1 border rounded"
                  />
                  <button
                    onClick={() => handleBuyIn(player.id)}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setSelectedPlayerId(null)}
                    className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setSelectedPlayerId(player.id)}
                  className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Buy-in
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PlayerList;