import { ObjectId } from 'mongodb';
import { getDB } from '../config/db.js';

export const toggleFavorite = async (req, res) => {
  try {
    const { petId } = req.body;
    if (!ObjectId.isValid(petId)) return res.status(400).json({ success: false, message: 'Valid pet ID is required' });
    const db = getDB();
    const userId = new ObjectId(req.user._id);
    const petObjectId = new ObjectId(petId);
    const existing = await db.collection('favorites').findOne({ userId, petId: petObjectId });
    if (existing) {
      await db.collection('favorites').deleteOne({ _id: existing._id });
      return res.json({ success: true, isFavorite: false, message: 'Removed from favorites' });
    }
    await db.collection('favorites').insertOne({ userId, petId: petObjectId, createdAt: new Date() });
    res.json({ success: true, isFavorite: true, message: 'Added to favorites' });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ success: false, message: 'Failed to update favorite status' });
  }
};

export const getMyFavorites = async (req, res) => {
  try {
    const db = getDB();
    const favorites = await db.collection('favorites').find({ userId: new ObjectId(req.user._id) }).sort({ createdAt: -1 }).toArray();
    const pets = await Promise.all(favorites.map(f => db.collection('pets').findOne({ _id: f.petId })));
    res.json({ success: true, count: pets.filter(Boolean).length, data: pets.filter(Boolean) });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch favorites' });
  }
};
