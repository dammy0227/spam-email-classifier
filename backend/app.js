// src/app.js
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/authRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import spamRoutes from './routes/spamRoutes.js';

const app = express();
app.use(cors({
  origin: [
    'https://spam-email-classifier-three.vercel.app', // production
    'http://localhost:5173' // local dev
  ],
  credentials: true,
}));

app.use(express.json());

app.get('/health', (_, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api', spamRoutes); // exposes POST /api/check-spam

// Basic error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

export default app;
