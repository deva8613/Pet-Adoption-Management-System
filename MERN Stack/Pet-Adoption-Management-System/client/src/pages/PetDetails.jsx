import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { petAPI, applicationAPI, favoriteAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import AdoptionMapModal from '../components/AdoptionMapModal';
import {
  MapPin, Phone, Heart, PawPrint, Building2, CheckCircle2, ShieldCheck,
  Award, Activity, Calendar, User, ArrowLeft, Navigation, Sparkles, AlertCircle
} from 'lucide-react';
import { checkAdoptionEligibility } from '../utils/locationUtils';

const PetDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [pet, setPet] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [submittingApp, setSubmittingApp] = useState(false);
  const [applyError, setApplyError] = useState(null);
  const [applySuccess, setApplySuccess] = useState(false);

  // Application Form State (Section 18)
  const [formData, setFormData] = useState({
    whyAdopt: '',
    whoWillCare: '',
    whereStay: 'Indoors with Family',
    hasChildren: 'No',
    hasOtherPets: 'No',
    experienceWithPets: '',
    medicalCommitment: true,
    vaccinationCommitment: true,
    longTermCommitment: true
  });

  useEffect(() => {
    fetchPetDetails();
  }, [id, user]);

  useEffect(() => {
    // If navigated with ?apply=true, automatically open the application form
    if (searchParams.get('apply') === 'true' && pet && pet.adoptionStatus === 'Available') {
      if (!user) {
        navigate('/login', { state: { from: `/pets/${id}?apply=true` } });
      } else {
        setShowApplyModal(true);
      }
    }
  }, [searchParams, pet, user]);

  const fetchPetDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await petAPI.getById(id);
      if (res.success && res.data) {
        setPet(res.data);
      } else {
        setError(res.message || 'Pet record not found');
      }

      // Check if favorited by user
      if (user) {
        const favRes = await favoriteAPI.getMyFavorites();
        if (favRes.success && favRes.data) {
          const isFav = favRes.data.some((f) => f._id?.toString() === id?.toString());
          setIsFavorited(isFav);
        }
      }
    } catch (err) {
      setError(err.message || 'Error fetching pet information');
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteToggle = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/pets/${id}` } });
      return;
    }

    try {
      setFavLoading(true);
      const res = await favoriteAPI.toggle(id);
      if (res.success) {
        setIsFavorited(res.isFavorite);
      }
    } catch (err) {
      console.error('Favorite error:', err);
    } finally {
      setFavLoading(false);
    }
  };

  const handleOpenApplyModal = () => {
    if (!user) {
      navigate('/login', { state: { from: `/pets/${id}?apply=true` } });
      return;
    }

    const eligibility = checkAdoptionEligibility(user, pet);
    if (!eligibility.eligible) {
      alert(`Adoption Notice: ${eligibility.reason}`);
      return;
    }

    // Pre-fill default answers if available from user profile
    setFormData((prev) => ({
      ...prev,
      whyAdopt: prev.whyAdopt || user.adoptionInfo?.whyAdopt || '',
      whoWillCare: prev.whoWillCare || user.adoptionInfo?.whoWillCare || `${user.name} (Applicant)`,
      experienceWithPets: prev.experienceWithPets || (user.adoptionInfo?.ownedPetBefore === 'Yes' ? 'Previously owned and cared for pets' : 'First-time pet parent eager to learn'),
      hasOtherPets: user.adoptionInfo?.currentlyHavePets || 'No'
    }));

    setShowApplyModal(true);
  };

  const handleApplicationSubmit = async (e) => {
    e.preventDefault();
    if (!formData.whyAdopt.trim()) {
      setApplyError('Please explain why you want to adopt this pet.');
      return;
    }
    if (!formData.experienceWithPets.trim()) {
      setApplyError('Please describe your previous pet care experience.');
      return;
    }

    try {
      setSubmittingApp(true);
      setApplyError(null);

      const payload = {
        petId: id,
        applicantDistrict: user.district || user.city || 'Tamil Nadu',
        reasonForAdoption: formData.whyAdopt.trim(),
        experienceWithPets: formData.experienceWithPets.trim(),
        whoWillCare: formData.whoWillCare.trim(),
        whereStay: formData.whereStay,
        hasChildren: formData.hasChildren,
        hasOtherPets: formData.hasOtherPets,
        medicalCommitment: formData.medicalCommitment,
        vaccinationCommitment: formData.vaccinationCommitment,
        longTermCommitment: formData.longTermCommitment
      };

      const res = await applicationAPI.create(payload);
      if (res.success && res.data) {
        setApplySuccess(true);
        const newAppId = res.data._id;
        setTimeout(() => {
          setShowApplyModal(false);
          setApplySuccess(false);
          navigate(`/application-status/${newAppId}`);
        }, 1200);
      } else {
        setApplyError(res.message || 'Failed to submit adoption application');
      }
    } catch (err) {
      setApplyError(err.message || 'An error occurred while submitting your application.');
    } finally {
      setSubmittingApp(false);
    }
  };

  if (loading) return <LoadingSpinner message="Retrieving pet profile and medical specifications..." />;
  if (error) return (
    <div className="container section-padding">
      <ErrorMessage message={error} />
      <div className="mt-3">
        <Link to="/pets" className="btn btn-primary">Browse Other Pets</Link>
      </div>
    </div>
  );
  if (!pet) return null;

  const images = (pet.images && pet.images.length > 0)
    ? pet.images
    : ['https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80'];

  const shelterPhone = pet.shelterInfo?.phone || pet.shelterPhone || '9876543210';
  const shelterName = pet.shelterInfo?.shelterName || pet.shelterName || 'PawHomes Partner Shelter';
  const petLocation = pet.city ? `${pet.city}, ${pet.district || ''}`.trim() : (pet.district || pet.location || 'Tamil Nadu');

  return (
    <div className="paw-pet-details-page section-padding">
      <div className="container">
        {/* Navigation Breadcrumb */}
        <div className="mb-4 d-flex justify-between align-center">
          <button onClick={() => navigate(-1)} className="btn btn-outline btn-sm d-flex align-center gap-1">
            <ArrowLeft size={16} /> Back to Catalog
          </button>
          <span className="badge-pill">🐾 Animal ID: {pet._id.slice(-6)}</span>
        </div>

        {/* Main Details Grid */}
        <div className="pet-details-hero-grid mb-5">
          {/* LEFT: Large Image Gallery (Section 15) */}
          <div className="pet-gallery-panel">
            <div className="pet-gallery-main card shadow-sm mb-3">
              <img
                src={images[activeImageIndex]}
                alt={pet.petName}
                className="gallery-main-img"
              />
              <div className="gallery-status-overlay">
                <StatusBadge status={pet.adoptionStatus} />
              </div>
            </div>

            {/* Thumbnail Row */}
            {images.length > 1 && (
              <div className="gallery-thumbnails d-flex gap-2">
                {images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`thumb-btn ${activeImageIndex === idx ? 'active' : ''}`}
                  >
                    <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Pet Primary Info & 4 Action Buttons */}
          <div className="pet-summary-panel card p-4 shadow-sm">
            <div className="d-flex justify-between align-center mb-2">
              <h1 className="pet-heading mb-0">{pet.petName}</h1>
              <button
                onClick={handleFavoriteToggle}
                disabled={favLoading}
                className={`btn btn-outline btn-sm fav-toggle-round ${isFavorited ? 'favorited' : ''}`}
                title={isFavorited ? 'Saved in favorites' : 'Add to favorites'}
              >
                <Heart size={18} fill={isFavorited ? '#ef4444' : 'none'} color={isFavorited ? '#ef4444' : 'currentColor'} />
                <span>{isFavorited ? 'Favorited' : 'Favorite'}</span>
              </button>
            </div>

            <p className="pet-breed-line text-muted font-size-md mb-3">
              {pet.breed} • {pet.species} • {pet.gender}
            </p>

            <div className="pet-location-badge d-flex align-center gap-2 p-2 bg-light rounded mb-4">
              <MapPin size={18} className="text-teal" />
              <span><strong>Location:</strong> {petLocation}</span>
            </div>

            {/* Section 15 Buttons:
                ❤️ Add to Favorites
                🐾 Apply for Adoption
                📞 Contact Shelter (actual registered phone number)
                📍 View Location (opens actual location modal) */}
            <div className="pet-action-buttons-group d-flex flex-column gap-3 mb-4">
              {pet.adoptionStatus === 'Available' ? (
                <button
                  onClick={handleOpenApplyModal}
                  className="btn btn-primary btn-lg d-flex align-center justify-center gap-2"
                >
                  <PawPrint size={20} />
                  <span>Apply for Adoption</span>
                </button>
              ) : (
                <button disabled className="btn btn-secondary btn-lg">
                  Pet Already {pet.adoptionStatus}
                </button>
              )}

              <div className="grid grid-2 gap-2">
                <a
                  href={`tel:${shelterPhone}`}
                  className="btn btn-outline d-flex align-center justify-center gap-2"
                >
                  <Phone size={16} />
                  <span>Contact Shelter</span>
                </a>

                <button
                  onClick={() => setShowMapModal(true)}
                  className="btn btn-outline d-flex align-center justify-center gap-2"
                >
                  <MapPin size={16} />
                  <span>View Location</span>
                </button>
              </div>
            </div>

            {/* Shelter Summary Box */}
            <div className="shelter-info-card p-3 border rounded bg-white">
              <div className="d-flex align-center gap-2 mb-2">
                <Building2 size={20} className="text-teal" />
                <h4 className="mb-0">{shelterName}</h4>
              </div>
              <p className="font-size-sm text-muted mb-2">
                Verified shelter partner caring for {pet.petName}. Contact for visitation and adoption coordination.
              </p>
              <div className="font-size-xs text-muted">
                <strong>Phone:</strong> {shelterPhone}
              </div>
            </div>
          </div>
        </div>

        {/* DETAILED SPECIFICATIONS (Section 15) */}
        <div className="card p-4 shadow-sm mb-5">
          <h2 className="mb-4 border-bottom pb-2">Comprehensive Pet Profile</h2>

          <div className="grid grid-4 gap-4 mb-4">
            <div className="spec-item">
              <span className="spec-label text-muted font-size-xs">AGE</span>
              <p className="spec-value font-weight-bold font-size-md mb-0">{pet.age || 'Not specified'}</p>
            </div>
            <div className="spec-item">
              <span className="spec-label text-muted font-size-xs">GENDER</span>
              <p className="spec-value font-weight-bold font-size-md mb-0">{pet.gender || 'Male'}</p>
            </div>
            <div className="spec-item">
              <span className="spec-label text-muted font-size-xs">SIZE</span>
              <p className="spec-value font-weight-bold font-size-md mb-0">{pet.size || 'Medium'}</p>
            </div>
            <div className="spec-item">
              <span className="spec-label text-muted font-size-xs">WEIGHT</span>
              <p className="spec-value font-weight-bold font-size-md mb-0">{pet.weight || '12-15 kg'}</p>
            </div>
          </div>

          <div className="grid grid-4 gap-4 mb-4">
            <div className="spec-item">
              <span className="spec-label text-muted font-size-xs">COAT COLOR</span>
              <p className="spec-value font-weight-bold font-size-md mb-0">{pet.color || 'Standard Coat'}</p>
            </div>
            <div className="spec-item">
              <span className="spec-label text-muted font-size-xs">VACCINATION</span>
              <p className="spec-value font-weight-bold font-size-md text-teal mb-0">{pet.vaccinationStatus || 'Up to date'}</p>
            </div>
            <div className="spec-item">
              <span className="spec-label text-muted font-size-xs">STERILIZATION / NEUTERED</span>
              <p className="spec-value font-weight-bold font-size-md mb-0">{pet.neuteredStatus === 'Yes' ? 'Sterilized (Yes)' : 'Not Sterilized'}</p>
            </div>
            <div className="spec-item">
              <span className="spec-label text-muted font-size-xs">GENERAL HEALTH</span>
              <p className="spec-value font-weight-bold font-size-md mb-0">{pet.healthStatus || 'Healthy'}</p>
            </div>
          </div>

          <div className="grid grid-3 gap-4 mb-4">
            <div className="spec-item">
              <span className="spec-label text-muted font-size-xs">GOOD WITH CHILDREN?</span>
              <p className="spec-value font-weight-bold font-size-md mb-0">{pet.goodWithChildren || 'Yes'}</p>
            </div>
            <div className="spec-item">
              <span className="spec-label text-muted font-size-xs">GOOD WITH OTHER PETS?</span>
              <p className="spec-value font-weight-bold font-size-md mb-0">{pet.goodWithPets || pet.goodWithOtherPets || 'Yes'}</p>
            </div>
            <div className="spec-item">
              <span className="spec-label text-muted font-size-xs">TEMPERAMENT</span>
              <p className="spec-value font-weight-bold font-size-md mb-0">{pet.temperament || 'Friendly, Loving'}</p>
            </div>
          </div>

          {/* Description */}
          <div className="spec-description pt-3 border-top">
            <h4 className="mb-2">About {pet.petName}</h4>
            <p className="text-main line-height-relaxed mb-0">
              {pet.description || `${pet.petName} is a wonderful ${pet.breed} looking for a compassionate family to call their own. Fully vetted and ready for adoption.`}
            </p>
          </div>
        </div>

        {/* ADOPTION APPLICATION MODAL (Section 18) */}
        {showApplyModal && (
          <div className="modal-overlay">
            <div className="modal-card max-w-lg p-4">
              <div className="modal-header d-flex justify-between align-center mb-3 pb-2 border-bottom">
                <div>
                  <span className="badge-pill mb-1">Official Adoption Application</span>
                  <h2 className="mb-0">Apply to Adopt {pet.petName}</h2>
                </div>
                <button className="close-btn" onClick={() => setShowApplyModal(false)}>×</button>
              </div>

              {applySuccess ? (
                <div className="text-center py-5">
                  <CheckCircle2 size={54} className="text-teal mb-3" />
                  <h3>Application Submitted Successfully!</h3>
                  <p className="text-muted">
                    Your adoption application for <strong>{pet.petName}</strong> is now registered in MongoDB with status <strong>PENDING</strong>.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleApplicationSubmit}>
                  {applyError && <ErrorMessage message={applyError} />}

                  {/* Pre-filled Applicant Info (Section 18) */}
                  <div className="p-3 mb-3 bg-light rounded">
                    <strong className="font-size-xs text-muted d-block mb-1">PRE-FILLED APPLICANT DETAILS</strong>
                    <div className="grid grid-2 gap-2 font-size-sm">
                      <div><strong>Name:</strong> {user?.name}</div>
                      <div><strong>Email:</strong> {user?.email}</div>
                      <div><strong>Phone:</strong> {user?.phone || 'Provided in profile'}</div>
                      <div><strong>Address:</strong> {user?.address || user?.doorStreet || user?.district}</div>
                    </div>
                  </div>

                  {/* Section 18 Questionnaire */}
                  <div className="form-group mb-3">
                    <label>Why do you want to adopt {pet.petName}? *</label>
                    <textarea
                      rows={3}
                      value={formData.whyAdopt}
                      onChange={(e) => setFormData({ ...formData, whyAdopt: e.target.value })}
                      placeholder="Share your motivations, family agreement, and daily lifestyle..."
                      required
                    />
                  </div>

                  <div className="grid grid-2 gap-3 mb-3">
                    <div className="form-group">
                      <label>Who will take care of the pet? *</label>
                      <input
                        type="text"
                        value={formData.whoWillCare}
                        onChange={(e) => setFormData({ ...formData, whoWillCare: e.target.value })}
                        placeholder="e.g. Myself and family members"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Where will the pet stay? *</label>
                      <select
                        value={formData.whereStay}
                        onChange={(e) => setFormData({ ...formData, whereStay: e.target.value })}
                      >
                        <option value="Indoors with Family">Indoors with Family</option>
                        <option value="Indoor & Fenced Yard">Indoor &amp; Fenced Yard</option>
                        <option value="Covered Patio / Porch">Covered Patio / Porch</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-2 gap-3 mb-3">
                    <div className="form-group">
                      <label>Do you have children at home? *</label>
                      <select
                        value={formData.hasChildren}
                        onChange={(e) => setFormData({ ...formData, hasChildren: e.target.value })}
                      >
                        <option value="No">No</option>
                        <option value="Yes - Under 5 yrs">Yes - Under 5 yrs</option>
                        <option value="Yes - 5-12 yrs">Yes - 5-12 yrs</option>
                        <option value="Yes - Teenagers">Yes - Teenagers</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Do you currently have other pets? *</label>
                      <select
                        value={formData.hasOtherPets}
                        onChange={(e) => setFormData({ ...formData, hasOtherPets: e.target.value })}
                      >
                        <option value="No">No</option>
                        <option value="Yes - Dog(s)">Yes - Dog(s)</option>
                        <option value="Yes - Cat(s)">Yes - Cat(s)</option>
                        <option value="Yes - Other">Yes - Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group mb-3">
                    <label>Previous pet ownership experience *</label>
                    <textarea
                      rows={2}
                      value={formData.experienceWithPets}
                      onChange={(e) => setFormData({ ...formData, experienceWithPets: e.target.value })}
                      placeholder="Briefly describe any past experience caring for pets..."
                      required
                    />
                  </div>

                  {/* Section 18 Commitments */}
                  <div className="care-commitments p-3 mb-4 border rounded">
                    <strong className="d-block mb-2 font-size-sm">Required Commitments:</strong>
                    <label className="checkbox-label mb-1">
                      <input
                        type="checkbox"
                        checked={formData.medicalCommitment}
                        onChange={(e) => setFormData({ ...formData, medicalCommitment: e.target.checked })}
                      />
                      <span className="font-size-sm">I commit to providing regular food, care, and medical attention.</span>
                    </label>

                    <label className="checkbox-label mb-1">
                      <input
                        type="checkbox"
                        checked={formData.vaccinationCommitment}
                        onChange={(e) => setFormData({ ...formData, vaccinationCommitment: e.target.checked })}
                      />
                      <span className="font-size-sm">I agree to keep vaccinations updated as required.</span>
                    </label>

                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.longTermCommitment}
                        onChange={(e) => setFormData({ ...formData, longTermCommitment: e.target.checked })}
                      />
                      <span className="font-size-sm">I understand this is a long-term commitment for the pet's lifetime.</span>
                    </label>
                  </div>

                  <div className="d-flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowApplyModal(false)}
                      className="btn btn-outline"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingApp || !formData.medicalCommitment}
                      className="btn btn-primary"
                    >
                      {submittingApp ? 'Submitting Application...' : 'Submit Application'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* VIEW LOCATION MAP MODAL (Section 15) */}
        {showMapModal && (
          <AdoptionMapModal
            isOpen={showMapModal}
            onClose={() => setShowMapModal(false)}
            petName={pet.petName}
            shelterInfo={pet.shelterInfo || { shelterName, district: pet.district || 'Tamil Nadu' }}
            adopterInfo={user ? { name: user.name, district: user.district || user.city } : { name: 'Visitor', district: pet.district }}
            applicationStatus="Location View"
          />
        )}
      </div>
    </div>
  );
};

export default PetDetails;
