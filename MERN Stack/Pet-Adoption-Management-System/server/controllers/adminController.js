import { getDB } from '../config/db.js';
import { ObjectId } from 'mongodb';
import { createNotification } from '../services/notificationService.js';
import { createAuditLog } from '../services/auditService.js';

export const getDashboardStats = async (req, res) => {
  try {
    const db = getDB();

    const totalUsers = await db.collection('users').countDocuments();
    const totalShelters = await db.collection('users').countDocuments({ role: 'shelter' });
    const pendingShelters = await db.collection('users').countDocuments({ role: 'shelter', verificationStatus: 'Pending' });
    const totalPets = await db.collection('pets').countDocuments();
    const availablePets = await db.collection('pets').countDocuments({ adoptionStatus: 'Available' });
    const adoptedPets = await db.collection('pets').countDocuments({ adoptionStatus: 'Adopted' });
    const totalApplications = await db.collection('adoptionapplications').countDocuments();
    const pendingApplications = await db.collection('adoptionapplications').countDocuments({ applicationStatus: 'Pending' });
    const completedAdoptions = await db.collection('adoptionapplications').countDocuments({ applicationStatus: { $in: ['Successful', 'Completed'] } });
    const rescueReports = await db.collection('rescuereports').countDocuments();

    res.json({
      success: true,
      data: {
        totalUsers,
        totalShelters,
        pendingShelters,
        totalPets,
        availablePets,
        adoptedPets,
        totalApplications,
        pendingApplications,
        completedAdoptions,
        rescueReports
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ success: false, message: 'Error retrieving system statistics' });
  }
};

export const verifyShelter = async (req, res) => {
  try {
    const { id } = req.params;
    const { verificationStatus, verificationReason } = req.body;

    const allowedStatuses = ['Approved', 'Rejected', 'Suspended', 'Pending'];
    if (!allowedStatuses.includes(verificationStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid verification status requested' });
    }

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid shelter ID' });
    }

    const db = getDB();
    const shelter = await db.collection('users').findOne({ _id: new ObjectId(id) });

    if (!shelter) {
      return res.status(404).json({ success: false, message: 'Shelter user not found' });
    }

    const previousStatus = shelter.verificationStatus || 'Pending';
    const reasonText = verificationReason || req.body.reason || '';

    await db.collection('users').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          verificationStatus,
          verificationReason: reasonText,
          updatedAt: new Date()
        }
      }
    );

    // Send Real In-App Notification to Shelter
    await createNotification({
      userId: shelter._id,
      title: `Shelter Account ${verificationStatus}`,
      message: `Your shelter account verification status has been updated to "${verificationStatus}". ${reasonText ? `Reason: ${reasonText}` : ''}`,
      type: 'shelter_verification',
      relatedId: shelter._id
    });

    // Record Audit Log Entry
    await createAuditLog({
      req,
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      role: req.user.role,
      entityType: 'shelter',
      entityId: shelter._id,
      action: verificationStatus === 'Approved' ? 'SHELTER_UPDATED' : `SHELTER_${verificationStatus.toUpperCase()}`,
      module: 'SHELTER',
      status: 'SUCCESS',
      authorizedUser: req.user,
      previousStatus,
      newStatus: verificationStatus,
      details: `Shelter ${shelter.shelterName || shelter.name} verification status set to ${verificationStatus}${reasonText ? ` (${reasonText})` : ''}`,
      reason: reasonText
    });

    const updatedShelter = await db.collection('users').findOne(
      { _id: new ObjectId(id) },
      { projection: { password: 0 } }
    );

    res.json({ success: true, data: updatedShelter, message: `Shelter status updated to ${verificationStatus}` });
  } catch (error) {
    console.error('Verify shelter error:', error);
    res.status(500).json({ success: false, message: 'Failed to update shelter verification status' });
  }
};

