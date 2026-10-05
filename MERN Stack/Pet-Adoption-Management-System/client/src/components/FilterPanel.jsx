import React, { useEffect, useState } from 'react';
import { shelterAPI } from '../services/api';
import { TAMILNADU_DISTRICTS } from '../utils/locationUtils';
import { Filter, RotateCcw } from 'lucide-react';

const FilterPanel = ({ filters, onChange, onApply, onReset }) => {
  const [shelters, setShelters] = useState([]);

  useEffect(() => {
    fetchShelters();
  }, []);

  const fetchShelters = async () => {
    try {
      const res = await shelterAPI.getAll();
      if (res.success && res.data) {
        setShelters(res.data);
      }
    } catch (e) {
      console.warn('Could not load shelters list for filter', e);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onChange(name, value);
  };

  return (
    <div className="card filter-panel p-4 shadow-sm">
      <div className="d-flex justify-between align-center mb-3 pb-2 border-bottom">
        <div className="d-flex align-center gap-2">
          <Filter size={18} className="text-teal" />
          <h3 className="mb-0 font-size-md">Filter Pets</h3>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="btn btn-outline btn-xs d-flex align-center gap-1"
        >
          <RotateCcw size={12} />
          <span>Reset</span>
        </button>
      </div>

      {/* Species */}
      <div className="form-group mb-3">
        <label className="filter-label">Species</label>
        <select name="species" value={filters.species || ''} onChange={handleInputChange}>
          <option value="">All Species</option>
          <option value="Dog">Dog 🐶</option>
          <option value="Cat">Cat 🐱</option>
          <option value="Rabbit">Rabbit 🐰</option>
          <option value="Bird">Bird 🦜</option>
          <option value="Other">Other 🐾</option>
        </select>
      </div>

      {/* Breed */}
      <div className="form-group mb-3">
        <label className="filter-label">Breed</label>
        <input
          type="text"
          name="breed"
          value={filters.breed || ''}
          onChange={handleInputChange}
          placeholder="e.g. Golden Retriever, Indie, Persian"
        />
      </div>

      {/* Age */}
      <div className="form-group mb-3">
        <label className="filter-label">Age</label>
        <select name="age" value={filters.age || ''} onChange={handleInputChange}>
          <option value="">All Ages</option>
          <option value="Puppy">Puppy / Kitten (&lt; 1 yr)</option>
          <option value="Young">Young Adult (1 - 3 yrs)</option>
          <option value="Adult">Adult (3 - 7 yrs)</option>
          <option value="Senior">Senior (7+ yrs)</option>
        </select>
      </div>

      {/* Gender */}
      <div className="form-group mb-3">
        <label className="filter-label">Gender</label>
        <select name="gender" value={filters.gender || ''} onChange={handleInputChange}>
          <option value="">Any Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
      </div>

      {/* Size */}
      <div className="form-group mb-3">
        <label className="filter-label">Pet Size</label>
        <select name="size" value={filters.size || ''} onChange={handleInputChange}>
          <option value="">Any Size</option>
          <option value="Small">Small (&lt; 10 kg)</option>
          <option value="Medium">Medium (10 - 25 kg)</option>
          <option value="Large">Large (&gt; 25 kg)</option>
        </select>
      </div>

      {/* District */}
      <div className="form-group mb-3">
        <label className="filter-label">District</label>
        <select name="district" value={filters.district || ''} onChange={handleInputChange}>
          <option value="">All Districts</option>
          {TAMILNADU_DISTRICTS.map((dist) => (
            <option key={dist} value={dist}>
              {dist}
            </option>
          ))}
        </select>
      </div>

      {/* City */}
      <div className="form-group mb-3">
        <label className="filter-label">City / Area</label>
        <input
          type="text"
          name="city"
          value={filters.city || ''}
          onChange={handleInputChange}
          placeholder="e.g. Madurai, Anna Nagar"
        />
      </div>

      {/* Vaccination */}
      <div className="form-group mb-3">
        <label className="filter-label">Vaccination Status</label>
        <select name="vaccination" value={filters.vaccination || ''} onChange={handleInputChange}>
          <option value="">Any</option>
          <option value="Fully Vaccinated">Fully Vaccinated</option>
          <option value="Partially Vaccinated">Partially Vaccinated</option>
          <option value="Up to date">Up to date</option>
        </select>
      </div>

      {/* Sterilization */}
      <div className="form-group mb-3">
        <label className="filter-label">Sterilization / Neutered</label>
        <select name="sterilization" value={filters.sterilization || ''} onChange={handleInputChange}>
          <option value="">Any</option>
          <option value="Yes">Sterilized (Yes)</option>
          <option value="No">Not Sterilized (No)</option>
        </select>
      </div>

      {/* Shelter */}
      {shelters.length > 0 && (
        <div className="form-group mb-3">
          <label className="filter-label">Shelter Partner</label>
          <select name="shelter" value={filters.shelter || ''} onChange={handleInputChange}>
            <option value="">All Shelters</option>
            {shelters.map((s) => (
              <option key={s._id} value={s.shelterName || s.name}>
                {s.shelterName || s.name} ({s.district || s.city})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Availability */}
      <div className="form-group mb-3">
        <label className="filter-label">Availability</label>
        <select
          name="adoptionStatus"
          value={filters.adoptionStatus || 'Available'}
          onChange={handleInputChange}
        >
          <option value="Available">Available</option>
          <option value="Adopted">Adopted</option>
          <option value="">All Listings</option>
        </select>
      </div>

      <button
        type="button"
        onClick={onApply}
        className="btn btn-primary btn-block mt-3"
      >
        Apply Filters
      </button>
    </div>
  );
};

export default FilterPanel;
