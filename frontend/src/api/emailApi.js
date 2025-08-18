import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/api/emails`;

const authHeader = (token) => ({
  headers: { Authorization: `Bearer ${token}` }
});

// Email Operations
export const sendEmail = async (token, emailData) => {
  const { data } = await axios.post(`${API_URL}/send`, emailData, authHeader(token));
  return data;
};
export const getInbox = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/inbox`, authHeader(token));
    
    // Handle both possible response formats:
    if (Array.isArray(response.data)) {
      return response.data; // Direct array response
    }
    return response.data?.emails || []; // Handle { emails: [...] } or undefined
    
  } catch (error) {
    console.error('Error fetching inbox:', error);
    throw error; // Re-throw to handle in component
  }
};
export const getSpam = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/spam`, authHeader(token));
    return Array.isArray(response.data) 
      ? response.data 
      : response.data?.emails || [];
  } catch (error) {
    console.error('Error fetching spam:', error);
    throw error;
  }
};

export const getSent = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/sent`, authHeader(token));
    return Array.isArray(response.data) 
      ? response.data 
      : response.data?.emails || [];
  } catch (error) {
    console.error('Error fetching sent:', error);
    throw error;
  }
};

export const getTrash = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/trash`, authHeader(token));
    return Array.isArray(response.data) 
      ? response.data 
      : response.data?.emails || [];
  } catch (error) {
    console.error('Error fetching trash:', error);
    throw error;
  }
};


// Email Management
export const moveToTrash = async (token, emailId) => {
  try {
    const { data } = await axios.patch(`${API_URL}/${emailId}/trash`, {}, authHeader(token));
    return data;
  } catch (err) {
    const errorMsg = err.response?.data?.error || 
      err.response?.status === 403 ? 
        "You don't have permission to move this email" : 
        "Failed to move email to trash";
    throw new Error(errorMsg);
  }
};

export const markAsSpam = async (token, emailId) => {
  try {
    const { data } = await axios.patch(`${API_URL}/${emailId}/spam`, {}, authHeader(token));
    return data;
  } catch (err) {
    const errorMsg = err.response?.data?.error || 
      err.response?.status === 403 ? 
        "Only recipient can mark as spam" : 
        "Failed to mark as spam";
    throw new Error(errorMsg);
  }
};

export const markAsNotSpam = async (token, emailId) => {
  try {
    const { data } = await axios.patch(`${API_URL}/${emailId}/not-spam`, {}, authHeader(token));
    return data;
  } catch (err) {
    const errorMsg = err.response?.data?.error || 
      err.response?.status === 403 ? 
        "Only recipient can mark as not spam" : 
        "Failed to mark as not spam";
    throw new Error(errorMsg);
  }
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
    throw new Error(
      err.response?.status === 404
        ? 'Email not found or unauthorized.'
        : 'Failed to delete email.'
    );
  }
};