import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import ErrorMessage from '../components/ErrorMessage';
import {
  User, Mail, Phone, Lock, Eye, EyeOff, Calendar, Briefcase, Image as ImageIcon,
  MapPin, Compass, CheckCircle2, ArrowRight, ArrowLeft, Heart, PawPrint, Home as HomeIcon,
  ShieldCheck, Sparkles, Building2
} from 'lucide-react';
import { TAMILNADU_DISTRICTS } from '../utils/locationUtils';

const STEPS = [
  { id: 1, name: 'Account', icon: User },
  { id: 2, name: 'Personal', icon: Calendar },
  { id: 3, name: 'Address', icon: MapPin },
  { id: 4, name: 'Preferences', icon: Heart },
  { id: 5, name: 'Adoption Details', icon: ShieldCheck }
];

const Register = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [locationDetecting, setLocationDetecting] = useState(false);
  const [locationSuccessNote, setLocationSuccessNote] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Account
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',

    // Step 2: Personal Details
    dob: '',
    gender: 'Prefer not to say',
    occupation: '',
    profilePhoto: '',

    // Step 3: Address (District MUST default to "" / "Select District", NEVER Chennai)
    doorStreet: '',
    area: '',
    city: '',
    district: '',
    state: 'Tamil Nadu',
    pincode: '',
    latitude: null,
    longitude: null,

    // Step 4: Preferences
    preferredSpecies: 'Dog',
    preferredAge: 'Young Adult (1-3 yrs)',
    preferredGender: 'Any',
    preferredSize: 'Medium',
    energyLevel: 'Moderate',
    indoorOutdoor: 'Indoor with outdoor walks',
    childrenCompatibility: 'Yes',
    otherPetsCompatibility: 'Yes',

    // Step 5: Adoption Details
    ownedPetBefore: 'Yes',
    currentlyHavePets: 'No',
    homeType: 'Independent House',
    hasOutdoorSpace: 'Yes, fenced yard',
    whoWillCare: 'Myself and family',
    whyAdopt: '',
    willingMedicalCare: true,
    willingVaccination: true,
    willingSterilization: true,
    confirmAccurate: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Step 1 Validation
  const validateStep1 = () => {
    if (!formData.name.trim()) return 'Please enter your full name';
    if (!formData.email.trim() || !formData.email.includes('@')) return 'Please enter a valid email address';
    if (!formData.phone.trim() || formData.phone.trim().length < 10) return 'Please enter a valid 10-digit phone number';
    if (formData.password.length < 6) return 'Password must be at least 6 characters long';
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
    return null;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    if (!formData.dob) return 'Please enter your date of birth';
    if (!formData.occupation.trim()) return 'Please enter your current occupation';
    return null;
  };

  // Step 3 Validation
  const validateStep3 = () => {
    if (!formData.doorStreet.trim()) return 'Please enter door/street details';
    if (!formData.city.trim()) return 'Please enter your city/town';
    if (!formData.district || formData.district === 'Select District') {
      return 'Please explicitly select your District from the dropdown';
    }
    if (!formData.pincode.trim() || formData.pincode.trim().length < 6) return 'Please enter a valid 6-digit Pincode';
    return null;
  };

  // Step 4 Validation
  const validateStep4 = () => {
    if (!formData.preferredSpecies) return 'Please select your preferred pet species';
    return null;
  };

  // Step 5 Validation
  const validateStep5 = () => {
    if (!formData.whyAdopt.trim()) return 'Please share why you want to adopt a pet';
    if (!formData.confirmAccurate) return 'Please confirm that the information provided is correct';
    return null;
  };

  const handleNext = () => {
    setError(null);
    let stepError = null;

    if (currentStep === 1) stepError = validateStep1();
    else if (currentStep === 2) stepError = validateStep2();
    else if (currentStep === 3) stepError = validateStep3();
    else if (currentStep === 4) stepError = validateStep4();

    if (stepError) {
      setError(stepError);
      return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, 5));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrev = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Use My Location Geolocation Handler
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setLocationDetecting(true);
    setLocationSuccessNote('');
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setFormData((prev) => ({
          ...prev,
          latitude,
          longitude
        }));
        setLocationDetecting(false);
        setLocationSuccessNote(`Coordinates captured (${latitude.toFixed(4)}, ${longitude.toFixed(4)}). Please confirm your District.`);
      },
      (err) => {
        setLocationDetecting(false);
        console.warn('Geolocation denied or unavailable:', err.message);
        setError('Location permission was denied or unavailable. Please select your address manually.');
      },
      { timeout: 10000 }
    );
  };

  // Final Registration Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const step5Error = validateStep5();
    if (step5Error) {
      setError(step5Error);
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: 'adopter',
        gender: formData.gender,
        dob: formData.dob,
        occupation: formData.occupation.trim(),
        profilePhoto: formData.profilePhoto.trim(),
        profileImage: formData.profilePhoto.trim(),

        // Address & Location
        address: `${formData.doorStreet}, ${formData.area || ''}`.trim(),
        doorStreet: formData.doorStreet.trim(),
        area: formData.area.trim(),
        city: formData.city.trim(),
        district: formData.district,
        state: formData.state,
        pincode: formData.pincode.trim(),
        latitude: formData.latitude,
        longitude: formData.longitude,

        // Step 4 Preferences
        preferences: {
          species: formData.preferredSpecies,
          age: formData.preferredAge,
          gender: formData.preferredGender,
          size: formData.preferredSize,
          energyLevel: formData.energyLevel,
          indoorOutdoor: formData.indoorOutdoor,
          goodWithChildren: formData.childrenCompatibility,
          goodWithOtherPets: formData.otherPetsCompatibility
        },

        // Step 5 Adoption Info
        adoptionInfo: {
          ownedPetBefore: formData.ownedPetBefore,
          currentlyHavePets: formData.currentlyHavePets,
          homeType: formData.homeType,
          hasOutdoorSpace: formData.hasOutdoorSpace,
          whoWillCare: formData.whoWillCare,
          whyAdopt: formData.whyAdopt,
          willingMedicalCare: formData.willingMedicalCare,
          willingVaccination: formData.willingVaccination,
          willingSterilization: formData.willingSterilization
        }
      };

      const res = await authAPI.register(payload);
      if (res.success) {
        setRegistrationSuccess(true);
      } else {
        setError(res.message || 'Registration failed. Please check your details.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during account creation.');
    } finally {
      setLoading(false);
    }
  };

  // Render Step Content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="registration-step-pane">
            <div className="step-pane-header">
              <span className="step-badge">Step 1 of 5</span>
              <h3>Create Your PawHomes Account</h3>
              <p>Enter your primary contact details to get started with your pet adoption profile.</p>
            </div>

            <div className="form-group mb-3">
              <label>Full Name *</label>
              <div className="input-with-icon">
                <User size={18} className="input-icon" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Priya Sharma"
                  required
                />
              </div>
            </div>

            <div className="grid grid-2 gap-3 mb-3">
              <div className="form-group">
                <label>Email Address *</label>
                <div className="input-with-icon">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="priya@example.com"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Phone Number (10 digits) *</label>
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
                    placeholder="Create a strong password"
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
          </div>
        );

      case 2:
        return (
          <div className="registration-step-pane">
            <div className="step-pane-header">
              <span className="step-badge">Step 2 of 5</span>
              <h3>Personal Details</h3>
              <p>This information helps shelters know you better and verify your suitability for pet care.</p>
            </div>

            <div className="grid grid-2 gap-3 mb-3">
              <div className="form-group">
                <label>Date of Birth *</label>
                <div className="input-with-icon">
                  <Calendar size={18} className="input-icon" />
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    max={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Gender *</label>
                <select name="gender" value={formData.gender} onChange={handleChange}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>

            <div className="form-group mb-3">
              <label>Current Occupation *</label>
              <div className="input-with-icon">
                <Briefcase size={18} className="input-icon" />
                <input
                  type="text"
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleChange}
                  placeholder="e.g. Software Engineer / Teacher / Business Owner"
                  required
                />
              </div>
            </div>

            <div className="form-group mb-3">
              <label>Profile Photo URL (Optional)</label>
              <div className="input-with-icon">
                <ImageIcon size={18} className="input-icon" />
                <input
                  type="url"
                  name="profilePhoto"
                  value={formData.profilePhoto}
                  onChange={handleChange}
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
              <small className="form-hint">
                You can provide an image URL now or upload a picture in your profile later.
              </small>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="registration-step-pane">
            <div className="step-pane-header">
              <span className="step-badge">Step 3 of 5</span>
              <h3>Residential Address &amp; Location</h3>
              <p>
                PawHomes matches you with pets near you. Your district is never pre-selected automatically.
              </p>
            </div>

            {/* Location action buttons */}
            <div className="location-action-bar mb-4">
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={locationDetecting}
                className="btn btn-outline location-btn"
              >
                <Compass size={17} />
                <span>{locationDetecting ? 'Detecting Location...' : 'Use My Location'}</span>
              </button>
              <button
                type="button"
                onClick={() => setLocationSuccessNote('Manual entry enabled. Please fill in the address fields.')}
                className="btn btn-outline location-btn"
              >
                <MapPin size={17} />
                <span>Enter Address Manually</span>
              </button>
            </div>

            {locationSuccessNote && (
              <div className="alert alert-info mb-3">
                <Sparkles size={16} /> {locationSuccessNote}
              </div>
            )}

            <div className="form-group mb-3">
              <label>Door / House No. &amp; Street Address *</label>
              <input
                type="text"
                name="doorStreet"
                value={formData.doorStreet}
                onChange={handleChange}
                placeholder="e.g. 14B, Gandhi Street, 2nd Cross"
                required
              />
            </div>

            <div className="grid grid-2 gap-3 mb-3">
              <div className="form-group">
                <label>Area / Locality</label>
                <input
                  type="text"
                  name="area"
                  value={formData.area}
                  onChange={handleChange}
                  placeholder="e.g. Anna Nagar / KK Nagar"
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

            <div className="grid grid-3 gap-3 mb-3">
              <div className="form-group">
                <label>District * (Explicit Choice)</label>
                <select
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  required
                  className="district-select"
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
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  readOnly
                  className="bg-light"
                />
              </div>

              <div className="form-group">
                <label>Pincode *</label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="625020"
                  maxLength={6}
                  required
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="registration-step-pane">
            <div className="step-pane-header">
              <span className="step-badge">Step 4 of 5</span>
              <h3>Adoption Preferences</h3>
              <p>Tell us what kind of companion fits your lifestyle for our Smart Match algorithm.</p>
            </div>

            <div className="form-group mb-3">
              <label>What type of pet are you interested in adopting? *</label>
              <div className="pill-choice-grid">
                {['Dog', 'Cat', 'Rabbit', 'Bird', 'Other'].map((petType) => (
                  <button
                    key={petType}
                    type="button"
                    className={`pill-choice-btn ${formData.preferredSpecies === petType ? 'selected' : ''}`}
                    onClick={() => setFormData({ ...formData, preferredSpecies: petType })}
                  >
                    <span>{petType === 'Dog' ? '🐶' : petType === 'Cat' ? '🐱' : petType === 'Rabbit' ? '🐰' : petType === 'Bird' ? '🦜' : '🐾'}</span>
                    <span>{petType}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-2 gap-3 mb-3">
              <div className="form-group">
                <label>Preferred Age Range</label>
                <select name="preferredAge" value={formData.preferredAge} onChange={handleChange}>
                  <option value="Puppy / Kitten (< 1 yr)">Puppy / Kitten (&lt; 1 yr)</option>
                  <option value="Young Adult (1-3 yrs)">Young Adult (1-3 yrs)</option>
                  <option value="Adult (3-7 yrs)">Adult (3-7 yrs)</option>
                  <option value="Senior (7+ yrs)">Senior (7+ yrs)</option>
                  <option value="Any Age">Any Age</option>
                </select>
              </div>

              <div className="form-group">
                <label>Preferred Gender</label>
                <select name="preferredGender" value={formData.preferredGender} onChange={handleChange}>
                  <option value="Any">Any Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>

            <div className="grid grid-2 gap-3 mb-3">
              <div className="form-group">
                <label>Preferred Pet Size</label>
                <select name="preferredSize" value={formData.preferredSize} onChange={handleChange}>
                  <option value="Small">Small (&lt; 10 kg)</option>
                  <option value="Medium">Medium (10 - 25 kg)</option>
                  <option value="Large">Large (&gt; 25 kg)</option>
                  <option value="Any">Any Size</option>
                </select>
              </div>

              <div className="form-group">
                <label>Energy Level Preference</label>
                <select name="energyLevel" value={formData.energyLevel} onChange={handleChange}>
                  <option value="Calm">Calm &amp; Relaxed</option>
                  <option value="Moderate">Moderate Daily Activity</option>
                  <option value="High">High Energy &amp; Playful</option>
                </select>
              </div>
            </div>

            <div className="grid grid-3 gap-3 mb-3">
              <div className="form-group">
                <label>Living Style</label>
                <select name="indoorOutdoor" value={formData.indoorOutdoor} onChange={handleChange}>
                  <option value="Indoor with outdoor walks">Indoor with outdoor walks</option>
                  <option value="Strictly Indoor">Strictly Indoor</option>
                  <option value="Indoor & Fenced Garden">Indoor &amp; Fenced Garden</option>
                </select>
              </div>

              <div className="form-group">
                <label>Must be Good with Children?</label>
                <select name="childrenCompatibility" value={formData.childrenCompatibility} onChange={handleChange}>
                  <option value="Yes">Yes, essential</option>
                  <option value="No children at home">No children at home</option>
                  <option value="Doesn't matter">Doesn't matter</option>
                </select>
              </div>

              <div className="form-group">
                <label>Must get along with other pets?</label>
                <select name="otherPetsCompatibility" value={formData.otherPetsCompatibility} onChange={handleChange}>
                  <option value="Yes">Yes, essential</option>
                  <option value="No other pets at home">No other pets at home</option>
                  <option value="Doesn't matter">Doesn't matter</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="registration-step-pane">
            <div className="step-pane-header">
              <span className="step-badge">Step 5 of 5</span>
              <h3>Adoption Readiness &amp; Care Details</h3>
              <p>These verified answers help shelters process your future adoption applications immediately.</p>
            </div>

            <div className="grid grid-2 gap-3 mb-3">
              <div className="form-group">
                <label>Have you owned a pet before? *</label>
                <select name="ownedPetBefore" value={formData.ownedPetBefore} onChange={handleChange}>
                  <option value="Yes">Yes, previously had pets</option>
                  <option value="No">No, first-time pet parent</option>
                </select>
              </div>

              <div className="form-group">
                <label>Do you currently have pets at home? *</label>
                <select name="currentlyHavePets" value={formData.currentlyHavePets} onChange={handleChange}>
                  <option value="No">No</option>
                  <option value="Yes - Dog(s)">Yes - Dog(s)</option>
                  <option value="Yes - Cat(s)">Yes - Cat(s)</option>
                  <option value="Yes - Other">Yes - Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-2 gap-3 mb-3">
              <div className="form-group">
                <label>Home Type *</label>
                <select name="homeType" value={formData.homeType} onChange={handleChange}>
                  <option value="Independent House">Independent House</option>
                  <option value="Apartment / Flat">Apartment / Flat</option>
                  <option value="Villa / Farmhouse">Villa / Farmhouse</option>
                </select>
              </div>

              <div className="form-group">
                <label>Do you have outdoor space? *</label>
                <select name="hasOutdoorSpace" value={formData.hasOutdoorSpace} onChange={handleChange}>
                  <option value="Yes, fenced yard">Yes, fenced yard</option>
                  <option value="Yes, balcony / terrace">Yes, balcony / terrace</option>
                  <option value="No, public parks nearby">No, public parks nearby</option>
                </select>
              </div>
            </div>

            <div className="form-group mb-3">
              <label>Who will be primary caregiver for the pet? *</label>
              <input
                type="text"
                name="whoWillCare"
                value={formData.whoWillCare}
                onChange={handleChange}
                placeholder="e.g. Myself, with daily support from my spouse"
                required
              />
            </div>

            <div className="form-group mb-3">
              <label>Why do you want to adopt? *</label>
              <textarea
                name="whyAdopt"
                value={formData.whyAdopt}
                onChange={handleChange}
                rows={3}
                placeholder="Share your motivations, your daily routine, and what kind of love and care you will provide..."
                required
              />
            </div>

            <div className="care-commitments-card p-3 mb-4">
              <h4 className="commitments-title mb-2">Adoption Care Commitments</h4>
              <label className="checkbox-label mb-2">
                <input
                  type="checkbox"
                  name="willingMedicalCare"
                  checked={formData.willingMedicalCare}
                  onChange={handleChange}
                />
                <span>I commit to providing timely veterinary care, nutrition, and medical attention.</span>
              </label>

              <label className="checkbox-label mb-2">
                <input
                  type="checkbox"
                  name="willingVaccination"
                  checked={formData.willingVaccination}
                  onChange={handleChange}
                />
                <span>I agree to complete and maintain all required vaccinations on schedule.</span>
              </label>

              <label className="checkbox-label mb-3">
                <input
                  type="checkbox"
                  name="willingSterilization"
                  checked={formData.willingSterilization}
                  onChange={handleChange}
                />
                <span>I agree to sterilize / neuter the pet if required and advised by veterinary protocols.</span>
              </label>

              <div className="final-confirmation-wrap pt-2 border-top">
                <label className="checkbox-label font-weight-bold">
                  <input
                    type="checkbox"
                    name="confirmAccurate"
                    checked={formData.confirmAccurate}
                    onChange={handleChange}
                  />
                  <strong>I confirm that the information provided is correct. *</strong>
                </label>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // SUCCESS SCREEN
  if (registrationSuccess) {
    return (
      <div className="paw-auth-page">
        <div className="paw-success-modal-card">
          <div className="paw-success-icon-wrap">
            <CheckCircle2 size={56} className="text-teal" />
          </div>
          <span className="badge-pill mb-2">Registration Complete</span>
          <h2>Welcome to PawHomes, {formData.name}! 🐾</h2>
          <p className="paw-success-subtext">
            Your adopter profile and location preferences in <strong>{formData.district || formData.city}</strong> have been registered successfully in our database.
          </p>

          <div className="success-action-row mt-4">
            <button
              onClick={() => navigate('/login', { state: { registeredEmail: formData.email } })}
              className="btn btn-primary btn-lg"
            >
              <PawPrint size={20} />
              <span>Explore Pets &amp; Sign In</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="paw-register-page section-padding">
      <div className="container max-w-lg">
        {/* Registration Header */}
        <div className="register-header-card text-center mb-4">
          <div className="brand-pill mb-2">
            <span>🐾 PawHomes Adopter Registration</span>
          </div>
          <h1>Join Our Pet-Loving Community</h1>
          <p className="subtitle">
            Complete the 5-step registration to find, match, and adopt your companion.
          </p>

          {/* Progress Indicator */}
          <div className="step-progress-bar">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;

              return (
                <div
                  key={step.id}
                  className={`step-indicator-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'active' : ''}`}
                >
                  <div className="step-icon-bubble">
                    {isCompleted ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                  </div>
                  <span className="step-name">{step.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Container */}
        <div className="card paw-register-card p-4">
          {error && <ErrorMessage message={error} />}

          <form onSubmit={currentStep === 5 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
            {renderStepContent()}

            <div className="step-navigation-buttons mt-4 pt-3 border-top d-flex justify-between align-center">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="btn btn-outline"
                >
                  <ArrowLeft size={16} />
                  <span>Previous</span>
                </button>
              ) : (
                <div />
              )}

              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="btn btn-primary"
                >
                  <span>Continue</span>
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading || !formData.confirmAccurate}
                  className="btn btn-primary btn-lg"
                >
                  {loading ? 'Creating Account...' : (
                    <>
                      <PawPrint size={18} />
                      <span>Create PawHomes Account</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Shelter and Login Links */}
        <div className="register-bottom-links text-center mt-4">
          <p>
            Already have an account? <Link to="/login" className="highlight-link">Sign In</Link>
          </p>
          <p className="mt-2 text-muted">
            Are you an animal shelter or rescue organization?{' '}
            <Link to="/shelter/register" className="highlight-link font-weight-bold">
              <Building2 size={15} style={{ verticalAlign: 'text-bottom' }} /> Register as a Shelter Partner
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
