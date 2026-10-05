import { getDB } from '../config/db.js';
import { ObjectId } from 'mongodb';
import {
  getCanonicalDistrict,
  validateDistrict,
  getDistrictCoordinates,
  normalizeLocation
} from '../utils/locationUtils.js';
import { createAuditLog } from '../services/auditService.js';

export const createPet = async (req, res) => {
  try {
    // SHELTER VERIFICATION CHECK: Admin must approve shelter accounts before they can list pets
    if (req.user.role === 'shelter' && req.user.verificationStatus !== 'Approved') {
      const status = req.user.verificationStatus || 'Pending';
      return res.status(403).json({
        success: false,
        message: `Your shelter account verification status is currently "${status}". Only approved and verified shelters can list new pets.`
      });
    }

    const {
      petName, species, breed, age, gender, size, color, weight, temperament,
      location, district, state, description, healthStatus, vaccinationStatus,
      neuteredStatus, sterilizationStatus, specialNeeds, images, adoptionArea,
      goodWithChildren, goodWithPets, goodWithOtherPets
    } = req.body;

    if (!petName || !species || !breed || !age || !location) {
      return res.status(400).json({ success: false, message: 'Please fill all required pet details' });
    }

    const targetDistrict = district ? getCanonicalDistrict(district) : getCanonicalDistrict(location);

    const db = getDB();
    const newPet = {
      petName: petName.trim(),
      species: species.trim(),
      breed: breed.trim(),
      age: age.trim(),
      gender: gender || 'Male',
      size: size || 'Medium',
      color: color || '',
      weight: weight || '',
      temperament: temperament || '',
      location: location.trim(),
      district: targetDistrict,
      city: location.trim(),
      state: state || 'Tamil Nadu',
      adoptionArea: adoptionArea || 'Anywhere in Tamil Nadu', // 'Anywhere in Tamil Nadu' | 'Within District' | 'Local Only'
      description: description || '',
      healthStatus: healthStatus || 'Healthy',
      vaccinationStatus: vaccinationStatus || 'Up to date',
      neuteredStatus: neuteredStatus || sterilizationStatus || 'Yes',
      sterilizationStatus: sterilizationStatus || neuteredStatus || 'Yes',
      goodWithChildren: goodWithChildren !== undefined ? goodWithChildren : 'Yes',
      goodWithPets: goodWithPets !== undefined ? goodWithPets : 'Yes',
      goodWithOtherPets: goodWithOtherPets || goodWithPets || 'Yes',
      specialNeeds: specialNeeds || '',
      adoptionStatus: 'Available',
      images: Array.isArray(images) ? images : (images ? [images] : []),
      ownerId: new ObjectId(req.user._id),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('pets').insertOne(newPet);
    newPet._id = result.insertedId;

    await createAuditLog({
      req,
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      role: req.user.role,
      action: 'PET_CREATED',
      module: 'PETS',
      status: 'SUCCESS',
      details: `Pet created: ${newPet.petName} (${newPet.species}, ${newPet.breed})`,
      entityType: 'pet',
      entityId: newPet._id
    });

    res.status(201).json({ success: true, data: newPet });
  } catch (error) {
    console.error('Create pet error:', error);
    res.status(500).json({ success: false, message: 'Failed to create pet record' });
  }
};

export const getPets = async (req, res) => {
  try {
    const db = getDB();
    const {
      search, species, breed, gender, age, size,
      location, district, userDistrict, adoptionStatus, sortBy, page = 1, limit = 12
    } = req.query;

    const query = {};

    // By default, show available pets unless specific status requested
    if (adoptionStatus) {
      query.adoptionStatus = adoptionStatus;
    } else {
      query.adoptionStatus = 'Available';
    }

    if (species && species !== 'All') {
      query.species = new RegExp(`^${species.trim()}$`, 'i');
    }

    if (gender && gender !== 'All') {
      query.gender = new RegExp(`^${gender.trim()}$`, 'i');
    }

    if (size && size !== 'All') {
      query.size = new RegExp(`^${size.trim()}$`, 'i');
    }

    if (breed && breed !== 'All') {
      query.breed = new RegExp(breed.trim(), 'i');
    }

    if (district && district !== 'All') {
      query.$or = [
        { district: new RegExp(district.trim(), 'i') },
        { location: new RegExp(district.trim(), 'i') }
      ];
    } else if (location) {
      query.location = new RegExp(location.trim(), 'i');
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { petName: searchRegex },
        { breed: searchRegex },
        { location: searchRegex },
        { district: searchRegex },
        { description: searchRegex }
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12;
    const skip = (pageNum - 1) * limitNum;

    const total = await db.collection('pets').countDocuments(query);
    let pets = await db.collection('pets')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    // Determine user location from auth token or query parameters
    let effectiveUserCity = '';
    let effectiveUserDistrict = '';
    let effectiveUserState = 'Tamil Nadu';

    if (req.user && req.user._id) {
      const dbUser = await db.collection('users').findOne(
        { _id: new ObjectId(req.user._id) },
        { projection: { city: 1, district: 1, state: 1 } }
      );
      if (dbUser) {
        effectiveUserCity = dbUser.city || dbUser.district || '';
        effectiveUserDistrict = dbUser.district || dbUser.city || '';
        effectiveUserState = dbUser.state || 'Tamil Nadu';
      }
    }

    if (!effectiveUserCity) effectiveUserCity = req.query.userCity || '';
    if (!effectiveUserDistrict) effectiveUserDistrict = req.query.userDistrict || req.query.userCity || '';
    if (!effectiveUserState) effectiveUserState = req.query.userState || 'Tamil Nadu';

    const normUserCity = effectiveUserCity ? normalizeLocation(effectiveUserCity) : '';
    const normUserDistrict = effectiveUserDistrict ? normalizeLocation(effectiveUserDistrict) : '';

    const nearbyPets = [];
    const otherTnPets = [];

    if (normUserDistrict || normUserCity) {
      pets.forEach(pet => {
        const petCityNorm = pet.city ? normalizeLocation(pet.city) : '';
        const petDistNorm = pet.district ? normalizeLocation(pet.district) : normalizeLocation(pet.location || '');
        
        const isNearby = (normUserCity && petCityNorm && petCityNorm === normUserCity) ||
                         (normUserDistrict && petDistNorm && petDistNorm === normUserDistrict) ||
                         (normUserCity && petDistNorm && petDistNorm.includes(normUserCity)) ||
                         (normUserDistrict && petCityNorm && petCityNorm.includes(normUserDistrict));
        
        if (isNearby) {
          nearbyPets.push(pet);
        } else {
          otherTnPets.push(pet);
        }
      });

      // Sort nearby pets by city exact match first, then district
      nearbyPets.sort((a, b) => {
        const aCity = a.city ? normalizeLocation(a.city) : '';
        const bCity = b.city ? normalizeLocation(b.city) : '';
        const aExact = (normUserCity && aCity === normUserCity) ? 0 : 1;
        const bExact = (normUserCity && bCity === normUserCity) ? 0 : 1;
        if (aExact !== bExact) return aExact - bExact;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    }

    // Location Relevance Sorting if requested
    const matchDistrict = effectiveUserDistrict || userDistrict || district;
    if (sortBy === 'location_relevance' && matchDistrict) {
      const normMatch = normalizeLocation(matchDistrict);
      pets.sort((a, b) => {
        const aDist = normalizeLocation(a.district || a.location || '');
        const bDist = normalizeLocation(b.district || b.location || '');
        const aMatch = aDist.includes(normMatch) ? 0 : 1;
        const bMatch = bDist.includes(normMatch) ? 0 : 1;
        if (aMatch !== bMatch) return aMatch - bMatch;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    }

    const paginatedPets = pets.slice(skip, skip + limitNum);

    res.json({
      success: true,
      data: paginatedPets,
      nearbyPets,
      otherTnPets,
      total,
      userLocation: {
        city: effectiveUserCity || '',
        district: effectiveUserDistrict || '',
        state: effectiveUserState || 'Tamil Nadu'
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    });
  } catch (error) {
    console.error('Get pets error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve pets' });
  }
};

export const getPetById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid pet ID format' });
    }

    const db = getDB();
    const pet = await db.collection('pets').findOne({ _id: new ObjectId(id) });

    if (!pet) {
      return res.status(404).json({ success: false, message: 'Pet not found' });
    }

    // Attach shelter details and coordinates
    let shelterInfo = null;
    if (pet.ownerId) {
      const owner = await db.collection('users').findOne(
        { _id: new ObjectId(pet.ownerId) },
        { projection: { name: 1, email: 1, phone: 1, shelterName: 1, address: 1, city: 1, district: 1, state: 1, verificationStatus: 1 } }
      );
      if (owner) {
        const shelterDistrict = owner.district || pet.district || pet.location;
        const coordinates = getDistrictCoordinates(shelterDistrict);
        shelterInfo = {
          ...owner,
          coordinates
        };
      }
    }

    const petDistrict = pet.district || pet.location;
    const petCoordinates = getDistrictCoordinates(petDistrict);

    res.json({
      success: true,
      data: {
        ...pet,
        coordinates: petCoordinates,
        shelterInfo
      }
    });
  } catch (error) {
    console.error('Get pet by id error:', error);
    res.status(500).json({ success: false, message: 'Error retrieving pet details' });
  }
};

export const updatePet = async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid pet ID' });
    }

    if (req.user.role === 'shelter' && req.user.verificationStatus !== 'Approved') {
      return res.status(403).json({ success: false, message: 'Your shelter account must be verified to edit pets' });
    }

    const db = getDB();
    const pet = await db.collection('pets').findOne({ _id: new ObjectId(id) });

    if (!pet) {
      return res.status(404).json({ success: false, message: 'Pet not found' });
    }

    if (pet.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this pet' });
    }

    const updates = { ...req.body, updatedAt: new Date() };
    delete updates._id;
    delete updates.ownerId;

    if (updates.district) {
      updates.district = getCanonicalDistrict(updates.district);
    }

    await db.collection('pets').updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );

    const updatedPet = await db.collection('pets').findOne({ _id: new ObjectId(id) });

    await createAuditLog({
      req,
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      role: req.user.role,
      action: updates.adoptionStatus && updates.adoptionStatus !== pet.adoptionStatus ? 'PET_STATUS_CHANGED' : 'PET_UPDATED',
      module: 'PETS',
      status: 'SUCCESS',
      details: `Pet updated: ${pet.petName}${updates.adoptionStatus ? ` (Status: ${updates.adoptionStatus})` : ''}`,
      entityType: 'pet',
      entityId: pet._id
    });

    res.json({ success: true, data: updatedPet });
  } catch (error) {
    console.error('Update pet error:', error);
    res.status(500).json({ success: false, message: 'Failed to update pet' });
  }
};

export const deletePet = async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid pet ID' });
    }

    const db = getDB();
    const pet = await db.collection('pets').findOne({ _id: new ObjectId(id) });

    if (!pet) {
      return res.status(404).json({ success: false, message: 'Pet not found' });
    }

    if (pet.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this pet' });
    }

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
      details: `Pet deleted: ${pet.petName} (ID: ${id})`,
      entityType: 'pet',
      entityId: pet._id
    });

    res.json({ success: true, message: 'Pet record removed successfully' });
  } catch (error) {
    console.error('Delete pet error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete pet' });
  }
};

export const uploadPetImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, imageUrl });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({ success: false, message: 'Image upload failed' });
  }
};

export const getMyPets = async (req, res) => {
  try {
    const db = getDB();
    const query = req.user.role === 'admin' ? {} : { ownerId: new ObjectId(req.user._id) };
    const pets = await db.collection('pets')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ success: true, count: pets.length, data: pets });
  } catch (error) {
    console.error('Get my pets error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve shelter pets' });
  }
};

