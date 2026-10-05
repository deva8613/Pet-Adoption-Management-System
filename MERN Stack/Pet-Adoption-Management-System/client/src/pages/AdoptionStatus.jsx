import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { applicationAPI } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import AdoptionMapModal from '../components/AdoptionMapModal';
import { CheckCircle2, Clock, MapPin, Navigation, ArrowRight, ShieldCheck, Heart } from 'lucide-react';

const AdoptionStatus = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);

  useEffect(() => {
    fetchApplicationDetails();
  }, [id]);

  const fetchApplicationDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await applicationAPI.getMyApplications();
      if (res.success && res.data) {
        const found = res.data.find(a => a._id?.toString() === id?.toString());
        if (found) {
          setApplication(found);
        } else {
          setError('Application details not found or unauthorized.');
        }
      } else {
        setError(res.message || 'Failed to load application status.');
      }
    } catch (err) {
      setError(err.message || 'Error loading application status.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Retrieving application status from PawHomes database..." />;
  if (error) return <div className="container section-padding"><ErrorMessage message={error} /><div className="mt-4"><Link to="/dashboard" className="btn btn-primary">Go to Dashboard</Link></div></div>;
  if (!application) return null;

  const { pet, applicant, owner, applicationStatus, createdAt, _id, reasonForAdoption, experienceWithPets, livingSituation, preferredContact } = application;
  const petName = pet?.petName || 'Pet';
  const petImage = pet?.images?.[0] || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="section-padding container">
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Success Banner Header */}
        <div style={{
          backgroundColor: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: '16px',
          padding: '24px',
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <CheckCircle2 size={36} color="#ffffff" />
          </div>
          <h1 style={{ color: '#065f46', fontSize: '1.75rem', marginBottom: '8px' }}>Adoption Application Submitted!</h1>
          <p style={{ color: '#047857', fontSize: '1rem', margin: 0 }}>
            Your application for <strong>{petName}</strong> has been successfully registered with PawHomes.
          </p>
        </div>

        {/* Application Details Card */}
        <div className="card shadow-sm p-4 mb-4">
          <div className="d-flex justify-between align-center mb-4 flex-wrap gap-2" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
            <div>
              <span className="text-muted" style={{ fontSize: '0.85rem' }}>APPLICATION REFERENCE ID</span>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontFamily: 'monospace', color: '#4f46e5' }}>{_id}</h3>
            </div>
            <div className="text-right">
              <span className="text-muted" style={{ fontSize: '0.85rem', display: 'block' }}>CURRENT STATUS</span>
              <StatusBadge status={applicationStatus} />
            </div>
          </div>

          <div className="grid grid-2 gap-4 mb-4">
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <img
                src={petImage}
                alt={petName}
                style={{ width: '90px', height: '90px', borderRadius: '12px', objectFit: 'cover' }}
              />
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem' }}>{petName}</h3>
                <p className="text-muted" style={{ margin: '0 0 4px 0', fontSize: '0.9rem' }}>{pet?.breed || 'Pet'} • {pet?.species || 'Species'}</p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={14} color="#4f46e5" /> {pet?.district || pet?.location || 'Tamil Nadu'}
                </p>
              </div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.875rem' }}>
              <p style={{ margin: '0 0 6px 0' }}><strong>Submission Date:</strong> {new Date(createdAt).toLocaleString()}</p>
              <p style={{ margin: '0 0 6px 0' }}><strong>Applicant Name:</strong> {applicant?.name}</p>
              <p style={{ margin: '0 0 6px 0' }}><strong>Applicant District:</strong> {application.applicantDistrict || applicant?.district || applicant?.city}</p>
              <p style={{ margin: 0 }}><strong>Contact Method:</strong> {preferredContact}</p>
            </div>
          </div>

          {/* Form details section */}
          <div style={{ backgroundColor: '#fafafa', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: '#334155' }}>Submitted Information Summary</h4>
            <div style={{ fontSize: '0.9rem', color: '#475569' }}>
              <p style={{ margin: '0 0 8px 0' }}><strong>Reason for Adoption:</strong> {reasonForAdoption}</p>
              <p style={{ margin: '0 0 8px 0' }}><strong>Experience with Pets:</strong> {experienceWithPets}</p>
              <p style={{ margin: 0 }}><strong>Living Situation:</strong> {livingSituation}</p>
            </div>
          </div>

          {/* Driver & Delivery Allocation Card (If Approved or Successful) */}
          {application.driverInfo && (application.driverInfo.name || application.driverInfo.driverName) && (
            <div style={{
              backgroundColor: '#f0fdf4',
              border: '2px solid #86efac',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '24px',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <h3 style={{ margin: 0, color: '#15803d', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={22} color="#16a34a" /> Driver & Delivery Schedule Allocated
                </h3>
                <span style={{
                  backgroundColor: applicationStatus === 'SUCCESSFUL' || applicationStatus === 'Successful' ? '#dcfce7' : '#fef3c7',
                  color: applicationStatus === 'SUCCESSFUL' || applicationStatus === 'Successful' ? '#15803d' : '#b45309',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}>
                  {application.deliveryStatus || (applicationStatus === 'SUCCESSFUL' || applicationStatus === 'Successful' ? 'Delivered' : 'Scheduled')}
                </span>
              </div>

              <div className="grid grid-2 gap-3" style={{ fontSize: '0.92rem' }}>
                <div style={{ backgroundColor: '#ffffff', padding: '12px 16px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                  <div style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Assigned Driver</div>
                  <div style={{ color: '#0f172a', fontWeight: 700, fontSize: '1rem' }}>
                    👤 {application.driverInfo.name || application.driverInfo.driverName}
                  </div>
                  <div style={{ color: '#475569', marginTop: '2px' }}>
                    📞 <a href={`tel:${application.driverInfo.phone || application.driverInfo.driverPhone}`} style={{ color: '#2563eb', textDecoration: 'underline' }}>
                      {application.driverInfo.phone || application.driverInfo.driverPhone}
                    </a>
                  </div>
                  {application.driverInfo.vehicleNumber && (
                    <div style={{ color: '#475569', fontSize: '0.85rem', marginTop: '2px' }}>
                      🚘 Vehicle: <strong>{application.driverInfo.vehicleNumber}</strong>
                    </div>
                  )}
                </div>

                <div style={{ backgroundColor: '#ffffff', padding: '12px 16px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                  <div style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Scheduled Delivery Slot</div>
                  <div style={{ color: '#0f172a', fontWeight: 700, fontSize: '1rem' }}>
                    📅 {application.scheduledDeliveryDate ? new Date(application.scheduledDeliveryDate).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : 'As Scheduled'}
                  </div>
                  <div style={{ color: '#4f46e5', fontWeight: 600, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={15} /> Slot: {application.scheduledDeliveryTime || 'Morning (9 AM - 12 PM)'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* What happens next box */}
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
            <h4 style={{ color: '#166534', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem' }}>
              <Clock size={16} /> What Happens Next?
            </h4>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#15803d', fontSize: '0.875rem', lineHeight: '1.5' }}>
              {applicationStatus === 'APPROVED' || applicationStatus === 'Approved' ? (
                <>
                  <li><strong>Driver & Time Slot Allocated:</strong> Your transport specialist is scheduled to deliver {petName} on <strong>{application.scheduledDeliveryDate ? new Date(application.scheduledDeliveryDate).toLocaleDateString() : 'the scheduled date'}</strong> during the <strong>{application.scheduledDeliveryTime || 'selected'}</strong> slot.</li>
                  <li>Our driver will contact you via phone prior to arrival at your district destination.</li>
                  <li>Once safely delivered, application status will officially change to <strong>SUCCESSFUL</strong>.</li>
                </>
              ) : applicationStatus === 'SUCCESSFUL' || applicationStatus === 'Successful' ? (
                <>
                  <li><strong>Pet Delivered Successfully! 🎉</strong> {petName} has been safely transported and handed over to you.</li>
                  <li>Congratulations on your new pet family member!</li>
                </>
              ) : (
                <>
                  <li>The shelter team will review your submitted application details and adoption eligibility.</li>
                  <li>Upon approval, a delivery driver and delivery date & time slot will be allocated to transport {petName} safely to your location.</li>
                  <li>Status changes will automatically update your dashboard in real-time.</li>
                </>
              )}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="d-flex gap-3 flex-wrap justify-between">
            <button
              onClick={() => setShowMapModal(true)}
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Navigation size={18} color="#4f46e5" /> View Route Map
            </button>

            <div className="d-flex gap-2">
              <Link to="/pets" className="btn btn-outline">Browse More Pets</Link>
              <Link to="/dashboard" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                Go to Dashboard <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>

        {/* Map Modal */}
        <AdoptionMapModal
          isOpen={showMapModal}
          onClose={() => setShowMapModal(false)}
          petName={petName}
          shelterInfo={owner || { shelterName: 'Shelter', district: pet?.district || 'Chennai' }}
          adopterInfo={applicant || { name: applicant?.name, district: application.applicantDistrict || 'Coimbatore' }}
          applicationStatus={applicationStatus}
          driverInfo={application.driverInfo}
          scheduledDeliveryDate={application.scheduledDeliveryDate}
          scheduledDeliveryTime={application.scheduledDeliveryTime}
        />
      </div>
    </div>
  );
};

export default AdoptionStatus;
