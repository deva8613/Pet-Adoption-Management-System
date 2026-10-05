import express from 'express';
import {
  register,
  login,
  forgotPassword,
  resetPassword,
  sendEmailVerification,
  verifyEmail,
  getAdminIdentifier,
  logout
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { rateLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

// Sensitive routes protected by rate limiting (15 requests per 15 minutes)
const authRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many authentication attempts. Please try again in a few minutes.'
});

router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);
router.post('/logout', protect, logout);
router.post('/forgot-password', authRateLimiter, forgotPassword);
router.post('/reset-password', authRateLimiter, resetPassword);

router.post('/send-verification', protect, sendEmailVerification);
router.get('/verify-email/:token', verifyEmail);
router.get('/admin-identifier', getAdminIdentifier);

export default router;
