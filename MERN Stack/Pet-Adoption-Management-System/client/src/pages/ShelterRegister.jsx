import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import ErrorMessage from '../components/ErrorMessage';
import { Building2, User, Mail, Phone, Lock, Eye, EyeOff, MapPin, Globe, Image as ImageIcon, Compass, CheckCircle2, ArrowRight } from 'lucide-react';
import { TAMILNADU_DISTRICTS } from '../utils/locationUtils';

const ShelterRegister = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [locationDetecting, setLocationDetecting] = useState(false);

  const [formData, setFormData] = useState({
    shelterName: '',
    name: '', // Contact Person
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    description: '',
    doorStreet: '',
    area: '',
    city: '',
    district: '',
    state: 'Tamil Nadu',
    pincode: '',
    latitude: null,
    longitude: null,
    website: '',
    shelterImage: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setLocationDetecting(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setFormData((prev) => ({ ...prev, latitude, longitude }));
        setLocationDetecting(false);
      },
      (err) => {
        setLocationDetecting(false);
        setError('Location permission denied or unavailable.');
      },
      { timeout: 10000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg('');

    if (!formData.shelterName.trim()) return setError('Please enter your Shelter Name');
    if (!formData.name.trim()) return setError('Please enter the Contact Person name');
    if (!formData.email.trim() || !formData.email.includes('@')) return setError('Please enter a valid email address');
    if (!formData.phone.trim() || formData.phone.length < 10) return setError('Please enter a valid 10-digit contact phone number');
    if (formData.password.length < 6) return setError('Password must be at least 6 characters long');
    if (formData.password !== formData.confirmPassword) return setError('Passwords do not match');
    if (!formData.district || formData.district === 'Select District') {
      return setError('Please explicitly select your shelter District');
    }
    if (!formData.doorStreet.trim() || !formData.city.trim() || !formData.pincode.trim()) {
      return setError('Please provide the full physical address for the shelter');
    }

    try {
      setLoading(true);

      const payload = {
        name: formData.name.trim(),
        shelterName: formData.shelterName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: 'shelter',
        description: formData.description.trim(),
        address: `${formData.doorStreet}, ${formData.area || ''}`.trim(),
        doorStreet: formData.doorStreet.trim(),
        area: formData.area.trim(),
        city: formData.city.trim(),
        district: formData.district,
        state: formData.state,
        pincode: formData.pincode.trim(),
        latitude: formData.latitude,
        longitude: formData.longitude,
        website: formData.website.trim(),
        shelterImage: formData.shelterImage.trim() || 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=80'
      };

      const res = await authAPI.register(payload);
      if (res.success) {
        setSuccessMsg(`Shelter "${formData.shelterName}" has been successfully registered! You can now log into your Shelter Dashboard.`);
        setTimeout(() => {
          navigate('/login', { state: { registeredEmail: formData.email } });
        }, 1800);
      } else {
        setError(res.message || 'Shelter registration failed.');
      }
    } catch (err) {
      setError(err.message || 'Error occurred during shelter registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="paw-register-page section-padding">
      <div className="container max-w-lg">
        <div className="register-header-card text-center mb-4">
          <div className="brand-pill mb-2">
            <span>🏛️ PawHomes Shelter Partner Registration</span>
          </div>
          <h1>Register Your Animal Shelter</h1>
          <p className="subtitle">
            Join the PawHomes network to list rescued pets, review applications, and coordinate verified adoptions.
          </p>
        </div>

        <div className="card paw-register-card p-4">
          {error && <ErrorMessage message={error} />}
          {successMsg && <div className="alert alert-success">{successMsg}</div>}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-2 gap-3 mb-3">
              <div className="form-group">
                <label>Shelter / Organization Name *</label>
                <div className="input-with-icon">
                  <Building2 size={18} className="input-icon" />
                  <input
                    type="text"
                    name="shelterName"
                    value={formData.shelterName}
                    onChange={handleChange}
                    placeholder="e.g. Hope Haven Animal Shelter"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Contact Person Name *</label>
                <div className="input-with-icon">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Dr. Rajesh Kumar"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-2 gap-3 mb-3">
              <div className="form-group">
                <label>Official Email Address *</label>
                <div className="input-with-icon">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="contact@shelter.org"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Contact Phone (10 digits) *</label>
                <div className="input-with-icon">
                  <Phone size={18} className="input-icon" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="9876543210"
                    maxLength={10}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-2 gap-3 mb-3">
              <div className="form-group">
                <label>Password (min 6 characters) *</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle-btn"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Confirm Password *</label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repeat password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="password-toggle-btn"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="form-group mb-3">
              <label>Shelter Description &amp; Mission</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Describe your facility, adoption hours, care facilities, and mission..."
              />
            </div>

            <div className="location-section-box p-3 mb-3">
              <div className="d-flex justify-between align-center mb-2">
                <h4 style={{ margin: 0 }}>Shelter Physical Location</h4>
                <button
                  type="button"
                  onClick={handleUseMyLocation}
                  disabled={locationDetecting}
                  className="btn btn-outline btn-xs"
                >
                  <Compass size={14} />
                  <span>{locationDetecting ? 'Capturing...' : 'Pin Current Coordinates'}</span>
                </button>
              </div>

              {formData.latitude && formData.longitude && (
                <div className="alert alert-info py-1 mb-2 font-size-sm">
                  ✓ Coordinates recorded: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                </div>
              )}

              <div className="form-group mb-2">
                <label>Door / Street Address *</label>
                <input
                  type="text"
                  name="doorStreet"
                  value={formData.doorStreet}
                  onChange={handleChange}
                  placeholder="e.g. 42, Bypass Road, Near Veterinary Hospital"
                  required
                />
              </div>

              <div className="grid grid-2 gap-2 mb-2">
                <div className="form-group">
                  <label>Area / Neighborhood</label>
                  <input
                    type="text"
                    name="area"
                    value={formData.area}
                    onChange={handleChange}
                    placeholder="e.g. Mattuthavani"
                  />
                </div>
                <div className="form-group">
                  <label>City / Town *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="e.g. Madurai"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-3 gap-2">
                <div className="form-group">
                  <label>District *</label>
                  <select
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select District</option>
                    {TAMILNADU_DISTRICTS.map((dist) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input type="text" name="state" value={formData.state} readOnly className="bg-light" />
                </div>
                <div className="form-group">
                  <label>Pincode *</label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="625007"
                    maxLength={6}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-2 gap-3 mb-4">
              <div className="form-group">
                <label>Website / Social Link</label>
                <div className="input-with-icon">
                  <Globe size={18} className="input-icon" />
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://myshelter.org"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Shelter Facility Photo URL</label>
                <div className="input-with-icon">
                  <ImageIcon size={18} className="input-icon" />
                  <input
                    type="url"
                    name="shelterImage"
                    value={formData.shelterImage}
                    onChange={handleChange}
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-block btn-lg"
            >
              {loading ? 'Registering Shelter...' : (
                <>
                  <Building2 size={18} />
                  <span>Register Shelter Account</span>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="register-bottom-links text-center mt-4">
          <p>
            Already registered? <Link to="/login" className="highlight-link">Sign In to Dashboard</Link>
          </p>
          <p className="mt-2 text-muted">
            Looking to adopt a pet? <Link to="/register" className="highlight-link">Register as Adopter</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShelterRegister;
