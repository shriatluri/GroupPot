import React from 'react';
import { useNavigate } from 'react-router-dom';

export const GroupCard = ({ group }) => {
  const navigate = useNavigate();

  return (
    <div 
      className="bg-white rounded-lg shadow-lg p-6 mb-4 cursor-pointer hover:shadow-xl transition-shadow"
      onClick={() => navigate(`/group/${group.id}`)}
    >
      <h2 className="text-2xl font-bold mb-4">{group.name}</h2>
      <div className="flex justify-between items-center text-gray-600">
        <div>
          <p>Total Sessions: {group.sessions?.length || 0}</p>
        </div>
        {group.sessions?.length > 0 && (
          <div className="text-right">
            <p>Last Session: {new Date(group.sessions[group.sessions.length - 1].date).toLocaleDateString()}</p>
          </div>
        )}
      </div>
    </div>
  );
};