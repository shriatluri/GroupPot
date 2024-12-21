import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFirebase } from '../hooks/useFirebase';

// Group component for managing sessions
export const Group = () => {
    const navigate = useNavigate();
    const { groupId } = useParams();
    const { groups, createSession, deleteSession, deleteGroup } = useFirebase();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState(null);
    
    const group = groups.find(g => g.id === groupId);
  
    const handleCreateSession = async () => {
      try {
        const session = {
          id: Date.now().toString(),
          name: `Session ${(group.sessions?.length || 0) + 1}`,
          date: new Date().toISOString(),
          players: []
        };
        await createSession(groupId, session);
        navigate(`/group/${groupId}/session/${session.id}`);
      } catch (error) {
        console.error('Error creating session:', error);
        alert('Failed to create session');
      }
    };
  
    const handleDeleteSession = async (sessionId) => {
      try {
        await deleteSession(groupId, sessionId);
        setSessionToDelete(null);
        setShowDeleteConfirm(false);
      } catch (error) {
        console.error('Error deleting session:', error);
        alert('Failed to delete session');
      }
    };
  
    const handleDeleteGroup = async () => {
      if (window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
        try {
          await deleteGroup(groupId);
          navigate('/');
        } catch (error) {
          console.error('Error deleting group:', error);
          alert('Failed to delete group');
        }
      }
    };
  
    if (!group) return <div>Loading...</div>;
  
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{group.name}</h1>
          <div className="space-x-4">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Back
            </button>
            <button
              onClick={handleDeleteGroup}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Delete Group
            </button>
          </div>
        </div>
  
        <div className="mb-6">
          <button
            onClick={handleCreateSession}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            New Session
          </button>
        </div>
  
        <div className="space-y-4">
          {group.sessions?.map(session => (
            <div
              key={session.id}
              className="bg-white rounded-lg shadow p-6"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-semibold">{session.name}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/group/${groupId}/session/${session.id}`)}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => {
                      setSessionToDelete(session);
                      setShowDeleteConfirm(true);
                    }}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Players: {session.players?.length || 0}</span>
                <span>{new Date(session.date).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
  
        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && sessionToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
              <p className="mb-4">
                Are you sure you want to delete "{sessionToDelete.name}"? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    setSessionToDelete(null);
                    setShowDeleteConfirm(false);
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteSession(sessionToDelete.id)}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };