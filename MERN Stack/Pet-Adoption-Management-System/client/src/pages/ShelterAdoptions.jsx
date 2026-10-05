import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applicationAPI } from '../services/api';
import ShelterLayout from '../components/ShelterLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import AdoptionMapModal from '../components/AdoptionMapModal';
import {
  CheckCircle2,
  Navigation,
  Award,
  Calendar,
  User,
  PawPrint,
  Search,
  MapPin,
  Heart,
  Phone,
  Mail,
  ShieldCheck,
  Eye,
  X,
  RotateCcw
} from 'lucide-react';

const ShelterAdoptions = () => {
  const [adoptions, setAdoptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [mapApp, setMapApp] = useState(null);

  useEffect(() => {
    fetchCompletedAdoptions();
  }, []);

  const fetchCompletedAdoptions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await applicationAPI.getMyApplications();
      if (res.success) {
        const completed = (res.data || []).filter((app) =>
          ['Successful', 'Completed'].includes(app.applicationStatus)
        );
        setAdoptions(completed);
      } else {
        setError(res.message || 'Failed to load adoption records');
      }
    } catch (err) {
      setError(err.message || 'Error fetching completed adoptions');
    } finally {
      setLoading(false);
    }
  };

  const filtered = adoptions.filter((rec) => {
    const text = `${rec.pet?.petName || ''} ${rec.applicant?.name || rec.applicantDetails?.name || ''} ${rec.pet?.breed || ''}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <ShelterLayout
      title="Successful Adoptions"
      subtitle="Permanent records of pets successfully handed over to verified loving adopters."
      activePage="/shelter/adoptions"
    >
      {/* Modern Search & Placements Toolbar */}
      <div className="shelter-toolbar-row mb-4">
        {/* Search Field */}
        <div className="shelter-search-field-wrap">
          <Search size={18} className="shelter-search-field-icon" />
          <input
            type="text"
            placeholder="Search by pet name, breed, or adopter..."
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

        {/* Placements Counter */}
        <div className="shelter-toolbar-controls">
          <div className="shelter-placements-stat-pill">
            <Award size={16} />
            <span>Total Verified Placements: <strong>{adoptions.length}</strong></span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card p-5 text-center shadow-sm">
          <LoadingSpinner message="Loading permanent adoption archives..." />
        </div>
      ) : error ? (
        <div className="card p-4 shadow-sm">
          <ErrorMessage message={error} />
          <button onClick={fetchCompletedAdoptions} className="btn btn-outline btn-sm mt-3">
            Retry
          </button>
        </div>
      ) : adoptions.length === 0 ? (
        <div className="card p-5 text-center shadow-sm shelter-empty-box">
          <div className="shelter-empty-icon mb-3">
            <Award size={48} className="text-muted" />
          </div>
          <h3 className="h4 font-weight-bold mb-1">No completed adoptions yet</h3>
          <p className="text-muted font-size-sm mb-4">
            Once you approve applications and complete pet handovers, official verified adoption records will be archived here.
          </p>
          <Link to="/shelter/applications" className="btn btn-primary btn-sm d-inline-flex align-center gap-2">
            <span>Review Pending Applications</span>
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="shelter-empty-search-state">
          <div className="empty-search-icon-wrap">
            <Search size={32} />
          </div>
          <h3 className="empty-search-title">No matching adoption records found</h3>
          <p className="empty-search-subtitle">
            Try searching with another pet name, breed, or adopter keyword.
          </p>
          <button
            type="button"
            onClick={() => setSearch('')}
            className="shelter-btn-clear-filters"
          >
            <RotateCcw size={14} />
            <span>Clear Search</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-3 gap-4 mb-4">
          {filtered.map((record) => {
            const petImg = record.pet?.images?.[0] || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80';
            const petName = record.pet?.petName || 'Pet';
            const adopterName = record.applicant?.name || record.applicantDetails?.name || 'Verified Adopter';
            const adopterEmail = record.applicant?.email || record.applicantDetails?.email || '';
            const adopterPhone = record.applicant?.phone || record.applicantDetails?.phone || '';
            const adoptionDate = record.completedAt || record.successfulAt || record.updatedAt || record.createdAt;

            return (
              <div key={record._id} className="card adoption-record-card shadow-sm">
                <div className="adoption-record-img-wrap">
                  <img src={petImg} alt={petName} className="adoption-record-img" />
                  <div className="adoption-record-badge">
                    <span className="shelter-badge shelter-badge-completed d-flex align-center gap-1">
                      <CheckCircle2 size={12} />
                      <span>OFFICIALLY ADOPTED</span>
                    </span>
                  </div>
                </div>

                <div className="card-body p-3">
                  <div className="d-flex justify-between align-center mb-1">
                    <h3 className="h5 font-weight-bold mb-0">{petName}</h3>
                    <span className="badge badge-success font-size-xs">{record.pet?.species || 'Pet'}</span>
                  </div>
                  <p className="text-muted font-size-xs mb-3">
                    {record.pet?.breed} · {record.pet?.age}
                  </p>

                  <div className="adoption-meta-box p-3 bg-light rounded mb-3 font-size-xs">
                    <div className="d-flex align-center gap-2 mb-2">
                      <User size={14} className="text-primary flex-shrink-0" />
                      <div>
                        <span className="text-muted d-block">Adopter</span>
                        <strong>{adopterName}</strong>
                      </div>
                    </div>

                    <div className="d-flex align-center gap-2 mb-2">
                      <Calendar size={14} className="text-primary flex-shrink-0" />
                      <div>
                        <span className="text-muted d-block">Adoption Handover Date</span>
                        <strong>{new Date(adoptionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</strong>
                      </div>
                    </div>

                    <div className="d-flex align-center gap-2">
                      <MapPin size={14} className="text-primary flex-shrink-0" />
                      <div>
                        <span className="text-muted d-block">Placement Location</span>
                        <strong>{record.applicantDistrict || record.applicant?.district || 'Tamil Nadu'}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex justify-between align-center pt-2 border-top">
                    <span className="text-success font-size-xs font-weight-bold d-flex align-center gap-1">
                      <ShieldCheck size={14} />
                      <span>Verified Record</span>
                    </span>

                    {record.routeCoordinates && (
                      <button
                        onClick={() => setMapApp(record)}
                        className="btn btn-outline btn-xs d-flex align-center gap-1"
                        title="View Transport Route"
                      >
                        <Navigation size={12} />
                        <span>Route</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Transport Route Map Modal */}
      {mapApp && (
        <AdoptionMapModal
          isOpen={!!mapApp}
          onClose={() => setMapApp(null)}
          petName={mapApp.pet?.petName || 'Pet'}
          shelterInfo={mapApp.owner || { shelterName: 'Shelter', district: 'Tamil Nadu' }}
          adopterInfo={mapApp.applicant || { name: mapApp.applicantDetails?.name, district: mapApp.applicantDistrict }}
          applicationStatus="Completed"
        />
      )}
    </ShelterLayout>
  );
};

export default ShelterAdoptions;
