import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { petAPI, favoriteAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PetCard from '../components/PetCard';
import FilterPanel from '../components/FilterPanel';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { Search, PawPrint, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

const PetListing = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [pets, setPets] = useState([]);
  const [userFavorites, setUserFavorites] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    species: searchParams.get('species') || '',
    breed: searchParams.get('breed') || '',
    gender: searchParams.get('gender') || '',
    age: searchParams.get('age') || '',
    size: searchParams.get('size') || '',
    district: searchParams.get('district') || '',
    city: searchParams.get('city') || '',
    vaccination: searchParams.get('vaccination') || '',
    sterilization: searchParams.get('sterilization') || '',
    shelter: searchParams.get('shelter') || '',
    sortBy: searchParams.get('sortBy') || 'newest',
    adoptionStatus: searchParams.get('adoptionStatus') || 'Available'
  });

  useEffect(() => {
    fetchPets(1);
  }, [searchParams]);

  const fetchPets = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        limit: 12,
        search: searchParams.get('search') || '',
        species: searchParams.get('species') || '',
        breed: searchParams.get('breed') || '',
        gender: searchParams.get('gender') || '',
        age: searchParams.get('age') || '',
        size: searchParams.get('size') || '',
        district: searchParams.get('district') || '',
        city: searchParams.get('city') || '',
        vaccination: searchParams.get('vaccination') || '',
        sterilization: searchParams.get('sterilization') || '',
        shelter: searchParams.get('shelter') || '',
        sortBy: searchParams.get('sortBy') || 'newest',
        userDistrict: user?.district || '',
        adoptionStatus: searchParams.get('adoptionStatus') || 'Available'
      };

      const [petsRes, favRes] = await Promise.all([
        petAPI.getAll(params),
        user ? favoriteAPI.getMyFavorites() : Promise.resolve({ success: false })
      ]);

      if (petsRes.success) {
        let petData = petsRes.data || [];

        // Apply in-memory sort if needed
        const sortType = params.sortBy;
        if (sortType === 'age') {
          petData.sort((a, b) => {
            const ageA = parseFloat(a.age) || 0;
            const ageB = parseFloat(b.age) || 0;
            return ageA - ageB;
          });
        } else if (sortType === 'recommended') {
          // Put fully vaccinated and sterilized pets first
          petData.sort((a, b) => {
            const scoreA = (a.vaccinationStatus?.includes('Vaccinated') ? 2 : 0) + (a.neuteredStatus === 'Yes' ? 1 : 0);
            const scoreB = (b.vaccinationStatus?.includes('Vaccinated') ? 2 : 0) + (b.neuteredStatus === 'Yes' ? 1 : 0);
            return scoreB - scoreA;
          });
        }

        setPets(petData);
        setPagination({
          page: petsRes.pagination?.page || 1,
          totalPages: petsRes.pagination?.totalPages || 1,
          total: petsRes.pagination?.total || petData.length
        });
      } else {
        setError(petsRes.message || 'Failed to load pets');
      }

      if (favRes.success && favRes.data) {
        setUserFavorites(new Set(favRes.data.map((f) => f._id?.toString())));
      }
    } catch (err) {
      setError(err.message || 'Error fetching pet catalog');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    const query = {};
    Object.keys(filters).forEach((key) => {
      if (filters[key]) query[key] = filters[key];
    });
    setSearchParams(query);
    setMobileFilterOpen(false);
  };

  const handleResetFilters = () => {
    const resetState = {
      search: '',
      species: '',
      breed: '',
      gender: '',
      age: '',
      size: '',
      district: '',
      city: '',
      vaccination: '',
      sterilization: '',
      shelter: '',
      sortBy: 'newest',
      adoptionStatus: 'Available'
    };
    setFilters(resetState);
    setSearchParams({ adoptionStatus: 'Available', sortBy: 'newest' });
    setMobileFilterOpen(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    handleApplyFilters();
  };

  const handleSortChange = (newSort) => {
    handleFilterChange('sortBy', newSort);
    const updated = { ...filters, sortBy: newSort };
    const query = {};
    Object.keys(updated).forEach((key) => {
      if (updated[key]) query[key] = updated[key];
    });
    setSearchParams(query);
  };

  const handleFavoriteToggle = (petId, isFav) => {
    setUserFavorites((prev) => {
      const updated = new Set(prev);
      if (isFav) updated.add(petId.toString());
      else updated.delete(petId.toString());
      return updated;
    });
  };

  return (
    <div className="paw-listing-page section-padding">
      <div className="container">
        {/* Page Header with Search */}
        <div className="listing-header-banner card p-4 mb-4">
          <div className="d-flex justify-between align-center flex-wrap gap-3">
            <div>
              <span className="badge-pill mb-1">Adoptable Companions</span>
              <h1 className="mb-1">Find Your Companion</h1>
              <p className="text-muted mb-0">
                Browse verified rescued pets from trusted shelters across Tamil Nadu.
              </p>
            </div>

            {/* Section 14 Search Bar */}
            <form onSubmit={handleSearchSubmit} className="listing-search-form d-flex gap-2">
              <div className="input-with-icon flex-1">
                <Search size={18} className="input-icon" />
                <input
                  type="text"
                  placeholder="Search by pet name or breed..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="paw-input"
                />
              </div>
              <button type="submit" className="btn btn-primary">
                Search
              </button>
            </form>
          </div>
        </div>

        {/* Sort & Mobile Filter Toggle Toolbar */}
        <div className="d-flex justify-between align-center flex-wrap gap-3 mb-4">
          <div className="d-flex align-center gap-2">
            <button
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="btn btn-outline btn-sm mobile-filter-btn"
            >
              <SlidersHorizontal size={16} />
              <span>Filters</span>
            </button>
            <span className="text-muted font-size-sm">
              Showing <strong>{pets.length}</strong> {pets.length === 1 ? 'pet' : 'pets'} available
            </span>
          </div>

          {/* Section 14 Sort Options */}
          <div className="d-flex align-center gap-2">
            <ArrowUpDown size={15} className="text-muted" />
            <label className="text-muted font-size-sm">Sort By:</label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="paw-select font-size-sm"
            >
              <option value="nearest">Nearest (My District First)</option>
              <option value="newest">Newest</option>
              <option value="age">Age</option>
              <option value="recommended">Recommended</option>
            </select>
          </div>
        </div>

        {/* Main Grid Layout: Left Sidebar Filter + Right Pet Grid */}
        <div className="listing-main-layout">
          <aside className={`listing-filter-sidebar ${mobileFilterOpen ? 'mobile-open' : ''}`}>
            <FilterPanel
              filters={filters}
              onChange={handleFilterChange}
              onApply={handleApplyFilters}
              onReset={handleResetFilters}
            />
          </aside>

          <main className="listing-results-main">
            {loading ? (
              <LoadingSpinner message="Searching verified pets matching your criteria..." />
            ) : error ? (
              <ErrorMessage message={error} />
            ) : pets.length === 0 ? (
              /* Section 14 Empty State */
              <div className="card empty-state-box text-center p-5">
                <div className="empty-icon-wrap mb-3">
                  <PawPrint size={52} className="text-teal" />
                </div>
                <h2>No pets found matching your preferences.</h2>
                <p className="text-muted max-w-md mx-auto mb-4">
                  We couldn't find any pets with the exact filters selected. Try clearing or expanding your search criteria or district filter.
                </p>
                <button onClick={handleResetFilters} className="btn btn-primary">
                  Reset All Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-3 gap-4">
                  {pets.map((pet) => (
                    <PetCard
                      key={pet._id}
                      pet={pet}
                      isFavorited={userFavorites.has(pet._id?.toString())}
                      onFavoriteToggle={handleFavoriteToggle}
                    />
                  ))}
                </div>

                {pagination.totalPages > 1 && (
                  <div className="mt-5">
                    <Pagination
                      currentPage={pagination.page}
                      totalPages={pagination.totalPages}
                      onPageChange={(page) => fetchPets(page)}
                    />
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default PetListing;
