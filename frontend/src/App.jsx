import React, { useState, useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContextInstance';

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

import './styles/global.css';

const App = () => {
  const { user } = useContext(AuthContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <Router>
      {user && <Navbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />}
      <div className="app-container" style={{ display: 'flex', minHeight: '100vh' }}>
        {user && (
          <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        )}
        <main style={{ flex: 1, padding: '20px' }}>
          <Routes>
            {!user ? (
              <>
                <Route path="/" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="*" element={<Navigate to="/login" />} />
              </>
            ) : (
              <>
                <Route path="/inbox" element={<InboxPage />} />
                <Route path="/sent" element={<SentPage />} />
                <Route path="/trash" element={<TrashPage />} />
                <Route path="/compose" element={<ComposePage />} />
                <Route path="/spam" element={<SpamPage />} />
                {/* <Route path="*" element={<Navigate to="/inbox" />} /> */}
              </>
            )}
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
