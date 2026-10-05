import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { favoriteAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { Heart, MapPin, Eye, Trash2, PawPrint, Building2 } from 'lucide-react';

const Favorites = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await favoriteAPI.getMyFavorites();
      if (res.success) {
        setPets(res.data || []);
      } else {
        setError(res.message || 'Failed to fetch favorites');
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve your favorite pets from MongoDB');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (petId) => {
    try {
      setRemovingId(petId);
      const res = await favoriteAPI.toggle(petId);
      if (res.success) {
        setPets((prev) => prev.filter((p) => p._id !== petId));
      } else {
        alert(res.message || 'Failed to remove pet from favorites');
      }
    } catch (err) {
      alert('Error removing pet from favorites');
    } finally {
      setRemovingId(null);
    }
  };

  const handleApply = (petId) => {
    navigate(`/pets/${petId}?apply=true`);
  };

  return (
    <div className="paw-favorites-page container section-padding">
      <div className="d-flex justify-between align-center flex-wrap gap-3 mb-4">
        <div>
          <span className="badge-pill mb-1">Saved Pets</span>
          <h1 className="d-flex align-center gap-2 mb-1">
            <Heart className="text-danger" size={30} fill="#ef4444" />
            <span>My Favorites</span>
          </h1>
          <p className="subtitle mb-0">
            Keep track of the pets you love and apply whenever you are ready.
          </p>
        </div>

        <Link to="/pets" className="btn btn-primary btn-sm">
          <PawPrint size={16} />
          <span>Discover More Pets</span>
        </Link>
      </div>

      {loading ? (
        <LoadingSpinner message="Fetching your favorite saved pets from MongoDB..." />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : pets.length === 0 ? (
        <div className="card text-center p-5 empty-favorites-card shadow-sm">
          <div className="empty-fav-icon mb-3">
            <Heart size={56} className="text-muted" />
          </div>
          <h3>No favorite pets saved yet</h3>
          <p className="text-muted max-w-md mx-auto mb-4">
            Browse our verified adoptable companions and click the heart button on any pet card to add them to your favorites.
          </p>
          <Link to="/pets" className="btn btn-primary">
            Browse Pet Catalog
          </Link>
        </div>
      ) : (
        <div className="grid grid-3 gap-4">
          {pets.map((pet) => {
            const petImage =
              pet.images?.[0] ||
              'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80';
            const locationText = pet.city ? `${pet.city}, ${pet.district || ''}`.trim() : (pet.district || pet.location || 'Tamil Nadu');

            return (
              <div key={pet._id} className="card favorite-pet-card shadow-sm">
                {/* Pet Image (Section 16) */}
                <div className="fav-card-image-wrap">
                  <img src={petImage} alt={pet.petName} className="fav-pet-img" />
                  <span className="fav-status-pill">{pet.adoptionStatus || 'Available'}</span>
                </div>

                <div className="card-body p-3 d-flex flex-column flex-1">
                  {/* Name & Breed (Section 16) */}
                  <h3 className="mb-1">{pet.petName}</h3>
                  <p className="text-muted font-size-sm mb-2">
                    {pet.breed} • {pet.species} • {pet.gender}
                  </p>

                  {/* Location (Section 16) */}
                  <div className="d-flex align-center gap-1 font-size-xs text-muted mb-3">
                    <MapPin size={14} className="text-teal" />
                    <span>{locationText}</span>
                  </div>

                  {/* 3 Section 16 Buttons: View, Remove, Apply */}
                  <div className="fav-card-buttons-row mt-auto pt-3 border-top d-flex gap-2">
                    <Link
                      to={`/pets/${pet._id}`}
                      className="btn btn-outline btn-sm flex-1 text-center"
                    >
                      <Eye size={14} />
                      <span>View</span>
                    </Link>

                    <button
                      type="button"
                      disabled={removingId === pet._id}
                      onClick={() => handleRemove(pet._id)}
                      className="btn btn-danger btn-sm"
                      title="Remove from favorites"
                    >
                      <Trash2 size={14} />
                      <span>Remove</span>
                    </button>

                    {pet.adoptionStatus === 'Available' ? (
                      <button
                        type="button"
                        onClick={() => handleApply(pet._id)}
                        className="btn btn-primary btn-sm flex-1"
                      >
                        <PawPrint size={14} />
                        <span>Apply</span>
                      </button>
                    ) : (
                      <button disabled className="btn btn-secondary btn-sm flex-1">
                        Adopted
                      </button>
                    )}
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

export default Favorites;
