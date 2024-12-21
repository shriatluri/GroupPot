import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirebase } from '../hooks/useFirebase';

// Home component for displaying groups
export const Home = () => {
    const navigate = useNavigate();
    const { groups, createGroup, deleteGroup } = useFirebase();
    const [groupName, setGroupName] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [groupToDelete, setGroupToDelete] = useState(null);

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        if (!groupName.trim()) return;
        
        try {
        await createGroup({
            name: groupName,
            sessions: []
        });
        setGroupName('');
        } catch (error) {
        console.error('Error creating group:', error);
        alert('Failed to create group');
        }
    };

    const handleDeleteGroup = async (groupId) => {
        try {
        await deleteGroup(groupId);
        setGroupToDelete(null);
        setShowDeleteConfirm(false);
        } catch (error) {
        console.error('Error deleting group:', error);
        alert('Failed to delete group');
        }
    };

    const handleGroupClick = (group, e) => {
        // Prevent navigation when clicking delete button
        if (e.target.closest('button[data-action="delete"]')) {
        e.stopPropagation();
        setGroupToDelete(group);
        setShowDeleteConfirm(true);
        return;
        }
        navigate(`/group/${group.id}`);
    };

    return (
        <div className="max-w-4xl mx-auto p-4">
        {/* Create Group Form */}
        <div className="mb-8">
            <form onSubmit={handleCreateGroup} className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Create New Group</h2>
            <div className="flex gap-2">
                <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
                className="flex-grow px-3 py-2 border rounded"
                />
                <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                Create
                </button>
            </div>
            </form>
        </div>

        {/* Groups List */}
        <div className="space-y-4">
            {groups.map((group) => (
            <div 
                key={group.id} 
                className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg"
                onClick={(e) => handleGroupClick(group, e)}
            >
                <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-semibold">{group.name}</h3>
                <button
                    data-action="delete"
                    className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                    Delete
                </button>
                </div>
                <div className="text-gray-600">
                <p>Total Sessions: {group.sessions?.length || 0}</p>
                {group.sessions?.length > 0 && (
                    <p>Last Session: {new Date(group.sessions[group.sessions.length - 1].date).toLocaleDateString()}</p>
                )}
                </div>
            </div>
            ))}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && groupToDelete && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
                <p className="mb-4">
                Are you sure you want to delete "{groupToDelete.name}"? This will also delete all sessions in this group. This action cannot be undone.
                </p>
                <div className="flex justify-end gap-4">
                <button
                    onClick={() => {
                    setGroupToDelete(null);
                    setShowDeleteConfirm(false);
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                    Cancel
                </button>
                <button
                    onClick={() => handleDeleteGroup(groupToDelete.id)}
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