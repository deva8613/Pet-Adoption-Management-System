import express from 'express';
import { getShelters, getShelterById, getShelterDashboardStats } from '../controllers/shelterController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/dashboard-stats', protect, authorize('shelter', 'admin'), getShelterDashboardStats);
router.get('/', getShelters);
router.get('/:id', getShelterById);

export default router;
