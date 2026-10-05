import { getDB } from '../config/db.js';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { getCanonicalDistrict, validateDistrict } from '../utils/locationUtils.js';
import { createAuditLog } from '../services/auditService.js';

export const getProfile = async (req, res) => {
  try {
    const db = getDB();
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(req.user._id) },
      { projection: { password: 0 } }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Error fetching profile' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, email, phone, gender, address, city, district, state, profileImage, shelterName, licenseNumber } = req.body;
    const db = getDB();

    const updateFields = {
      updatedAt: new Date()
    };

    if (name) updateFields.name = name;
    if (gender !== undefined) {
      const validGenders = ['Male', 'Female', 'Other', 'Prefer not to say'];
      updateFields.gender = validGenders.includes(gender) ? gender : 'Prefer not to say';
    }

    if (email) {
      // Check email uniqueness if email changed
      const lowerEmail = email.toLowerCase();
      if (lowerEmail !== req.user.email) {
        const existing = await db.collection('users').findOne({ email: lowerEmail });
        if (existing) {
          return res.status(400).json({ success: false, message: 'Email address is already in use' });
        }
        updateFields.email = lowerEmail;
        updateFields.isEmailVerified = false; // reset verification if email changed
      }
    }

    if (phone !== undefined) updateFields.phone = phone;
    if (address !== undefined) updateFields.address = address;
    if (req.body.doorStreet !== undefined) updateFields.doorStreet = req.body.doorStreet;
    if (req.body.area !== undefined) updateFields.area = req.body.area;
    if (city !== undefined) updateFields.city = city.trim();
    if (req.body.pincode !== undefined) updateFields.pincode = req.body.pincode;
    if (req.body.latitude !== undefined) updateFields.latitude = req.body.latitude;
    if (req.body.longitude !== undefined) updateFields.longitude = req.body.longitude;
    if (req.body.occupation !== undefined) updateFields.occupation = req.body.occupation;
    if (req.body.dob !== undefined) updateFields.dob = req.body.dob;
    if (req.body.preferences !== undefined) updateFields.preferences = req.body.preferences;
    if (req.body.adoptionInfo !== undefined) updateFields.adoptionInfo = req.body.adoptionInfo;
    if (req.body.personalDetails !== undefined) updateFields.personalDetails = req.body.personalDetails;
    if (req.body.addressDetails !== undefined) updateFields.addressDetails = req.body.addressDetails;
    if (req.body.description !== undefined) updateFields.description = req.body.description;
    if (req.body.website !== undefined) updateFields.website = req.body.website;
    if (req.body.shelterImage !== undefined) updateFields.shelterImage = req.body.shelterImage;

    if (district !== undefined) {
      if (district && !validateDistrict(district)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid district specified. Please select a valid Tamil Nadu district.'
        });
      }
      updateFields.district = district ? getCanonicalDistrict(district) : '';
    }

    if (state !== undefined) updateFields.state = state || 'Tamil Nadu';
    if (profileImage !== undefined) updateFields.profileImage = profileImage;
    if (shelterName !== undefined && req.user.role === 'shelter') updateFields.shelterName = shelterName;
    if (licenseNumber !== undefined && req.user.role === 'shelter') updateFields.licenseNumber = licenseNumber;

    // Explicitly prevent role mutation via profile update
    if (req.body.role && req.body.role !== req.user.role) {
      return res.status(403).json({ success: false, message: 'Role changes are not permitted' });
    }

    await db.collection('users').updateOne(
      { _id: new ObjectId(req.user._id) },
      { $set: updateFields }
    );

    const updatedUser = await db.collection('users').findOne(
      { _id: new ObjectId(req.user._id) },
      { projection: { password: 0 } }
    );

    res.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Error updating profile' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current password and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
    }

    const db = getDB();
    const user = await db.collection('users').findOne({ _id: new ObjectId(req.user._id) });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db.collection('users').updateOne(
      { _id: new ObjectId(req.user._id) },
      { $set: { password: hashedPassword, updatedAt: new Date() } }
    );

    await createAuditLog({
      req,
      userId: req.user._id,
      userName: user.name,
      userEmail: user.email,
      role: user.role,
      action: 'PASSWORD_CHANGED',
      module: 'AUTH',
      status: 'SUCCESS',
      details: 'User updated their password via settings'
    });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Error changing password' });
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    const db = getDB();
    await db.collection('users').updateOne(
      { _id: new ObjectId(req.user._id) },
      { $set: { profileImage: imageUrl, updatedAt: new Date() } }
    );

    res.json({ success: true, imageUrl, message: 'Profile picture updated' });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload profile image' });
  }
};
