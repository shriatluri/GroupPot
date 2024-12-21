import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate} from 'react-router-dom';
import { Auth } from './components/Auth';
import { auth } from './utils/firebase';
import { useFirebase } from './hooks/useFirebase';
import { Home } from './components/Home';
import { Group } from './components/Group';
import { Session } from './components/Session';

// Main App component
function AppContent() {
  const [user, setUser] = useState(null);
  const { loading } = useFirebase();
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow mb-6">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <button 
            onClick={() => navigate('/')} 
            className="text-xl font-bold hover:text-blue-600 transition-colors"
          >
            GroupPot
          </button>
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
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;