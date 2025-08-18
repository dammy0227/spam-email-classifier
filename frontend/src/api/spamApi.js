import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

const authHeader = (token) => ({
  headers: { Authorization: `Bearer ${token}` }
});

export const checkSpam = async (token, message) => {
  try {
    const { data } = await axios.post(
      `${API_URL}/check-spam`,
      { message },
      authHeader(token)
    );
    return data; // { isSpam: boolean, confidence: number, details: object }
  } catch (err) {
    console.error('Spam check failed:', err);
    return {
      isSpam: false,
      confidence: 0,
      details: { error: err.response?.data?.error || 'Failed to check spam' }
    };
  }
};