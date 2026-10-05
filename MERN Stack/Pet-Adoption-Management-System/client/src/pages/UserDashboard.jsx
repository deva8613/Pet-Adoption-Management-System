import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { applicationAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import AdoptionMapModal from '../components/AdoptionMapModal';
import { Navigation } from 'lucide-react';

const UserDashboard = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapApp, setMapApp] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await applicationAPI.getMyApplications();
      if (res.success) {
        setApplications(res.data || []);
      } else {
        setError(res.message || 'Failed to load applications');
      }
    } catch (err) {
      setError(err.message || 'Error fetching applications');
    } finally {
      setLoading(false);
    }
  };

  const totalApps = applications.length;
  const pendingApps = applications.filter(a => a.applicationStatus === 'Pending').length;
  const approvedApps = applications.filter(a => a.applicationStatus === 'Approved').length;
  const successfulApps = applications.filter(a => a.applicationStatus === 'Successful').length;

  return (
    <div className="dashboard-layout container section-padding">
      <Sidebar />

      <main className="dashboard-content">
        <div className="dashboard-header">
          <h1>Welcome back, {user?.name}!</h1>
          <p className="subtitle">Track your pet adoption applications and delivery route maps.</p>
        </div>

        <div className="grid grid-4 mb-5">
          <StatCard title="Total Applications" value={totalApps} icon="📋" />
          <StatCard title="Pending Applications" value={pendingApps} icon="⏳" />
          <StatCard title="Approved Applications" value={approvedApps} icon="✅" />
          <StatCard title="Adopted Pets" value={successfulApps} icon="🐾" />
        </div>

        <div className="card dashboard-section">
          <h2 className="section-title mb-4">Recent Applications</h2>

          {loading ? (
            <LoadingSpinner message="Loading your applications..." />
          ) : error ? (
            <ErrorMessage message={error} />
          ) : applications.length === 0 ? (
            <div className="empty-state-card text-center p-5">
              <span className="empty-icon">🐾</span>
              <h3>No adoption applications yet.</h3>
              <p>Explore available pets and apply today!</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Pet Name</th>
                    <th>Status</th>
                    <th>Applied On</th>
                    <th>Route Map</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map(app => (
                    <tr key={app._id}>
                      <td><strong>{app.pet?.petName || 'Pet'}</strong></td>
                      <td>
                        <StatusBadge status={app.applicationStatus} />
                        {app.closingReason && (
                          <div style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '2px' }}>
                            {app.closingReason}
                          </div>
                        )}
                        {app.driverInfo && (app.driverInfo.name || app.driverInfo.driverName) && (
                          <div style={{ fontSize: '0.75rem', color: '#15803d', marginTop: '4px', fontWeight: 600 }}>
                            🚚 Driver: {app.driverInfo.name || app.driverInfo.driverName}<br />
                            📅 {app.scheduledDeliveryDate ? new Date(app.scheduledDeliveryDate).toLocaleDateString() : 'Scheduled'} ({app.scheduledDeliveryTime || 'Slot'})
                          </div>
                        )}
                      </td>
                      <td>{new Date(app.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          onClick={() => setMapApp(app)}
                          className="btn btn-outline btn-xs"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Navigation size={12} /> Map Path
                        </button>
                      </td>
                      <td>
                        <Link to={`/adoption-status/${app._id}`} className="btn btn-outline btn-xs me-1">Track Delivery</Link>
                        <a href={`/pets/${app.petId}`} className="btn btn-outline btn-xs">View Pet</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Map Modal */}
        {mapApp && (
          <AdoptionMapModal
            isOpen={!!mapApp}
            onClose={() => setMapApp(null)}
            petName={mapApp.pet?.petName || 'Pet'}
            shelterInfo={mapApp.owner || { shelterName: 'Shelter', district: mapApp.pet?.district || 'Chennai' }}
            adopterInfo={mapApp.applicant || { name: user?.name, district: user?.district || 'Coimbatore' }}
            applicationStatus={mapApp.applicationStatus}
            driverInfo={mapApp.driverInfo}
            scheduledDeliveryDate={mapApp.scheduledDeliveryDate}
            scheduledDeliveryTime={mapApp.scheduledDeliveryTime}
          />
        )}
      </main>
    </div>
  );
};

export default UserDashboard;
