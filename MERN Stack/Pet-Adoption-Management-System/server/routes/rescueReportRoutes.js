import express from 'express';
import {
  createReport,
  getReports,
  getReportById,
  verifyReport,
  updateReport,
  deleteReport
} from '../controllers/rescueReportController.js';
import { protect, optionalProtect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/', optionalProtect, getReports);
router.get('/:id', optionalProtect, getReportById);
router.post('/', protect, createReport);
router.put('/:id/verify', protect, authorize('admin'), verifyReport);
router.put('/:id', protect, updateReport);
router.delete('/:id', protect, deleteReport);

export default router;
