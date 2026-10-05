import express from 'express';
import {
  getPetCareRecords,
  addVaccination,
  addVetVisit,
  updateFeedingSchedule,
  addAppointment
} from '../controllers/petCareController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:petId', protect, getPetCareRecords);
router.post('/:petId/vaccinations', protect, addVaccination);
router.post('/:petId/vet-visits', protect, addVetVisit);
router.put('/:petId/feeding-schedules', protect, updateFeedingSchedule);
router.post('/:petId/appointments', protect, addAppointment);

export default router;
