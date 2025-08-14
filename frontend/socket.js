// src/socket.js
import { io } from 'socket.io-client';

// Point to your backend server
export const socket = io('https://spam-email-classifier-c5yf.onrender.com', {
  transports: ['websocket'], // ensures websocket first
});
