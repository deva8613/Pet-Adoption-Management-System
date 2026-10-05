import { getDB } from '../config/db.js';
import { ObjectId } from 'mongodb';

export const getMyNotifications = async (req, res) => {
  try {
    const db = getDB();
    const notifications = await db.collection('notifications')
      .find({ userId: new ObjectId(req.user._id) })
      .sort({ createdAt: -1 })
      .toArray();

    const unreadCount = notifications.filter(n => !n.read).length;

    res.json({
      success: true,
      data: notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve notifications' });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid notification ID' });
    }

    const db = getDB();
    const result = await db.collection('notifications').updateOne(
      { _id: new ObjectId(id), userId: new ObjectId(req.user._id) },
      { $set: { read: true, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const db = getDB();
    await db.collection('notifications').updateMany(
      { userId: new ObjectId(req.user._id), read: false },
      { $set: { read: true, updatedAt: new Date() } }
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notifications as read' });
  }
};
