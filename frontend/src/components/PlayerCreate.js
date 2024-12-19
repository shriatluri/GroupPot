// frontend/src/components/PlayerCreate.js
import React, { useState } from 'react';
import { addPlayerToGroup } from '../utils/api';

function PlayerCreate({ groupId, onAddPlayer }) {
  const [playerName, setPlayerName] = useState('');
  const [initialBuyIn, setInitialBuyIn] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!playerName.trim() || !initialBuyIn) return;

    try {
      const newPlayer = {
        id: Date.now().toString(),
        name: playerName,
        buyIns: [Number(initialBuyIn)],
        totalBuyIn: Number(initialBuyIn)
      };

      await addPlayerToGroup(groupId, newPlayer);
      onAddPlayer(newPlayer);
      setPlayerName('');
      setInitialBuyIn('');
    } catch (error) {
      console.error('Failed to add player:', error);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Add Player</h3>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Player name"
          className="flex-grow px-3 py-2 border rounded"
        />
        <input
          type="number"
          value={initialBuyIn}
          onChange={(e) => setInitialBuyIn(e.target.value)}
          placeholder="Buy-in amount"
          className="w-32 px-3 py-2 border rounded"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Add
        </button>
      </form>
    </div>
  );
}

export default PlayerCreate;