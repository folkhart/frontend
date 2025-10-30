import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useGameStore } from './store/gameStore';
import { connectSocket, disconnectSocket } from './lib/socket';
import LandingPage from './pages/LandingPage';
import CharacterCreationPage from './pages/CharacterCreationPage';
import GamePage from './pages/GamePage';
import DocsPage from './pages/DocsPage';

// Increment this version whenever you reset the database
// This will auto-logout all cached users
const DB_VERSION = '1.0.0';

function App() {
  const { isAuthenticated, accessToken, clearAuth } = useGameStore();

  // Check database version on app load
  useEffect(() => {
    const storedVersion = localStorage.getItem('db_version');
    if (storedVersion !== DB_VERSION) {
      // Database was reset, clear all cached auth data
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem('db_version', DB_VERSION);
      if (isAuthenticated) {
        clearAuth();
        window.location.reload();
      }
    } else {
      localStorage.setItem('db_version', DB_VERSION);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      connectSocket(accessToken);
    }

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, accessToken]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={!isAuthenticated ? <LandingPage /> : <Navigate to="/game" />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/create-character" element={isAuthenticated ? <CharacterCreationPage /> : <Navigate to="/" />} />
        <Route path="/game" element={isAuthenticated ? <GamePage /> : <Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
