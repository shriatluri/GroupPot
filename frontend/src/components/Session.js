import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFirebase } from '../hooks/useFirebase';

export const Session = () => {
  const navigate = useNavigate();
  const { groupId, sessionId } = useParams();
  const { groups, updateSession } = useFirebase();
  const [playerName, setPlayerName] = useState('');
  const [buyInAmount, setBuyInAmount] = useState('50');
  const [showPayouts, setShowPayouts] = useState(false);
  const [cateringAmount, setCateringAmount] = useState('0');
  const [hostId, setHostId] = useState(null);
  const [hostPays, setHostPays] = useState(true);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [sessionDuration, setSessionDuration] = useState('00:00:00');
  const [accountantId, setAccountantId] = useState(null);
  const group = groups.find(g => g.id === groupId);
  const session = group?.sessions?.find(s => s.id === sessionId);

  // Add this helper function at the beginning of your component, after the state declarations
  const getCalculations = () => {
    const balances = {};
    let error = null;

      // Add this check at the start
    if (!accountantId) {
      error = 'Please select an accountant before calculating payouts';
      return { balances, payouts: [], error };
    }
  
    if (!session.players || session.players.length === 0) {
      error = 'No players in session';
      return { balances, payouts: [], error };
    }
  
    const missingEndAmounts = session.players.some(player =>
      player.endAmount === null || player.endAmount === undefined || player.endAmount === ''
    );
  
    if (missingEndAmounts) {
      error = 'Please enter end amounts for all players';
      return { balances, payouts: [], error };
    }
  
    const totalPot = session.players.reduce((sum, player) => sum + player.totalBuyIn, 0);
    const totalEntered = session.players.reduce((sum, player) => {
      const endAmount = Number(player.endAmount) || 0;
      return sum + endAmount;
    }, 0);
  
    if (Math.abs(totalPot - totalEntered) > 0.01) {
      const difference = Math.abs(totalPot - totalEntered).toFixed(2);
      error = `Total amount entered (${totalEntered.toFixed(2)}) does not match total pot (${totalPot.toFixed(2)}). Difference: $${difference}`;
      return { balances, payouts: [], error };
    }
  
    // Calculate base balances from poker
    session.players.forEach(player => {
      const endAmount = Number(player.endAmount || 0);
      const buyIn = player.totalBuyIn;
      balances[player.name] = endAmount - buyIn;
    });
  
    const hostPlayer = session.players.find(p => p.isHost);
    const cateringTotal = Number(cateringAmount) || 0;
  
    const hostPaymentOption = hostPays ? 'Host Pays Equal Share' : 'Host Does Not Pay';
  
    // Handle catering
    if (cateringTotal > 0) {
      if (hostPaymentOption === 'Host Pays Equal Share') {
        const cateringPerPlayer = cateringTotal / session.players.length;
        Object.keys(balances).forEach(playerName => {
          balances[playerName] = +(balances[playerName] - cateringPerPlayer).toFixed(2);
        });
        if (hostPlayer) {
          balances[hostPlayer.name] = +(balances[hostPlayer.name] + cateringTotal).toFixed(2);
        }
      } else if (hostPaymentOption === 'Host Does Not Pay') {
        const nonHostPlayers = session.players.filter(p => !p.isHost);
        if (nonHostPlayers.length > 0) {
          const cateringPerNonHost = cateringTotal / nonHostPlayers.length;
          nonHostPlayers.forEach(player => {
            balances[player.name] = +(balances[player.name] - cateringPerNonHost).toFixed(2);
          });
        }
        if (hostPlayer) {
          balances[hostPlayer.name] = +(balances[hostPlayer.name] + cateringTotal).toFixed(2);
        }
      } else if (hostPaymentOption === 'Host Already Paid') {
        const nonHostPlayers = session.players.filter(p => !p.isHost);
        if (nonHostPlayers.length > 0) {
          const cateringPerNonHost = cateringTotal / nonHostPlayers.length;
          nonHostPlayers.forEach(player => {
            balances[player.name] = +(balances[player.name] - cateringPerNonHost).toFixed(2);
          });
        }
        // Host already paid separately, no addition to host balance
      }
    }
  
    // Add the GroupPot fee logic
    const groupPotFeePerUser = 5;
    const groupPotFeeTotal = session.players.length * groupPotFeePerUser;
  
    // Subtract GroupPot fee from each player’s balance
    session.players.forEach(player => {
      balances[player.name] = +(balances[player.name] - groupPotFeePerUser).toFixed(2);
    });
  
    // Calculate payouts from final balances
    const creditors = Object.entries(balances)
      .filter(([_, balance]) => balance > 0)
      .sort(([_, a], [__, b]) => b - a);
  
    const debtors = Object.entries(balances)
      .filter(([_, balance]) => balance < 0)
      .sort(([_, a], [__, b]) => a - b);
  
    const payouts = [];
    let tempCreditors = [...creditors];
    let tempDebtors = [...debtors];
  
    while (tempCreditors.length > 0 && tempDebtors.length > 0) {
      const [creditorName, creditAmount] = tempCreditors[0];
      const [debtorName, debtAmount] = tempDebtors[0];
  
      const amount = Math.min(creditAmount, -debtAmount);
  
      if (amount >= 0.01) {
        payouts.push({
          from: debtorName,
          to: creditorName,
          amount: amount.toFixed(2)
        });
      }
  
      if (Math.abs(creditAmount - amount) < 0.01) tempCreditors.shift();
      else tempCreditors[0][1] = +(creditAmount - amount).toFixed(2);
  
      if (Math.abs(-debtAmount - amount) < 0.01) tempDebtors.shift();
      else tempDebtors[0][1] = +(debtAmount + amount).toFixed(2);
    }
  
    // Return groupPotFeeTotal so you can show it in a popup
    return { balances, payouts, error, groupPotFeeTotal };
  };


  // Session Timer Logic
  useEffect(() => {
    // Check if session start time is stored in localStorage
    const storedStartTime = localStorage.getItem(`session_${sessionId}_start`);
    
    if (!storedStartTime) {
      const startTime = new Date();
      setSessionStartTime(startTime);
      localStorage.setItem(`session_${sessionId}_start`, startTime.toISOString());
    } else {
      setSessionStartTime(new Date(storedStartTime));
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionStartTime) return;

    const timer = setInterval(() => {
      const now = new Date();
      const diff = now - new Date(sessionStartTime);
      const totalHours = diff / 3600000;

      // Check if 24 hours have passed
      if (totalHours >= 24) {
        clearInterval(timer);
        setSessionDuration('24:00:00');
        alert('Session has reached its 24-hour limit.');
        return;
      }

      const hours = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const minutes = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const seconds = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      setSessionDuration(`${hours}:${minutes}:${seconds}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionStartTime]);

  const handleAddPlayer = async (e) => {
    e.preventDefault();
    if (!playerName.trim() || !buyInAmount) return;

    try {
      const newPlayer = {
        id: Date.now().toString(),
        name: playerName,
        buyIns: [Number(buyInAmount)],
        totalBuyIn: Number(buyInAmount),
        endAmount: null,
        isHost: false
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
            newBuyIns.pop();
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

  const handleSetHost = async (playerId) => {
    try {
      const updatedSession = {
        ...session,
        players: session.players.map(player => ({
          ...player,
          isHost: player.id === playerId
        }))
      };
      setHostId(playerId);
      await updateSession(groupId, sessionId, updatedSession);
    } catch (error) {
      console.error('Error setting host:', error);
    }
  };

  const handleSetAccountant = async (playerId) => {
    try {
      const updatedSession = {
        ...session,
        players: session.players.map(player => ({
          ...player,
          isAccountant: player.id === playerId
        }))
      };
      setAccountantId(playerId);
      await updateSession(groupId, sessionId, updatedSession);
    } catch (error) {
      console.error('Error setting accountant:', error);
    }
  };

  const handleUpdateCatering = async (amount) => {
    try {
      const updatedSession = {
        ...session,
        cateringAmount: Number(amount)
      };
      setCateringAmount(amount);
      await updateSession(groupId, sessionId, updatedSession);
    } catch (error) {
      console.error('Error updating catering amount:', error);
    }
  };

  if (!group || !session) return <div>Session not found</div>;

  const totalPot = session.players?.reduce((sum, player) => sum + player.totalBuyIn, 0) || 0;
  const totalEntered = session.players?.reduce((sum, player) => {
    const endAmount = Number(player.endAmount) || 0;
    return sum + endAmount;
  }, 0) || 0;
  const totalRemaining = -(totalEntered - totalPot);

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{group.name}</h1>
          <h2 className="text-xl text-gray-600 font-bold">{session.name}</h2>
          <p className="text-gray-500">Session Duration: {sessionDuration}</p>
        </div>
        <button
          onClick={() => navigate(`/group/${groupId}`)}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Back
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

      {/* Totals Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Total Pot</h3>
            <p className="text-2xl font-bold">${totalPot.toFixed(2)}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Total Entered</h3>
            <p className="text-2xl font-bold">${totalEntered.toFixed(2)}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Total Remaining</h3>
            <p className="text-2xl font-bold">${totalRemaining.toFixed(2)}</p>
          </div>
        </div>
        <button
          onClick={() => setShowPayouts(true)}
          className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Calculate Interim Payouts
        </button>
      </div>

      {/* Players List */}
      <div className="space-y-4 mb-6">
        {session.players?.map(player => (
          <div key={player.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold">{player.name}</h3>
                {player.isHost && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded">
                    Host
                  </span>
                )}
              </div>
              <button
                onClick={() => handleRemovePlayer(player.id)}
                className="text-red-500 hover:text-red-600"
              >
                Remove
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">Total Buy-in: ${player.totalBuyIn.toFixed(2)}</p>
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

      {/* End Session Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">End Session Details</h3>

        {/* Accountant Selection */}
        <div className="mb-6">
          <h4 className="text-lg font-medium mb-4">GroupPot Accountant</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Select Accountant</label>
              <select
                value={accountantId || ''}
                onChange={(e) => handleSetAccountant(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">Select Accountant</option>
                {session.players?.map(player => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
            </div>
            {accountantId && (
              <div className="text-sm text-gray-600">
                <p>Selected accountant will:</p>
                <ul className="list-disc ml-5 mt-2">
                  <li>Pay GroupPot fee of ${(session.players?.length || 0) * 5}</li>
                  <li>Collect $5 from each player</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Host Selection */}
        <div className="mb-6">
          <h4 className="text-lg font-medium mb-4">Host Selection</h4>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Select Host</label>
            <select
              value={hostId || ''}
              onChange={(e) => handleSetHost(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="">Select Host</option>
              {session.players?.map(player => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </div>
        </div>
              
        {/* Catering Section */}
        <div className="mb-6">
          <h4 className="text-lg font-medium mb-4">Catering Details</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Catering Amount</label>
              <input
                type="number"
                value={cateringAmount}
                onChange={(e) => handleUpdateCatering(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                placeholder="0"
              />
            </div>

            {Number(cateringAmount) > 0 && (
              <>
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600">Host Payment:</label>
                  <select
                    value={hostPays.toString()}
                    onChange={(e) => setHostPays(e.target.value === 'true')}
                    className="px-3 py-2 border rounded"
                  >
                    <option value="true">Host Pays Equal Share</option>
                    <option value="false">Host Doesn't Pay</option>
                  </select>
                </div>

                {!hostPays && (
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Select Host</label>
                    <select
                      value={hostId || ''}
                      onChange={(e) => handleSetHost(e.target.value)}
                      className="w-full px-3 py-2 border rounded"
                    >
                      <option value="">Select Host</option>
                      {session.players?.map(player => (
                        <option key={player.id} value={player.id}>
                          {player.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowPayouts(true)}
          disabled={!accountantId}
          className={`w-full px-4 py-2 text-white rounded ${
            accountantId 
            ? "bg-green-500 hover:bg-green-600" 
            : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          {!accountantId 
            ? "Select an Accountant to Calculate Payouts" 
            : "Calculate Final Payouts"}
        </button>
      </div>

      {/* Payouts Modal */}
      {showPayouts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
            {/* Header - fixed */}
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Payouts</h2>
                <button
                  onClick={() => setShowPayouts(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content - scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              {(() => {
                const { balances, payouts, error } = getCalculations();
                
                if (error) {
                  return (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-600">{error}</p>
                    </div>
                  );
                }

                return (
                  <>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Player Balances</h3>
                      <div className="space-y-2 mb-6">
                        {Object.entries(balances).map(([name, balance]) => (
                          <div key={name} className="flex justify-between">
                            <span>{name}</span>
                            <span className={balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {balance >= 0 ? '+' : ''}{balance.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <h3 className="text-lg font-semibold mb-2">Payment Instructions</h3>
                      <div className="space-y-3">
                        {/* Only show GroupPot fee for accountant */}
                        {accountantId && (
                          <div className="p-3 bg-gray-50 rounded border border-gray-200">
                            <span className="font-semibold text-blue-600">
                              {session.players.find(p => p.id === accountantId)?.name}
                            </span>
                            {' owes GroupPot '}
                            <span className="font-semibold">${(session.players?.length || 0) * 5}</span>
                          </div>
                        )}
                        
                        {/* Game payouts (including GroupPot fees in calculations) */}
                        {payouts.length > 0 ? (
                          payouts.map((payout, index) => (
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
                          ))
                        ) : (
                          <p className="text-gray-500">No payouts needed</p>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Footer - fixed */}
            <div className="p-6 border-t">
              <button
                onClick={() => setShowPayouts(false)}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};