import React, { useState, useEffect } from 'react';
import { rescueAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ShelterLayout from '../components/ShelterLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { TAMILNADU_DISTRICTS } from '../utils/locationUtils';
import {
  AlertCircle, CheckCircle2, ShieldCheck, MapPin, Phone, Mail,
  PlusCircle, Filter, Compass, AlertTriangle, Image as ImageIcon, PawPrint,
  Search, X, ChevronDown, RotateCcw
} from 'lucide-react';

const RescueManagement = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('All');
  const [districtFilter, setDistrictFilter] = useState('All');
  const [urgencyFilter, setUrgencyFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Report Modal
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [locationDetecting, setLocationDetecting] = useState(false);

  // Section 25 Form Fields
  const [formData, setFormData] = useState({
    reporterName: user?.name || '',
    contactPhone: user?.phone || '',
    petType: 'Dog',
    description: '',
    photo: '',
    location: '',
    address: '',
    district: user?.district || '',
    urgency: 'MEDIUM'
  });

  useEffect(() => {
    fetchReports();
  }, [filterType, districtFilter, urgencyFilter]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (filterType !== 'All') params.reportType = filterType;
      if (districtFilter !== 'All') params.district = districtFilter;
      if (urgencyFilter !== 'All') params.urgency = urgencyFilter;

      const res = await rescueAPI.getReports(params);
      if (res.success) {
        setReports(res.data || []);
      } else {
        setError(res.message || 'Failed to fetch rescue reports');
      }
    } catch (err) {
      setError(err.message || 'Error connecting to rescue records');
    } finally {
      setLoading(false);
    }
  };

  const handleCaptureLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocationDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setFormData((prev) => ({
          ...prev,
          location: `GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
        }));
        setLocationDetecting(false);
      },
      (err) => {
        setLocationDetecting(false);
        alert('Could not retrieve current location.');
      },
      { timeout: 10000 }
    );
  };

  const handleCreateReport = async (e) => {
    e.preventDefault();
    if (!formData.reporterName.trim() || !formData.contactPhone.trim() || !formData.description.trim()) {
      setFormError('Please fill in reporter name, contact phone, and pet description.');
      return;
    }

    try {
      setFormLoading(true);
      setFormError(null);

      const payload = {
        reportType: 'Rescue',
        reporterName: formData.reporterName.trim(),
        contactPhone: formData.contactPhone.trim(),
        species: formData.petType,
        petType: formData.petType,
        description: formData.description.trim(),
        photo: formData.photo.trim(),
        images: formData.photo.trim() ? [formData.photo.trim()] : [],
        location: formData.location.trim() || formData.address.trim(),
        address: formData.address.trim() || formData.location.trim(),
        district: formData.district || user?.district || 'Tamil Nadu',
        urgency: formData.urgency
      };

      const res = await rescueAPI.createReport(payload);
      if (res.success) {
        setShowModal(false);
        setFormData({
          reporterName: user?.name || '',
          contactPhone: user?.phone || '',
          petType: 'Dog',
          description: '',
          photo: '',
          location: '',
          address: '',
          district: user?.district || '',
          urgency: 'MEDIUM'
        });
        await fetchReports();
      } else {
        setFormError(res.message || 'Failed to submit rescue report');
      }
    } catch (err) {
      setFormError('Error recording rescue report in database.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleVerify = async (reportId, isVerified) => {
    try {
      const res = await rescueAPI.verifyReport(reportId, { isVerified, status: isVerified ? 'Verified' : 'Open' });
      if (res.success) {
        await fetchReports();
      }
    } catch (err) {
      alert('Error updating report status');
    }
  };

  const canManageReports = user && ['shelter', 'admin'].includes(user.role);

  const isShelter = user?.role === 'shelter';

  const filteredReports = reports.filter((r) => {
    if (!searchQuery.trim()) return true;
    const term = searchQuery.toLowerCase();
    const text = `${r.petName || ''} ${r.species || ''} ${r.reporterName || ''} ${r.location || ''} ${r.district || ''} ${r.description || ''}`.toLowerCase();
    return text.includes(term);
  });

  const mainContent = (
    <>
      {/* SECTION 25 HERO: Only show on public rescue page if not inside shelter dashboard */}
      {!isShelter && (
        <div className="rescue-hero-card card p-5 text-center mb-5 shadow-sm">
          <div className="rescue-hero-icon mb-3">
            <AlertTriangle size={48} className="text-amber mx-auto" />
          </div>
          <span className="badge-pill mb-2">Emergency Rescue &amp; Stray Network</span>
          <h1 className="rescue-hero-title mb-2">Found a Pet That Needs Help?</h1>
          <p className="rescue-hero-subtitle text-muted max-w-md mx-auto mb-4">
            Report injured, lost, or abandoned animals immediately. Local shelters and volunteer rescuers are alerted to respond.
          </p>

          <button
            onClick={() => {
              setFormError(null);
              setShowModal(true);
            }}
            className="btn btn-primary btn-lg d-inline-flex align-center gap-2"
          >
            <PlusCircle size={20} />
            <span>Report a Rescue</span>
          </button>
        </div>
      )}

      {/* Modern Search & Filter Toolbar */}
      <div className="shelter-toolbar-row mb-4">
        {/* Search Field */}
        <div className="shelter-search-field-wrap">
          <Search size={18} className="shelter-search-field-icon" />
          <input
            type="text"
            placeholder="Search rescue reports by pet, reporter, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="shelter-search-field-input"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="shelter-search-clear-btn"
              title="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filters & Actions */}
        <div className="shelter-toolbar-controls">
          {/* Urgency Filter */}
          <div className="shelter-filter-control-wrap">
            <div className="shelter-select-wrap">
              <select
                value={urgencyFilter}
                onChange={(e) => setUrgencyFilter(e.target.value)}
                className={`shelter-filter-select ${urgencyFilter !== 'All' ? 'is-active' : ''}`}
                aria-label="Filter by urgency"
              >
                <option value="All">All Urgencies</option>
                <option value="HIGH">HIGH (Urgent)</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
              <ChevronDown size={14} className="shelter-select-chevron" />
            </div>
          </div>

          {/* District Filter */}
          <div className="shelter-filter-control-wrap">
            <div className="shelter-select-wrap">
              <select
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className={`shelter-filter-select ${districtFilter !== 'All' ? 'is-active' : ''}`}
                aria-label="Filter by district"
              >
                <option value="All">All Districts</option>
                {TAMILNADU_DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <ChevronDown size={14} className="shelter-select-chevron" />
            </div>
          </div>

          {/* Report a Rescue Action Button */}
          <button
            type="button"
            onClick={() => {
              setFormError(null);
              setShowModal(true);
            }}
            className="shelter-btn-action-primary"
          >
            <PlusCircle size={16} />
            <span>Report a Rescue</span>
          </button>
        </div>
      </div>

      {/* Reports Grid */}
      {loading ? (
        <LoadingSpinner message="Retrieving active rescue reports from MongoDB..." />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : reports.length === 0 ? (
        <div className="card text-center p-5">
          <CheckCircle2 size={44} className="text-teal mb-2 mx-auto" />
          <h3>No active rescue reports found</h3>
          <p className="text-muted">All clear! No open rescue cases match your selected filters.</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="shelter-empty-search-state">
          <div className="empty-search-icon-wrap">
            <Search size={32} />
          </div>
          <h3 className="empty-search-title">No matching rescue reports found</h3>
          <p className="empty-search-subtitle">
            Try searching with another pet, location, or reporter keyword, or reset active filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setUrgencyFilter('All');
              setDistrictFilter('All');
              setFilterType('All');
            }}
            className="shelter-btn-clear-filters"
          >
            <RotateCcw size={14} />
            <span>Reset Search &amp; Filters</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-3 gap-4">
          {filteredReports.map((report) => {
            const urgencyClass =
              report.urgency === 'HIGH' ? 'badge-danger' : report.urgency === 'MEDIUM' ? 'badge-warning' : 'badge-info';
            const imgUrl =
              report.images?.[0] ||
              report.photo ||
              'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=80';

            return (
              <div key={report._id} className="card rescue-card shadow-sm d-flex flex-column">
                <div className="rescue-card-media position-relative">
                  <img src={imgUrl} alt={report.petName || 'Rescue pet'} className="rescue-card-img" />
                  <div className="rescue-badges-overlay">
                    <span className={`badge ${urgencyClass}`}>
                      {report.urgency || 'MEDIUM'} URGENCY
                    </span>
                    {report.isVerified ? (
                      <span className="badge badge-success d-inline-flex align-center gap-1">
                        <ShieldCheck size={12} /> Verified
                      </span>
                    ) : (
                      <span className="badge badge-secondary">Pending Verification</span>
                    )}
                  </div>
                </div>

                <div className="card-body p-3 d-flex flex-column flex-1">
                  <div className="d-flex justify-between align-center mb-1">
                    <h3 className="mb-0">{report.petName || `${report.species} Rescue`}</h3>
                    <span className="font-size-xs text-muted">{new Date(report.createdAt).toLocaleDateString()}</span>
                  </div>

                  <p className="text-muted font-size-sm mb-2">
                    {report.species || 'Animal'} · {report.district}
                  </p>

                  <p className="rescue-description-copy font-size-sm mb-3">
                    {report.description}
                  </p>

                  <div className="rescue-meta-box p-2 bg-light rounded font-size-xs text-muted mb-3">
                    <div className="d-flex align-center gap-1 mb-1">
                      <MapPin size={13} className="text-teal" />
                      <span><strong>Location:</strong> {report.address || report.location}</span>
                    </div>
                    <div className="d-flex align-center gap-1">
                      <Phone size={13} className="text-teal" />
                      <span><strong>Contact:</strong> {report.contactPhone} ({report.reporterName})</span>
                    </div>
                  </div>

                  <div className="rescue-card-actions mt-auto pt-2 border-top d-flex gap-2">
                    <a
                      href={`tel:${report.contactPhone}`}
                      className="btn btn-outline btn-sm flex-1 text-center d-flex align-center justify-center gap-1"
                    >
                      <Phone size={13} />
                      <span>Call Reporter</span>
                    </a>

                    {canManageReports && (
                      <button
                        onClick={() => handleVerify(report._id, !report.isVerified)}
                        className={`btn btn-sm ${report.isVerified ? 'btn-outline' : 'btn-success'}`}
                      >
                        {report.isVerified ? 'Mark Unverified' : 'Verify Case'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SECTION 25 RESCUE REPORT MODAL FORM */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card max-w-lg p-4">
            <div className="modal-header d-flex justify-between align-center mb-3 pb-2 border-bottom">
              <div>
                <span className="badge-pill mb-1">Emergency Intake</span>
                <h2 className="mb-0">Report a Pet Rescue</h2>
              </div>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleCreateReport}>
              {formError && <ErrorMessage message={formError} />}

              <div className="grid grid-2 gap-3 mb-3">
                <div className="form-group">
                  <label>Reporter Name *</label>
                  <input
                    type="text"
                    value={formData.reporterName}
                    onChange={(e) => setFormData({ ...formData, reporterName: e.target.value })}
                    placeholder="Your Name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="10-digit mobile"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-2 gap-3 mb-3">
                <div className="form-group">
                  <label>Pet Type *</label>
                  <select
                    value={formData.petType}
                    onChange={(e) => setFormData({ ...formData, petType: e.target.value })}
                  >
                    <option value="Dog">Dog</option>
                    <option value="Cat">Cat</option>
                    <option value="Puppy / Kitten">Puppy / Kitten</option>
                    <option value="Bird">Bird</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Section 25 Urgency Options */}
                <div className="form-group">
                  <label>Urgency Level *</label>
                  <select
                    value={formData.urgency}
                    onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                    required
                  >
                    <option value="LOW">LOW (Stable, safe for now)</option>
                    <option value="MEDIUM">MEDIUM (Needs shelter/food)</option>
                    <option value="HIGH">HIGH (Injured / Critical Emergency)</option>
                  </select>
                </div>
              </div>

              <div className="form-group mb-3">
                <label>Description &amp; Condition *</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the animal's physical state, injuries, collar or distinguishing marks..."
                  required
                />
              </div>

              <div className="form-group mb-3">
                <label>Photo URL (Optional)</label>
                <div className="input-with-icon">
                  <ImageIcon size={18} className="input-icon" />
                  <input
                    type="url"
                    value={formData.photo}
                    onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>
              </div>

              <div className="location-box p-3 mb-4 bg-light rounded">
                <div className="d-flex justify-between align-center mb-2">
                  <strong className="font-size-sm">Current Location &amp; Address *</strong>
                  <button
                    type="button"
                    onClick={handleCaptureLocation}
                    disabled={locationDetecting}
                    className="btn btn-outline btn-xs"
                  >
                    <Compass size={14} />
                    <span>{locationDetecting ? 'Detecting...' : 'Use My GPS'}</span>
                  </button>
                </div>

                <div className="form-group mb-2">
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Landmark or GPS coordinates"
                  />
                </div>

                <div className="grid grid-2 gap-2">
                  <div className="form-group mb-0">
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Street address / Junction"
                      required
                    />
                  </div>

                  <div className="form-group mb-0">
                    <select
                      value={formData.district}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      required
                    >
                      <option value="">Select District</option>
                      {TAMILNADU_DISTRICTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="d-flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="btn btn-primary"
                >
                  {formLoading ? 'Submitting Report...' : 'Submit Rescue Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );

  if (isShelter) {
    return (
      <ShelterLayout
        title="Rescue Reports"
        subtitle="Emergency stray alerts and community rescue response tracking."
        activePage="/rescue"
      >
        {mainContent}
      </ShelterLayout>
    );
  }

  return (
    <div className="paw-rescue-page container section-padding">
      {mainContent}
    </div>
  );
};

export default RescueManagement;
