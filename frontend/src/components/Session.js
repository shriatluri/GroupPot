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

  if (!group || !session) return <div className="dark:text-white">Session not found</div>;

  const totalPot = session.players?.reduce((sum, player) => sum + player.totalBuyIn, 0) || 0;
  const totalEntered = session.players?.reduce((sum, player) => {
    const endAmount = Number(player.endAmount) || 0;
    return sum + endAmount;
  }, 0) || 0;
  const totalRemaining = -(totalEntered - totalPot);

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {group.name}
          </h1>
          <h2 className="text-xl text-gray-600 dark:text-gray-300 font-bold">
            {session.name}
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Session Duration: {sessionDuration}
          </p>
        </div>
        <button
          onClick={() => navigate(`/group/${groupId}`)}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 
            dark:bg-gray-600 dark:hover:bg-gray-700 transition-colors"
        >
          Back
        </button>
      </div>

      {/* Add Player Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Add Player
        </h3>
        <form onSubmit={handleAddPlayer} className="space-y-4">
          <div className="flex gap-4">
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Player name"
              className="flex-1 px-3 py-2 border rounded transition-colors
                dark:bg-gray-700 dark:border-gray-600 dark:text-white 
                dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 
                focus:border-blue-500 dark:focus:ring-blue-400"
              required
            />
            <input
              type="number"
              value={buyInAmount}
              onChange={(e) => setBuyInAmount(e.target.value)}
              placeholder="Buy-in amount"
              className="w-32 px-3 py-2 border rounded transition-colors
                dark:bg-gray-700 dark:border-gray-600 dark:text-white 
                dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 
                focus:border-blue-500 dark:focus:ring-blue-400"
              required
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded transition-colors
                hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700
                focus:outline-none focus:ring-2 focus:ring-blue-500 
                focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              Add Player
            </button>
          </div>
        </form>
      </div>

      {/* Totals Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Pot
            </h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${totalPot.toFixed(2)}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Entered
            </h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${totalEntered.toFixed(2)}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Remaining
            </h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${totalRemaining.toFixed(2)}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowPayouts(true)}
          className="w-full px-4 py-2 bg-green-500 text-white rounded transition-colors
            hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700
            focus:outline-none focus:ring-2 focus:ring-green-500 
            focus:ring-offset-2 dark:focus:ring-offset-gray-800"
        >
          Calculate Interim Payouts
        </button>
      </div>

      {/* Players List */}
      <div className="space-y-4 mb-6">
        {session.players?.map(player => (
          <div 
            key={player.id} 
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 
              transition-colors hover:shadow-md"
          >
            {/* Player Header */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {player.name}
                </h3>
                {player.isHost && (
                  <span className="px-2 py-1 text-sm rounded
                    bg-blue-100 text-blue-700 
                    dark:bg-blue-900 dark:text-blue-300"
                  >
                    Host
                  </span>
                )}
                {player.isAccountant && (
                  <span className="px-2 py-1 text-sm rounded
                    bg-purple-100 text-purple-700 
                    dark:bg-purple-900 dark:text-purple-300"
                  >
                    Accountant
                  </span>
                )}
              </div>
              <button
                onClick={() => handleRemovePlayer(player.id)}
                className="text-red-500 hover:text-red-600 
                  dark:text-red-400 dark:hover:text-red-300
                  transition-colors focus:outline-none 
                  focus:ring-2 focus:ring-red-500 focus:ring-offset-2 
                  dark:focus:ring-offset-gray-800 rounded"
              >
                Remove
              </button>
            </div>

            {/* Player Details */}
            <div className="grid grid-cols-2 gap-4">
              {/* Buy-in Section */}
              <div>
                <p className="text-gray-600 dark:text-gray-300">
                  Total Buy-in: ${player.totalBuyIn.toFixed(2)}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <button
                    onClick={() => handleAddBuyIn(player.id)}
                    className="px-3 py-1 rounded transition-colors
                      bg-green-100 text-green-700 hover:bg-green-200 
                      dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800
                      focus:outline-none focus:ring-2 focus:ring-green-500 
                      focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                  >
                    Add Buy-in (${buyInAmount})
                  </button>
                  {player.buyIns.length > 0 && (
                    <button
                      onClick={() => handleRemoveBuyIn(player.id)}
                      className="px-3 py-1 rounded transition-colors
                        bg-red-100 text-red-700 hover:bg-red-200 
                        dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800
                        focus:outline-none focus:ring-2 focus:ring-red-500 
                        focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                    >
                      Remove Buy-in
                    </button>
                  )}
                </div>
              </div>

              {/* End Amount Section */}
              <div className="text-right">
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                  End Amount
                </label>
                <input
                  type="number"
                  value={player.endAmount || ''}
                  onChange={(e) => handleUpdateEndAmount(player.id, e.target.value)}
                  className="px-3 py-2 border rounded w-full transition-colors
                    dark:bg-gray-700 dark:border-gray-600 dark:text-white
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                    dark:focus:ring-blue-400 dark:placeholder-gray-400"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Buy-ins History */}
            {player.buyIns.length > 0 && (
              <div className="mt-4 pt-4 border-t dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Buy-in History:
                  <div className="flex flex-wrap gap-2 mt-1">
                    {player.buyIns.map((amount, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700"
                      >
                        ${amount}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* End Session Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          End Session Details
        </h3>

        {/* Accountant Selection */}
        <div className="mb-8">
          <h4 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
            GroupPot Accountant
          </h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                Select Accountant
              </label>
              <select
                value={accountantId || ''}
                onChange={(e) => handleSetAccountant(e.target.value)}
                className="w-full px-3 py-2 border rounded transition-colors
                  dark:bg-gray-700 dark:border-gray-600 dark:text-white
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                  dark:focus:ring-blue-400"
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
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg
                border border-blue-100 dark:border-blue-800">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Selected accountant will:
                </p>
                <ul className="list-disc ml-5 mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  <li>Pay GroupPot fee of ${(session.players?.length || 0) * 5}</li>
                  <li>Collect $5 from each player</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Host Selection */}
        <div className="mb-8">
          <h4 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
            Host Selection
          </h4>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
              Select Host
            </label>
            <select
              value={hostId || ''}
              onChange={(e) => handleSetHost(e.target.value)}
              className="w-full px-3 py-2 border rounded transition-colors
                dark:bg-gray-700 dark:border-gray-600 dark:text-white
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                dark:focus:ring-blue-400"
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
        <div className="mb-8">
          <h4 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
            Catering Details
          </h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                Catering Amount
              </label>
              <input
                type="number"
                value={cateringAmount}
                onChange={(e) => handleUpdateCatering(e.target.value)}
                className="w-full px-3 py-2 border rounded transition-colors
                  dark:bg-gray-700 dark:border-gray-600 dark:text-white
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                  dark:focus:ring-blue-400 dark:placeholder-gray-400"
                placeholder="0"
              />
            </div>

            {Number(cateringAmount) > 0 && (
              <>
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg
                  border border-yellow-100 dark:border-yellow-800">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600 dark:text-gray-300">
                      Host Payment:
                    </label>
                    <select
                      value={hostPays.toString()}
                      onChange={(e) => setHostPays(e.target.value === 'true')}
                      className="flex-1 px-3 py-2 border rounded transition-colors
                        dark:bg-gray-700 dark:border-gray-600 dark:text-white
                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                        dark:focus:ring-blue-400"
                    >
                      <option value="true">Host Pays Equal Share</option>
                      <option value="false">Host Doesn't Pay</option>
                    </select>
                    </div>

                    {!hostPays && !hostId && (
                      <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
                        Please select a host in the Host Selection section above to handle catering expenses
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

        <button
          onClick={() => setShowPayouts(true)}
          disabled={!accountantId}
          className={`w-full px-4 py-2 text-white rounded transition-colors
            focus:outline-none focus:ring-2 focus:ring-offset-2 
            dark:focus:ring-offset-gray-800
            ${accountantId 
              ? "bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 focus:ring-green-500" 
              : "bg-gray-300 dark:bg-gray-600 cursor-not-allowed"
            }`}
        >
          {!accountantId 
            ? "Select an Accountant to Calculate Payouts" 
            : "Calculate Final Payouts"}
        </button>
      </div>

        {/* Payouts Modal */}
        {showPayouts && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col
            shadow-xl relative animate-fadeIn">
            {/* Header */}
            <div className="p-6 border-b dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Payouts
                </h2>
                <button
                  onClick={() => setShowPayouts(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 
                    dark:hover:text-gray-300 transition-colors rounded-full p-1
                    hover:bg-gray-100 dark:hover:bg-gray-700
                    focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
                >
                  <span className="sr-only">Close</span>
                  ✕
                </button>
              </div>
            </div>

            {/* Content - scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              {(() => {
                const { balances, payouts, error, groupPotFeeTotal } = getCalculations();
                
                if (error) {
                  return (
                    <div className="p-4 bg-red-50 dark:bg-red-900/50 border border-red-200 
                      dark:border-red-800 rounded-lg">
                      <p className="text-red-600 dark:text-red-400">
                        {error}
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-6">
                    {/* Player Balances */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                        Player Balances
                      </h3>
                      <div className="space-y-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        {Object.entries(balances).map(([name, balance]) => (
                          <div key={name} className="flex justify-between items-center">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {name}
                            </span>
                            <span className={`font-medium ${
                              balance >= 0 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {balance >= 0 ? '+' : ''}{balance.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Payment Instructions */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                        Payment Instructions
                      </h3>
                      <div className="space-y-3">
                        {/* GroupPot Fee Section */}
                        {accountantId && (
                          <div className="mb-6 p-5 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl
                            border-l-4 border-indigo-500 dark:border-indigo-400">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-indigo-600 dark:text-indigo-300">
                                  {session.players.find(p => p.id === accountantId)?.name}
                                </span>
                                <span className="text-gray-600 dark:text-gray-400">
                                  collects GroupPot fee:
                                </span>
                                <span className="font-bold text-gray-900 dark:text-white text-lg">
                                  ${groupPotFeeTotal}
                                </span>
                              </div>
                              <span className="text-sm bg-indigo-100 dark:bg-indigo-800/50 px-3 py-1 rounded-full text-indigo-600 dark:text-indigo-300">
                                $5 per player
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {/* Game Payouts */}
                        <div className="space-y-3">
                          {payouts.length > 0 ? (
                            payouts.map((payout, index) => (
                              <div
                                key={index}
                                className="p-5 bg-gray-50 dark:bg-gray-800 rounded-xl
                                  border-l-4 border-gray-300 dark:border-gray-600
                                  hover:shadow-lg transition-all duration-200"
                              >
                                <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-red-600 dark:text-red-400">
                                    {payout.from}
                                  </span>
                                  <span className="font-medium text-gray-700 dark:text-gray-300">
                                    pays
                                  </span>
                                  <span className="font-semibold text-green-600 dark:text-green-400">
                                    {payout.to}
                                  </span>
                                </div>
                                  <span className="font-bold text-lg text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg">
                                    ${payout.amount}
                                  </span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                              No payouts needed
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="p-6 border-t dark:border-gray-700">
              <button
                onClick={() => setShowPayouts(false)}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded
                  hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700
                  transition-colors focus:outline-none focus:ring-2 
                  focus:ring-gray-500 focus:ring-offset-2
                  dark:focus:ring-offset-gray-800"
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