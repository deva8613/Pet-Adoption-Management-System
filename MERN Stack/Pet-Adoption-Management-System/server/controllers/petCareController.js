import { ObjectId } from 'mongodb';
import { getDB } from '../config/db.js';

const id = (value) => ObjectId.isValid(value) ? new ObjectId(value) : null;

const canAccess = async (db, petId, userId, role) => {
  const pet = await db.collection('pets').findOne({ _id: id(petId) });
  if (!pet) return { pet: null, allowed: false };
  const successful = await db.collection('adoptionapplications').findOne({ petId: id(petId), applicantId: id(userId), applicationStatus: 'Successful' });
  const allowed = role === 'admin' || pet.ownerId?.toString() === userId.toString() || Boolean(successful);
  return { pet, allowed };
};

const baseCare = (pet, ownerId) => ({
  petId: id(pet._id), ownerId: id(ownerId), vaccinationRecords: [], vetVisits: [], feedingSchedules: [], followUpAppointments: [],
  certificateUrl: `/certificates/CERT-${pet._id.toString().slice(-6).toUpperCase()}.pdf`, createdAt: new Date(), updatedAt: new Date()
});

export const getPetCareRecords = async (req, res) => {
  try {
    if (!id(req.params.petId)) return res.status(400).json({ success: false, message: 'Invalid pet ID' });
    const db = getDB(); const { pet, allowed } = await canAccess(db, req.params.petId, req.user._id, req.user.role);
    if (!pet) return res.status(404).json({ success: false, message: 'Pet not found' });
    if (!allowed) return res.status(403).json({ success: false, message: 'Unauthorized access to pet care records' });
    let care = await db.collection('petcares').findOne({ petId: id(req.params.petId) });
    if (!care) { care = baseCare(pet, req.user._id); const result = await db.collection('petcares').insertOne(care); care._id = result.insertedId; }
    res.json({ success: true, data: care, pet });
  } catch (error) { console.error(error); res.status(500).json({ success: false, message: 'Failed to load care records' }); }
};

const appendToArray = async (req, res, field) => {
  try {
    if (!id(req.params.petId)) return res.status(400).json({ success: false, message: 'Invalid pet ID' });
    const db = getDB(); const { pet, allowed } = await canAccess(db, req.params.petId, req.user._id, req.user.role);
    if (!pet) return res.status(404).json({ success: false, message: 'Pet not found' });
    if (!allowed) return res.status(403).json({ success: false, message: 'Unauthorized access' });
    let care = await db.collection('petcares').findOne({ petId: id(req.params.petId) });
    if (!care) { care = baseCare(pet, req.user._id); await db.collection('petcares').insertOne(care); }
    const item = { ...req.body, createdAt: new Date() };
    await db.collection('petcares').updateOne({ _id: care._id }, { $push: { [field]: item }, $set: { updatedAt: new Date() } });
    res.json({ success: true, data: await db.collection('petcares').findOne({ _id: care._id }) });
  } catch (error) { console.error(error); res.status(500).json({ success: false, message: 'Failed to save care record' }); }
};

export const addVaccination = (req, res) => appendToArray(req, res, 'vaccinationRecords');
export const addVetVisit = (req, res) => appendToArray(req, res, 'vetVisits');
export const addAppointment = (req, res) => appendToArray(req, res, 'followUpAppointments');

export const updateFeedingSchedule = async (req, res) => {
  try {
    if (!id(req.params.petId)) return res.status(400).json({ success: false, message: 'Invalid pet ID' });
    const db = getDB(); const { pet, allowed } = await canAccess(db, req.params.petId, req.user._id, req.user.role);
    if (!pet) return res.status(404).json({ success: false, message: 'Pet not found' });
    if (!allowed) return res.status(403).json({ success: false, message: 'Unauthorized access' });
    let care = await db.collection('petcares').findOne({ petId: id(req.params.petId) });
    if (!care) { care = baseCare(pet, req.user._id); const result = await db.collection('petcares').insertOne(care); care._id = result.insertedId; }
    const schedules = Array.isArray(req.body) ? req.body : (Array.isArray(req.body.schedules) ? req.body.schedules : [req.body]);
    await db.collection('petcares').updateOne({ _id: care._id }, { $set: { feedingSchedules: schedules, updatedAt: new Date() } });
    res.json({ success: true, data: await db.collection('petcares').findOne({ _id: care._id }) });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to update feeding schedule' }); }
};
