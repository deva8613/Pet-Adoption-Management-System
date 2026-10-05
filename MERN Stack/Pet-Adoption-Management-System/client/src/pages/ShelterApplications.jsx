import React, { useEffect, useMemo, useState } from 'react';
import { applicationAPI } from '../services/api';
import ShelterLayout from '../components/ShelterLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import AdoptionMapModal from '../components/AdoptionMapModal';
import {
  ClipboardList,
  Eye,
  CheckCircle2,
  XCircle,
  Navigation,
  Search,
  Clock,
  User,
  PawPrint,
  MessageSquare,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Home,
  Check,
  X,
  FileText,
  Calendar,
  ShieldCheck,
  Send,
  Award,
  ChevronDown,
  RotateCcw
} from 'lucide-react';

const ShelterApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  // Modals & Drawers
  const [selectedApp, setSelectedApp] = useState(null);
  const [mapApp, setMapApp] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Sub-action Modals
  const [rejectModalApp, setRejectModalApp] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [infoModalApp, setInfoModalApp] = useState(null);
  const [informationRequest, setInformationRequest] = useState('');
  const [completeConfirmApp, setCompleteConfirmApp] = useState(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await applicationAPI.getMyApplications();
      if (res.success) {
        setApplications(res.data || []);
      } else {
        setError(res.message || 'Failed to load adoption applications');
      }
    } catch (err) {
      setError(err.message || 'Error loading applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  // Counts for top status tabs
  const counts = useMemo(
    () => ({
      total: applications.length,
      pending: applications.filter((a) => a.applicationStatus === 'Pending').length,
      underReview: applications.filter((a) => a.applicationStatus === 'Under Review').length,
      needsInfo: applications.filter((a) => a.applicationStatus === 'Needs Information').length,
      approved: applications.filter((a) => a.applicationStatus === 'Approved').length,
      completed: applications.filter((a) => ['Successful', 'Completed'].includes(a.applicationStatus)).length
    }),
    [applications]
  );

  // Status Badge Helper
  const getStatusBadge = (status) => {
    const s = (status || 'PENDING').toUpperCase();
    if (s.includes('APPROV')) {
      return <span className="shelter-badge shelter-badge-approved">APPROVED</span>;
    }
    if (s.includes('REJECT')) {
      return <span className="shelter-badge shelter-badge-rejected">REJECTED</span>;
    }
    if (s.includes('REVIEW')) {
      return <span className="shelter-badge shelter-badge-review">UNDER REVIEW</span>;
    }
    if (s.includes('NEED') || s.includes('INFO')) {
      return <span className="shelter-badge shelter-badge-info">NEEDS INFO</span>;
    }
    if (s.includes('SUCCESS') || s.includes('COMPLET')) {
      return <span className="shelter-badge shelter-badge-completed">COMPLETED</span>;
    }
    return <span className="shelter-badge shelter-badge-pending">PENDING</span>;
  };

  // Status Update Actions
  const handleApprove = async (app) => {
    try {
      setActionLoading(true);
      const res = await applicationAPI.updateStatus(app._id, 'Approved');
      if (res.success) {
        await fetchApplications();
        if (selectedApp && selectedApp._id === app._id) {
          setSelectedApp(res.data);
        }
      } else {
        alert(res.message || 'Failed to approve application');
      }
    } catch (err) {
      alert('Error approving application');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkUnderReview = async (app) => {
    try {
      setActionLoading(true);
      const res = await applicationAPI.updateStatus(app._id, 'Under Review');
      if (res.success) {
        await fetchApplications();
        if (selectedApp && selectedApp._id === app._id) {
          setSelectedApp(res.data);
        }
      } else {
        alert(res.message || 'Failed to update application status');
      }
    } catch (err) {
      alert('Error updating status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectModalApp || !rejectionReason.trim()) return;
    try {
      setActionLoading(true);
      const res = await applicationAPI.updateStatus(rejectModalApp._id, 'Rejected', rejectionReason);
      if (res.success) {
        setRejectModalApp(null);
        setRejectionReason('');
        await fetchApplications();
        if (selectedApp && selectedApp._id === rejectModalApp._id) {
          setSelectedApp(res.data);
        }
      } else {
        alert(res.message || 'Failed to reject application');
      }
    } catch (err) {
      alert('Error submitting rejection');
    } finally {
      setActionLoading(false);
    }
  };

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    if (!infoModalApp || !informationRequest.trim()) return;
    try {
      setActionLoading(true);
      const res = await applicationAPI.updateStatus(infoModalApp._id, 'Needs Information', informationRequest);
      if (res.success) {
        setInfoModalApp(null);
        setInformationRequest('');
        await fetchApplications();
        if (selectedApp && selectedApp._id === infoModalApp._id) {
          setSelectedApp(res.data);
        }
      } else {
        alert(res.message || 'Failed to request information');
      }
    } catch (err) {
      alert('Error requesting information');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteAdoption = async () => {
    if (!completeConfirmApp) return;
    try {
      setActionLoading(true);
      const res = await applicationAPI.updateStatus(completeConfirmApp._id, 'Completed');
      if (res.success) {
        setCompleteConfirmApp(null);
        await fetchApplications();
        if (selectedApp && selectedApp._id === completeConfirmApp._id) {
          setSelectedApp(res.data);
        }
      } else {
        alert(res.message || 'Failed to complete adoption');
      }
    } catch (err) {
      alert('Error completing adoption');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter & Sort Logic
  const filtered = applications.filter((app) => {
    const text = `${app.pet?.petName || ''} ${app.applicant?.name || app.applicantDetails?.name || ''} ${app.applicant?.email || app.applicantDetails?.email || ''} ${app.applicantDistrict || ''}`.toLowerCase();
    const matchesQuery = text.includes(query.toLowerCase());
    const matchesFilter =
      statusFilter === 'All' ||
      (statusFilter === 'Completed' ? ['Successful', 'Completed'].includes(app.applicationStatus) : app.applicationStatus === statusFilter);
    return matchesFilter && matchesQuery;
  }).sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
  });

  return (
    <ShelterLayout
      title="Adoption Applications"
      subtitle="Review and manage people interested in your pets."
      activePage="/shelter/applications"
    >
      {/* Status Tab Pills */}
      <div className="shelter-status-tabs mb-3">
        {[
          { key: 'All', label: 'All Applications', count: counts.total },
          { key: 'Pending', label: 'Pending', count: counts.pending },
          { key: 'Under Review', label: 'Under Review', count: counts.underReview },
          { key: 'Needs Information', label: 'Needs Info', count: counts.needsInfo },
          { key: 'Approved', label: 'Approved', count: counts.approved },
          { key: 'Completed', label: 'Completed', count: counts.completed },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatusFilter(tab.key)}
            className={`shelter-status-tab-btn ${statusFilter === tab.key ? 'active' : ''}`}
          >
            <span>{tab.label}</span>
            <span className="tab-counter">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Modern Search & Sort Toolbar */}
      <div className="shelter-toolbar-row mb-4">
        {/* Search Field */}
        <div className="shelter-search-field-wrap">
          <Search size={18} className="shelter-search-field-icon" />
          <input
            type="text"
            placeholder="Search applicant name, email, or pet..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="shelter-search-field-input"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="shelter-search-clear-btn"
              title="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Sort Controls */}
        <div className="shelter-toolbar-controls">
          <div className="shelter-filter-control-wrap">
            <span className="shelter-filter-control-label">Sort</span>
            <div className="shelter-select-wrap">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="shelter-filter-select"
                aria-label="Sort applications"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
              <ChevronDown size={14} className="shelter-select-chevron" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Applications Table */}
      {loading ? (
        <div className="card p-5 text-center shadow-sm">
          <LoadingSpinner message="Loading adoption applications..." />
        </div>
      ) : error ? (
        <div className="card p-4 shadow-sm">
          <ErrorMessage message={error} />
          <button onClick={fetchApplications} className="btn btn-outline btn-sm mt-3">
            Retry
          </button>
        </div>
      ) : applications.length === 0 ? (
        <div className="card p-5 text-center shadow-sm shelter-empty-box">
          <ClipboardList size={48} className="text-muted mb-2 mx-auto" />
          <h3 className="h4 font-weight-bold mb-1">No applications found</h3>
          <p className="text-muted font-size-sm mb-3">
            When adopters submit applications for your pets, they will appear here.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="shelter-empty-search-state">
          <div className="empty-search-icon-wrap">
            <Search size={32} />
          </div>
          <h3 className="empty-search-title">No matching applications found</h3>
          <p className="empty-search-subtitle">
            Try searching with another applicant name, email, or pet keyword, or clear your filters.
          </p>
          <button
            type="button"
            onClick={() => { setQuery(''); setStatusFilter('All'); }}
            className="shelter-btn-clear-filters"
          >
            <RotateCcw size={14} />
            <span>Reset Search &amp; Filters</span>
          </button>
        </div>
      ) : (
        <div className="card shadow-sm p-0 mb-4 table-responsive">
          <table className="shelter-full-table">
            <thead>
              <tr>
                <th>Applicant Profile</th>
                <th>Target Pet</th>
                <th>Applied Date</th>
                <th>Phone &amp; Email</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((app) => {
                const applicantName = app.applicant?.name || app.applicantDetails?.name || 'Applicant';
                const applicantEmail = app.applicant?.email || app.applicantDetails?.email || '';
                const applicantPhone = app.applicant?.phone || app.applicantDetails?.phone || 'Not provided';
                const petName = app.pet?.petName || 'Pet';
                const petImg = app.pet?.images?.[0] || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=200&q=80';

                return (
                  <tr key={app._id} className="shelter-app-row" onClick={() => setSelectedApp(app)}>
                    <td>
                      <div className="applicant-meta-cell">
                        <strong className="d-block font-size-sm">{applicantName}</strong>
                        <span className="text-muted font-size-xs d-flex align-center gap-1">
                          <MapPin size={11} />
                          {app.applicantDistrict || app.applicant?.city || 'Tamil Nadu'}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div className="d-flex align-center gap-2">
                        <img src={petImg} alt={petName} className="table-pet-thumb" />
                        <div>
                          <strong className="d-block font-size-sm">{petName}</strong>
                          <span className="text-muted font-size-xs">{app.pet?.breed}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="d-flex align-center gap-1 font-size-xs text-muted">
                        <Calendar size={12} />
                        <span>{new Date(app.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>

                    <td>
                      <div className="contact-meta-cell">
                        <span className="font-size-xs text-muted d-block">{applicantPhone}</span>
                        <span className="font-size-xs text-muted d-block text-truncate" style={{ maxWidth: '160px' }}>
                          {applicantEmail}
                        </span>
                      </div>
                    </td>

                    <td>
                      {getStatusBadge(app.applicationStatus)}
                    </td>

                    <td className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="d-flex justify-end align-center gap-1">
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="btn btn-primary btn-xs d-flex align-center gap-1"
                          title="View complete application dossier"
                        >
                          <Eye size={12} />
                          <span>View Details</span>
                        </button>
                        {app.routeCoordinates && (
                          <button
                            onClick={() => setMapApp(app)}
                            className="btn btn-outline btn-xs"
                            title="View transport route"
                          >
                            <Navigation size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* RICH APPLICATION DETAILS MODAL / DRAWER */}
      {selectedApp && (
        <div className="shelter-modal-overlay" onClick={() => setSelectedApp(null)}>
          <div className="shelter-modal-card card shadow-lg app-dossier-modal" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="shelter-modal-header p-4 border-bottom d-flex justify-between align-center">
              <div>
                <span className="text-muted font-size-xs text-uppercase font-weight-bold d-block mb-1">
                  Adoption Dossier · ID #{selectedApp._id?.substring(selectedApp._id.length - 6)}
                </span>
                <h3 className="h4 font-weight-bold mb-0">
                  {selectedApp.applicant?.name || selectedApp.applicantDetails?.name} &rarr; {selectedApp.pet?.petName}
                </h3>
              </div>
              <div className="d-flex align-center gap-2">
                {getStatusBadge(selectedApp.applicationStatus)}
                <button onClick={() => setSelectedApp(null)} className="btn btn-link text-muted p-1">
                  <X size={22} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="shelter-modal-body p-4 dossier-body">
              {/* Pet & Applicant Summary Banner */}
              <div className="dossier-hero-card p-3 bg-light rounded mb-4 d-flex justify-between align-center flex-wrap gap-3">
                <div className="d-flex align-center gap-3">
                  <img
                    src={selectedApp.pet?.images?.[0] || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=200&q=80'}
                    alt={selectedApp.pet?.petName}
                    className="dossier-pet-img rounded"
                  />
                  <div>
                    <h4 className="mb-0 font-weight-bold">{selectedApp.pet?.petName}</h4>
                    <span className="text-muted font-size-xs">
                      {selectedApp.pet?.species} · {selectedApp.pet?.breed} · {selectedApp.pet?.age} ({selectedApp.pet?.gender})
                    </span>
                    <span className="d-block text-muted font-size-xs mt-1">
                      Current Pet Status: <strong>{selectedApp.pet?.adoptionStatus || 'Available'}</strong>
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-muted font-size-xs d-block">Submission Date:</span>
                  <strong className="font-size-sm">{new Date(selectedApp.createdAt).toLocaleString()}</strong>
                </div>
              </div>

              {/* SECTION: APPLICANT INFORMATION */}
              <div className="dossier-section mb-4">
                <h4 className="dossier-section-title d-flex align-center gap-2 mb-3">
                  <User size={16} className="text-primary" />
                  <span>Applicant Information &amp; Address</span>
                </h4>
                <div className="grid grid-2 gap-3 dossier-grid">
                  <div className="dossier-item">
                    <span className="dossier-label">Full Name</span>
                    <span className="dossier-value">{selectedApp.applicant?.name || selectedApp.applicantDetails?.name}</span>
                  </div>
                  <div className="dossier-item">
                    <span className="dossier-label">Email Address</span>
                    <span className="dossier-value">{selectedApp.applicant?.email || selectedApp.applicantDetails?.email}</span>
                  </div>
                  <div className="dossier-item">
                    <span className="dossier-label">Phone Number</span>
                    <span className="dossier-value">{selectedApp.applicant?.phone || selectedApp.applicantDetails?.phone || 'Not provided'}</span>
                  </div>
                  <div className="dossier-item">
                    <span className="dossier-label">Occupation</span>
                    <span className="dossier-value">{selectedApp.applicant?.occupation || selectedApp.applicantDetails?.occupation || 'Not specified'}</span>
                  </div>
                  <div className="dossier-item col-span-2">
                    <span className="dossier-label">Residential Address</span>
                    <span className="dossier-value">
                      {selectedApp.applicantDetails?.address || selectedApp.applicant?.address || 'Address provided on record'},{' '}
                      {selectedApp.applicantDistrict || selectedApp.applicant?.district || 'Tamil Nadu'}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION: HOME & LIVING CONDITIONS */}
              <div className="dossier-section mb-4">
                <h4 className="dossier-section-title d-flex align-center gap-2 mb-3">
                  <Home size={16} className="text-success" />
                  <span>Home Environment &amp; Care Setup</span>
                </h4>
                <div className="grid grid-2 gap-3 dossier-grid">
                  <div className="dossier-item">
                    <span className="dossier-label">Home Type / Living Situation</span>
                    <span className="dossier-value">{selectedApp.livingSituation || 'Apartment / House'}</span>
                  </div>
                  <div className="dossier-item">
                    <span className="dossier-label">Where Will Pet Stay?</span>
                    <span className="dossier-value">{selectedApp.whereStay || 'Indoors with Family'}</span>
                  </div>
                  <div className="dossier-item">
                    <span className="dossier-label">Primary Caretaker</span>
                    <span className="dossier-value">{selectedApp.whoWillCare || 'Self / Family'}</span>
                  </div>
                  <div className="dossier-item">
                    <span className="dossier-label">Has Other Pets?</span>
                    <span className="dossier-value">{selectedApp.hasOtherPets || 'No'}</span>
                  </div>
                  <div className="dossier-item">
                    <span className="dossier-label">Has Children at Home?</span>
                    <span className="dossier-value">{selectedApp.hasChildren || 'No'}</span>
                  </div>
                  <div className="dossier-item">
                    <span className="dossier-label">Previous Pet Experience</span>
                    <span className="dossier-value">{selectedApp.experienceWithPets || 'Previous pet parent'}</span>
                  </div>
                </div>
              </div>

              {/* SECTION: REASON & COMMITMENTS */}
              <div className="dossier-section mb-4">
                <h4 className="dossier-section-title d-flex align-center gap-2 mb-3">
                  <ShieldCheck size={16} className="text-teal" />
                  <span>Adoption Motivation &amp; Commitments</span>
                </h4>
                <div className="p-3 bg-light rounded mb-3">
                  <span className="dossier-label d-block mb-1">Reason for Adoption:</span>
                  <p className="mb-0 font-size-sm font-italic">
                    "{selectedApp.reasonForAdoption || 'Desires a loving companion animal for family.'}"
                  </p>
                </div>

                <div className="d-flex flex-wrap gap-2">
                  <span className={`commitment-badge ${selectedApp.medicalCommitment !== false ? 'active' : ''}`}>
                    ✓ Medical Care Commitment
                  </span>
                  <span className={`commitment-badge ${selectedApp.vaccinationCommitment !== false ? 'active' : ''}`}>
                    ✓ Regular Vaccination Commitment
                  </span>
                  <span className={`commitment-badge ${selectedApp.longTermCommitment !== false ? 'active' : ''}`}>
                    ✓ 10-15 Year Long-Term Commitment
                  </span>
                </div>
              </div>

              {/* REJECTION OR INFO REQUEST NOTE IF PRESENT */}
              {selectedApp.rejectionReason && (
                <div className="alert alert-danger p-3 mb-4 rounded font-size-sm">
                  <strong>Recorded Rejection Reason:</strong> {selectedApp.rejectionReason}
                </div>
              )}
              {selectedApp.informationRequest && (
                <div className="alert alert-warning p-3 mb-4 rounded font-size-sm">
                  <strong>Information Request Sent to Adopter:</strong> {selectedApp.informationRequest}
                </div>
              )}

              {/* Transport Details if Approved */}
              {selectedApp.applicationStatus === 'Approved' && selectedApp.driverInfo && (
                <div className="p-3 bg-success-soft rounded border border-success mb-4 font-size-sm">
                  <strong className="text-success d-block mb-1">🚗 Transport &amp; Delivery Scheduled:</strong>
                  <div>Driver: <strong>{selectedApp.driverInfo.name}</strong> ({selectedApp.driverInfo.phone})</div>
                  <div>Delivery Date: <strong>{selectedApp.scheduledDeliveryDate}</strong> ({selectedApp.scheduledDeliveryTime})</div>
                </div>
              )}
            </div>

            {/* LIVE ACTIONS FOOTER */}
            <div className="shelter-modal-footer p-4 border-top d-flex justify-between align-center flex-wrap gap-2">
              <button onClick={() => setSelectedApp(null)} className="btn btn-outline btn-sm">
                Close Dossier
              </button>

              <div className="d-flex align-center gap-2 flex-wrap">
                {selectedApp.applicationStatus === 'Pending' && (
                  <button
                    onClick={() => handleMarkUnderReview(selectedApp)}
                    disabled={actionLoading}
                    className="btn btn-outline btn-sm text-info border-info"
                  >
                    Mark Under Review
                  </button>
                )}

                {['Pending', 'Under Review'].includes(selectedApp.applicationStatus) && (
                  <button
                    onClick={() => { setInfoModalApp(selectedApp); }}
                    disabled={actionLoading}
                    className="btn btn-outline btn-sm text-warning border-warning"
                  >
                    Request More Info
                  </button>
                )}

                {['Pending', 'Under Review', 'Needs Information'].includes(selectedApp.applicationStatus) && (
                  <button
                    onClick={() => { setRejectModalApp(selectedApp); }}
                    disabled={actionLoading}
                    className="btn btn-outline btn-sm text-danger border-danger"
                  >
                    Reject Application
                  </button>
                )}

                {['Pending', 'Under Review', 'Needs Information'].includes(selectedApp.applicationStatus) && (
                  <button
                    onClick={() => handleApprove(selectedApp)}
                    disabled={actionLoading}
                    className="btn btn-primary btn-sm"
                  >
                    Approve Application
                  </button>
                )}

                {selectedApp.applicationStatus === 'Approved' && (
                  <button
                    onClick={() => setCompleteConfirmApp(selectedApp)}
                    disabled={actionLoading}
                    className="btn btn-success btn-sm d-flex align-center gap-1"
                  >
                    <CheckCircle2 size={16} />
                    <span>Complete Adoption Handover</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectModalApp && (
        <div className="shelter-modal-overlay" onClick={() => setRejectModalApp(null)}>
          <div className="shelter-modal-card card shadow-lg p-4" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="h5 font-weight-bold mb-2">Reject Adoption Application</h3>
            <p className="text-muted font-size-xs mb-3">
              Please provide a professional reason for not approving this application. This note will be recorded and communicated to the applicant.
            </p>
            <form onSubmit={handleRejectSubmit}>
              <textarea
                rows={3}
                className="form-control mb-3 font-size-sm"
                placeholder="e.g. Living environment does not have secure fencing, pet requires experienced trainer..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                required
              />
              <div className="d-flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectModalApp(null)}
                  className="btn btn-outline btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !rejectionReason.trim()}
                  className="btn btn-danger btn-sm"
                >
                  {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REQUEST INFO MODAL */}
      {infoModalApp && (
        <div className="shelter-modal-overlay" onClick={() => setInfoModalApp(null)}>
          <div className="shelter-modal-card card shadow-lg p-4" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="h5 font-weight-bold mb-2">Request Additional Information</h3>
            <p className="text-muted font-size-xs mb-3">
              Ask the applicant for clarification regarding their home setup, schedule, or veterinary references.
            </p>
            <form onSubmit={handleInfoSubmit}>
              <textarea
                rows={3}
                className="form-control mb-3 font-size-sm"
                placeholder="e.g. Could you confirm if your apartment landlord allows pets, or who will look after the pet while you travel?"
                value={informationRequest}
                onChange={(e) => setInformationRequest(e.target.value)}
                required
              />
              <div className="d-flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setInfoModalApp(null)}
                  className="btn btn-outline btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !informationRequest.trim()}
                  className="btn btn-primary btn-sm"
                >
                  {actionLoading ? 'Sending...' : 'Send Request to Adopter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPLETE ADOPTION CONFIRMATION MODAL */}
      {completeConfirmApp && (
        <div className="shelter-modal-overlay" onClick={() => setCompleteConfirmApp(null)}>
          <div className="shelter-modal-card card shadow-lg p-4 text-center" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
            <div className="complete-icon-badge mx-auto mb-2 bg-success-soft text-success p-3 rounded-circle d-inline-flex">
              <Award size={36} />
            </div>
            <h3 className="h5 font-weight-bold mb-1">Finalize Adoption Handover?</h3>
            <p className="text-muted font-size-sm mb-4">
              Confirming this will mark <strong>{completeConfirmApp.pet?.petName}</strong> as officially Adopted, close competing active applications, and archive the permanent adoption certificate in MongoDB.
            </p>
            <div className="d-flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setCompleteConfirmApp(null)}
                className="btn btn-outline btn-sm"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCompleteAdoption}
                className="btn btn-success btn-sm"
                disabled={actionLoading}
              >
                {actionLoading ? 'Finalizing Handover...' : 'Yes, Complete Adoption'}
              </button>
            </div>
          </div>
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
          applicationStatus={mapApp.applicationStatus}
        />
      )}
    </ShelterLayout>
  );
};

export default ShelterApplications;
