// App.js
import React, { useState, useContext, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContextInstance';
import { io } from 'socket.io-client';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import InboxPage from './pages/InboxPage';
import SentPage from './pages/SentPage';
import TrashPage from './pages/TrashPage';
import SpamPage from './pages/SpamPage';
import ComposePage from './pages/ComposePage';
import Logout from './pages/Logout';

import './styles/global.css';

const socket = io("https://spam-email-classifier-c5yf.onrender.com", {
  transports: ["websocket"],
  autoConnect: false
});

const App = () => {
  const { user, token } = useContext(AuthContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    if (user && token) {
      socket.connect();
      socket.emit("join", user._id); // join room for only this user
    }
    return () => {
      socket.disconnect();
    };
  }, [user, token]);

  return (
    <Router>
      {user && <Navbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />}
      <div className="app-container" style={{ display: 'flex', minHeight: '100vh' }}>
        {user && <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />}
        <main style={{ flex: 1, padding: '20px' }}>
          <Routes>
            {!user ? (
              <>
                <Route path="/" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/login" element={<LoginPage />} />
                {/* <Route path="*" element={<Navigate to="/login" />} /> */}
              </>
            ) : (
              <>
                <Route path="/inbox" element={<InboxPage socket={socket} />} />
                <Route path="/sent" element={<SentPage socket={socket} />} />
                <Route path="/trash" element={<TrashPage socket={socket} />} />
                <Route path="/compose" element={<ComposePage />} />
                <Route path="/spam" element={<SpamPage />} />
                <Route path="/logout" element={<Logout />} />
              </>
            )}
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
