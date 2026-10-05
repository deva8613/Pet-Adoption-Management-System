import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applicationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import Sidebar from '../components/Sidebar';
import AdoptionMapModal from '../components/AdoptionMapModal';
import { Navigation } from 'lucide-react';

const AdoptionHistory = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapApp, setMapApp] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await applicationAPI.getMyApplications();
      if (res.success) {
        // Filter only Successful adoptions
        const successfulAdoptions = (res.data || []).filter(
          app => app.applicationStatus === 'Successful'
        );
        setHistory(successfulAdoptions);
      } else {
        setError(res.message || 'Failed to load adoption history');
      }
    } catch (err) {
      setError(err.message || 'Error fetching history');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-layout container section-padding">
      <Sidebar />

      <main className="dashboard-content">
        <div className="dashboard-header">
          <h1>Adoption History</h1>
          <p className="subtitle">Your finalized pet adoptions and delivery routes.</p>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading adoption history..." />
        ) : error ? (
          <ErrorMessage message={error} />
        ) : history.length === 0 ? (
          <div className="empty-state-card text-center p-5">
            <span className="empty-icon">🏆</span>
            <h3>No Successful Adoptions Yet</h3>
            <p>Once your adoption application is approved and completed by the shelter, your happy companion story will appear here!</p>
          </div>
        ) : (
          <div className="grid grid-3">
            {history.map(record => (
              <div key={record._id} className="card pet-history-card">
                <div className="history-image-wrap">
                  <img
                    src={record.pet?.images?.[0] || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80'}
                    alt={record.pet?.petName || 'Adopted Pet'}
                  />
                  <StatusBadge status="Successful" />
                </div>
                <div className="card-body">
                  <h3>{record.pet?.petName || 'Pet'}</h3>
                  <p className="text-muted">{record.pet?.breed} ({record.pet?.species})</p>
                  <hr />
                  <p className="small"><strong>Adopted On:</strong> {record.successfulAt ? new Date(record.successfulAt).toLocaleDateString() : 'N/A'}</p>
                  <p className="small"><strong>Shelter:</strong> {record.owner?.shelterName || record.owner?.name || 'Partner Shelter'}</p>
                  <div className="d-flex flex-column gap-2 mt-3">
                    <Link to={`/care/${record.pet?._id}`} className="btn btn-primary btn-sm full-width text-center">
                      📋 Health Records &amp; Certificate
                    </Link>
                    <button
                      onClick={() => setMapApp(record)}
                      className="btn btn-outline btn-sm full-width"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <Navigation size={14} color="#4f46e5" /> View Transport Route Map
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Map Modal */}
        {mapApp && (
          <AdoptionMapModal
            isOpen={!!mapApp}
            onClose={() => setMapApp(null)}
            petName={mapApp.pet?.petName || 'Pet'}
            shelterInfo={mapApp.owner || { shelterName: 'Shelter', district: mapApp.pet?.district || 'Chennai' }}
            adopterInfo={mapApp.applicant || { name: user?.name, district: user?.district || 'Coimbatore' }}
            applicationStatus="Successful"
          />
        )}
      </main>
    </div>
  );
};

export default AdoptionHistory;
