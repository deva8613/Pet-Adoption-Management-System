import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Heart, Building2, PawPrint } from 'lucide-react';
import { favoriteAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const NEUTRAL_PET_SVG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300' fill='%23e2ece9'><rect width='400' height='300' fill='%23f4f8f5'/><path d='M200 110 C180 80, 140 80, 140 120 C140 150, 200 190, 200 190 C200 190, 260 150, 260 120 C260 80, 220 80, 200 110 Z' fill='%230f766e' opacity='0.3'/><text x='200' y='230' font-family='sans-serif' font-size='16' font-weight='bold' fill='%230f766e' text-anchor='middle'>PawHomes Pet</text></svg>";

const PetCard = ({ pet, isFavorited = false, onFavoriteToggle }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);
  const [favorited, setFavorited] = useState(isFavorited);
  const [favLoading, setFavLoading] = useState(false);

  if (!pet) return null;

  const getImageUrl = () => {
    if (imgError) return NEUTRAL_PET_SVG;
    if (!pet.images || pet.images.length === 0 || !pet.images[0]) return NEUTRAL_PET_SVG;
    return pet.images[0];
  };

  const isAdopted = pet.adoptionStatus === 'Adopted';
  const locationText = pet.city ? `${pet.city}, ${pet.district || ''}`.trim() : (pet.district || pet.location || 'Tamil Nadu');
  const shelterName = pet.shelterInfo?.shelterName || pet.shelterName || 'PawHomes Partner Shelter';

  const handleFavoriteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate('/login', { state: { from: `/pets/${pet._id}` } });
      return;
    }

    try {
      setFavLoading(true);
      const res = await favoriteAPI.toggle(pet._id);
      if (res.success) {
        setFavorited(res.isFavorite);
        if (onFavoriteToggle) onFavoriteToggle(pet._id, res.isFavorite);
      }
    } catch (err) {
      console.error('Favorite toggle error:', err);
    } finally {
      setFavLoading(false);
    }
  };

  const handleAdoptMe = (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login', { state: { from: `/pets/${pet._id}` } });
    } else {
      navigate(`/pets/${pet._id}?apply=true`);
    }
  };

  return (
    <div className={`paw-pet-card card shadow-sm ${isAdopted ? 'adopted-card' : ''}`}>
      <div className="paw-card-media">
        <img
          src={getImageUrl()}
          alt={pet.petName || 'Pet'}
          className="paw-card-img"
          onError={() => setImgError(true)}
        />
        <div className="paw-media-badges">
          <span className={`status-badge-pill ${isAdopted ? 'badge-adopted' : 'badge-available'}`}>
            {pet.adoptionStatus || 'Available'}
          </span>
          {pet.distanceKm && (
            <span className="distance-badge-pill">
              📍 {pet.distanceKm} km away
            </span>
          )}
        </div>

        {/* Favorite Icon Button on Card Image */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          disabled={favLoading}
          className={`card-heart-btn ${favorited ? 'active' : ''}`}
          aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart size={18} fill={favorited ? '#ef4444' : 'none'} color={favorited ? '#ef4444' : '#ffffff'} />
        </button>
      </div>

      <div className="paw-card-content p-3 d-flex flex-column flex-1">
        <div className="d-flex justify-between align-center mb-1">
          <h3 className="pet-title mb-0">{pet.petName}</h3>
          <span className="badge badge-light">{pet.gender || 'Male'}</span>
        </div>

        <p className="pet-subline text-muted font-size-sm mb-2">
          {pet.breed} • {pet.species}
        </p>

        <div className="pet-chips-row d-flex flex-wrap gap-1 mb-2">
          <span className="chip-tag">{pet.age}</span>
          <span className="chip-tag">{pet.size || 'Medium'}</span>
          {pet.vaccinationStatus && <span className="chip-tag text-teal">{pet.vaccinationStatus}</span>}
        </div>

        <div className="pet-shelter-info d-flex align-center gap-1 font-size-xs text-muted mb-1">
          <Building2 size={13} className="text-teal" />
          <span className="text-truncate">{shelterName}</span>
        </div>

        <div className="pet-location-info d-flex align-center gap-1 font-size-xs text-muted mb-3">
          <MapPin size={13} className="text-teal" />
          <span>{locationText}</span>
        </div>

        {/* 3 Explicit Buttons: [View Details], [❤️ Favorite], [Adopt Me] */}
        <div className="paw-card-actions-grid mt-auto pt-2 border-top">
          <div className="d-flex gap-2 mb-2">
            <Link to={`/pets/${pet._id}`} className="btn btn-outline btn-sm flex-1 text-center">
              View Details
            </Link>
            <button
              onClick={handleFavoriteClick}
              disabled={favLoading}
              className={`btn btn-outline btn-sm fav-action-btn ${favorited ? 'btn-favorited' : ''}`}
              title={favorited ? 'Favorited' : 'Add to Favorites'}
            >
              <Heart size={14} fill={favorited ? '#ef4444' : 'none'} color={favorited ? '#ef4444' : 'currentColor'} />
              <span>{favorited ? 'Saved' : 'Favorite'}</span>
            </button>
          </div>

          {!isAdopted ? (
            <button
              onClick={handleAdoptMe}
              className="btn btn-primary btn-sm btn-block d-flex align-center justify-center gap-1"
            >
              <PawPrint size={14} />
              <span>Adopt Me</span>
            </button>
          ) : (
            <button disabled className="btn btn-secondary btn-sm btn-block">
              Pet Adopted
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PetCard;
