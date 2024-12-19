import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFirebase } from '../hooks/useFirebase';

export const GroupSession = () => {
  const navigate = useNavigate();
  const { groupId, sessionId } = useParams();
  const { groups, updateSession } = useFirebase();
  
  const [playerName, setPlayerName] = useState('');
  const [buyInAmount, setBuyInAmount] = useState('100');

  const group = groups.find(g => g.id === groupId);
  const session = group?.sessions?.find(s => s.id === sessionId);

  if (!group || !session) {
    return <div>Session not found</div>;
  }

  const handleAddPlayer = async (e) => {
    e.preventDefault();
    if (!playerName.trim() || !buyInAmount) return;

    const updatedSession = {
      ...session,
      players: [
        ...(session.players || []),
        {
          id: Date.now().toString(),
          name: playerName,
          buyIns: [Number(buyInAmount)],
          totalBuyIn: Number(buyInAmount),
          endAmount: null
        }
      ]
    };

    try {
      await updateSession(groupId, sessionId, updatedSession);
      setPlayerName('');
    } catch (error) {
      console.error('Error adding player:', error);
    }
  };

  const handleRemovePlayer = async (playerId) => {
    const updatedSession = {
      ...session,
      players: session.players.filter(p => p.id !== playerId)
    };
    await updateSession(groupId, sessionId, updatedSession);
  };

  const handleAddBuyIn = async (playerId) => {
    const updatedSession = {
      ...session,
      players: session.players.map(player => {
        if (player.id === playerId) {
          const newBuyIns = [...player.buyIns, Number(buyInAmount)];
          return {
            ...player,
            buyIns: newBuyIns,
            totalBuyIn: newBuyIns.reduce((sum, amount) => sum + amount, 0)
          };
        }
        return player;
      })
    };
    await updateSession(groupId, sessionId, updatedSession);
  };

  const handleUpdateEndAmount = async (playerId, amount) => {
    const updatedSession = {
      ...session,
      players: session.players.map(player =>
        player.id === playerId ? { ...player, endAmount: Number(amount) } : player
      )
    };
    await updateSession(groupId, sessionId, updatedSession);
  };

  const handleClearEndAmounts = async () => {
    const updatedSession = {
      ...session,
      players: session.players.map(player => ({ ...player, endAmount: null }))
    };
    await updateSession(groupId, sessionId, updatedSession);
  };

  const handleClearPlayers = async () => {
    const updatedSession = {
      ...session,
      players: []
    };
    await updateSession(groupId, sessionId, updatedSession);
  };

  const totalPot = session.players?.reduce((sum, player) => sum + player.totalBuyIn, 0) || 0;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{group.name}</h1>
          <h2 className="text-xl text-gray-600">{session.name}</h2>
        </div>
        <button
          onClick={() => navigate(`/group/${groupId}`)}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Back
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">Add Player</h3>
        <form onSubmit={handleAddPlayer} className="space-y-4">
          <div className="flex gap-4">
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Player name"
              className="flex-1 px-3 py-2 border rounded"
            />
            <input
              type="number"
              value={buyInAmount}
              onChange={(e) => setBuyInAmount(e.target.value)}
              placeholder="Buy-in amount"
              className="w-32 px-3 py-2 border rounded"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Total Pot: ${totalPot}</h3>
          <div className="space-x-4">
            <button
              onClick={handleClearEndAmounts}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Clear End Amounts
            </button>
            <button
              onClick={handleClearPlayers}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Clear Players
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {session.players?.map(player => (
          <div key={player.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">{player.name}</h3>
              <button
                onClick={() => handleRemovePlayer(player.id)}
                className="text-red-500 hover:text-red-600"
              >
                Remove
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">Total Buy-in: ${player.totalBuyIn}</p>
                <button
                  onClick={() => handleAddBuyIn(player.id)}
                  className="mt-2 px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                >
                Add Buy-in (${buyInAmount})
            </button>
            </div>
            <div className="text-right">
            <label className="block text-sm text-gray-600 mb-1">End Amount</label>
            <input
                type="number"
                value={player.endAmount || ''}
                onChange={(e) => handleUpdateEndAmount(player.id, e.target.value)}
                className="px-3 py-2 border rounded w-full"
                placeholder="0"
            />
            </div>
        </div>
        </div>
    ))}
    </div>
</div>
);
};