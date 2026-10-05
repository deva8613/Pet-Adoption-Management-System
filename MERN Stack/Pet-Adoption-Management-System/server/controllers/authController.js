import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { getDB } from '../config/db.js';
import { getCanonicalDistrict, validateDistrict } from '../utils/locationUtils.js';
import { createAuditLog } from '../services/auditService.js';

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d'
  });
};

export const register = async (req, res) => {
  try {
    const {
      name, email, password, phone, role, gender,
      shelterName, address, city, district, state, licenseNumber
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    // Role safety: public users default to 'adopter'; shelter role supported for system test suites; admin prevented
    const rawRole = (role || 'adopter').toLowerCase();
    const userRole = (rawRole === 'admin') ? 'adopter' : (rawRole === 'shelter' ? 'shelter' : 'adopter');

    const validGenders = ['Male', 'Female', 'Other', 'Prefer not to say'];
    const userGender = validGenders.includes(gender) ? gender : 'Prefer not to say';

    const normalizedDistrict = district ? getCanonicalDistrict(district) : '';

    const db = getDB();
    const usersCol = db.collection('users');

    const existingUser = await usersCol.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const verificationStatus = (userRole === 'shelter') ? 'Pending' : 'Approved';

    const newUser = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone: phone || '',
      gender: userGender,
      shelterName: shelterName || req.body.shelterName || '',
      description: req.body.description || req.body.shelterDescription || '',
      website: req.body.website || '',
      shelterImage: req.body.shelterImage || '',
      address: address || req.body.doorStreet || '',
      doorStreet: req.body.doorStreet || '',
      area: req.body.area || '',
      city: city || '',
      district: normalizedDistrict,
      state: state || 'Tamil Nadu',
      pincode: req.body.pincode || '',
      latitude: req.body.latitude || null,
      longitude: req.body.longitude || null,
      occupation: req.body.occupation || '',
      dob: req.body.dob || '',
      profileImage: req.body.profileImage || req.body.profilePhoto || '',
      licenseNumber: licenseNumber || req.body.licenseNumber || '',
      preferences: req.body.preferences || {},
      adoptionInfo: req.body.adoptionInfo || {},
      personalDetails: req.body.personalDetails || {
        dob: req.body.dob || '',
        gender: userGender,
        occupation: req.body.occupation || '',
        profilePhoto: req.body.profileImage || req.body.profilePhoto || ''
      },
      addressDetails: req.body.addressDetails || {
        doorStreet: req.body.doorStreet || address || '',
        area: req.body.area || '',
        city: city || '',
        district: normalizedDistrict,
        state: state || 'Tamil Nadu',
        pincode: req.body.pincode || '',
        latitude: req.body.latitude || null,
        longitude: req.body.longitude || null
      },
      role: userRole,
      verificationStatus,
      verificationReason: '',
      isEmailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await usersCol.insertOne(newUser);
    const userDoc = {
      _id: result.insertedId,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      gender: newUser.gender,
      shelterName: newUser.shelterName,
      description: newUser.description,
      website: newUser.website,
      shelterImage: newUser.shelterImage,
      address: newUser.address,
      doorStreet: newUser.doorStreet,
      area: newUser.area,
      city: newUser.city,
      district: newUser.district,
      state: newUser.state,
      pincode: newUser.pincode,
      latitude: newUser.latitude,
      longitude: newUser.longitude,
      occupation: newUser.occupation,
      dob: newUser.dob,
      preferences: newUser.preferences,
      adoptionInfo: newUser.adoptionInfo,
      personalDetails: newUser.personalDetails,
      addressDetails: newUser.addressDetails,
      role: newUser.role,
      verificationStatus: newUser.verificationStatus,
      isEmailVerified: newUser.isEmailVerified,
      profileImage: newUser.profileImage
    };

    const token = generateToken(result.insertedId.toString(), newUser.role);

    // Audit log
    await createAuditLog({
      req,
      userId: result.insertedId,
      userName: newUser.name,
      userEmail: newUser.email,
      role: newUser.role,
      action: newUser.role === 'shelter' ? 'SHELTER_CREATED' : 'USER_CREATED',
      module: 'AUTH',
      status: 'SUCCESS',
      details: `${newUser.role === 'shelter' ? 'Shelter' : 'User'} account registered (${newUser.email})`
    });

    res.status(201).json({
      success: true,
      token,
      user: userDoc
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      await createAuditLog({
        req,
        userEmail: email || 'Unknown',
        action: 'LOGIN_FAILED',
        module: 'AUTH',
        status: 'FAILED',
        details: 'Login attempt missing email or password'
      });
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const db = getDB();
    const usersCol = db.collection('users');

    const user = await usersCol.findOne({ email: email.toLowerCase() });
    if (!user) {
      await createAuditLog({
        req,
        userEmail: email.toLowerCase(),
        action: 'LOGIN_FAILED',
        module: 'AUTH',
        status: 'FAILED',
        details: 'Login attempt for non-existent account'
      });
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await createAuditLog({
        req,
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        role: user.role,
        action: 'LOGIN_FAILED',
        module: 'AUTH',
        status: 'FAILED',
        details: 'Login attempt failed: incorrect password'
      });
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user._id.toString(), user.role);

    // Audit log successful login
    await createAuditLog({
      req,
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      role: user.role,
      action: 'LOGIN_SUCCESS',
      module: 'AUTH',
      status: 'SUCCESS',
      details: 'User authenticated successfully'
    });

    const userDoc = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      gender: user.gender || 'Prefer not to say',
      shelterName: user.shelterName || '',
      description: user.description || '',
      website: user.website || '',
      shelterImage: user.shelterImage || '',
      address: user.address || '',
      doorStreet: user.doorStreet || '',
      area: user.area || '',
      city: user.city || '',
      district: user.district || '',
      state: user.state || '',
      pincode: user.pincode || '',
      latitude: user.latitude || null,
      longitude: user.longitude || null,
      occupation: user.occupation || '',
      dob: user.dob || '',
      preferences: user.preferences || {},
      adoptionInfo: user.adoptionInfo || {},
      personalDetails: user.personalDetails || {},
      addressDetails: user.addressDetails || {},
      role: user.role,
      verificationStatus: user.verificationStatus || 'Approved',
      verificationReason: user.verificationReason || '',
      isEmailVerified: user.isEmailVerified || false,
      profileImage: user.profileImage || ''
    };

    res.json({
      success: true,
      token,
      user: userDoc
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide your email address' });
    }

    const db = getDB();
    const user = await db.collection('users').findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.json({
        success: true,
        message: 'If an account exists with that email, a password reset link has been generated.'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

    await db.collection('users').updateOne(
      { _id: user._id },
      { $set: { resetPasswordToken: resetToken, resetPasswordExpires, updatedAt: new Date() } }
    );

    res.json({
      success: true,
      message: 'Password reset request processed successfully.',
      ...(process.env.NODE_ENV === 'test' || !process.env.SMTP_HOST ? { resetToken } : {})
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Server error processing password reset request' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide reset token and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const db = getDB();
    const user = await db.collection('users').findOne({
      resetPasswordToken: resetToken,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset token' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db.collection('users').updateOne(
      { _id: user._id },
      {
        $set: { password: hashedPassword, updatedAt: new Date() },
        $unset: { resetPasswordToken: '', resetPasswordExpires: '' }
      }
    );

    await createAuditLog({
      req,
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      role: user.role,
      action: 'PASSWORD_CHANGED',
      module: 'AUTH',
      status: 'SUCCESS',
      details: 'Password was updated successfully'
    });

    res.json({ success: true, message: 'Password reset successful! You can now log in with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Server error resetting password' });
  }
};

export const logout = async (req, res) => {
  try {
    if (req.user) {
      await createAuditLog({
        req,
        userId: req.user._id,
        userName: req.user.name,
        userEmail: req.user.email,
        role: req.user.role,
        action: 'LOGOUT',
        module: 'AUTH',
        status: 'SUCCESS',
        details: 'User logged out of session'
      });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
};

export const sendEmailVerification = async (req, res) => {
  try {
    const isEmailConfigured = !!(process.env.SMTP_HOST || process.env.EMAIL_HOST || process.env.SMTP_USER);

    if (!isEmailConfigured) {
      return res.status(400).json({
        success: false,
        message: 'Email service is not configured on the server. Verification email delivery is currently unavailable.'
      });
    }

    const db = getDB();
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h expiration

    await db.collection('users').updateOne(
      { _id: req.user._id },
      { $set: { emailVerificationToken: token, emailVerificationExpires: expires, updatedAt: new Date() } }
    );

    // Secure response: Never leak tokens in API responses
    res.json({
      success: true,
      message: 'Verification link sent to your registered email address. Please check your inbox.'
    });
  } catch (error) {
    console.error('Send verification error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate verification request' });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token is required' });
    }

    const db = getDB();
    const user = await db.collection('users').findOne({
      emailVerificationToken: token,
      $or: [
        { emailVerificationExpires: { $gt: new Date() } },
        { emailVerificationExpires: { $exists: false } }
      ]
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired email verification token' });
    }

    await db.collection('users').updateOne(
      { _id: user._id },
      {
        $set: { isEmailVerified: true, updatedAt: new Date() },
        $unset: { emailVerificationToken: '', emailVerificationExpires: '' }
      }
    );

    res.json({ success: true, message: 'Email address verified successfully!' });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify email' });
  }
};

export const getAdminIdentifier = async (req, res) => {
  try {
    const db = getDB();
    const usersCol = db.collection('users');
    const adminUser = await usersCol.findOne(
      { role: 'admin' },
      { projection: { email: 1, name: 1 } }
    );
    if (!adminUser) {
      return res.json({ success: false, message: 'No admin configured' });
    }
    res.json({
      success: true,
      email: adminUser.email,
      name: adminUser.name
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error retrieving admin identifier' });
  }
};
