import React from 'react';

const PokerTableDisplay = ({ group }) => {
  if (!group) return null;
  
  const players = group.players || [];
  const totalPotSize = players.reduce((total, player) => {
    return total + (player?.totalBuyIn || 0);
  }, 0);

  // Calculate positions for up to 8 players around a circle
  const getPlayerPosition = (index, totalPlayers) => {
    const radius = 80; // Distance from center
    const startAngle = -90; // Start from top
    const angle = startAngle + (index * (360 / Math.max(8, totalPlayers)));
    const radian = (angle * Math.PI) / 180;
    return {
      x: 100 + radius * Math.cos(radian),
      y: 100 + radius * Math.sin(radian)
    };
  };

  return (
    <div className="fixed right-4 top-4 w-[300px]">
      <div className="bg-green-50 rounded-lg shadow-lg p-4">
        <h3 className="text-lg font-semibold mb-2 text-center">{group.name}</h3>
        <div className="relative w-[200px] h-[200px] mx-auto">
          {/* Poker Table SVG */}
          <svg viewBox="0 0 200 200" className="w-full h-full">
            {/* Outer table ring */}
            <circle
              cx="100"
              cy="100"
              r="95"
              fill="#8B4513"
              stroke="#654321"
              strokeWidth="5"
            />
            {/* Inner felt */}
            <circle
              cx="100"
              cy="100"
              r="85"
              fill="#267f00"
              stroke="#1a5f00"
              strokeWidth="2"
            />
            
            {/* Player positions - up to 8 seats */}
            {Array.from({ length: 8 }).map((_, index) => {
              const pos = getPlayerPosition(index, 8);
              const isOccupied = players[index];
              return (
                <g key={index} transform={`translate(${pos.x - 15}, ${pos.y - 15})`}>
                  <circle
                    r="15"
                    cx="15"
                    cy="15"
                    fill={isOccupied ? "#4a5568" : "#cbd5e0"}
                    stroke="#2d3748"
                    strokeWidth="2"
                  />
                  {isOccupied && (
                    <text
                      x="15"
                      y="35"
                      textAnchor="middle"
                      fill="#2d3748"
                      fontSize="8"
                      className="font-bold"
                    >
                      {players[index].name}
                    </text>
                  )}
                </g>
              );
            })}
            
            {/* Pot amount in the middle */}
            <text
              x="100"
              y="95"
              textAnchor="middle"
              fill="white"
              fontSize="16"
              className="font-bold"
            >
              Pot Size
            </text>
            <text
              x="100"
              y="115"
              textAnchor="middle"
              fill="white"
              fontSize="20"
              className="font-bold"
            >
              ${totalPotSize}
            </text>
          </svg>
        </div>
        
        {/* Player count */}
        <div className="mt-4 text-center text-gray-600">
          Players: {players.length}/8
        </div>
      </div>
    </div>
  );
};

export default PokerTableDisplay;