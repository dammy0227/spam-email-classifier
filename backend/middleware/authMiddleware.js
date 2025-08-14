import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { User } from '../models/User.js';

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const payload = jwt.verify(token, ENV.JWT_SECRET);
    console.log('Token payload:', payload); // Debug log
    
    const user = await User.findById(payload.id);
    if (!user) {
      console.log('User not found for ID:', payload.id);
      return res.status(401).json({ error: 'Invalid user' });
    }

    // Ensure ID is string for consistent comparison
    req.user = { 
      id: user._id.toString(), 
      email: user.email, 
      name: user.name 
    };
    
    console.log('Authenticated user:', req.user); // Debug log
    next();
  } catch (err) {
    console.error('Authentication error:', err.message);
    return res.status(401).json({ 
      error: 'Invalid or expired token',
      ...(process.env.NODE_ENV === 'development' && { details: err.message })
    });
  }
}