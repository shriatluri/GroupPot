import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFirebase } from '../hooks/useFirebase';

// Group component for managing sessions
export const Group = () => {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const { groups, createSession, deleteSession, deleteGroup, updateSession} = useFirebase();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [newSessionName, setNewSessionName] = useState('');
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [sessionToRename, setSessionToRename] = useState(null);
  
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

  const handleSessionClick = (session, e) => {
    // Prevent navigation when clicking buttons
    if (e.target.closest('button[data-action]')) {
      e.stopPropagation();
      return;
    }
    navigate(`/group/${groupId}/session/${session.id}`);
  };

  if (!group) return <div className="dark:text-white">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold dark:text-white">{group.name}</h1>
        <div className="space-x-4">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700"
          >
            Back
          </button>
          <button
            onClick={handleDeleteGroup}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
          >
            Delete Group
          </button>
        </div>
      </div>

      <div className="mb-6">
        <button
          onClick={handleCreateSession}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
        >
          New Session
        </button>
      </div>

      <div className="space-y-4">
        {group.sessions?.map(session => (
          <div
            key={session.id}
            onClick={(e) => handleSessionClick(session, e)}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-all duration-200"
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-semibold dark:text-white">{session.name}</h3>
              <div className="flex gap-2">
                <button
                  data-action="rename"
                  onClick={() => {
                    setSessionToRename(session);
                    setNewSessionName(session.name);
                    setShowRenameModal(true);
                  }}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  Rename
                </button>
                <button
                  data-action="delete"
                  onClick={() => {
                    setSessionToDelete(session);
                    setShowDeleteConfirm(true);
                  }}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-gray-300">
              <span>Players: {session.players?.length || 0}</span>
              <span>{new Date(session.date).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Rename Modal */}
      {showRenameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Rename Session</h2>
            <input
              type="text"
              value={newSessionName}
              onChange={(e) => setNewSessionName(e.target.value)}
              placeholder="Enter new session name"
              className="w-full px-3 py-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRenameModal(false);
                  setSessionToRename(null);
                  setNewSessionName('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newSessionName.trim() && sessionToRename) {
                    updateSession(groupId, sessionToRename.id, {
                      ...sessionToRename,
                      name: newSessionName.trim()
                    });
                    setShowRenameModal(false);
                    setSessionToRename(null);
                    setNewSessionName('');
                  }
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && sessionToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Confirm Delete</h2>
            <p className="mb-4 dark:text-gray-300">
              Are you sure you want to delete "{sessionToDelete.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setSessionToDelete(null);
                  setShowDeleteConfirm(false);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteSession(sessionToDelete.id)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
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