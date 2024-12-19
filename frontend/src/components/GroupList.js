// frontend/src/components/GroupList.js
import React, { useState, useEffect } from 'react';
import { getGroups } from '../utils/api';

function GroupList({ onSelectGroup }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const fetchedGroups = await getGroups();
        setGroups(fetchedGroups);
      } catch (error) {
        console.error('Failed to fetch groups:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  if (loading) return <div>Loading groups...</div>;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Groups</h2>
      {groups.length === 0 ? (
        <p>No groups created yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {groups.map(group => (
            <button
              key={group.id}
              onClick={() => onSelectGroup(group)}
              className="text-left px-4 py-2 border rounded hover:bg-gray-50"
            >
              {group.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default GroupList;