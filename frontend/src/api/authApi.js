import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/api/auth`;

export const registerUser = async (userData) => {
  const { data } = await axios.post(`${API_URL}/register`, userData);
  return data;
};

export const loginUser = async (userData) => {
  const { data } = await axios.post(`${API_URL}/login`, userData);
  return data;
};
