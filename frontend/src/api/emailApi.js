import axios from 'axios';

const API_URL = 'http://localhost:5000/api/emails'; // change to production URL if needed

// Set token in request header
const authHeader = (token) => ({
  headers: { Authorization: `Bearer ${token}` }
});

export const sendEmail = async (token, emailData) => {
  const { data } = await axios.post(`${API_URL}/send`, emailData, authHeader(token));
  return data;
};

export const getInbox = async (token) => {
  const { data } = await axios.get(`${API_URL}/inbox`, authHeader(token));
  return data;
};

export const getSent = async (token) => {
  const { data } = await axios.get(`${API_URL}/sent`, authHeader(token));
  return data;
};

export const getTrash = async (token) => {
  const { data } = await axios.get(`${API_URL}/trash`, authHeader(token));
  return data;
};

export const moveToTrash = async (token, emailId) => {
  const { data } = await axios.patch(`${API_URL}/${emailId}/trash`, {}, authHeader(token));
  return data;
};

export const markRead = async (token, emailId) => {
  const { data } = await axios.patch(`${API_URL}/${emailId}/read`, {}, authHeader(token));
  return data;
};

export const deleteEmail = async (token, emailId) => {
  try {
    const { data } = await axios.delete(`${API_URL}/${emailId}`, authHeader(token));
    return data;
  } catch (err) {
    console.error('Failed to delete email:', err.response?.status, err.response?.data || err.message);
    throw new Error(err.response?.status === 404 ? 'Email not found or unauthorized.' : 'Failed to delete email.');
  }
};

