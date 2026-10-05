import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { petAPI } from '../services/api';
import ShelterLayout from '../components/ShelterLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import {
  PawPrint,
  Plus,
  Search,
  Eye,
  Trash2,
  Edit,
  X,
  CheckCircle,
  Filter,
  Calendar,
  Layers,
  Heart,
  AlertTriangle,
  LayoutGrid,
  List,
  ChevronDown,
  RotateCcw
} from 'lucide-react';
import { TAMILNADU_DISTRICTS } from '../utils/locationUtils';

const ShelterPets = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState('All');
  const [speciesFilter, setSpeciesFilter] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Edit Pet Modal State
  const [editingPet, setEditingPet] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState(null);

  // Delete Confirmation Modal State
  const [petToDelete, setPetToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPets = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await petAPI.getMyPets();
      if (res.success) {
        setPets(res.data || []);
      } else {
        setError(res.message || 'Failed to fetch shelter pets');
      }
    } catch (e) {
      setError(e.message || 'Error fetching pets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, []);

  // Delete Pet with Confirmation
  const confirmDeletePet = async () => {
    if (!petToDelete) return;
    try {
      setDeleting(true);
      const res = await petAPI.delete(petToDelete._id);
      if (res.success) {
        setPets((prev) => prev.filter((p) => p._id !== petToDelete._id));
        setPetToDelete(null);
      } else {
        alert(res.message || 'Failed to delete pet listing');
      }
    } catch (e) {
      alert(e.message || 'Delete operation failed');
    } finally {
      setDeleting(false);
    }
  };

  // Quick Status Toggle
  const handleQuickStatusChange = async (petId, newStatus) => {
    try {
      const res = await petAPI.update(petId, { adoptionStatus: newStatus });
      if (res.success) {
        setPets((prev) =>
          prev.map((p) => (p._id === petId ? { ...p, adoptionStatus: newStatus } : p))
        );
      } else {
        alert(res.message || 'Failed to update pet availability');
      }
    } catch (err) {
      alert('Error updating status');
    }
  };

  // Submit Edit Form
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingPet) return;
    try {
      setSavingEdit(true);
      setEditError(null);
      const res = await petAPI.update(editingPet._id, editingPet);
      if (res.success) {
        setPets((prev) =>
          prev.map((p) => (p._id === editingPet._id ? { ...p, ...res.data } : p))
        );
        setEditingPet(null);
      } else {
        setEditError(res.message || 'Update failed');
      }
    } catch (err) {
      setEditError('Error saving pet details');
    } finally {
      setSavingEdit(false);
    }
  };

  const filtered = pets.filter((p) => {
    const text = `${p.petName} ${p.breed} ${p.species} ${p.district || ''}`.toLowerCase();
    const matchesSearch = text.includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || p.adoptionStatus === statusFilter;
    const matchesSpecies = speciesFilter === 'All' || p.species?.toLowerCase() === speciesFilter.toLowerCase();
    return matchesSearch && matchesStatus && matchesSpecies;
  });

  const getStatusBadge = (status) => {
    const s = status || 'Available';
    if (s === 'Available') {
      return <span className="shelter-badge shelter-badge-success">Available</span>;
    }
    if (s === 'Adopted') {
      return <span className="shelter-badge shelter-badge-completed">Adopted</span>;
    }
    return <span className="shelter-badge shelter-badge-pending">{s}</span>;
  };

  return (
    <ShelterLayout
      title="Pets"
      subtitle="Manage all pets listed by your shelter."
      activePage="/shelter/pets"
      actions={
        <Link to="/shelter/add-pet" className="btn btn-primary btn-sm d-flex align-center gap-1">
          <Plus size={16} />
          <span>Add Pet</span>
        </Link>
      }
    >
      {/* Modern Search & Filter Toolbar */}
      <div className="shelter-toolbar-row mb-4">
        {/* Search Field */}
        <div className="shelter-search-field-wrap">
          <Search size={18} className="shelter-search-field-icon" />
          <input
            type="text"
            placeholder="Search pets by name, breed, species..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="shelter-search-field-input"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="shelter-search-clear-btn"
              title="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filters & Controls */}
        <div className="shelter-toolbar-controls">
          {/* Species Filter */}
          <div className="shelter-filter-control-wrap">
            <div className="shelter-select-wrap">
              <select
                value={speciesFilter}
                onChange={(e) => setSpeciesFilter(e.target.value)}
                className={`shelter-filter-select ${speciesFilter !== 'All' ? 'is-active' : ''}`}
                aria-label="Filter by species"
              >
                <option value="All">All Species</option>
                <option value="Dog">Dogs</option>
                <option value="Cat">Cats</option>
                <option value="Bird">Birds</option>
                <option value="Other">Other</option>
              </select>
              <ChevronDown size={14} className="shelter-select-chevron" />
            </div>
          </div>

          {/* Status Filter */}
          <div className="shelter-filter-control-wrap">
            <div className="shelter-select-wrap">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`shelter-filter-select ${statusFilter !== 'All' ? 'is-active' : ''}`}
                aria-label="Filter by status"
              >
                <option value="All">All Statuses</option>
                <option value="Available">Available</option>
                <option value="Adopted">Adopted</option>
                <option value="Pending">Pending</option>
              </select>
              <ChevronDown size={14} className="shelter-select-chevron" />
            </div>
          </div>

          {/* View Toggle */}
          <div className="shelter-view-toggle-wrap">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`shelter-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              title="Grid Cards View"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`shelter-view-btn ${viewMode === 'table' ? 'active' : ''}`}
              title="Table View"
            >
              <List size={15} />
            </button>
          </div>

          {/* Direct Add Pet action */}
          <Link to="/shelter/add-pet" className="shelter-btn-action-primary">
            <Plus size={16} />
            <span>Add Pet</span>
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="card p-5 text-center shadow-sm">
          <LoadingSpinner message="Loading shelter pets..." />
        </div>
      ) : error ? (
        <div className="card p-4 shadow-sm">
          <ErrorMessage message={error} />
          <button onClick={fetchPets} className="btn btn-outline btn-sm mt-3">
            Retry
          </button>
        </div>
      ) : pets.length === 0 ? (
        /* Empty Inventory State */
        <div className="card p-5 text-center shadow-sm shelter-empty-box">
          <div className="shelter-empty-icon mb-3">
            <PawPrint size={48} className="text-muted" />
          </div>
          <h3 className="h4 font-weight-bold mb-1">No pets added yet.</h3>
          <p className="text-muted font-size-sm mb-4">
            Add your first pet to start finding them a loving home.
          </p>
          <Link to="/shelter/add-pet" className="btn btn-primary btn-sm d-inline-flex align-center gap-2">
            <Plus size={16} />
            <span>Add First Pet</span>
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        /* Empty Search Results State */
        <div className="shelter-empty-search-state">
          <div className="empty-search-icon-wrap">
            <Search size={32} />
          </div>
          <h3 className="empty-search-title">No matching pets found</h3>
          <p className="empty-search-subtitle">
            Try searching with another name, breed, or keyword, or reset active filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setStatusFilter('All');
              setSpeciesFilter('All');
            }}
            className="shelter-btn-clear-filters"
          >
            <RotateCcw size={14} />
            <span>Reset Search &amp; Filters</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID CARDS VIEW */
        <div className="shelter-pets-grid mb-4">
          {filtered.map((pet) => {
            const isAvailable = (pet.adoptionStatus || 'Available') === 'Available';
            const imgUrl = pet.images?.[0] || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80';

            return (
              <div key={pet._id} className="shelter-pet-card card shadow-sm">
                <div className="shelter-pet-img-wrap">
                  <img src={imgUrl} alt={pet.petName} className="shelter-pet-img" />
                  <div className="shelter-pet-status-floating">
                    {getStatusBadge(pet.adoptionStatus)}
                  </div>
                  <div className="shelter-pet-gender-pill">
                    {pet.gender || 'Unknown'}
                  </div>
                </div>

                <div className="shelter-pet-body p-3">
                  <div className="d-flex justify-between align-center mb-1">
                    <h3 className="shelter-pet-name text-truncate mb-0">{pet.petName}</h3>
                    <span className="font-size-xs text-muted">{pet.age}</span>
                  </div>

                  <p className="shelter-pet-subtext text-muted font-size-xs mb-2">
                    {pet.breed} · {pet.species}
                  </p>

                  <div className="shelter-pet-tags d-flex flex-wrap gap-1 mb-3">
                    <span className="mini-tag">{pet.size || 'Medium'}</span>
                    <span className="mini-tag">{pet.vaccinationStatus === 'Fully Vaccinated' ? 'Vaccinated' : (pet.vaccinationStatus || 'Health Checked')}</span>
                    {pet.neuteredStatus === 'Yes' && <span className="mini-tag">Neutered</span>}
                  </div>

                  <div className="shelter-pet-date text-muted font-size-xs mb-3 d-flex align-center gap-1">
                    <Calendar size={12} />
                    <span>Listed: {new Date(pet.createdAt).toLocaleDateString()}</span>
                  </div>

                  {/* Actions Footer */}
                  <div className="shelter-pet-footer pt-2 border-top d-flex justify-between align-center">
                    <div className="d-flex gap-1">
                      <Link
                        to={`/pets/${pet._id}`}
                        target="_blank"
                        className="btn btn-outline btn-xs d-flex align-center gap-1"
                        title="View public listing"
                      >
                        <Eye size={12} />
                        <span>View</span>
                      </Link>
                      <button
                        onClick={() => setEditingPet({ ...pet })}
                        className="btn btn-outline btn-xs d-flex align-center gap-1"
                        title="Edit pet details"
                      >
                        <Edit size={12} />
                        <span>Edit</span>
                      </button>
                    </div>

                    <button
                      onClick={() => setPetToDelete(pet)}
                      className="btn btn-link btn-xs text-danger p-1"
                      title="Delete pet listing"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="card shadow-sm p-0 mb-4 table-responsive">
          <table className="shelter-full-table">
            <thead>
              <tr>
                <th>Pet</th>
                <th>Species / Breed</th>
                <th>Age &amp; Gender</th>
                <th>Status</th>
                <th>Added Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((pet) => {
                const imgUrl = pet.images?.[0] || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=200&q=80';
                return (
                  <tr key={pet._id}>
                    <td>
                      <div className="d-flex align-center gap-3">
                        <img src={imgUrl} alt={pet.petName} className="table-pet-thumb-lg" />
                        <div>
                          <strong className="d-block font-size-sm">{pet.petName}</strong>
                          <span className="text-muted font-size-xs">{pet.district || 'Tamil Nadu'}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="d-block font-size-sm">{pet.species}</span>
                      <span className="text-muted font-size-xs">{pet.breed}</span>
                    </td>

                    <td>
                      <span className="d-block font-size-sm">{pet.age}</span>
                      <span className="text-muted font-size-xs">{pet.gender}</span>
                    </td>

                    <td>
                      {getStatusBadge(pet.adoptionStatus)}
                    </td>

                    <td>
                      <span className="font-size-xs text-muted">
                        {new Date(pet.createdAt).toLocaleDateString()}
                      </span>
                    </td>

                    <td className="text-right">
                      <div className="d-flex justify-end align-center gap-1">
                        <Link
                          to={`/pets/${pet._id}`}
                          target="_blank"
                          className="btn btn-outline btn-xs"
                          title="View public profile"
                        >
                          <Eye size={12} />
                        </Link>
                        <button
                          onClick={() => setEditingPet({ ...pet })}
                          className="btn btn-outline btn-xs"
                          title="Edit pet"
                        >
                          <Edit size={12} />
                        </button>
                        <button
                          onClick={() => setPetToDelete(pet)}
                          className="btn btn-outline btn-xs text-danger"
                          title="Delete pet"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* EDIT PET MODAL */}
      {editingPet && (
        <div className="shelter-modal-overlay" onClick={() => setEditingPet(null)}>
          <div className="shelter-modal-card card shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="shelter-modal-header p-3 border-bottom d-flex justify-between align-center">
              <h3 className="h5 font-weight-bold mb-0">Edit Pet: {editingPet.petName}</h3>
              <button onClick={() => setEditingPet(null)} className="btn btn-link text-muted p-1">
                <X size={20} />
              </button>
            </div>

            {editError && (
              <div className="p-3">
                <div className="alert alert-danger font-size-sm mb-0">{editError}</div>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="shelter-modal-body p-4">
              <div className="grid grid-2 gap-3">
                <div className="form-group">
                  <label className="filter-label">Pet Name *</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={editingPet.petName || ''}
                    onChange={(e) => setEditingPet({ ...editingPet, petName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="filter-label">Species *</label>
                  <select
                    className="form-control form-control-sm"
                    value={editingPet.species || 'Dog'}
                    onChange={(e) => setEditingPet({ ...editingPet, species: e.target.value })}
                  >
                    <option value="Dog">Dog</option>
                    <option value="Cat">Cat</option>
                    <option value="Bird">Bird</option>
                    <option value="Rabbit">Rabbit</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="filter-label">Breed *</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={editingPet.breed || ''}
                    onChange={(e) => setEditingPet({ ...editingPet, breed: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="filter-label">Age *</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={editingPet.age || ''}
                    onChange={(e) => setEditingPet({ ...editingPet, age: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="filter-label">Gender</label>
                  <select
                    className="form-control form-control-sm"
                    value={editingPet.gender || 'Male'}
                    onChange={(e) => setEditingPet({ ...editingPet, gender: e.target.value })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="filter-label">Availability Status</label>
                  <select
                    className="form-control form-control-sm"
                    value={editingPet.adoptionStatus || 'Available'}
                    onChange={(e) => setEditingPet({ ...editingPet, adoptionStatus: e.target.value })}
                  >
                    <option value="Available">Available</option>
                    <option value="Pending">Pending</option>
                    <option value="Adopted">Adopted</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="filter-label">District</label>
                  <select
                    className="form-control form-control-sm"
                    value={editingPet.district || 'Chennai'}
                    onChange={(e) => setEditingPet({ ...editingPet, district: e.target.value })}
                  >
                    {TAMILNADU_DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="filter-label">Vaccination Status</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={editingPet.vaccinationStatus || ''}
                    onChange={(e) => setEditingPet({ ...editingPet, vaccinationStatus: e.target.value })}
                  />
                </div>

                <div className="form-group col-span-2">
                  <label className="filter-label">Description</label>
                  <textarea
                    rows={3}
                    className="form-control form-control-sm"
                    value={editingPet.description || ''}
                    onChange={(e) => setEditingPet({ ...editingPet, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="d-flex justify-end gap-2 mt-4 pt-3 border-top">
                <button
                  type="button"
                  onClick={() => setEditingPet(null)}
                  className="btn btn-outline btn-sm"
                  disabled={savingEdit}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={savingEdit}
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {petToDelete && (
        <div className="shelter-modal-overlay" onClick={() => setPetToDelete(null)}>
          <div className="shelter-modal-card card shadow-lg p-4" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-3">
              <div className="alert-circle-icon mx-auto mb-2 text-danger">
                <AlertTriangle size={36} />
              </div>
              <h3 className="h5 font-weight-bold mb-1">Delete Pet Listing?</h3>
              <p className="text-muted font-size-sm mb-0">
                Are you sure you want to delete <strong>{petToDelete.petName}</strong>? This action cannot be undone and will remove the pet listing from PawHomes.
              </p>
            </div>

            <div className="d-flex justify-center gap-2 mt-4">
              <button
                type="button"
                onClick={() => setPetToDelete(null)}
                className="btn btn-outline btn-sm"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeletePet}
                className="btn btn-danger btn-sm"
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Yes, Delete Pet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ShelterLayout>
  );
};

export default ShelterPets;
