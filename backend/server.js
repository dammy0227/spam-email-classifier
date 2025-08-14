// src/server.js
import { ENV } from './config/env.js';
import { connectDB } from './config/db.js';
import app from './app.js';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

app.use(cors({
  origin: [
    'https://spam-email-classifier-three.vercel.app',
    'http://localhost:5173'
  ],
  credentials: true,
}));

// Create HTTP server
const httpServer = createServer(app);

// Create Socket.IO server
export const io = new Server(httpServer, {
  cors: {
    origin: [
      'https://spam-email-classifier-three.vercel.app',
      'http://localhost:5173'
    ],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log(`🟢 Client connected: ${socket.id}`);

  // Optional: Join user-specific room when they log in
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  socket.on('disconnect', () => {
    console.log(`🔴 Client disconnected: ${socket.id}`);
  });
});

(async () => {
  try {
    await connectDB();
    httpServer.listen(ENV.PORT, () => {
      console.log(`🚀 Server listening on http://localhost:${ENV.PORT}`);
    });
  } catch (e) {
    console.error('Failed to start server:', e);
    process.exit(1);
  }
})();
