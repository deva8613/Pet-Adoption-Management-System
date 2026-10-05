import express from 'express';
import { toggleFavorite, getMyFavorites } from '../controllers/favoriteController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getMyFavorites);
router.post('/toggle', protect, toggleFavorite);

export default router;
