import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useGameStore } from './store/gameStore';
import { connectSocket, disconnectSocket } from './lib/socket';
import LandingPage from './pages/LandingPage';
import CharacterCreationPage from './pages/CharacterCreationPage';
import GamePage from './pages/GamePage';
import DocsPage from './pages/DocsPage';

function App() {
  const { isAuthenticated, accessToken } = useGameStore();

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
