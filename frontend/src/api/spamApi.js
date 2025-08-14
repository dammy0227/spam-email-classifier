import axios from 'axios';

const API_URL = 'http://localhost:5000/api'; // change to production URL if needed

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
