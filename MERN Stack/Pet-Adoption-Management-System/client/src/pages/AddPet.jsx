import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { petAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ShelterLayout from '../components/ShelterLayout';
import ShelterVerificationBanner from '../components/ShelterVerificationBanner';
import ErrorMessage from '../components/ErrorMessage';
import {
  PawPrint,
  Heart,
  Activity,
  Image as ImageIcon,
  PlusCircle,
  CheckCircle2,
  ArrowLeft,
  X,
  Upload,
  Info,
  ShieldCheck,
  Smile
} from 'lucide-react';
import { TAMILNADU_DISTRICTS } from '../utils/locationUtils';

const AddPet = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Form State Organized by Categories
  const [formData, setFormData] = useState({
    // 1. Basic Information
    petName: '',
    species: 'Dog',
    breed: '',
    age: '',
    gender: 'Male',
    color: '',
    size: 'Medium',
    weight: '',

    // 2. Health Information
    vaccinationStatus: 'Fully Vaccinated',
    sterilizationStatus: 'Yes',
    healthStatus: 'Healthy & Checked',
    specialNeeds: '',

    // 3. Behaviour
    temperament: 'Friendly & Playful',
    goodWithChildren: 'Yes',
    goodWithPets: 'Yes',
    goodWithOtherPets: 'Yes',
    energyLevel: 'Moderate',

    // 4. Adoption Information
    adoptionStatus: 'Available',
    description: '',
    district: user?.district || 'Chennai',
    location: user?.city ? `${user.city}, ${user.district || ''}` : (user?.district || 'Chennai'),

    // 5. Photos
    imageUrlInput: '',
    images: []
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Add Image URL
  const handleAddImageUrl = () => {
    if (!formData.imageUrlInput.trim()) return;
    const url = formData.imageUrlInput.trim();
    if (formData.images.includes(url)) return;
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, url],
      imageUrlInput: ''
    }));
  };

  // Remove Image
  const handleRemoveImage = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.petName.trim() || !formData.breed.trim() || !formData.age.trim()) {
      setError('Please fill in all mandatory pet details (Pet Name, Breed, and Age).');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Default fallback stock image if shelter hasn't uploaded any
      let finalImages = [...formData.images];
      if (finalImages.length === 0) {
        if (formData.imageUrlInput.trim()) {
          finalImages.push(formData.imageUrlInput.trim());
        } else {
          finalImages.push(
            formData.species === 'Cat'
              ? 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80'
              : 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80'
          );
        }
      }

      const payload = {
        ...formData,
        neuteredStatus: formData.sterilizationStatus,
        district: formData.district || user?.district || 'Tamil Nadu',
        location: formData.location || user?.city || 'Tamil Nadu',
        images: finalImages
      };

      const res = await petAPI.create(payload);

      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/shelter/pets');
        }, 1200);
      } else {
        setError(res.message || 'Failed to list pet');
      }
    } catch (err) {
      setError(err.message || 'Error occurred while listing pet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ShelterLayout
      title="Add New Pet"
      subtitle="Publish an animal profile to PawHomes with health, behavioral, and location details."
      activePage="/shelter/add-pet"
      actions={
        <Link to="/shelter/pets" className="btn btn-outline btn-sm d-flex align-center gap-1">
          <ArrowLeft size={15} />
          <span>Back to Pets</span>
        </Link>
      }
    >
      {/* Verification Notice Banner if not approved */}
      {user?.verificationStatus && user.verificationStatus !== 'Approved' && (
        <ShelterVerificationBanner
          status={user.verificationStatus}
          reason={user.verificationReason}
        />
      )}

      {/* Success Notification */}
      {success && (
        <div className="alert alert-success d-flex align-center gap-2 mb-4 p-3 rounded shadow-sm">
          <CheckCircle2 size={20} className="text-success" />
          <span><strong>Success!</strong> Pet listing published successfully. Redirecting to your inventory...</span>
        </div>
      )}

      {error && (
        <div className="mb-4">
          <ErrorMessage message={error} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="shelter-add-pet-form">
        {/* SECTION 1: BASIC INFORMATION */}
        <div className="form-card card shadow-sm p-4 mb-4">
          <div className="form-section-header d-flex align-center gap-2 mb-3 pb-2 border-bottom">
            <div className="form-section-icon bg-teal-soft text-teal p-2 rounded">
              <PawPrint size={18} />
            </div>
            <div>
              <h3 className="h5 font-weight-bold mb-0">1. Basic Information</h3>
              <p className="text-muted font-size-xs mb-0">General details about the animal</p>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Pet Name *</label>
              <input
                type="text"
                name="petName"
                placeholder="e.g. Bella, Bruno, Milo"
                value={formData.petName}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Species *</label>
              <select
                name="species"
                value={formData.species}
                onChange={handleChange}
                className="form-control"
              >
                <option value="Dog">Dog</option>
                <option value="Cat">Cat</option>
                <option value="Bird">Bird</option>
                <option value="Rabbit">Rabbit</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Breed *</label>
              <input
                type="text"
                name="breed"
                placeholder="e.g. Golden Retriever, Indie, Persian Cat"
                value={formData.breed}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Age / Stage *</label>
              <input
                type="text"
                name="age"
                placeholder="e.g. 2 Months, 1 Year, Puppy"
                value={formData.age}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="form-control"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Color / Markings</label>
              <input
                type="text"
                name="color"
                placeholder="e.g. Golden Brown, Black & White"
                value={formData.color}
                onChange={handleChange}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Size Category</label>
              <select
                name="size"
                value={formData.size}
                onChange={handleChange}
                className="form-control"
              >
                <option value="Small">Small (under 10 kg)</option>
                <option value="Medium">Medium (10 - 25 kg)</option>
                <option value="Large">Large (25+ kg)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Weight</label>
              <input
                type="text"
                name="weight"
                placeholder="e.g. 8 kg, 15 kg"
                value={formData.weight}
                onChange={handleChange}
                className="form-control"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: HEALTH INFORMATION */}
        <div className="form-card card shadow-sm p-4 mb-4">
          <div className="form-section-header d-flex align-center gap-2 mb-3 pb-2 border-bottom">
            <div className="form-section-icon bg-green-soft text-success p-2 rounded">
              <Activity size={18} />
            </div>
            <div>
              <h3 className="h5 font-weight-bold mb-0">2. Health &amp; Medical Information</h3>
              <p className="text-muted font-size-xs mb-0">Veterinary verification and sterilization status</p>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Vaccination Status</label>
              <select
                name="vaccinationStatus"
                value={formData.vaccinationStatus}
                onChange={handleChange}
                className="form-control"
              >
                <option value="Fully Vaccinated">Fully Vaccinated</option>
                <option value="Partially Vaccinated">Partially Vaccinated (First Dose Done)</option>
                <option value="Due Soon">Vaccination Due Soon</option>
                <option value="Not Vaccinated">Not Vaccinated</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Sterilization / Neutered Status</label>
              <select
                name="sterilizationStatus"
                value={formData.sterilizationStatus}
                onChange={handleChange}
                className="form-control"
              >
                <option value="Yes">Yes (Spayed / Neutered)</option>
                <option value="No">No (Not Yet Neutered)</option>
                <option value="Too Young">Too Young (Scheduled Later)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">General Health Condition</label>
              <input
                type="text"
                name="healthStatus"
                placeholder="e.g. Healthy, Active, Dewormed"
                value={formData.healthStatus}
                onChange={handleChange}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Special Needs or Medical Notes</label>
              <input
                type="text"
                name="specialNeeds"
                placeholder="e.g. None, Needs daily eye drops, Three-legged"
                value={formData.specialNeeds}
                onChange={handleChange}
                className="form-control"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: BEHAVIOUR & TEMPERAMENT */}
        <div className="form-card card shadow-sm p-4 mb-4">
          <div className="form-section-header d-flex align-center gap-2 mb-3 pb-2 border-bottom">
            <div className="form-section-icon bg-amber-soft text-warning p-2 rounded">
              <Smile size={18} />
            </div>
            <div>
              <h3 className="h5 font-weight-bold mb-0">3. Behavioral Profile</h3>
              <p className="text-muted font-size-xs mb-0">Help adopters find the right temperament match</p>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Temperament</label>
              <input
                type="text"
                name="temperament"
                placeholder="e.g. Gentle, Highly Affectionate, Calm, Energetic"
                value={formData.temperament}
                onChange={handleChange}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Energy Level</label>
              <select
                name="energyLevel"
                value={formData.energyLevel}
                onChange={handleChange}
                className="form-control"
              >
                <option value="Low">Low (Couch potato, relaxed)</option>
                <option value="Moderate">Moderate (Daily walks, balanced)</option>
                <option value="High">High (Active, loves running/play)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Good with Children?</label>
              <select
                name="goodWithChildren"
                value={formData.goodWithChildren}
                onChange={handleChange}
                className="form-control"
              >
                <option value="Yes">Yes (Loving &amp; patient)</option>
                <option value="No">No (Prefers adult-only home)</option>
                <option value="Unknown">Not Tested Yet</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Good with Other Pets?</label>
              <select
                name="goodWithOtherPets"
                value={formData.goodWithOtherPets}
                onChange={handleChange}
                className="form-control"
              >
                <option value="Yes">Yes (Friendly with dogs and cats)</option>
                <option value="Dogs Only">Dogs Only</option>
                <option value="Cats Only">Cats Only</option>
                <option value="No">No (Prefers to be the only pet)</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 4: ADOPTION INFORMATION */}
        <div className="form-card card shadow-sm p-4 mb-4">
          <div className="form-section-header d-flex align-center gap-2 mb-3 pb-2 border-bottom">
            <div className="form-section-icon bg-indigo-soft text-indigo p-2 rounded">
              <Heart size={18} />
            </div>
            <div>
              <h3 className="h5 font-weight-bold mb-0">4. Adoption Details &amp; Bio</h3>
              <p className="text-muted font-size-xs mb-0">Story and geographical location</p>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Initial Availability Status</label>
              <select
                name="adoptionStatus"
                value={formData.adoptionStatus}
                onChange={handleChange}
                className="form-control"
              >
                <option value="Available">Available (Open for Applications)</option>
                <option value="Pending">Pending (Under Initial Quarantine / Prep)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Shelter District (Tamil Nadu)</label>
              <select
                name="district"
                value={formData.district}
                onChange={handleChange}
                className="form-control"
              >
                {TAMILNADU_DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="form-group col-span-2">
              <label className="form-label">Location / Area Name</label>
              <input
                type="text"
                name="location"
                placeholder="e.g. Anna Nagar, Chennai"
                value={formData.location}
                onChange={handleChange}
                className="form-control"
              />
            </div>

            <div className="form-group col-span-2">
              <label className="form-label">Pet Description &amp; Background Story</label>
              <textarea
                name="description"
                rows={4}
                placeholder="Tell potential adopters about this pet's rescue story, quirks, habits, favorite games, and ideal home environment..."
                value={formData.description}
                onChange={handleChange}
                className="form-control"
              />
            </div>
          </div>
        </div>

        {/* SECTION 5: PHOTOS */}
        <div className="form-card card shadow-sm p-4 mb-4">
          <div className="form-section-header d-flex align-center gap-2 mb-3 pb-2 border-bottom">
            <div className="form-section-icon bg-teal-soft text-teal p-2 rounded">
              <ImageIcon size={18} />
            </div>
            <div>
              <h3 className="h5 font-weight-bold mb-0">5. Pet Photos</h3>
              <p className="text-muted font-size-xs mb-0">High quality photos increase adoption inquiries by 300%</p>
            </div>
          </div>

          <div className="photo-input-group mb-3">
            <label className="form-label">Add Photo Image URL</label>
            <div className="d-flex gap-2">
              <input
                type="url"
                placeholder="Paste direct image URL (https://...)"
                value={formData.imageUrlInput}
                onChange={(e) => setFormData(prev => ({ ...prev, imageUrlInput: e.target.value }))}
                className="form-control"
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="btn btn-outline btn-sm d-flex align-center gap-1 flex-shrink-0"
              >
                <PlusCircle size={15} />
                <span>Add Photo</span>
              </button>
            </div>
            <span className="text-muted font-size-xs mt-1 d-block">
              Paste image link and click "Add Photo". You can add multiple photos.
            </span>
          </div>

          {/* Photo Previews */}
          {formData.images.length > 0 ? (
            <div className="photo-preview-grid">
              {formData.images.map((url, idx) => (
                <div key={idx} className="photo-preview-item">
                  <img src={url} alt={`Preview ${idx + 1}`} className="photo-preview-img" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="photo-remove-btn"
                    title="Remove image"
                  >
                    <X size={14} />
                  </button>
                  {idx === 0 && <span className="photo-primary-badge">Cover Photo</span>}
                </div>
              ))}
            </div>
          ) : (
            <div className="photo-empty-dropzone p-4 text-center border rounded bg-light">
              <ImageIcon size={32} className="text-muted mb-2 mx-auto" />
              <p className="font-size-sm text-muted mb-0">
                No custom photos added yet. A verified default photo will be used if none provided.
              </p>
            </div>
          )}
        </div>

        {/* FORM ACTIONS */}
        <div className="form-actions-card card shadow-sm p-4 d-flex justify-between align-center flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate('/shelter/pets')}
            className="btn btn-outline"
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="btn btn-primary d-flex align-center gap-2"
            disabled={loading}
          >
            <CheckCircle2 size={18} />
            <span>{loading ? 'Publishing Pet Listing...' : 'Publish Pet Listing'}</span>
          </button>
        </div>
      </form>
    </ShelterLayout>
  );
};

export default AddPet;