export const getAuditLogs = async (req, res) => {
  try {
    const db = getDB();
    const {
      page = 1,
      limit = 20,
      search = '',
      role = '',
      status = '',
      action = '',
      dateRange = '',
      startDate = '',
      endDate = '',
      sortBy = 'newest'
    } = req.query;

    const query = {};

    // 1. Role filter: ALL, USER, SHELTER, ADMIN
    if (role && role !== 'ALL') {
      const targetRole = role.toUpperCase();
      if (targetRole === 'USER') {
        query.$or = [
          { role: 'USER' },
          { role: 'ADOPTER' },
          { role: 'user' },
          { role: 'adopter' },
          { 'authorizedUser.role': 'user' },
          { 'authorizedUser.role': 'adopter' }
        ];
      } else {
        query.$or = [
          { role: { $regex: new RegExp(`^${targetRole}$`, 'i') } },
          { 'authorizedUser.role': { $regex: new RegExp(`^${targetRole}$`, 'i') } }
        ];
      }
    }

    // 2. Status filter: ALL, SUCCESS, FAILED
    if (status && status !== 'ALL') {
      query.status = { $regex: new RegExp(`^${status.trim()}$`, 'i') };
    }

    // 3. Action filter
    if (action && action !== 'ALL') {
      query.action = { $regex: new RegExp(`^${action.trim()}$`, 'i') };
    }

    // 4. Date filter
    const now = new Date();
    let dateCondition = null;

    if (dateRange === 'today') {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      dateCondition = { $gte: startOfToday };
    } else if (dateRange === '7days') {
      const past7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      dateCondition = { $gte: past7 };
    } else if (dateRange === '30days') {
      const past30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      dateCondition = { $gte: past30 };
    } else if (dateRange === 'custom' && (startDate || endDate)) {
      dateCondition = {};
      if (startDate) {
        dateCondition.$gte = new Date(startDate);
      }
      if (endDate) {
        const endD = new Date(endDate);
        endD.setHours(23, 59, 59, 999);
        dateCondition.$lte = endD;
      }
    }

    if (dateCondition) {
      const dateOr = [
        { createdAt: dateCondition },
        { timestamp: dateCondition }
      ];
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: dateOr }];
        delete query.$or;
      } else {
        query.$or = dateOr;
      }
    }

    // 5. Search filter: User, Email, Action, Details
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      const searchCond = [
        { userName: searchRegex },
        { userEmail: searchRegex },
        { action: searchRegex },
        { details: searchRegex },
        { module: searchRegex },
        { ipAddress: searchRegex },
        { 'authorizedUser.name': searchRegex },
        { 'authorizedUser.email': searchRegex }
      ];
      if (query.$and) {
        query.$and.push({ $or: searchCond });
      } else if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchCond }];
        delete query.$or;
      } else {
        query.$or = searchCond;
      }
    }

    // Use auditLogs collection (fallback to auditlogs if empty)
    let auditCol = db.collection('auditLogs');
    const primaryCount = await auditCol.countDocuments({});
    if (primaryCount === 0) {
      const secondaryCount = await db.collection('auditlogs').countDocuments({});
      if (secondaryCount > 0) {
        auditCol = db.collection('auditlogs');
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const sortOrder = sortBy === 'oldest' ? 1 : -1;
    const sortField = { createdAt: sortOrder, timestamp: sortOrder, _id: sortOrder };

    const total = await auditCol.countDocuments(query);
    const auditLogs = await auditCol
      .find(query)
      .sort(sortField)
      .skip(skip)
      .limit(limitNum)
      .toArray();

    // Summary Statistics from MongoDB
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

    const [totalLogs, successCount, failedCount, todayCount] = await Promise.all([
      auditCol.countDocuments({}),
      auditCol.countDocuments({ status: { $regex: /^SUCCESS$/i } }),
      auditCol.countDocuments({ status: { $regex: /^FAILED$/i } }),
      auditCol.countDocuments({
        $or: [
          { createdAt: { $gte: startOfToday } },
          { timestamp: { $gte: startOfToday } }
        ]
      })
    ]);

    res.json({
      success: true,
      data: auditLogs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1
      },
      stats: {
        totalLogs,
        successCount,
        failedCount,
        todayCount
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve audit logs' });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const db = getDB();
    const users = await db.collection('users')
      .find({}, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

export const getAllPets = async (req, res) => {
  try {
    const db = getDB();
    const pets = await db.collection('pets').find({}).sort({ createdAt: -1 }).toArray();
    res.json({ success: true, data: pets });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch pets' });
  }
};

export const getAllApplications = async (req, res) => {
  try {
    const db = getDB();
    const apps = await db.collection('adoptionapplications').find({}).sort({ createdAt: -1 }).toArray();

    const populatedApps = await Promise.all(
      apps.map(async (app) => {
        const pet = app.petId ? await db.collection('pets').findOne({ _id: new ObjectId(app.petId) }) : null;
        const applicant = app.applicantId ? await db.collection('users').findOne(
          { _id: new ObjectId(app.applicantId) },
          { projection: { password: 0 } }
        ) : null;
        const owner = app.ownerId ? await db.collection('users').findOne(
          { _id: new ObjectId(app.ownerId) },
          { projection: { password: 0 } }
        ) : null;

        return {
          ...app,
          pet,
          applicant,
          owner
        };
      })
    );

    res.json({ success: true, data: populatedApps });
  } catch (error) {
    console.error('Failed to fetch admin applications:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch applications' });
  }
};

export const getAllRescues = async (req, res) => {
  try {
    const db = getDB();
    const rescues = await db.collection('rescuereports').find({}).sort({ createdAt: -1 }).toArray();
    res.json({ success: true, data: rescues });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch rescue reports' });
  }
};

export const getAllAdoptions = async (req, res) => {
  try {
    const db = getDB();
    const adoptions = await db.collection('adoptions').find({}).sort({ adoptionDate: -1 }).toArray();
    res.json({ success: true, data: adoptions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch adoption records' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid ID' });
    const db = getDB();
    const targetUser = await db.collection('users').findOne({ _id: new ObjectId(id) });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    await db.collection('users').deleteOne({ _id: new ObjectId(id) });

    await createAuditLog({
      req,
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      role: req.user.role,
      action: 'USER_DELETED',
      module: 'ADMIN',
      status: 'SUCCESS',
      details: `User account deleted: ${targetUser.name || 'User'} (${targetUser.email})`,
      entityType: 'user',
      entityId: id
    });

    res.json({ success: true, message: 'User removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
};

export const deletePet = async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid ID' });
    const db = getDB();
    const targetPet = await db.collection('pets').findOne({ _id: new ObjectId(id) });
    await db.collection('pets').deleteOne({ _id: new ObjectId(id) });

    await createAuditLog({
      req,
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      role: req.user.role,
      action: 'PET_DELETED',
      module: 'PETS',
      status: 'SUCCESS',
      details: `Pet deleted by admin: ${targetPet?.petName || 'Pet'} (ID: ${id})`,
      entityType: 'pet',
      entityId: id
    });

    res.json({ success: true, message: 'Pet removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete pet' });
  }
};

export const deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid ID' });
    const db = getDB();
    await db.collection('adoptionapplications').deleteOne({ _id: new ObjectId(id) });

    await createAuditLog({
      req,
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      role: req.user.role,
      action: 'APPLICATION_DELETED',
      module: 'APPLICATIONS',
      status: 'SUCCESS',
      details: `Application removed by admin (ID: ${id})`,
      entityType: 'application',
      entityId: id
    });

    res.json({ success: true, message: 'Application removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete application' });
  }
};

