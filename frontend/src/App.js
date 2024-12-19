import React, { useState, useEffect} from 'react';
import PokerTableDisplay from './components/PokerTableDisplay';
import EndAmountTracker from './components/EndAmountTracker';
import { useFirebase } from './hooks/useFirebase';
import { Auth } from './components/Auth';
import {auth } from './utils/firebase';

function App() {
  const [user, setUser] = useState(null);
  const [groupName, setGroupName] = useState('');
  const { groups, loading, createGroup, addPlayer, updatePlayer } = useFirebase();
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [globalBuyInAmount, setGlobalBuyInAmount] = useState('100');
  const [endAmounts, setEndAmounts] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [payoutResults, setPayoutResults] = useState([]);
  
  // Then, add the useEffect for auth
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  // Then, add the loading check
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  // Then, add the auth check
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Auth onAuthStateChange={() => setUser(auth.currentUser)} />
      </div>
    );
  }

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    
    try {
      await createGroup({
        name: groupName,
        players: []
      });
      setGroupName('');
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const handleAddPlayer = async (e) => {
    e.preventDefault();
    if (!playerName.trim() || !globalBuyInAmount || !selectedGroup) return;
    
    const newPlayer = {
      id: Date.now(),
      name: playerName,
      buyIns: [Number(globalBuyInAmount)],
      totalBuyIn: Number(globalBuyInAmount)
    };
  
    try {
      // Use the addPlayer function from useFirebase
      await addPlayer(selectedGroup.id, newPlayer);
      
      // Clear the player name input
      setPlayerName('');
      
      // Update end amounts state
      setEndAmounts(prev => ({...prev, [newPlayer.id]: ''}));
      
      // Update selected group (the hook will handle the groups state)
      setSelectedGroup(prevGroup => ({
        ...prevGroup,
        players: [...prevGroup.players, newPlayer]
      }));
    } catch (error) {
      console.error('Error adding player:', error);
    }
  };

  const handleBuyInChange = async (groupId, playerId, amount, isAdding = true) => {
    try {
      const group = groups.find(g => g.id === groupId);
      if (!group) return;
  
      const player = group.players.find(p => p.id === playerId);
      if (!player) return;
  
      const newBuyIns = isAdding 
        ? [...player.buyIns, Number(amount)]
        : player.buyIns.slice(0, -1);
      
      const newTotalBuyIn = newBuyIns.reduce((sum, buyIn) => sum + buyIn, 0);
      
      const updatedPlayer = {
        ...player,
        buyIns: newBuyIns,
        totalBuyIn: newTotalBuyIn
      };
  
      await updatePlayer(groupId, playerId, updatedPlayer);
      
      // Update selectedGroup to reflect changes
      if (selectedGroup?.id === groupId) {
        setSelectedGroup(prevGroup => ({
          ...prevGroup,
          players: prevGroup.players.map(p => 
            p.id === playerId ? updatedPlayer : p
          )
        }));
      }
    } catch (error) {
      console.error('Error updating buy-in:', error);
    }
  };

  const handleEndAmountChange = (playerId, amount) => {
    setEndAmounts(prev => ({
      ...prev,
      [playerId]: amount
    }));
  };

  const calculatePayouts = () => {
    if (!selectedGroup) return;
    
    const totalBuyIn = selectedGroup.players.reduce((sum, player) => sum + player.totalBuyIn, 0);
    const totalEndAmount = Object.values(endAmounts).reduce((sum, amount) => sum + Number(amount || 0), 0);

    // Check if all end amounts are entered
    const missingEndAmounts = selectedGroup.players.some(player => !endAmounts[player.id]);
    if (missingEndAmounts) {
      alert('Please enter end amounts for all players');
      return;
    }

    // Validate total amounts match
    if (Math.abs(totalBuyIn - totalEndAmount) > 0.01) {
      alert(`Error: Total buy-in ($${totalBuyIn}) doesn't match total end amount ($${totalEndAmount})`);
      return;
    }

    const players = selectedGroup.players.map(player => ({
      name: player.name,
      buyIn: player.totalBuyIn,
      endAmount: Number(endAmounts[player.id])
    }));

    // Calculate balances
    const balances = {};
    players.forEach(player => {
      balances[player.name] = player.endAmount - player.buyIn;
    });

    // Sort players by balance
    const creditors = Object.entries(balances)
      .filter(([_, balance]) => balance > 0)
      .sort(([_, a], [__, b]) => b - a)
      .map(([name]) => name);

    const debtors = Object.entries(balances)
      .filter(([_, balance]) => balance < 0)
      .sort(([_, a], [__, b]) => a - b)
      .map(([name]) => name);

    const payouts = [];
    while (creditors.length > 0 && debtors.length > 0) {
      const creditor = creditors[0];
      const debtor = debtors[0];
      
      const creditAmount = balances[creditor];
      const debtAmount = -balances[debtor];
      const amount = Math.min(creditAmount, debtAmount);

      payouts.push({
        from: debtor,
        to: creditor,
        amount: amount.toFixed(2)
      });

      balances[creditor] -= amount;
      balances[debtor] += amount;

      if (Math.abs(balances[creditor]) < 0.01) creditors.shift();
      if (Math.abs(balances[debtor]) < 0.01) debtors.shift();
    }

    setPayoutResults(payouts);
    setShowResults(true);
  };

  if (showResults) {
    return (
      <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full">
          <h2 className="text-2xl font-bold mb-6">Game Results</h2>
          
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-4">Payouts</h3>
            {payoutResults.length === 0 ? (
              <p>No payouts needed</p>
            ) : (
              <div className="space-y-3">
                {payoutResults.map((payout, index) => (
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
          
          <div className="flex justify-between">
            <button
              onClick={() => setShowResults(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Back to Game
            </button>
            <button
              onClick={() => {
                setShowResults(false);
                setEndAmounts({});
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Start New Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
    {/* Add a sign out button in the header */}
    <div className="bg-white shadow">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">GroupPot</h1>
        <button
          onClick={() => auth.signOut()}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Sign Out
        </button>
      </div>
    </div>
    
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto flex gap-8">
          {/* Main content */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-6">GroupPot</h1>

            {/* Buy-in Amount Setting */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Set Buy-in Amount</h2>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={globalBuyInAmount}
                  onChange={(e) => setGlobalBuyInAmount(e.target.value)}
                  placeholder="Set buy-in amount"
                  className="w-32 px-3 py-2 border rounded"
                />
                <span className="py-2">Current Buy-in: ${globalBuyInAmount}</span>
              </div>
            </div>

            {/* Create Group Form */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Create New Group</h2>
              <form onSubmit={handleCreateGroup} className="flex gap-2">
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
              </form>
            </div>

            {/* Group List */}
            {groups.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Groups</h2>
                <div className="space-y-2">
                  {groups.map(group => (
                    <button
                      key={group.id}
                      onClick={() => setSelectedGroup(group)}
                      className={`w-full text-left px-4 py-2 rounded ${
                        selectedGroup?.id === group.id
                          ? 'bg-blue-100 border-blue-500'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      {group.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Group Section */}
            {selectedGroup && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">{selectedGroup.name}</h2>

                {/* Add Player Form */}
                <form onSubmit={handleAddPlayer} className="mb-6">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="Player name"
                      className="flex-grow px-3 py-2 border rounded"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Add Player
                    </button>
                  </div>
                </form>

                {/* Add EndAmountTracker */}
                {selectedGroup.players.length > 0 && (
                  <EndAmountTracker 
                    totalPotSize={selectedGroup.players.reduce((sum, player) => sum + player.totalBuyIn, 0)}
                    endAmounts={endAmounts}
                  />
                )}

                {/* Players List */}
                {selectedGroup.players.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Players</h3>
                    <div className="space-y-4">
                      {selectedGroup.players.map(player => (
                        <div
                          key={player.id}
                          className="p-4 bg-gray-50 rounded"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <p className="font-medium">{player.name}</p>
                            <p className="text-sm text-gray-600">
                              Total Buy-in: ${player.totalBuyIn}
                            </p>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleBuyInChange(selectedGroup.id, player.id, globalBuyInAmount, true)}
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                            >
                              Add Buy-in (${globalBuyInAmount})
                            </button>
                            {player.buyIns.length > 0 && (
                              <button
                                onClick={() => handleBuyInChange(selectedGroup.id, player.id, null, false)}
                                className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                              >
                                Remove Last Buy-in
                              </button>
                            )}
                          </div>

                          <div className="mt-2">
                            <label className="text-sm text-gray-600">End Amount:</label>
                            <input
                              type="number"
                              value={endAmounts[player.id] || ''}
                              onChange={(e) => handleEndAmountChange(player.id, e.target.value)}
                              placeholder="Enter end amount"
                              className="ml-2 px-2 py-1 border rounded w-32"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={calculatePayouts}
                      className="w-full mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Finish Game & Calculate Payouts
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Poker table display */}
          {selectedGroup && (
            <div className="w-[300px] sticky top-8">
              <PokerTableDisplay group={selectedGroup} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;