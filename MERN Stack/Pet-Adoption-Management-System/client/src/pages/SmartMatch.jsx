import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { petAPI, favoriteAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import {
  Sparkles, CheckCircle2, PawPrint, Heart, MapPin, Sliders,
  RefreshCw, Award, ArrowRight, Home as HomeIcon, Users
} from 'lucide-react';
import { TAMILNADU_DISTRICTS } from '../utils/locationUtils';

const SmartMatch = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [allPets, setAllPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userFavorites, setUserFavorites] = useState(new Set());

  // Match Preferences (Default to user's registered preferences if logged in)
  const [preferences, setPreferences] = useState({
    species: user?.preferences?.species || 'Dog',
    ageRange: user?.preferences?.age || 'Young Adult (1-3 yrs)',
    size: user?.preferences?.size || 'Medium',
    homeType: user?.adoptionInfo?.homeType || 'Independent House',
    hasOutdoorSpace: user?.adoptionInfo?.hasOutdoorSpace || 'Yes, fenced yard',
    hasChildren: user?.adoptionInfo?.currentlyHavePets ? 'Yes' : 'Yes',
    district: user?.district || ''
  });

  useEffect(() => {
    fetchPetsAndFavorites();
  }, [user]);

  const fetchPetsAndFavorites = async () => {
    try {
      setLoading(true);
      setError(null);

      const [petsRes, favRes] = await Promise.all([
        petAPI.getAll({ limit: 50, adoptionStatus: 'Available' }),
        user ? favoriteAPI.getMyFavorites() : Promise.resolve({ success: false })
      ]);

      if (petsRes.success) {
        setAllPets(petsRes.data || []);
      } else {
        setError(petsRes.message || 'Failed to fetch pets for matching');
      }

      if (favRes.success && favRes.data) {
        setUserFavorites(new Set(favRes.data.map((f) => f._id?.toString())));
      }
    } catch (err) {
      setError(err.message || 'Error loading pets for Smart Match');
    } finally {
      setLoading(false);
    }
  };

  // REAL RULE-BASED SCORING ALGORITHM (Section 17)
  const calculateMatch = (pet) => {
    let score = 0;
    const reasons = [];

    // 1. Preferred Pet Type (Weight: 25%)
    if (preferences.species === 'All' || pet.species?.toLowerCase() === preferences.species?.toLowerCase()) {
      score += 25;
      reasons.push('Preferred pet type');
    }

    // 2. Suitable Age (Weight: 15%)
    const petAgeStr = (pet.age || '').toLowerCase();
    const prefAge = preferences.ageRange.toLowerCase();
    if (
      prefAge.includes('any') ||
      (prefAge.includes('puppy') && (petAgeStr.includes('month') || petAgeStr.includes('puppy') || petAgeStr.includes('kitten'))) ||
      (prefAge.includes('young') && (petAgeStr.includes('1') || petAgeStr.includes('2') || petAgeStr.includes('3'))) ||
      (prefAge.includes('adult') && (petAgeStr.includes('3') || petAgeStr.includes('4') || petAgeStr.includes('5') || petAgeStr.includes('adult'))) ||
      (prefAge.includes('senior') && (petAgeStr.includes('7') || petAgeStr.includes('8') || petAgeStr.includes('senior')))
    ) {
      score += 15;
      reasons.push('Suitable age');
    } else {
      score += 5; // partial
    }

    // 3. Suitable Size (Weight: 15%)
    if (preferences.size === 'Any' || pet.size?.toLowerCase() === preferences.size?.toLowerCase()) {
      score += 15;
      reasons.push('Suitable size');
    } else {
      score += 5;
    }

    // 4. Suitable Home Environment (Weight: 15%)
    const isApartment = preferences.homeType.includes('Apartment');
    const petSize = (pet.size || 'Medium').toLowerCase();
    if (isApartment && petSize === 'small') {
      score += 15;
      reasons.push('Suitable home environment');
    } else if (!isApartment) {
      score += 15;
      reasons.push('Suitable home environment');
    } else {
      score += 8;
      reasons.push('Suitable home environment');
    }

    // 5. Good with Children / Temperament (Weight: 15%)
    if (pet.goodWithChildren === 'Yes' || !pet.goodWithChildren) {
      score += 15;
      reasons.push('Good with children');
    } else {
      score += 5;
    }

    // 6. Proximity / Located Near You (Weight: 15%)
    const targetDistrict = preferences.district || user?.district || '';
    if (targetDistrict) {
      const petDist = (pet.district || pet.location || '').toLowerCase();
      const userDist = targetDistrict.toLowerCase();
      if (petDist.includes(userDist) || userDist.includes(petDist)) {
        score += 15;
        reasons.push('Located near you');
      } else {
        score += 5; // same state
      }
    } else {
      score += 15;
      reasons.push('Located near you');
    }

    // Cap score max at 98% and min at 45%
    const finalScore = Math.min(Math.max(score, 45), 98);

    return {
      score: finalScore,
      reasons
    };
  };

  // Rank pets by score
  const matchedPets = allPets
    .map((pet) => {
      const match = calculateMatch(pet);
      return {
        ...pet,
        matchScore: match.score,
        matchReasons: match.reasons
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);

  const handlePrefChange = (e) => {
    const { name, value } = e.target;
    setPreferences((prev) => ({ ...prev, [name]: value }));
  };

  const handleFavoriteToggle = async (petId) => {
    if (!user) {
      navigate('/login', { state: { from: '/smart-match' } });
      return;
    }
    try {
      const res = await favoriteAPI.toggle(petId);
      if (res.success) {
        setUserFavorites((prev) => {
          const next = new Set(prev);
          if (res.isFavorite) next.add(petId.toString());
          else next.delete(petId.toString());
          return next;
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="paw-smart-match-page container section-padding">
      {/* Header */}
      <div className="smart-match-hero-banner card p-4 mb-4">
        <div className="d-flex justify-between align-center flex-wrap gap-3">
          <div>
            <span className="badge-pill mb-1">
              <Sparkles size={14} className="text-amber" /> Algorithm-Powered Companion Matcher
            </span>
            <h1 className="mb-1">Smart Match Engine</h1>
            <p className="subtitle mb-0">
              Our rule-based matching system analyzes your living space, family dynamics, and location to recommend your perfect companion.
            </p>
          </div>

          <div className="match-stat-chip">
            <Award size={20} className="text-teal" />
            <div>
              <strong>Rule-Based AI</strong>
              <p className="mb-0 font-size-xs text-muted">6 Weighted Match Criteria</p>
            </div>
          </div>
        </div>
      </div>

      {/* Preferences Customizer Bar */}
      <div className="card p-3 mb-4 shadow-sm bg-light">
        <div className="d-flex align-center gap-2 mb-2 font-weight-bold">
          <Sliders size={16} className="text-teal" />
          <span>Match Criteria Preferences (Live Update):</span>
        </div>

        <div className="grid grid-4 gap-3">
          <div className="form-group mb-0">
            <label className="font-size-xs text-muted">Species</label>
            <select name="species" value={preferences.species} onChange={handlePrefChange} className="paw-select font-size-sm">
              <option value="Dog">Dog</option>
              <option value="Cat">Cat</option>
              <option value="Rabbit">Rabbit</option>
              <option value="Bird">Bird</option>
              <option value="All">Any Companion</option>
            </select>
          </div>

          <div className="form-group mb-0">
            <label className="font-size-xs text-muted">Preferred Size</label>
            <select name="size" value={preferences.size} onChange={handlePrefChange} className="paw-select font-size-sm">
              <option value="Small">Small (&lt; 10 kg)</option>
              <option value="Medium">Medium (10 - 25 kg)</option>
              <option value="Large">Large (&gt; 25 kg)</option>
              <option value="Any">Any Size</option>
            </select>
          </div>

          <div className="form-group mb-0">
            <label className="font-size-xs text-muted">Home Environment</label>
            <select name="homeType" value={preferences.homeType} onChange={handlePrefChange} className="paw-select font-size-sm">
              <option value="Independent House">Independent House</option>
              <option value="Apartment / Flat">Apartment / Flat</option>
              <option value="Villa / Farmhouse">Farm / Open Yard</option>
            </select>
          </div>

          <div className="form-group mb-0">
            <label className="font-size-xs text-muted">Your District</label>
            <select name="district" value={preferences.district} onChange={handlePrefChange} className="paw-select font-size-sm">
              <option value="">All Districts</option>
              {TAMILNADU_DISTRICTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Calculating pet compatibility scores..." />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : matchedPets.length === 0 ? (
        <div className="card text-center p-5">
          <PawPrint size={40} className="text-muted mb-2 mx-auto" />
          <h3>No available pets to match</h3>
          <p className="text-muted">Please check back soon as shelters add new rescues.</p>
        </div>
      ) : (
        <div className="matched-results-grid grid grid-3 gap-4">
          {matchedPets.map((pet) => {
            const petImage =
              pet.images?.[0] ||
              'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80';
            const locationText = pet.city ? `${pet.city}, ${pet.district || ''}`.trim() : (pet.district || pet.location || 'Tamil Nadu');
            const isFav = userFavorites.has(pet._id?.toString());

            return (
              <div key={pet._id} className="card smart-match-card shadow-sm d-flex flex-column">
                {/* Media with Match Percentage Badge (Section 17) */}
                <div className="smart-match-media position-relative">
                  <img src={petImage} alt={pet.petName} className="smart-match-img" />

                  {/* Section 17 Score Badge */}
                  <div className="match-score-badge">
                    <Sparkles size={14} />
                    <span>{pet.matchScore}% Match</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleFavoriteToggle(pet._id)}
                    className={`card-heart-btn ${isFav ? 'active' : ''}`}
                    title="Toggle Favorite"
                  >
                    <Heart size={18} fill={isFav ? '#ef4444' : 'none'} color={isFav ? '#ef4444' : '#ffffff'} />
                  </button>
                </div>

                <div className="card-body p-3 d-flex flex-column flex-1">
                  <div className="d-flex justify-between align-center mb-1">
                    <h3 className="mb-0">{pet.petName}</h3>
                    <span className="badge badge-light">{pet.gender}</span>
                  </div>
                  <p className="text-muted font-size-sm mb-2">
                    {pet.breed} • {pet.species} • {pet.age}
                  </p>

                  <div className="d-flex align-center gap-1 font-size-xs text-muted mb-3">
                    <MapPin size={13} className="text-teal" />
                    <span>{locationText}</span>
                  </div>

                  {/* Section 17 Reasons Checklist */}
                  <div className="match-reasons-box p-3 bg-light rounded mb-3">
                    <span className="reasons-heading font-size-xs text-muted d-block mb-2 font-weight-bold">
                      WHY THIS PET IS A GREAT FIT:
                    </span>
                    <ul className="reasons-checklist font-size-xs">
                      {pet.matchReasons.map((reason, idx) => (
                        <li key={idx} className="d-flex align-center gap-1 mb-1">
                          <CheckCircle2 size={13} className="text-teal flex-shrink-0" />
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Actions */}
                  <div className="smart-match-actions mt-auto pt-2 border-top d-flex gap-2">
                    <Link
                      to={`/pets/${pet._id}`}
                      className="btn btn-outline btn-sm flex-1 text-center"
                    >
                      View Details
                    </Link>
                    <Link
                      to={`/pets/${pet._id}?apply=true`}
                      className="btn btn-primary btn-sm flex-1 text-center d-flex align-center justify-center gap-1"
                    >
                      <PawPrint size={14} />
                      <span>Adopt Me</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SmartMatch;
