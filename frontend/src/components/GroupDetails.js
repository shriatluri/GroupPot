// frontend/src/components/GroupDetails.js
import React, { useState } from 'react';
import PlayerList from './PlayerList';
import PlayerCreate from './PlayerCreate';
import GameFinish from './GameFinish';

function GroupDetails({ group }) {
  const [players, setPlayers] = useState(group.players || []);

  const handleAddPlayer = (newPlayer) => {
    setPlayers([...players, newPlayer]);
  };

  const handleBuyIn = (playerId, amount) => {
    setPlayers(players.map(player => {
      if (player.id === playerId) {
        return {
          ...player,
          buyIns: [...(player.buyIns || []), Number(amount)],
          totalBuyIn: (player.totalBuyIn || 0) + Number(amount)
        };
      }
      return player;
    }));
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">{group.name}</h2>
      
      <div className="mb-6">
        <PlayerCreate onAddPlayer={handleAddPlayer} groupId={group.id} />
      </div>

      <div className="mb-6">
        <PlayerList 
          players={players} 
          onBuyIn={handleBuyIn}
        />
      </div>

      {players.length > 0 && (
        <div>
          <GameFinish players={players} />
        </div>
      )}
    </div>
  );
}

export default GroupDetails;