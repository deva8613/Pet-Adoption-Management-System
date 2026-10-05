import express from 'express';
import { 
  createApplication, 
  getMyApplications, 
  getApplicationsByPet, 
  updateApplicationStatus, 
  deleteApplication 
} from '../controllers/applicationController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.post('/', protect, authorize('adopter'), createApplication);
router.get('/my', protect, getMyApplications);
router.get('/pet/:petId', protect, getApplicationsByPet);
router.put('/:id/status', protect, updateApplicationStatus);
router.delete('/:id', protect, authorize('admin'), deleteApplication);

export default router;
