import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/sidebar.css';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Close button only visible on mobile */}
      <button className="close-sidebar" onClick={toggleSidebar}>
        ✖
      </button>

      <ul>
        <li><Link to="/inbox" onClick={toggleSidebar}>Inbox</Link></li>
        <li><Link to="/sent" onClick={toggleSidebar}>Sent</Link></li>
        <li><Link to="/trash" onClick={toggleSidebar}>Trash</Link></li>
        <li><Link to="/compose" onClick={toggleSidebar}>Compose</Link></li>
        <li><Link to="/spam" onClick={toggleSidebar}>Spam Check</Link></li>
        <li><Link to="/logout" onClick={toggleSidebar}>logout</Link></li>
      </ul>
    </aside>
  );
};

export default Sidebar;
