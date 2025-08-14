import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContextInstance';
import '../styles/navbar.css';

const Navbar = ({ toggleSidebar, isSidebarOpen }) => {
  const { user,  } = useContext(AuthContext);

  return (
    <nav className="navbar">
      <div className="navbar-left">
        {user && (
          <button className="hamburger" onClick={toggleSidebar}>
            {isSidebarOpen ? '✖' : '☰'}
          </button>
        )}
        {/* <h1>Email App</h1> */}
      </div>
      <div className="navbar-right">
        {user && (
          <>
            {/* <span className="username">{user.username}</span>
            <button onClick={logout} className="logout-btn">Logout</button> */}
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
