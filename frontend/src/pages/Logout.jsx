// src/pages/Logout.jsx
import { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContextInstance';

const Logout = () => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    logout(); // clear token & user
    navigate('/'); // send to login page
  }, [logout, navigate]);

  return null; // no UI needed, it's just a redirect
};

export default Logout;
