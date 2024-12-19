import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where,
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from '../firebase';

export const useFirebase = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const userGroupsRef = collection(db, `users/${auth.currentUser.uid}/groups`);
    
    const unsubscribe = onSnapshot(userGroupsRef, 
      (snapshot) => {
        const groupsData = [];
        snapshot.forEach((doc) => {
          groupsData.push({ id: doc.id, ...doc.data() });
        });
        setGroups(groupsData);
        setLoading(false);
      },
      (error) => {
        setError(error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const createGroup = async (groupData) => {
    try {
      const userGroupsRef = collection(db, `users/${auth.currentUser.uid}/groups`);
      const docRef = await addDoc(userGroupsRef, {
        ...groupData,
        createdAt: new Date(),
        players: []
      });
      return docRef.id;
    } catch (error) {
      setError(error);
      throw error;
    }
  };

  const updateGroup = async (groupId, groupData) => {
    try {
      const groupRef = doc(db, `users/${auth.currentUser.uid}/groups/${groupId}`);
      await updateDoc(groupRef, groupData);
    } catch (error) {
      setError(error);
      throw error;
    }
  };

  const deleteGroup = async (groupId) => {
    try {
      const groupRef = doc(db, `users/${auth.currentUser.uid}/groups/${groupId}`);
      await deleteDoc(groupRef);
    } catch (error) {
      setError(error);
      throw error;
    }
  };

  const addPlayer = async (groupId, playerData) => {
    try {
      const groupRef = doc(db, `users/${auth.currentUser.uid}/groups/${groupId}`);
      const group = groups.find(g => g.id === groupId);
      if (!group) throw new Error('Group not found');
      
      await updateDoc(groupRef, {
        players: [...group.players, playerData]
      });
    } catch (error) {
      setError(error);
      throw error;
    }
  };

  const updatePlayer = async (groupId, playerId, playerData) => {
    try {
      const groupRef = doc(db, `users/${auth.currentUser.uid}/groups/${groupId}`);
      const group = groups.find(g => g.id === groupId);
      if (!group) throw new Error('Group not found');
      
      const updatedPlayers = group.players.map(player => 
        player.id === playerId ? { ...player, ...playerData } : player
      );
      
      await updateDoc(groupRef, { players: updatedPlayers });
    } catch (error) {
      setError(error);
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
    updatePlayer
  };
};