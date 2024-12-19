import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { Auth } from './components/Auth';
import { auth } from './utils/firebase';
import { useFirebase } from './hooks/useFirebase';

// Home component for displaying groups
const Home = () => {
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

// Group component for managing sessions
const Group = () => {
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

// Session component for managing players and buy-ins
const Session = () => {
  const navigate = useNavigate();
  const { groupId, sessionId } = useParams();
  const { groups, updateSession } = useFirebase();
  const [playerName, setPlayerName] = useState('');
  const [buyInAmount, setBuyInAmount] = useState('100');
  const [showPayouts, setShowPayouts] = useState(false);

  const group = groups.find(g => g.id === groupId);
  const session = group?.sessions?.find(s => s.id === sessionId);

  const handleAddPlayer = async (e) => {
    e.preventDefault();
    if (!playerName.trim() || !buyInAmount) return;

    try {
      const newPlayer = {
        id: Date.now().toString(),
        name: playerName,
        buyIns: [Number(buyInAmount)],
        totalBuyIn: Number(buyInAmount),
        endAmount: null
      };

      const updatedSession = {
        ...session,
        players: [...(session.players || []), newPlayer]
      };

      await updateSession(groupId, sessionId, updatedSession);
      setPlayerName('');
    } catch (error) {
      console.error('Error adding player:', error);
    }
  };

  const handleRemovePlayer = async (playerId) => {
    try {
      const updatedSession = {
        ...session,
        players: session.players.filter(p => p.id !== playerId)
      };
      await updateSession(groupId, sessionId, updatedSession);
    } catch (error) {
      console.error('Error removing player:', error);
    }
  };

  const handleAddBuyIn = async (playerId) => {
    try {
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
    } catch (error) {
      console.error('Error adding buy-in:', error);
    }
  };

  const handleRemoveBuyIn = async (playerId) => {
    try {
      const player = session.players.find(p => p.id === playerId);
      if (!player || player.buyIns.length === 0) return;

      const updatedSession = {
        ...session,
        players: session.players.map(p => {
          if (p.id === playerId) {
            const newBuyIns = [...p.buyIns];
            newBuyIns.pop(); // Remove last buy-in
            return {
              ...p,
              buyIns: newBuyIns,
              totalBuyIn: newBuyIns.reduce((sum, amount) => sum + amount, 0)
            };
          }
          return p;
        })
      };
      await updateSession(groupId, sessionId, updatedSession);
    } catch (error) {
      console.error('Error removing buy-in:', error);
    }
  };

  const handleUpdateEndAmount = async (playerId, amount) => {
    try {
      const updatedSession = {
        ...session,
        players: session.players.map(player =>
          player.id === playerId ? { ...player, endAmount: Number(amount) } : player
        )
      };
      await updateSession(groupId, sessionId, updatedSession);
    } catch (error) {
      console.error('Error updating end amount:', error);
    }
  };

  const calculatePayouts = () => {
    if (!session.players) return [];

    const missingEndAmounts = session.players.some(player => 
      player.endAmount === null || player.endAmount === undefined
    );
    if (missingEndAmounts) {
      alert('Please enter end amounts for all players');
      return [];
    }

    const balances = {};
    session.players.forEach(player => {
      balances[player.name] = Number(player.endAmount) - player.totalBuyIn;
    });

    const creditors = Object.entries(balances)
      .filter(([_, balance]) => balance > 0)
      .sort(([_, a], [__, b]) => b - a);
    
    const debtors = Object.entries(balances)
      .filter(([_, balance]) => balance < 0)
      .sort(([_, a], [__, b]) => a - b);

    const payouts = [];
    while (creditors.length > 0 && debtors.length > 0) {
      const [creditorName, creditAmount] = creditors[0];
      const [debtorName, debtAmount] = debtors[0];
      
      const amount = Math.min(creditAmount, -debtAmount);
      
      payouts.push({
        from: debtorName,
        to: creditorName,
        amount: amount.toFixed(2)
      });

      if (creditAmount === amount) creditors.shift();
      else creditors[0][1] -= amount;

      if (-debtAmount === amount) debtors.shift();
      else debtors[0][1] += amount;
    }

    return payouts;
  };

  if (!group || !session) return <div>Session not found</div>;

  const totalPot = session.players?.reduce((sum, player) => sum + player.totalBuyIn, 0) || 0;
  const totalEntered = session.players?.reduce((sum, player) => {
    const endAmount = Number(player.endAmount) || 0;
    return sum + endAmount;
  }, 0) || 0;
  const totalRemaining = totalEntered - totalPot;

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Header */}
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

      {/* Totals Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Total Pot</h3>
            <p className="text-2xl font-bold">${totalPot}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Total Entered</h3>
            <p className="text-2xl font-bold">${totalEntered}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Total Remaining</h3>
            <p className="text-2xl font-bold">${-totalRemaining}</p>
          </div>
        </div>
        <button
          onClick={() => setShowPayouts(true)}
          className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Calculate Payouts
        </button>
      </div>

      {/* Add Player Form */}
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
              required
            />
            <input
              type="number"
              value={buyInAmount}
              onChange={(e) => setBuyInAmount(e.target.value)}
              placeholder="Buy-in amount"
              className="w-32 px-3 py-2 border rounded"
              required
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add Player
            </button>
          </div>
        </form>
      </div>

      {/* Players List */}
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
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleAddBuyIn(player.id)}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                  >
                    Add Buy-in (${buyInAmount})
                  </button>
                  {player.buyIns.length > 0 && (
                    <button
                      onClick={() => handleRemoveBuyIn(player.id)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Remove Buy-in
                    </button>
                  )}
                </div>
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

      {/* Payouts Modal */}
      {showPayouts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Payouts</h2>
              <button
                onClick={() => setShowPayouts(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Display balances for each player */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Player Balances</h3>
              <div className="space-y-2">
                {session.players?.map(player => {
                  const balance = Number(player.endAmount || 0) - player.totalBuyIn;
                  return (
                    <div key={player.id} className="flex justify-between">
                      <span>{player.name}</span>
                      <span className={balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {balance >= 0 ? '+' : ''}{balance.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Display payout instructions */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Payout Instructions</h3>
              {calculatePayouts().length === 0 ? (
                <p className="text-gray-500">No payouts needed or missing end amounts</p>
              ) : (
                <div className="space-y-3">
                  {calculatePayouts().map((payout, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-50 rounded border border-gray-200"
                    >
                      <span className="font-semibold text-red-600">{payout.from}</span>
                      {' owes '}
                      <span className="font-semibold text-green-600">{payout.to}</span>
                      {' $'}
                      <span className="font-semibold">{payout.amount}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowPayouts(false)}
              className="mt-6 w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Main App component
function App() {
  const [user, setUser] = useState(null);
  const { loading } = useFirebase();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Auth onAuthStateChange={() => setUser(auth.currentUser)} />
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow mb-6">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-xl font-bold">GroupPot</h1>
            <button
              onClick={() => auth.signOut()}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Sign Out
            </button>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/group/:groupId" element={<Group />} />
          <Route path="/group/:groupId/session/:sessionId" element={<Session />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;