import express from 'express';
import { createPet, getPets, getPetById, updatePet, deletePet, uploadPetImage, getMyPets } from '../controllers/petController.js';
import { protect, optionalProtect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/', optionalProtect, getPets);
router.get('/my/pets', protect, authorize('shelter', 'admin'), getMyPets);
router.get('/:id', getPetById);
router.post('/upload', protect, authorize('shelter', 'admin'), upload.single('image'), uploadPetImage);
router.post('/', protect, authorize('shelter', 'admin'), createPet);
router.put('/:id', protect, authorize('shelter', 'admin'), updatePet);
router.delete('/:id', protect, authorize('shelter', 'admin'), deletePet);

export default router;
