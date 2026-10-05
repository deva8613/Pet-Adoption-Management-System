import React, { useState, useEffect } from 'react';
import { userAPI, authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import ShelterLayout from '../components/ShelterLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import {
  ShieldCheck,
  Mail,
  Upload,
  CheckCircle2,
  Clock,
  Building,
  Phone,
  MapPin,
  Globe,
  Edit,
  X,
  Save,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { TAMILNADU_DISTRICTS } from '../utils/locationUtils';

const getProfileAvatar = (user, customImage, currentGender) => {
  if (customImage) return customImage;
  if (user?.profileImage) return user.profileImage;

  const gender = currentGender || user?.gender;
  if (gender === 'Male') {
    return 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';
  }
  if (gender === 'Female') {
    return 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80';
  }
  return 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80';
};

const Profile = () => {
  const { user, setUser, refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: 'Prefer not to say',
    address: '',
    doorStreet: '',
    area: '',
    city: '',
    district: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '',
    profileImage: '',
    shelterName: '',
    licenseNumber: '',
    website: '',
    description: '',
    occupation: '',
    dob: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [verifyMsg, setVerifyMsg] = useState('');
  const [isEditingModal, setIsEditingModal] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await userAPI.getProfile();
      if (res.success && res.data) {
        const u = res.data;
        setFormData({
          name: u.name || '',
          email: u.email || '',
          phone: u.phone || '',
          gender: u.gender || 'Prefer not to say',
          address: u.address || u.doorStreet || '',
          doorStreet: u.doorStreet || u.address || '',
          area: u.area || '',
          city: u.city || '',
          district: u.district || 'Chennai',
          state: u.state || 'Tamil Nadu',
          pincode: u.pincode || '',
          profileImage: u.profileImage || '',
          shelterName: u.shelterName || u.name || '',
          licenseNumber: u.licenseNumber || '',
          website: u.website || '',
          description: u.description || '',
          occupation: u.occupation || '',
          dob: u.dob || ''
        });
      } else {
        setError(res.message || 'Failed to load profile');
      }
    } catch (err) {
      setError(err.message || 'Error fetching profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg('');
      const res = await userAPI.updateProfile(formData);
      if (res.success) {
        setSuccessMsg('Profile updated successfully!');
        setIsEditingModal(false);
        if (refreshUser) refreshUser();
      } else {
        setError(res.message || 'Failed to update profile');
      }
    } catch (err) {
      setError(err.message || 'Error saving profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    const formDataUpload = new FormData();
    formDataUpload.append('image', file);

    try {
      setUploadingImg(true);
      setError(null);
      const res = await userAPI.uploadAvatar(formDataUpload);
      if (res.success && res.imageUrl) {
        setFormData(prev => ({ ...prev, profileImage: res.imageUrl }));
        setSuccessMsg('Profile image updated successfully!');
        if (refreshUser) refreshUser();
      } else {
        setError(res.message || 'Failed to upload image');
      }
    } catch (err) {
      setError('Error uploading image');
    } finally {
      setUploadingImg(false);
    }
  };

  const handleRequestEmailVerification = async () => {
    setVerifyMsg('');
    setError(null);
    try {
      const res = await authAPI.sendEmailVerification();
      if (res.success) {
        setVerifyMsg(res.message || 'Verification link sent to your email.');
      } else {
        setError(res.message || 'Failed to send verification request');
      }
    } catch (err) {
      setError(err.message || 'Error sending verification request');
    }
  };

  const avatarSrc = getProfileAvatar(user, formData.profileImage, formData.gender);
  const isShelter = user?.role === 'shelter';

  // Format real address string from MongoDB
  const formattedAddress = [
    formData.doorStreet,
    formData.area,
    formData.city,
    formData.district,
    formData.state,
    formData.pincode ? `PIN: ${formData.pincode}` : ''
  ].filter(Boolean).join(', ');

  // Edit Form Modal Component (used for Shelter)
  const renderEditModal = () => (
    <div className="shelter-modal-overlay" onClick={() => setIsEditingModal(false)}>
      <div className="shelter-modal-card card shadow-lg p-4" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        <div className="d-flex justify-between align-center mb-3 pb-2 border-bottom">
          <h3 className="h5 font-weight-bold mb-0">Edit Shelter Profile</h3>
          <button onClick={() => setIsEditingModal(false)} className="btn btn-link text-muted p-1">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-2 gap-3 mb-3">
            <div className="form-group">
              <label className="form-label">Shelter Name *</label>
              <input
                type="text"
                name="shelterName"
                value={formData.shelterName}
                onChange={handleChange}
                className="form-control form-control-sm"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contact Person Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="form-control form-control-sm"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="form-control form-control-sm"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Official License Number</label>
              <input
                type="text"
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={handleChange}
                className="form-control form-control-sm"
              />
            </div>

            <div className="form-group col-span-2">
              <label className="form-label">Website URL</label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="form-control form-control-sm"
                placeholder="https://..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tamil Nadu District *</label>
              <select
                name="district"
                value={formData.district}
                onChange={handleChange}
                className="form-control form-control-sm"
                required
              >
                {TAMILNADU_DISTRICTS.map((dist) => (
                  <option key={dist} value={dist}>{dist}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">City / Town</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="form-control form-control-sm"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Door / Street Address</label>
              <input
                type="text"
                name="doorStreet"
                value={formData.doorStreet}
                onChange={handleChange}
                className="form-control form-control-sm"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Area / Locality</label>
              <input
                type="text"
                name="area"
                value={formData.area}
                onChange={handleChange}
                className="form-control form-control-sm"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Pincode</label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                className="form-control form-control-sm"
                maxLength={6}
              />
            </div>

            <div className="form-group col-span-2">
              <label className="form-label">About Shelter / Bio</label>
              <textarea
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="form-control form-control-sm"
                placeholder="Describe your shelter's work and adoption policy..."
              />
            </div>
          </div>

          <div className="d-flex justify-end gap-2 pt-3 border-top">
            <button
              type="button"
              onClick={() => setIsEditingModal(false)}
              className="btn btn-outline btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary btn-sm"
            >
              {saving ? 'Saving Changes...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // IF USER IS SHELTER: RENDER DEDICATED SHELTER PROFILE DESIGN (Requirement #8)
  if (isShelter) {
    return (
      <ShelterLayout
        title="Shelter Profile"
        subtitle="Public shelter details, exact registered address, and official credentials."
        activePage="/profile"
        actions={
          <button
            onClick={() => setIsEditingModal(true)}
            className="btn btn-primary btn-sm d-flex align-center gap-2"
          >
            <Edit size={15} />
            <span>Edit Profile</span>
          </button>
        }
      >
        {successMsg && (
          <div className="alert alert-success d-flex align-center gap-2 mb-4 p-3 rounded">
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}
        {error && (
          <div className="alert alert-danger d-flex align-center gap-2 mb-4 p-3 rounded">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="card p-5 text-center shadow-sm">
            <LoadingSpinner message="Loading shelter profile..." />
          </div>
        ) : (
          <div className="shelter-profile-container">
            {/* Header Hero Card */}
            <div className="shelter-profile-hero card shadow-sm p-4 mb-4">
              <div className="d-flex align-center gap-4 flex-wrap">
                <div className="shelter-profile-avatar-wrap">
                  <img
                    src={avatarSrc}
                    alt={formData.shelterName}
                    className="shelter-profile-avatar"
                  />
                  <label className="shelter-avatar-upload-badge" title="Upload shelter logo">
                    <Upload size={14} />
                    <input type="file" onChange={handleAvatarUpload} accept="image/*" style={{ display: 'none' }} />
                  </label>
                </div>

                <div className="shelter-profile-meta flex-grow-1">
                  <div className="d-flex align-center gap-2 flex-wrap mb-1">
                    <h2 className="h3 font-weight-bold mb-0">{formData.shelterName || 'Shelter Partner'}</h2>
                    {user?.verificationStatus === 'Approved' ? (
                      <span className="shelter-badge shelter-badge-success d-inline-flex align-center gap-1">
                        <CheckCircle size={13} />
                        <span>Verified Shelter Partner</span>
                      </span>
                    ) : (
                      <span className="shelter-badge shelter-badge-pending">
                        {user?.verificationStatus || 'Pending Verification'}
                      </span>
                    )}
                  </div>

                  <p className="text-muted font-size-sm mb-2">
                    Operated by: <strong>{formData.name}</strong> • Licensed: <strong>{formData.licenseNumber || 'Registered Shelter'}</strong>
                  </p>

                  <div className="d-flex align-center gap-3 flex-wrap font-size-xs text-muted">
                    <span className="d-flex align-center gap-1">
                      <Mail size={13} /> {formData.email}
                    </span>
                    {formData.phone && (
                      <span className="d-flex align-center gap-1">
                        <Phone size={13} /> {formData.phone}
                      </span>
                    )}
                    {formData.website && (
                      <a href={formData.website} target="_blank" rel="noreferrer" className="text-teal d-flex align-center gap-1">
                        <Globe size={13} /> Visit Website &rarr;
                      </a>
                    )}
                  </div>
                </div>

                <div>
                  <button
                    onClick={() => setIsEditingModal(true)}
                    className="btn btn-outline btn-sm d-flex align-center gap-1"
                  >
                    <Edit size={14} />
                    <span>Edit Profile Details</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Content Sections Grid */}
            <div className="grid grid-2 gap-4 mb-4">
              {/* Section 1: Contact Information */}
              <div className="card shadow-sm p-4">
                <h3 className="h5 font-weight-bold mb-3 d-flex align-center gap-2 pb-2 border-bottom">
                  <Phone size={18} className="text-primary" />
                  <span>Contact Information</span>
                </h3>

                <div className="profile-info-list font-size-sm">
                  <div className="info-row py-2 d-flex justify-between border-bottom">
                    <span className="text-muted">Primary Phone:</span>
                    <strong>{formData.phone || 'Not provided'}</strong>
                  </div>
                  <div className="info-row py-2 d-flex justify-between border-bottom">
                    <span className="text-muted">Email Address:</span>
                    <strong>{formData.email}</strong>
                  </div>
                  <div className="info-row py-2 d-flex justify-between border-bottom">
                    <span className="text-muted">Contact Person:</span>
                    <strong>{formData.name}</strong>
                  </div>
                  <div className="info-row py-2 d-flex justify-between">
                    <span className="text-muted">Official Website:</span>
                    {formData.website ? (
                      <a href={formData.website} target="_blank" rel="noreferrer" className="text-teal font-weight-bold">
                        {formData.website}
                      </a>
                    ) : (
                      <span className="text-muted">Not specified</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 2: Shelter Address (Exact Registered Location from MongoDB - NEVER HARDCODED) */}
              <div className="card shadow-sm p-4">
                <h3 className="h5 font-weight-bold mb-3 d-flex align-center gap-2 pb-2 border-bottom">
                  <MapPin size={18} className="text-success" />
                  <span>Registered Shelter Address</span>
                </h3>

                <div className="profile-info-list font-size-sm">
                  <div className="info-row py-2 d-flex justify-between border-bottom">
                    <span className="text-muted">District:</span>
                    <strong className="text-primary">{formData.district || 'Tamil Nadu'}</strong>
                  </div>
                  <div className="info-row py-2 d-flex justify-between border-bottom">
                    <span className="text-muted">City / Locality:</span>
                    <strong>{formData.city || formData.area || formData.district || 'Tamil Nadu'}</strong>
                  </div>
                  <div className="info-row py-2 d-flex justify-between border-bottom">
                    <span className="text-muted">Door / Street:</span>
                    <strong>{formData.doorStreet || 'Registered Facility Address'}</strong>
                  </div>
                  <div className="info-row py-2 d-flex justify-between">
                    <span className="text-muted">Pincode / Postal:</span>
                    <strong>{formData.pincode || 'Tamil Nadu'}</strong>
                  </div>
                </div>

                <div className="mt-3 p-2 bg-light rounded font-size-xs text-muted">
                  <strong>Full Address on File:</strong><br />
                  {formattedAddress || 'Official registered address recorded in database.'}
                </div>
              </div>
            </div>

            {/* Section 3: About Shelter */}
            <div className="card shadow-sm p-4 mb-4">
              <h3 className="h5 font-weight-bold mb-2 pb-2 border-bottom">About the Shelter</h3>
              <p className="font-size-sm text-muted mb-0">
                {formData.description || 'PawHomes verified animal welfare organization committed to ethical rescue, pet rehabilitation, and finding forever homes for companion animals.'}
              </p>
            </div>
          </div>
        )}

        {isEditingModal && renderEditModal()}
      </ShelterLayout>
    );
  }

  // STANDARD ADOPTER / ADMIN PROFILE VIEW
  return (
    <div className="dashboard-layout container section-padding">
      <Sidebar />

      <main className="dashboard-content">
        <div className="dashboard-header mb-4">
          <h1>My Profile</h1>
          <p className="subtitle">Manage your personal account, gender preferences, and Tamil Nadu location details.</p>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading profile details..." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Profile Avatar & Verification Card */}
            <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <img
                  src={avatarSrc}
                  alt="Profile Avatar"
                  style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #0f766e' }}
                />
                <label style={{
                  position: 'absolute', bottom: '0', right: '0', backgroundColor: '#0f766e', color: '#fff',
                  borderRadius: '50%', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Upload size={14} />
                  <input type="file" onChange={handleAvatarUpload} accept="image/*" style={{ display: 'none' }} />
                </label>
              </div>

              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{formData.name || 'PawHomes User'}</h3>
                <p style={{ margin: '4px 0 8px 0', color: '#64748b', fontSize: '0.875rem' }}>
                  {formData.email} • <span style={{ textTransform: 'capitalize' }}>{formData.gender}</span>
                </p>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className={`badge ${user?.isEmailVerified ? 'badge-success' : 'badge-warning'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {user?.isEmailVerified ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                    {user?.isEmailVerified ? 'EMAIL VERIFIED' : 'EMAIL UNVERIFIED'}
                  </span>

                  {!user?.isEmailVerified && (
                    <button onClick={handleRequestEmailVerification} className="btn btn-outline btn-xs" style={{ padding: '2px 10px' }}>
                      Verify Email
                    </button>
                  )}
                </div>

                {verifyMsg && <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#047857' }}>{verifyMsg}</div>}
                {uploadingImg && <div style={{ marginTop: '4px', fontSize: '0.8rem', color: '#0f766e' }}>Uploading image...</div>}
              </div>
            </div>

            {/* Profile Edit Form */}
            <div className="card form-card" style={{ padding: '2rem' }}>
              <h3 className="mb-3">Personal &amp; Location Information</h3>
              {error && <ErrorMessage message={error} />}
              {successMsg && <div className="alert alert-success">{successMsg}</div>}

              <form onSubmit={handleSubmit}>
                <div className="form-group mb-3">
                  <label>Full Name / Contact Person *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group mb-3">
                  <label>Gender *</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} required>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div className="form-group mb-3">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group mb-3">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div className="form-row mb-3">
                  <div className="form-group">
                    <label>Tamil Nadu District *</label>
                    <select name="district" value={formData.district} onChange={handleChange} required>
                      {TAMILNADU_DISTRICTS.map((dist) => (
                        <option key={dist} value={dist}>{dist}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>City / Town</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="e.g. Madurai, Coimbatore"
                    />
                  </div>
                </div>

                <div className="grid grid-3 gap-3 mb-3">
                  <div className="form-group">
                    <label>Door / House &amp; Street</label>
                    <input
                      type="text"
                      name="doorStreet"
                      value={formData.doorStreet || formData.address || ''}
                      onChange={handleChange}
                      placeholder="e.g. 14B, 2nd Cross Street"
                    />
                  </div>
                  <div className="form-group">
                    <label>Area / Locality</label>
                    <input
                      type="text"
                      name="area"
                      value={formData.area || ''}
                      onChange={handleChange}
                      placeholder="e.g. KK Nagar"
                    />
                  </div>
                  <div className="form-group">
                    <label>Pincode</label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode || ''}
                      onChange={handleChange}
                      placeholder="e.g. 625020"
                      maxLength={6}
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving Profile...' : 'Save Profile Details'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Profile;
