// src/server.js
import { ENV } from './config/env.js';
import { connectDB } from './config/db.js';
import app from './app.js';
import cors from 'cors';


app.use(cors({
  origin: 'https://spam-email-classifier-three.vercel.app', // your Vercel frontend
  credentials: true,
}));

(async () => {
  try {
    await connectDB();
    // No need to preload HF model, API handles it on-demand
    app.listen(ENV.PORT, () => {
      console.log(`🚀 Server listening on http://localhost:${ENV.PORT}`);
    });
  } catch (e) {
    console.error('Failed to start server:', e);
    process.exit(1);
  }
})();
