import { getDB } from '../config/db.js';
import { ObjectId } from 'mongodb';

/**
 * Helper to create real, in-app notifications
 */
export const createNotification = async ({
  userId,
  title,
  message,
  type = 'system',
  relatedId = null
}) => {
  try {
    if (!userId) return;
    const db = getDB();
    
    const notification = {
      userId: new ObjectId(userId),
      title,
      message,
      type, // 'application', 'shelter_verification', 'pet_status', 'system'
      relatedId: relatedId ? new ObjectId(relatedId) : null,
      read: false,
      createdAt: new Date()
    };

    await db.collection('notifications').insertOne(notification);
  } catch (error) {
    console.error('[Notification Error]: Failed to create notification:', error);
  }
};
