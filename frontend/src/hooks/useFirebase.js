import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from '../utils/firebase';

export const useFirebase = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(auth.currentUser);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  // Listen for groups changes
  useEffect(() => {
    if (!user) {
      setGroups([]);
      setLoading(false);
      setError(null);
      return;
    }

    const userGroupsRef = collection(db, `users/${user.uid}/groups`);
    
    const unsubscribe = onSnapshot(userGroupsRef, 
      (snapshot) => {
        const groupsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setGroups(groupsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching groups:', error);
        setError(error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]); // Now we depend on user state instead of auth.currentUser

  // Rest of the code remains the same, but replace auth.currentUser with user
  const createGroup = async (groupData) => {
    if (!user) throw new Error('Not authenticated');
    
    try {
      const userGroupsRef = collection(db, `users/${user.uid}/groups`);
      const docRef = await addDoc(userGroupsRef, {
        ...groupData,
        createdAt: new Date().toISOString(),
        players: []
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating group:', error);
      setError(error);
      throw error;
    }
  };

  // Update other methods similarly, replacing auth.currentUser with user
  // ... rest of the code

  const updateGroup = async (groupId, groupData) => {
    if (!user) throw new Error('Not authenticated');
    
    try {
      const groupRef = doc(db, `users/${user.uid}/groups/${groupId}`);
      await updateDoc(groupRef, groupData);
    } catch (error) {
      console.error('Error updating group:', error);
      setError(error);
      throw error;
    }
  };

  const deleteGroup = async (groupId) => {
    if (!user) throw new Error('Not authenticated');
    
    try {
      const groupRef = doc(db, `users/${user.uid}/groups/${groupId}`);
      await deleteDoc(groupRef);
    } catch (error) {
      console.error('Error deleting group:', error);
      setError(error);
      throw error;
    }
  };

  const addPlayer = async (groupId, playerData) => {
    if (!user) throw new Error('Not authenticated');
    
    try {
      const group = groups.find(g => g.id === groupId);
      if (!group) throw new Error('Group not found');

      const groupRef = doc(db, `users/${user.uid}/groups/${groupId}`);
      await updateDoc(groupRef, {
        players: [...group.players, playerData]
      });
    } catch (error) {
      console.error('Error adding player:', error);
      setError(error);
      throw error;
    }
  };

  const updatePlayer = async (groupId, playerId, playerData) => {
    if (!user) throw new Error('Not authenticated');
    
    try {
      const group = groups.find(g => g.id === groupId);
      if (!group) throw new Error('Group not found');

      const updatedPlayers = group.players.map(player => 
        player.id === playerId ? { ...player, ...playerData } : player
      );

      const groupRef = doc(db, `users/${user.uid}/groups/${groupId}`);
      await updateDoc(groupRef, { 
        players: updatedPlayers 
      });
    } catch (error) {
      console.error('Error updating player:', error);
      setError(error);
      throw error;
    }
  };
  
  const createSession = async (groupId, sessionData) => {
    if (!user) throw new Error('Not authenticated');
    
    try {
      const groupRef = doc(db, `users/${user.uid}/groups/${groupId}`);
      const group = groups.find(g => g.id === groupId);
      if (!group) throw new Error('Group not found');

      const updatedSessions = [...(group.sessions || []), sessionData];
      await updateDoc(groupRef, { sessions: updatedSessions });
    } catch (error) {
      console.error('Error creating session:', error);
      setError(error);
      throw error;
    }
  };
  
  const updateSession = async (groupId, sessionId, sessionData) => {
    if (!user) throw new Error('Not authenticated');
    
    try {
      const groupRef = doc(db, `users/${user.uid}/groups/${groupId}`);
      const group = groups.find(g => g.id === groupId);
      if (!group) throw new Error('Group not found');
  
      const updatedSessions = group.sessions.map(session =>
        session.id === sessionId ? { ...session, ...sessionData } : session
      );
  
      await updateDoc(groupRef, {
        sessions: updatedSessions
      });
      
      console.log('Session updated successfully:', sessionData); // Add logging
    } catch (error) {
      console.error('Error updating session:', error);
      throw error;
    }
  };
  
  const clearSessionEndAmounts = async (groupId, sessionId) => {
    if (!user) throw new Error('Not authenticated');
    
    try {
      const groupRef = doc(db, `users/${user.uid}/groups/${groupId}`);
      const group = groups.find(g => g.id === groupId);
      if (!group) throw new Error('Group not found');
  
      const updatedSessions = (group.sessions || []).map(session => {
        if (session.id === sessionId) {
          const updatedPlayers = session.players.map(player => ({
            ...player,
            endAmount: null
          }));
          return { ...session, players: updatedPlayers };
        }
        return session;
      });
  
      await updateDoc(groupRef, { sessions: updatedSessions });
    } catch (error) {
      console.error('Error clearing end amounts:', error);
      setError(error);
      throw error;
    }
  };
  
  const clearSessionPlayers = async (groupId, sessionId) => {
    if (!user) throw new Error('Not authenticated');
    
    try {
      const groupRef = doc(db, `users/${user.uid}/groups/${groupId}`);
      const group = groups.find(g => g.id === groupId);
      if (!group) throw new Error('Group not found');
  
      const updatedSessions = (group.sessions || []).map(session =>
        session.id === sessionId ? { ...session, players: [] } : session
      );
  
      await updateDoc(groupRef, { sessions: updatedSessions });
    } catch (error) {
      console.error('Error clearing players:', error);
      setError(error);
      throw error;
    }
  };


  const deleteSession = async (groupId, sessionId) => {
    if (!user) throw new Error('Not authenticated');
    
    try {
      const groupRef = doc(db, `users/${user.uid}/groups/${groupId}`);
      const group = groups.find(g => g.id === groupId);
      if (!group) throw new Error('Group not found');

      const updatedSessions = group.sessions.filter(session => session.id !== sessionId);
      await updateDoc(groupRef, { sessions: updatedSessions });
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  };
  

  return {
    groups,
    loading,
    error,
    createGroup,
    updateGroup,
    deleteGroup,
    addPlayer,
    updatePlayer,
    createSession,
    updateSession,
    clearSessionEndAmounts,
    clearSessionPlayers,
    deleteSession
  };
};