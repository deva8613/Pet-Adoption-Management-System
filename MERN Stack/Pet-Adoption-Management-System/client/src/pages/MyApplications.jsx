import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { applicationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import AdoptionMapModal from '../components/AdoptionMapModal';
import Sidebar from '../components/Sidebar';
import {
  ClipboardList, CheckCircle2, Clock, AlertCircle, XCircle,
  Navigation, PawPrint, Building2, Calendar, Phone, ArrowRight, ShieldCheck, HeartHandshake
} from 'lucide-react';

// Section 19 Visual Timeline Component
const ApplicationTimeline = ({ status, createdAt, approvedAt, completedAt, rejectedAt, closingReason, infoRequest }) => {
  // Timeline Stages:
  // 1. Application Submitted
  // 2. Under Review
  // 3. Verification & Info
  // 4. Decision (Approved or Rejected)
  // 5. Adoption Completed

  const isRejected = status === 'Rejected';
  const isCancelled = status === 'Cancelled';
  const isApproved = ['Approved', 'Successful', 'Completed'].includes(status);
  const isCompleted = ['Successful', 'Completed'].includes(status);
  const isUnderReview = ['Under Review', 'Needs Information', 'Approved', 'Successful', 'Completed'].includes(status);
  const isNeedsInfo = status === 'Needs Information';

  return (
    <div className="paw-application-timeline my-3 p-3 bg-light rounded">
      <div className="timeline-steps-container">
        {/* Step 1: Submitted */}
        <div className="timeline-step completed">
          <div className="timeline-node">
            <CheckCircle2 size={16} />
          </div>
          <div className="timeline-content">
            <span className="timeline-title">Submitted</span>
            <small className="timeline-date">{new Date(createdAt).toLocaleDateString()}</small>
          </div>
        </div>

        {/* Step 2: Under Review */}
        <div className={`timeline-step ${isUnderReview ? 'completed' : status === 'Pending' ? 'active' : ''}`}>
          <div className="timeline-node">
            {isUnderReview ? <CheckCircle2 size={16} /> : <Clock size={16} />}
          </div>
          <div className="timeline-content">
            <span className="timeline-title">Under Review</span>
            <small className="timeline-status-text">
              {status === 'Pending' ? 'In queue' : 'Reviewed by shelter'}
            </small>
          </div>
        </div>

        {/* Step 3: Verification / Info */}
        <div className={`timeline-step ${isNeedsInfo ? 'warning' : isApproved ? 'completed' : isUnderReview ? 'active' : ''}`}>
          <div className="timeline-node">
            {isNeedsInfo ? <AlertCircle size={16} /> : isApproved ? <CheckCircle2 size={16} /> : <ShieldCheck size={16} />}
          </div>
          <div className="timeline-content">
            <span className="timeline-title">{isNeedsInfo ? 'Needs Information' : 'Verification'}</span>
            <small className="timeline-status-text">
              {isNeedsInfo ? 'Shelter requested details' : 'Living space check'}
            </small>
          </div>
        </div>

        {/* Step 4: Decision */}
        <div className={`timeline-step ${isRejected ? 'rejected' : isApproved ? 'completed' : ''}`}>
          <div className="timeline-node">
            {isRejected ? <XCircle size={16} /> : isApproved ? <CheckCircle2 size={16} /> : <Clock size={16} />}
          </div>
          <div className="timeline-content">
            <span className="timeline-title">
              {isRejected ? 'Application Rejected' : isApproved ? 'Approved' : 'Decision Pending'}
            </span>
            <small className="timeline-status-text">
              {isRejected ? 'See shelter reason below' : isApproved ? 'Ready for handover' : 'Pending review'}
            </small>
          </div>
        </div>

        {/* Step 5: Adoption Completed */}
        <div className={`timeline-step ${isCompleted ? 'completed success' : ''}`}>
          <div className="timeline-node">
            <HeartHandshake size={16} />
          </div>
          <div className="timeline-content">
            <span className="timeline-title">Adoption Completed</span>
            <small className="timeline-status-text">
              {isCompleted ? 'Pet officially adopted!' : 'Final handover'}
            </small>
          </div>
        </div>
      </div>

      {/* Rejection / Info callouts */}
      {isRejected && closingReason && (
        <div className="alert alert-danger mt-2 mb-0 py-2 font-size-sm">
          <strong>Rejection Reason from Shelter:</strong> {closingReason}
        </div>
      )}

      {isNeedsInfo && infoRequest && (
        <div className="alert alert-warning mt-2 mb-0 py-2 font-size-sm">
          <strong>Shelter Note:</strong> {infoRequest}
        </div>
      )}
    </div>
  );
};

const MyApplications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapApp, setMapApp] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await applicationAPI.getMyApplications();
      if (res.success) {
        setApplications(res.data || []);
      } else {
        setError(res.message || 'Failed to load your applications');
      }
    } catch (err) {
      setError(err.message || 'Error retrieving applications from database');
    } finally {
      setLoading(false);
    }
  };

  const filteredApps = applications.filter((app) => {
    if (statusFilter === 'All') return true;
    if (statusFilter === 'Completed') return ['Successful', 'Completed'].includes(app.applicationStatus);
    return app.applicationStatus === statusFilter;
  });

  return (
    <div className="dashboard-layout container section-padding">
      <Sidebar />

      <main className="dashboard-content">
        <div className="dashboard-header d-flex justify-between align-center flex-wrap gap-3 mb-4">
          <div>
            <span className="badge-pill mb-1">Applicant Portal</span>
            <h1>My Applications</h1>
            <p className="subtitle">
              Follow every step of your adoption journey with real-time status timelines and delivery routes.
            </p>
          </div>

          <Link to="/pets" className="btn btn-primary btn-sm">
            <PawPrint size={16} />
            <span>Browse More Pets</span>
          </Link>
        </div>

        {/* Filter bar */}
        <div className="filter-pill-bar d-flex gap-2 flex-wrap mb-4">
          {['All', 'Pending', 'Needs Information', 'Approved', 'Completed', 'Rejected'].map((status) => (
            <button
              key={status}
              type="button"
              className={`filter-pill-btn ${statusFilter === status ? 'active' : ''}`}
              onClick={() => setStatusFilter(status)}
            >
              {status}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingSpinner message="Retrieving your adoption applications..." />
        ) : error ? (
          <ErrorMessage message={error} />
        ) : filteredApps.length === 0 ? (
          <div className="card text-center p-5 empty-apps-card">
            <ClipboardList size={48} className="text-teal mb-3 mx-auto" />
            <h3>No applications found</h3>
            <p className="text-muted max-w-md mx-auto mb-4">
              {statusFilter === 'All'
                ? "You haven't submitted any adoption applications yet. Browse available companions and find your match!"
                : `You don't have any applications currently in "${statusFilter}" status.`}
            </p>
            <Link to="/pets" className="btn btn-primary">
              Explore Available Pets
            </Link>
          </div>
        ) : (
          <div className="applications-stack d-flex flex-column gap-4">
            {filteredApps.map((app) => {
              const pet = app.pet;
              const shelter = app.owner;
              const petName = pet?.petName || 'Pet Record';
              const petImage =
                pet?.images?.[0] ||
                'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80';
              const shelterName = shelter?.shelterName || shelter?.name || 'PawHomes Partner Shelter';
              const shelterPhone = shelter?.phone || 'Contact via PawHomes';

              return (
                <div key={app._id} className="card application-detail-card shadow-sm p-4">
                  {/* Header Row */}
                  <div className="d-flex justify-between align-center flex-wrap gap-2 pb-3 border-bottom">
                    <div>
                      <span className="font-size-xs text-muted">APPLICATION ID:</span>
                      <strong className="font-monospace text-teal ms-1">{app._id}</strong>
                    </div>
                    <div className="d-flex align-center gap-2">
                      <span className="font-size-xs text-muted">STATUS:</span>
                      <StatusBadge status={app.applicationStatus} />
                    </div>
                  </div>

                  {/* Pet and Shelter Info */}
                  <div className="grid grid-2 gap-4 py-3 align-center">
                    <div className="d-flex align-center gap-3">
                      <img
                        src={petImage}
                        alt={petName}
                        className="application-pet-img rounded"
                      />
                      <div>
                        <h3 className="mb-1">{petName}</h3>
                        <p className="text-muted font-size-sm mb-1">
                          {pet?.breed} ({pet?.species}) · {pet?.gender} · {pet?.age}
                        </p>
                        <span className="font-size-xs text-muted">
                          📍 Shelter Location: {pet?.district || pet?.location || 'Tamil Nadu'}
                        </span>
                      </div>
                    </div>

                    <div className="shelter-contact-box p-3 bg-light rounded">
                      <div className="d-flex align-center gap-2 mb-1">
                        <Building2 size={16} className="text-teal" />
                        <strong>{shelterName}</strong>
                      </div>
                      <div className="font-size-xs text-muted mb-2">
                        <span>📞 Phone: {shelterPhone}</span>
                      </div>
                      <div className="font-size-xs text-muted">
                        <span>🗓️ Applied on: {new Date(app.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 19 VISUAL TIMELINE */}
                  <ApplicationTimeline
                    status={app.applicationStatus}
                    createdAt={app.createdAt}
                    approvedAt={app.approvedAt}
                    completedAt={app.completedAt || app.successfulAt}
                    rejectedAt={app.rejectedAt}
                    closingReason={app.rejectionReason || app.closingReason}
                    infoRequest={app.informationRequest}
                  />

                  {/* Actions Row */}
                  <div className="d-flex justify-between align-center pt-3 border-top flex-wrap gap-2">
                    <div className="d-flex gap-2">
                      <button
                        onClick={() => setMapApp(app)}
                        className="btn btn-outline btn-sm d-flex align-center gap-1"
                      >
                        <Navigation size={14} />
                        <span>View Route Map</span>
                      </button>

                      {['Successful', 'Completed'].includes(app.applicationStatus) && pet && (
                        <Link
                          to={`/care/${pet._id}`}
                          className="btn btn-secondary btn-sm"
                        >
                          📋 Adoption Certificate &amp; Health Records
                        </Link>
                      )}
                    </div>

                    <Link
                      to={`/pets/${app.petId}`}
                      className="btn btn-outline btn-sm"
                    >
                      View Pet Profile →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Route Map Modal */}
        {mapApp && (
          <AdoptionMapModal
            isOpen={!!mapApp}
            onClose={() => setMapApp(null)}
            petName={mapApp.pet?.petName || 'Pet'}
            shelterInfo={mapApp.owner || { shelterName: 'Shelter', district: mapApp.pet?.district || 'Tamil Nadu' }}
            adopterInfo={mapApp.applicant || { name: user?.name, district: user?.district || 'Tamil Nadu' }}
            applicationStatus={mapApp.applicationStatus}
          />
        )}
      </main>
    </div>
  );
};

export default MyApplications;
