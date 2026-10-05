import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { petAPI, favoriteAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PetCard from '../components/PetCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import {
  PawPrint, Search, Sparkles, MapPin, Heart, ShieldCheck,
  ArrowRight, Check, Compass, CheckCircle2, AlertTriangle,
  FileCheck, Users, Info
} from 'lucide-react';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [nearbyPets, setNearbyPets] = useState([]);
  const [allPets, setAllPets] = useState([]);
  const [featuredPet, setFeaturedPet] = useState(null);
  const [userFavorites, setUserFavorites] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState(user?.district || user?.city || '');

  const userDistrict = user?.district || user?.city || '';

  useEffect(() => {
    fetchHomeData();
  }, [user]);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch pets with location relevance if user has a registered district
      const params = {
        limit: 16,
        adoptionStatus: 'Available'
      };
      if (userDistrict) {
        params.userDistrict = userDistrict;
      }

      const [petsRes, favRes] = await Promise.all([
        petAPI.getAll(params),
        user ? favoriteAPI.getMyFavorites() : Promise.resolve({ success: false })
      ]);

      if (petsRes.success) {
        const petsList = petsRes.data || [];
        setAllPets(petsList);

        // Pick dynamic featured pet for hero right column
        if (petsList.length > 0) {
          // Look for pet with photo
          const withPhoto = petsList.find((p) => p.images && p.images.length > 0 && p.images[0]) || petsList[0];
          setFeaturedPet(withPhoto);
        }

        // Determine Pets Near You
        if (petsRes.nearbyPets && petsRes.nearbyPets.length > 0) {
          setNearbyPets(petsRes.nearbyPets);
        } else if (userDistrict) {
          const filtered = petsList.filter((p) => {
            const petDist = (p.district || p.location || p.city || '').toLowerCase();
            const uDist = userDistrict.toLowerCase();
            return petDist.includes(uDist) || uDist.includes(petDist);
          });
          // If filtered pets exist, show them; otherwise fallback to the most recent available pets
          setNearbyPets(filtered.length > 0 ? filtered : petsList.slice(0, 4));
        } else {
          // If no specific district, display first 4 available pets
          setNearbyPets(petsList.slice(0, 4));
        }
      } else {
        setError(petsRes.message || 'Failed to retrieve available pets');
      }

      if (favRes.success && favRes.data) {
        setUserFavorites(new Set(favRes.data.map((f) => (f._id || f.petId || f).toString())));
      }
    } catch (err) {
      setError(err.message || 'Error loading pet listings');
    } finally {
      setLoading(false);
    }
  };

  const handleHeroSearch = (e) => {
    e.preventDefault();
    const queryParams = new URLSearchParams();
    if (searchQuery.trim()) {
      queryParams.set('search', searchQuery.trim());
    }
    if (locationQuery.trim()) {
      queryParams.set('district', locationQuery.trim());
    }
    const queryString = queryParams.toString();
    navigate(queryString ? `/pets?${queryString}` : '/pets');
  };

  const handleFavoriteToggle = (petId, isFav) => {
    setUserFavorites((prev) => {
      const updated = new Set(prev);
      if (isFav) updated.add(petId.toString());
      else updated.delete(petId.toString());
      return updated;
    });
  };

  // Featured Pet data fallback
  const heroPetName = featuredPet?.petName || 'Buddy';
  const heroPetBreed = featuredPet?.breed || 'Golden Retriever';
  const heroPetAge = featuredPet?.age || '2 years old';
  const heroPetSpecies = featuredPet?.species || 'Dog';
  const heroPetEmoji = heroPetSpecies.toLowerCase() === 'cat' ? '🐱' : '🐶';
  const heroPetImage = (featuredPet?.images && featuredPet.images[0])
    ? featuredPet.images[0]
    : 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=900&q=85';

  return (
    <div className="paw-home-root">
      {/* 1. HERO SECTION (TWO-COLUMN) */}
      <section className="paw-hero-two-col">
        <div className="container paw-hero-wrapper">
          {/* LEFT: Heading, Badge, Copy, Buttons, Trust row */}
          <div className="paw-hero-left">
            <div className="paw-hero-badge">
              <span className="paw-badge-bullet">●</span>
              <span>Find. Adopt. Love.</span>
            </div>

            <h1 className="paw-hero-headline">
              Give a Loving Home<br />
              to a Loving Soul.
            </h1>

            <p className="paw-hero-subtitle">
              Every pet deserves a safe place to call home. Discover pets waiting for their forever family.
            </p>

            <div className="paw-hero-btn-group">
              <Link to="/pets" className="btn btn-primary btn-lg">
                <PawPrint size={19} />
                <span>Find Your Companion</span>
              </Link>
              <Link to="/pets" className="btn btn-outline btn-lg paw-hero-explore-btn">
                <span>Explore Pets</span>
                <ArrowRight size={17} />
              </Link>
            </div>

            {/* Small trust/info row */}
            <div className="paw-hero-trust-row">
              <div className="paw-trust-item">
                <Check size={16} className="paw-trust-check" />
                <span>Verified Shelters</span>
              </div>
              <div className="paw-trust-item">
                <Check size={16} className="paw-trust-check" />
                <span>Loving Pets</span>
              </div>
              <div className="paw-trust-item">
                <Check size={16} className="paw-trust-check" />
                <span>Easy Adoption</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Modern Image Composition with Floating Card */}
          <div className="paw-hero-right">
            <div className="paw-hero-art-container">
              {/* Soft decorative backdrop shape */}
              <div className="paw-hero-shape-backdrop" />

              {/* Large rounded image */}
              <div className="paw-hero-image-card shadow-lg">
                <img
                  src={heroPetImage}
                  alt={heroPetName}
                  className="paw-hero-main-photo"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=900&q=85';
                  }}
                />
              </div>

              {/* Floating Pet Card dynamically using actual pet from MongoDB */}
              <div className="paw-hero-floating-card shadow-md">
                <div className="paw-floating-status-row">
                  <span className="paw-floating-pill">Looking for a home</span>
                </div>
                <div className="paw-floating-pet-info">
                  <div className="paw-floating-pet-title">
                    <span className="paw-floating-emoji">{heroPetEmoji}</span>
                    <strong>{heroPetName}</strong>
                  </div>
                  <div className="paw-floating-pet-meta text-muted">
                    <span>{heroPetBreed}</span>
                    <span className="paw-dot-separator">•</span>
                    <span>{heroPetAge}</span>
                  </div>
                </div>
                {featuredPet?._id && (
                  <Link to={`/pets/${featuredPet._id}`} className="paw-floating-link">
                    Meet {heroPetName} →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2. HERO LOCATION / SEARCH CARD (Overlapping or below hero) */}
        <div className="container paw-location-search-wrapper">
          <div className="paw-search-card shadow-md">
            <form onSubmit={handleHeroSearch} className="paw-search-form">
              <div className="paw-search-location-chip">
                <MapPin size={18} className="text-teal" />
                <div className="paw-location-meta">
                  <span className="paw-location-label">Your Location</span>
                  <input
                    type="text"
                    placeholder="Enter City or District"
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                    className="paw-location-inline-input"
                  />
                </div>
              </div>

              <div className="paw-search-divider" />

              <div className="paw-search-input-group">
                <Search size={19} className="text-muted paw-search-icon" />
                <input
                  type="text"
                  placeholder="Search pets by city, district or breed..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="paw-search-main-input"
                />
              </div>

              <button type="submit" className="btn btn-primary paw-search-submit-btn">
                <Search size={16} />
                <span>Search</span>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* 3. PETS NEAR YOU */}
      <section className="paw-section paw-pets-near-section">
        <div className="container">
          <div className="paw-section-header">
            <div>
              <div className="paw-section-title-wrap">
                <MapPin size={24} className="text-teal" />
                <h2 className="paw-section-title">Pets Near You</h2>
              </div>
              <p className="paw-section-subtitle">
                {userDistrict ? (
                  <>Meet pets looking for their forever homes in and around <strong>{userDistrict}</strong>.</>
                ) : (
                  <>Meet pets looking for their forever homes.</>
                )}
              </p>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner message="Finding loving pets near you..." />
          ) : error ? (
            <ErrorMessage message={error} />
          ) : (
            <>
              {nearbyPets.length > 0 ? (
                <div className="paw-pets-grid-4">
                  {nearbyPets.slice(0, 4).map((pet) => (
                    <PetCard
                      key={pet._id}
                      pet={pet}
                      isFavorited={userFavorites.has(pet._id?.toString())}
                      onFavoriteToggle={handleFavoriteToggle}
                    />
                  ))}
                </div>
              ) : (
                <div className="paw-empty-state-card text-center p-5">
                  <PawPrint size={40} className="text-teal mb-3" />
                  <h3>No pets are currently available.</h3>
                  <p className="text-muted max-w-md mx-auto mb-4">
                    Check back soon or explore companions across all partner shelters across the state.
                  </p>
                  <Link to="/pets" className="btn btn-primary">
                    Browse All Pets
                  </Link>
                </div>
              )}

              {/* View All Pets button */}
              <div className="paw-view-all-row text-center mt-5">
                <Link to="/pets" className="btn btn-outline btn-lg paw-view-all-btn">
                  <span>View All Pets</span>
                  <ArrowRight size={18} />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* 4. SMART MATCH SECTION */}
      <section className="paw-section paw-smart-match-section">
        <div className="container">
          <div className="paw-smart-match-card shadow-sm">
            <div className="paw-smart-match-grid">
              <div className="paw-smart-match-content">
                <div className="paw-section-tag">
                  <Sparkles size={16} className="text-amber" />
                  <span>Rule-Based Lifestyle Match</span>
                </div>
                <h2 className="paw-smart-match-heading">
                  Not Sure Which Pet Is Right for You?
                </h2>
                <p className="paw-smart-match-desc">
                  Tell us what you're looking for and discover pets that match your lifestyle.
                  Our transparent rule-based scoring assesses home environment, family members, time commitment, and pet energy levels.
                </p>
                <div className="paw-smart-match-features mb-4">
                  <div className="paw-sm-pill">✓ Compatibility score calculation</div>
                  <div className="paw-sm-pill">✓ Good with kids &amp; other pets check</div>
                  <div className="paw-sm-pill">✓ Space &amp; exercise alignment</div>
                </div>
                <Link to="/smart-match" className="btn btn-primary btn-lg">
                  <Sparkles size={18} />
                  <span>Find My Match</span>
                </Link>
              </div>

              <div className="paw-smart-match-visual">
                <div className="paw-match-preview-card shadow-md">
                  <div className="paw-match-header-row">
                    <span className="paw-match-score-badge">94% Match</span>
                    <span className="text-muted font-size-xs">Compatibility Score</span>
                  </div>
                  <div className="paw-match-checklist">
                    <div className="paw-match-check-item">
                      <CheckCircle2 size={16} className="text-teal" />
                      <span>Preferred pet species and size</span>
                    </div>
                    <div className="paw-match-check-item">
                      <CheckCircle2 size={16} className="text-teal" />
                      <span>Friendly with children &amp; indoors</span>
                    </div>
                    <div className="paw-match-check-item">
                      <CheckCircle2 size={16} className="text-teal" />
                      <span>Activity level aligns with your schedule</span>
                    </div>
                    <div className="paw-match-check-item">
                      <CheckCircle2 size={16} className="text-teal" />
                      <span>Partner shelter within travel range</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. HOW PAWHOMES WORKS */}
      <section className="paw-section paw-how-it-works-section">
        <div className="container">
          <div className="text-center max-w-md mx-auto mb-5">
            <span className="paw-sub-badge">Simple 3 Steps</span>
            <h2 className="paw-section-title">How PawHomes Works</h2>
            <p className="paw-section-subtitle">
              From finding your soul pet to bringing them home safely.
            </p>
          </div>

          <div className="paw-how-grid">
            {/* Step 01 */}
            <div className="paw-how-card">
              <div className="paw-how-step-num">01</div>
              <h3 className="paw-how-card-title">Discover</h3>
              <p className="paw-how-card-desc">
                Browse pets from verified shelters.
              </p>
            </div>

            {/* Step 02 */}
            <div className="paw-how-card">
              <div className="paw-how-step-num">02</div>
              <h3 className="paw-how-card-title">Connect</h3>
              <p className="paw-how-card-desc">
                Learn about their personality and submit an adoption request.
              </p>
            </div>

            {/* Step 03 */}
            <div className="paw-how-card">
              <div className="paw-how-step-num">03</div>
              <h3 className="paw-how-card-title">Adopt</h3>
              <p className="paw-how-card-desc">
                Welcome your new companion home.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. RESCUE SECTION */}
      <section className="paw-section paw-rescue-banner-section">
        <div className="container">
          <div className="paw-rescue-banner-card shadow-sm">
            <div className="paw-rescue-banner-content">
              <div className="paw-rescue-alert-tag">
                <AlertTriangle size={18} />
                <span>Animal Welfare &amp; Rescue</span>
              </div>
              <h2 className="paw-rescue-banner-title">
                Found a Pet That Needs Help?
              </h2>
              <p className="paw-rescue-banner-desc">
                Report a stray, injured, or abandoned pet and help connect them with people who care.
                Our registered shelter partners monitor incoming alerts and dispatch assistance.
              </p>
              <Link to="/rescue" className="btn btn-rescue btn-lg">
                <AlertTriangle size={18} />
                <span>Report a Pet</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 7. TRUST SECTION */}
      <section className="paw-section paw-trust-section">
        <div className="container">
          <div className="text-center max-w-md mx-auto mb-5">
            <span className="paw-sub-badge">Safe &amp; Transparent</span>
            <h2 className="paw-section-title">Why Choose PawHomes?</h2>
            <p className="paw-section-subtitle">
              We stand for ethical adoptions, transparent medical records, and verified care.
            </p>
          </div>

          <div className="paw-trust-grid">
            <div className="paw-trust-card shadow-sm">
              <div className="paw-trust-icon-box bg-teal-light text-teal">
                <ShieldCheck size={26} />
              </div>
              <h3 className="paw-trust-card-title">Verified Shelters</h3>
              <p className="paw-trust-card-desc">
                Every shelter is vetted to ensure animals receive ethical treatment and safe shelter conditions.
              </p>
            </div>

            <div className="paw-trust-card shadow-sm">
              <div className="paw-trust-icon-box bg-sage-light text-primary">
                <PawPrint size={26} />
              </div>
              <h3 className="paw-trust-card-title">Real Pet Profiles</h3>
              <p className="paw-trust-card-desc">
                Accurate health histories, vaccination records, temperament notes, and actual photographs.
              </p>
            </div>

            <div className="paw-trust-card shadow-sm">
              <div className="paw-trust-icon-box bg-amber-light text-amber">
                <FileCheck size={26} />
              </div>
              <h3 className="paw-trust-card-title">Simple Adoption Process</h3>
              <p className="paw-trust-card-desc">
                Structured application steps with real-time status updates from submission to homecoming.
              </p>
            </div>

            <div className="paw-trust-card shadow-sm">
              <div className="paw-trust-icon-box bg-indigo-light text-indigo">
                <Compass size={26} />
              </div>
              <h3 className="paw-trust-card-title">Location-Based Discovery</h3>
              <p className="paw-trust-card-desc">
                Connect with nearby shelters to facilitate safe in-person visits and seamless adoption handoffs.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
