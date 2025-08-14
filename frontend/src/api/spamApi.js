import axios from 'axios';

// Use Vite environment variable (configured in .env files)
const API_URL = `${import.meta.env.VITE_API_URL}/api`;

const authHeader = (token) => ({
  headers: { Authorization: `Bearer ${token}` }
});

export const checkSpam = async (token, message) => {
  const { data } = await axios.post(
    `${API_URL}/check-spam`,
    { message },
    authHeader(token)
  );
  return data; // { label: 'spam' | 'ham' | 'suspicious', confidence: 0.xx }
};
