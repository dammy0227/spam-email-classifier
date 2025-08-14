// src/config/db.js
import mongoose from 'mongoose';
import { ENV } from './env.js';

export async function connectDB() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(ENV.MONGO_URI);
  console.log('✅ MongoDB connected');
}
