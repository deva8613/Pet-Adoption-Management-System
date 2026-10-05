import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { shelterAPI } from '../services/api';
import ShelterLayout from '../components/ShelterLayout';
import ShelterVerificationBanner from '../components/ShelterVerificationBanner';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import AdoptionMapModal from '../components/AdoptionMapModal';
import {
  PawPrint,
  Clock,
  CheckCircle2,
  Heart,
  PlusCircle,
  ArrowRight,
  ClipboardList,
  Eye,
  Edit,
  Navigation,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  FileText,
  Calendar,
  Sparkles
} from 'lucide-react';

const ShelterDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapApp, setMapApp] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await shelterAPI.getDashboardStats();
      if (res.success && res.data) {
        setStats(res.data);
      } else {
        setError(res.message || 'Failed to load shelter dashboard data');
      }
    } catch (err) {
      setError(err.message || 'Error retrieving shelter statistics');
    } finally {
      setLoading(false);
    }
  };

  const shelterDisplayName = stats?.shelter?.shelterName || user?.shelterName || user?.name || 'Shelter Partner';

  const getStatusBadge = (status) => {
    const s = (status || 'PENDING').toUpperCase();
    let badgeClass = 'shelter-status-pending';
    let label = status;

    if (s.includes('APPROV')) {
      badgeClass = 'shelter-status-approved';
      label = 'APPROVED';
    } else if (s.includes('REJECT')) {
      badgeClass = 'shelter-status-rejected';
      label = 'REJECTED';
    } else if (s.includes('REVIEW')) {
      badgeClass = 'shelter-status-review';
      label = 'UNDER REVIEW';
    } else if (s.includes('NEED') || s.includes('INFO')) {
      badgeClass = 'shelter-status-info';
      label = 'NEEDS INFO';
    } else if (s.includes('SUCCESS') || s.includes('COMPLET')) {
      badgeClass = 'shelter-status-completed';
      label = 'COMPLETED';
    }

    return (
      <span className={`shelter-badge ${badgeClass}`}>
        {label}
      </span>
    );
  };

  const pendingCount = stats?.pendingApplications || 0;
  const underReviewCount = stats?.underReviewApplications || 0;
  const approvedCount = stats?.approvedApplications || 0;
  const completedCount = stats?.successfulAdoptions || 0;
  const totalAppsCount = pendingCount + underReviewCount + approvedCount + completedCount;

  return (
    <ShelterLayout
      title="Shelter Dashboard"
      subtitle="Overview of operations, applications, and animal care activities."
      activePage="/shelter/dashboard"
      actions={
        <Link to="/shelter/add-pet" className="btn btn-primary btn-sm d-flex align-center gap-2">
          <PlusCircle size={16} />
          <span>Add New Pet</span>
        </Link>
      }
    >
      {/* Verification Notice Banner if not approved */}
      {user?.verificationStatus && user.verificationStatus !== 'Approved' && (
        <ShelterVerificationBanner
          status={user.verificationStatus}
          reason={user.verificationReason}
        />
      )}

      {loading ? (
        <div className="shelter-loading-box card p-5 text-center">
          <LoadingSpinner message="Loading shelter dashboard metrics..." />
        </div>
      ) : error ? (
        <div className="card p-4 mb-4">
          <ErrorMessage message={error} />
          <button onClick={fetchDashboardData} className="btn btn-outline btn-sm mt-3">
            Retry Loading
          </button>
        </div>
      ) : (
        <>
          {/* Welcome Greeting Banner */}
          <div className="shelter-welcome-banner card shadow-sm p-4 mb-4">
            <div className="d-flex justify-between align-center flex-wrap gap-3">
              <div className="welcome-text-col">
                <span className="shelter-portal-pill mb-2 d-inline-flex align-center gap-1">
                  <Sparkles size={13} />
                  <span>Verified Shelter Operations Hub</span>
                </span>
                <h2 className="welcome-heading mb-1">
                  Welcome back, {shelterDisplayName} 👋
                </h2>
                <p className="welcome-subtext mb-0">
                  Manage your pets, adoption applications and rescue activities from one place.
                </p>
              </div>

              <div className="welcome-actions-col d-flex align-center gap-2 flex-wrap">
                <Link to="/shelter/pets" className="btn btn-outline btn-sm">
                  <PawPrint size={15} />
                  <span>View Pet Inventory</span>
                </Link>
                <Link to="/shelter/add-pet" className="btn btn-primary btn-sm">
                  <PlusCircle size={15} />
                  <span>List New Pet</span>
                </Link>
              </div>
            </div>
          </div>

          {/* 4 REAL STAT CARDS FROM MONGODB */}
          <div className="shelter-stats-grid mb-4">
            {/* Total Pets */}
            <div className="shelter-stat-card card shadow-sm p-4">
              <div className="d-flex justify-between align-start mb-2">
                <div>
                  <span className="stat-card-title">Total Pets</span>
                  <h3 className="stat-card-number text-primary mt-1 mb-0">
                    {stats?.totalPets || 0}
                  </h3>
                </div>
                <div className="stat-card-icon-wrap stat-icon-teal">
                  <PawPrint size={22} />
                </div>
              </div>
              <p className="stat-card-desc mb-0 text-muted font-size-xs">
                {stats?.totalPets === 1 ? '1 animal registered' : `${stats?.totalPets || 0} animals registered under shelter`}
              </p>
            </div>

            {/* Available Pets */}
            <div className="shelter-stat-card card shadow-sm p-4">
              <div className="d-flex justify-between align-start mb-2">
                <div>
                  <span className="stat-card-title">Available Pets</span>
                  <h3 className="stat-card-number text-success mt-1 mb-0">
                    {stats?.availablePets || 0}
                  </h3>
                </div>
                <div className="stat-card-icon-wrap stat-icon-green">
                  <CheckCircle size={22} />
                </div>
              </div>
              <p className="stat-card-desc mb-0 text-muted font-size-xs">
                Actively ready for adopter applications
              </p>
            </div>

            {/* Pending Applications */}
            <div className="shelter-stat-card card shadow-sm p-4">
              <div className="d-flex justify-between align-start mb-2">
                <div>
                  <span className="stat-card-title">Pending Applications</span>
                  <h3 className="stat-card-number text-warning mt-1 mb-0">
                    {stats?.pendingApplications || 0}
                  </h3>
                </div>
                <div className="stat-card-icon-wrap stat-icon-amber">
                  <Clock size={22} />
                </div>
              </div>
              <p className="stat-card-desc mb-0 text-muted font-size-xs">
                Awaiting your evaluation &amp; response
              </p>
            </div>

            {/* Successful Adoptions */}
            <div className="shelter-stat-card card shadow-sm p-4">
              <div className="d-flex justify-between align-start mb-2">
                <div>
                  <span className="stat-card-title">Successful Adoptions</span>
                  <h3 className="stat-card-number text-indigo mt-1 mb-0">
                    {stats?.successfulAdoptions || 0}
                  </h3>
                </div>
                <div className="stat-card-icon-wrap stat-icon-indigo">
                  <CheckCircle2 size={22} />
                </div>
              </div>
              <p className="stat-card-desc mb-0 text-muted font-size-xs">
                Completed animal handovers recorded
              </p>
            </div>
          </div>

          {/* ADOPTION OVERVIEW SECTION */}
          <div className="shelter-overview-card card shadow-sm p-4 mb-4">
            <div className="d-flex justify-between align-center mb-3 flex-wrap gap-2">
              <div>
                <h3 className="h5 font-weight-bold mb-1 d-flex align-center gap-2">
                  <ClipboardList size={18} className="text-primary" />
                  <span>Adoption Workflow Pipeline</span>
                </h3>
                <p className="text-muted font-size-xs mb-0">
                  Real-time status breakdown of incoming adoption requests across your shelter.
                </p>
              </div>

              <Link to="/shelter/applications" className="btn btn-outline btn-sm font-size-xs">
                <span>View Full Pipeline</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {/* Visual Distribution Grid */}
            <div className="shelter-pipeline-grid">
              <div className="pipeline-metric-box">
                <div className="d-flex justify-between align-center mb-1">
                  <span className="pipeline-label">Pending</span>
                  <span className="pipeline-count text-warning font-weight-bold">{pendingCount}</span>
                </div>
                <div className="pipeline-bar-bg">
                  <div
                    className="pipeline-bar-fill bg-warning"
                    style={{ width: `${totalAppsCount > 0 ? (pendingCount / totalAppsCount) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="pipeline-metric-box">
                <div className="d-flex justify-between align-center mb-1">
                  <span className="pipeline-label">Under Review</span>
                  <span className="pipeline-count text-info font-weight-bold">{underReviewCount}</span>
                </div>
                <div className="pipeline-bar-bg">
                  <div
                    className="pipeline-bar-fill bg-info"
                    style={{ width: `${totalAppsCount > 0 ? (underReviewCount / totalAppsCount) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="pipeline-metric-box">
                <div className="d-flex justify-between align-center mb-1">
                  <span className="pipeline-label">Approved</span>
                  <span className="pipeline-count text-teal font-weight-bold">{approvedCount}</span>
                </div>
                <div className="pipeline-bar-bg">
                  <div
                    className="pipeline-bar-fill bg-teal"
                    style={{ width: `${totalAppsCount > 0 ? (approvedCount / totalAppsCount) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="pipeline-metric-box">
                <div className="d-flex justify-between align-center mb-1">
                  <span className="pipeline-label">Completed</span>
                  <span className="pipeline-count text-success font-weight-bold">{completedCount}</span>
                </div>
                <div className="pipeline-bar-bg">
                  <div
                    className="pipeline-bar-fill bg-success"
                    style={{ width: `${totalAppsCount > 0 ? (completedCount / totalAppsCount) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* TWO COLUMN GRID: RECENT APPLICATIONS & RECENT PETS */}
          <div className="shelter-dashboard-grid mb-4">
            {/* RECENT APPLICATIONS */}
            <div className="shelter-recent-apps-container card shadow-sm p-4">
              <div className="d-flex justify-between align-center mb-3">
                <div>
                  <h3 className="h5 font-weight-bold mb-1">Recent Applications</h3>
                  <p className="text-muted font-size-xs mb-0">Latest adoption requests received</p>
                </div>
                <Link to="/shelter/applications" className="btn btn-outline btn-xs d-flex align-center gap-1">
                  <span>View All</span>
                  <ArrowRight size={12} />
                </Link>
              </div>

              {(!stats?.recentApplications || stats.recentApplications.length === 0) ? (
                <div className="shelter-empty-state p-4 text-center">
                  <ClipboardList size={36} className="text-muted mb-2 mx-auto" />
                  <h4 className="font-size-md font-weight-medium mb-1">No applications received yet</h4>
                  <p className="text-muted font-size-xs mb-3">
                    When prospective adopters apply for your listed pets, their requests will appear here.
                  </p>
                  <Link to="/shelter/add-pet" className="btn btn-primary btn-xs">
                    List a Pet to Attract Adopters
                  </Link>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="shelter-mini-table">
                    <thead>
                      <tr>
                        <th>Applicant</th>
                        <th>Pet</th>
                        <th>Applied Date</th>
                        <th>Status</th>
                        <th className="text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentApplications.map((app) => (
                        <tr key={app._id}>
                          <td>
                            <div className="mini-applicant-info">
                              <span className="font-weight-medium font-size-sm d-block text-truncate">
                                {app.applicant?.name || app.applicantDetails?.name || 'Applicant'}
                              </span>
                              <span className="text-muted font-size-xs text-truncate d-block">
                                {app.applicant?.email || app.applicantDetails?.email || ''}
                              </span>
                            </div>
                          </td>

                          <td>
                            <div className="d-flex align-center gap-2">
                              {app.pet?.images?.[0] ? (
                                <img
                                  src={app.pet.images[0]}
                                  alt={app.pet.petName}
                                  className="mini-pet-thumb"
                                />
                              ) : (
                                <div className="mini-pet-placeholder">🐾</div>
                              )}
                              <span className="font-weight-medium font-size-sm">
                                {app.pet?.petName || 'Pet'}
                              </span>
                            </div>
                          </td>

                          <td>
                            <span className="text-muted font-size-xs">
                              {new Date(app.createdAt).toLocaleDateString()}
                            </span>
                          </td>

                          <td>
                            {getStatusBadge(app.applicationStatus)}
                          </td>

                          <td className="text-right">
                            <div className="d-flex justify-end gap-1">
                              <Link
                                to="/shelter/applications"
                                className="btn btn-outline btn-xs"
                                title="Review Application"
                              >
                                <Eye size={12} />
                                <span>Review</span>
                              </Link>
                              {app.routeCoordinates && (
                                <button
                                  onClick={() => setMapApp(app)}
                                  className="btn btn-outline btn-xs"
                                  title="View Transport Map"
                                >
                                  <Navigation size={12} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* RECENT PETS */}
            <div className="shelter-recent-pets-container card shadow-sm p-4">
              <div className="d-flex justify-between align-center mb-3">
                <div>
                  <h3 className="h5 font-weight-bold mb-1">Recent Pets Listed</h3>
                  <p className="text-muted font-size-xs mb-0">Animals recently listed in your shelter</p>
                </div>
                <Link to="/shelter/pets" className="btn btn-outline btn-xs d-flex align-center gap-1">
                  <span>View All</span>
                  <ArrowRight size={12} />
                </Link>
              </div>

              {(!stats?.recentPets || stats.recentPets.length === 0) ? (
                <div className="shelter-empty-state p-4 text-center">
                  <PawPrint size={36} className="text-muted mb-2 mx-auto" />
                  <h4 className="font-size-md font-weight-medium mb-1">No pets added yet</h4>
                  <p className="text-muted font-size-xs mb-3">
                    Start publishing pet profiles to connect them with loving forever homes.
                  </p>
                  <Link to="/shelter/add-pet" className="btn btn-primary btn-xs">
                    + Add First Pet
                  </Link>
                </div>
              ) : (
                <div className="shelter-recent-pets-grid">
                  {stats.recentPets.map((pet) => {
                    const isAvailable = (pet.adoptionStatus || 'Available') === 'Available';
                    return (
                      <div key={pet._id} className="shelter-pet-mini-card">
                        <div className="pet-mini-image-wrap">
                          <img
                            src={
                              pet.images?.[0] ||
                              'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=400&q=80'
                            }
                            alt={pet.petName}
                            className="pet-mini-image"
                          />
                          <span className={`pet-mini-status-badge ${isAvailable ? 'available' : 'adopted'}`}>
                            {pet.adoptionStatus || 'Available'}
                          </span>
                        </div>

                        <div className="pet-mini-body p-2">
                          <h4 className="pet-mini-name mb-0 text-truncate">{pet.petName}</h4>
                          <span className="pet-mini-breed text-muted font-size-xs d-block text-truncate">
                            {pet.breed} · {pet.age}
                          </span>
                          <div className="d-flex justify-between align-center mt-2 pt-1 border-top">
                            <span className="font-size-xs text-muted">{pet.gender}</span>
                            <Link
                              to="/shelter/pets"
                              className="btn btn-link btn-xs p-0 text-primary font-weight-bold"
                            >
                              Manage &rarr;
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Transport Route Map Modal */}
      {mapApp && (
        <AdoptionMapModal
          isOpen={!!mapApp}
          onClose={() => setMapApp(null)}
          petName={mapApp.pet?.petName || 'Pet'}
          shelterInfo={mapApp.owner || { shelterName: shelterDisplayName, district: user?.district || 'Tamil Nadu' }}
          adopterInfo={mapApp.applicant || { name: mapApp.applicantDetails?.name, district: mapApp.applicantDistrict }}
          applicationStatus={mapApp.applicationStatus}
        />
      )}
    </ShelterLayout>
  );
};

export default ShelterDashboard;
