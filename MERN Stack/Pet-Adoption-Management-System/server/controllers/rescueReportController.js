import { ObjectId } from 'mongodb';
import { getDB } from '../config/db.js';
import { getCanonicalDistrict } from '../utils/locationUtils.js';

const publicUser = (u) => u ? { _id: u._id, name: u.name, email: u.email, phone: u.phone || '', profileImage: u.profileImage || '' } : null;

export const createReport = async (req, res) => {
  try {
    const {
      reportType = 'Rescue', petName, species, petType, breed, color, description,
      location, address, district, state, contactPhone, contactEmail, images,
      urgency = 'MEDIUM', reporterName, photo
    } = req.body;

    const actualSpecies = species || petType || 'Other';
    const actualLocation = location || address || 'Tamil Nadu';
    const actualDistrict = district || location || 'Chennai';
    const actualPhone = contactPhone || req.user.phone || '9999999999';

    if (!description || !actualLocation) {
      return res.status(400).json({ success: false, message: 'Please provide description and location' });
    }

    const reportImages = Array.isArray(images) ? images : (images ? [images] : (photo ? [photo] : []));

    const report = {
      reporterId: new ObjectId(req.user._id),
      reporterName: reporterName || req.user.name,
      reportType,
      petName: petName || 'Unknown',
      species: actualSpecies,
      breed: breed || 'Mixed / Unknown',
      color: color || '',
      description,
      location: actualLocation,
      address: address || actualLocation,
      district: getCanonicalDistrict(actualDistrict),
      state: state || 'Tamil Nadu',
      urgency: (urgency || 'MEDIUM').toUpperCase(),
      contactPhone: actualPhone,
      contactEmail: contactEmail || req.user.email,
      images: reportImages,
      isVerified: req.user.role === 'admin' || req.user.role === 'shelter',
      verifiedBy: req.user.role === 'admin' ? new ObjectId(req.user._id) : null,
      status: 'Open',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const result = await getDB().collection('rescuereports').insertOne(report);
    report._id = result.insertedId;
    res.status(201).json({ success: true, data: report });
  } catch (error) {
    console.error('Create rescue report error:', error);
    res.status(500).json({ success: false, message: 'Failed to create rescue report' });
  }
};

export const getReports = async (req, res) => {
  try {
    const { reportType, district, status, urgency, verifiedOnly } = req.query;
    const query = {};
    if (reportType) query.reportType = reportType;
    if (district) query.district = { $regex: district, $options: 'i' };
    if (status) query.status = status;
    if (urgency) query.urgency = urgency.toUpperCase();
    if (verifiedOnly === 'true' || (!req.user || (req.user.role !== 'admin' && req.user.role !== 'shelter'))) {
      query.$or = req.user ? [{ isVerified: true }, { reporterId: new ObjectId(req.user._id) }] : [{ isVerified: true }];
    }
    const db = getDB();
    const reports = await db.collection('rescuereports').find(query).sort({ createdAt: -1 }).toArray();
    const data = await Promise.all(reports.map(async r => {
      const reporter = await db.collection('users').findOne({ _id: r.reporterId }, { projection: { password: 0 } });
      return { ...r, reporterId: publicUser(reporter) };
    }));
    res.json({ success: true, count: data.length, data });
  } catch (error) {
    console.error('Get rescue reports error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch rescue reports' });
  }
};

export const getReportById = async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid report ID' });
    const db = getDB();
    const report = await db.collection('rescuereports').findOne({ _id: new ObjectId(req.params.id) });
    if (!report) return res.status(404).json({ success: false, message: 'Rescue report not found' });
    const reporter = await db.collection('users').findOne({ _id: report.reporterId }, { projection: { password: 0 } });
    res.json({ success: true, data: { ...report, reporterId: publicUser(reporter) } });
  } catch (error) { res.status(500).json({ success: false, message: 'Error fetching report' }); }
};

export const verifyReport = async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid report ID' });
    const $set = { updatedAt: new Date() };
    if (req.body.isVerified !== undefined) { $set.isVerified = Boolean(req.body.isVerified); $set.verifiedBy = new ObjectId(req.user._id); }
    if (req.body.status) $set.status = req.body.status;
    const result = await getDB().collection('rescuereports').findOneAndUpdate({ _id: new ObjectId(req.params.id) }, { $set }, { returnDocument: 'after' });
    if (!result) return res.status(404).json({ success: false, message: 'Report not found' });
    res.json({ success: true, data: result });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to verify report' }); }
};

export const updateReport = async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid report ID' });
    const db = getDB();
    const report = await db.collection('rescuereports').findOne({ _id: new ObjectId(req.params.id) });
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    if (report.reporterId.toString() !== req.user._id.toString() && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Not authorized to edit this report' });
    const updates = { ...req.body, updatedAt: new Date() }; delete updates._id; delete updates.reporterId; delete updates.isVerified; delete updates.verifiedBy;
    await db.collection('rescuereports').updateOne({ _id: report._id }, { $set: updates });
    res.json({ success: true, data: await db.collection('rescuereports').findOne({ _id: report._id }) });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to update report' }); }
};

export const deleteReport = async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid report ID' });
    const db = getDB();
    const report = await db.collection('rescuereports').findOne({ _id: new ObjectId(req.params.id) });
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    if (report.reporterId.toString() !== req.user._id.toString() && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Not authorized to delete this report' });
    await db.collection('rescuereports').deleteOne({ _id: report._id });
    res.json({ success: true, message: 'Rescue report removed successfully' });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to delete report' }); }
};
