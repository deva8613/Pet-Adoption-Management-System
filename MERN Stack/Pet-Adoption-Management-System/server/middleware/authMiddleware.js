import jwt from 'jsonwebtoken';
import { getDB } from '../config/db.js';
import { ObjectId } from 'mongodb';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

      const db = getDB();
      const user = await db.collection('users').findOne(
        { _id: new ObjectId(decoded.id) },
        { projection: { password: 0 } }
      );

      if (!user) {
        return res.status(401).json({ success: false, message: 'User not found or token invalid' });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Auth middleware error:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

export const optionalProtect = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      const db = getDB();
      const user = await db.collection('users').findOne(
        { _id: new ObjectId(decoded.id) },
        { projection: { password: 0 } }
      );
      if (user) {
        req.user = user;
      }
    } catch (error) {
      // Ignore invalid/expired tokens for public endpoints
    }
  }
  next();
};

