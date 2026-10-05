import express from 'express';
import {
  getDashboardStats,
  getAllUsers,
  getAllPets,
  getAllApplications,
  getAllRescues,
  getAllAdoptions,
  deleteUser,
  deletePet,
  deleteApplication,
  verifyShelter,
  getAuditLogs
} from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(adminOnly);

router.get('/dashboard', getDashboardStats);
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.get('/pets', getAllPets);
router.delete('/pets/:id', deletePet);
router.get('/applications', getAllApplications);
router.delete('/applications/:id', deleteApplication);
router.get('/rescues', getAllRescues);
router.get('/adoptions', getAllAdoptions);
router.put('/shelters/:id/verify', verifyShelter);
router.get('/audit-logs', getAuditLogs);

export default router;
