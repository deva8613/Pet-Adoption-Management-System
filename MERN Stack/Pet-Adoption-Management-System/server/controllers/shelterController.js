import { ObjectId } from 'mongodb';
import { getDB } from '../config/db.js';
import { getCanonicalDistrict, getDistrictCoordinates } from '../utils/locationUtils.js';

// Get all verified shelters for adopters / public directory
export const getShelters = async (req, res) => {
  try {
    const db = getDB();
    const { district, search } = req.query;

    const query = { role: 'shelter' };
    if (district && district !== 'All') {
      query.district = new RegExp(district.trim(), 'i');
    }
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { shelterName: searchRegex },
        { name: searchRegex },
        { city: searchRegex },
        { district: searchRegex }
      ];
    }

    const shelters = await db.collection('users')
      .find(query, {
        projection: {
          password: 0,
          resetPasswordToken: 0,
          resetPasswordExpires: 0
        }
      })
      .sort({ createdAt: -1 })
      .toArray();

    // Attach pet count for each shelter
    const shelterData = await Promise.all(
      shelters.map(async (s) => {
        const petCount = await db.collection('pets').countDocuments({
          ownerId: s._id,
          adoptionStatus: 'Available'
        });
        const coords = s.latitude && s.longitude
          ? { lat: s.latitude, lng: s.longitude }
          : getDistrictCoordinates(s.district || s.city);

        return {
          ...s,
          availablePetCount: petCount,
          coordinates: coords
        };
      })
    );

    res.json({ success: true, count: shelterData.length, data: shelterData });
  } catch (error) {
    console.error('Get shelters error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve shelters' });
  }
};

// Get single shelter details + their pets
export const getShelterById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid shelter ID' });
    }

    const db = getDB();
    const shelter = await db.collection('users').findOne(
      { _id: new ObjectId(id), role: 'shelter' },
      { projection: { password: 0 } }
    );

    if (!shelter) {
      return res.status(404).json({ success: false, message: 'Shelter not found' });
    }

    const pets = await db.collection('pets')
      .find({ ownerId: new ObjectId(id) })
      .sort({ createdAt: -1 })
      .toArray();

    const coordinates = shelter.latitude && shelter.longitude
      ? { lat: shelter.latitude, lng: shelter.longitude }
      : getDistrictCoordinates(shelter.district || shelter.city);

    res.json({
      success: true,
      data: {
        ...shelter,
        coordinates,
        pets
      }
    });
  } catch (error) {
    console.error('Get shelter by id error:', error);
    res.status(500).json({ success: false, message: 'Error retrieving shelter details' });
  }
};

// Get Dashboard Statistics for logged-in shelter
export const getShelterDashboardStats = async (req, res) => {
  try {
    const db = getDB();
    const shelterId = new ObjectId(req.user._id);

    const totalPets = await db.collection('pets').countDocuments({ ownerId: shelterId });
    const availablePets = await db.collection('pets').countDocuments({ ownerId: shelterId, adoptionStatus: 'Available' });
    const pendingApplications = await db.collection('adoptionapplications').countDocuments({ ownerId: shelterId, applicationStatus: 'Pending' });
    const underReviewApplications = await db.collection('adoptionapplications').countDocuments({ ownerId: shelterId, applicationStatus: 'Under Review' });
    const approvedApplications = await db.collection('adoptionapplications').countDocuments({ ownerId: shelterId, applicationStatus: 'Approved' });
    const successfulAdoptions = await db.collection('adoptionapplications').countDocuments({
      ownerId: shelterId,
      applicationStatus: { $in: ['Successful', 'Completed'] }
    });

    const recentApplications = await db.collection('adoptionapplications')
      .find({ ownerId: shelterId })
      .sort({ createdAt: -1 })
      .limit(6)
      .toArray();

    // Populate pet & applicant for recent apps
    const populatedRecent = await Promise.all(
      recentApplications.map(async (app) => {
        const pet = await db.collection('pets').findOne({ _id: new ObjectId(app.petId) });
        const applicant = await db.collection('users').findOne(
          { _id: new ObjectId(app.applicantId) },
          { projection: { password: 0 } }
        );
        return {
          ...app,
          pet,
          applicant
        };
      })
    );

    // Fetch Recent Pets listed by this shelter
    const recentPets = await db.collection('pets')
      .find({ ownerId: shelterId })
      .sort({ createdAt: -1 })
      .limit(6)
      .toArray();

    res.json({
      success: true,
      data: {
        totalPets,
        availablePets,
        pendingApplications,
        underReviewApplications,
        approvedApplications,
        successfulAdoptions,
        recentApplications: populatedRecent,
        recentPets,
        shelter: {
          name: req.user.name,
          shelterName: req.user.shelterName || req.user.name,
          verificationStatus: req.user.verificationStatus || 'Approved',
          district: req.user.district,
          city: req.user.city
        }
      }
    });
  } catch (error) {
    console.error('Shelter dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve shelter statistics' });
  }
};
