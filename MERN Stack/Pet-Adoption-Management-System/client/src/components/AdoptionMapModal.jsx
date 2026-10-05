import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Truck, X, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

const AdoptionMapModal = ({ isOpen, onClose, petName, shelterInfo, adopterInfo, applicationStatus, driverInfo, scheduledDeliveryDate, scheduledDeliveryTime }) => {
  const [animating, setAnimating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval;
    if (animating) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setAnimating(false);
            return 100;
          }
          return prev + 2;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [animating]);

  if (!isOpen) return null;

  const shelterName = shelterInfo?.shelterName || shelterInfo?.name || 'PawHomes Partner Shelter';
  const shelterDistrict = shelterInfo?.district || shelterInfo?.city || 'Chennai';
  const adopterName = adopterInfo?.name || 'Adopter';
  const adopterDistrict = adopterInfo?.district || adopterInfo?.city || 'Coimbatore';

  const shelterCoords = shelterInfo?.coordinates || { lat: 13.0827, lng: 80.2707, displayName: shelterDistrict };
  const adopterCoords = adopterInfo?.coordinates || { lat: 11.0168, lng: 76.9558, displayName: adopterDistrict };

  const isCoordinatesMissing = !shelterInfo?.coordinates && !adopterInfo?.coordinates;

  const startAnimation = () => {
    setProgress(0);
    setAnimating(true);
  };

  const isEligibleForRouteAnimation = ['Approved', 'Successful'].includes(applicationStatus);

  // SVG Map relative coordinates calculation for visual canvas representation
  const startX = 80;
  const startY = 180;
  const endX = 320;
  const endY = 80;

  const currentX = startX + (endX - startX) * (progress / 100);
  const currentY = startY + (endY - startY) * (progress / 100);

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
    }}>
      <div className="modal-content" style={{
        backgroundColor: '#ffffff', borderRadius: '16px', maxWidth: '650px', width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', border: '1px solid #e2e8f0'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.5rem', background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
          color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Navigation size={22} /> Adoption Delivery & Route Map
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', opacity: 0.9 }}>
              Route between {shelterName} ({shelterDistrict}) and {adopterName} ({adopterDistrict})
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: '50%',
            width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
          }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {/* Transparency Disclaimer Box */}
          <div style={{
            padding: '0.75rem 1rem', borderRadius: '8px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe',
            color: '#1e40af', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <ShieldAlert size={18} style={{ flexShrink: 0 }} />
            <div>
              <strong>Simulated Delivery Route Animation</strong> - Not Live GPS Tracking.
              This visualizer illustrates the transport path for {petName} between shelter and adopter.
            </div>
          </div>

          {/* Canvas Map Container */}
          <div style={{
            position: 'relative', width: '100%', height: '240px', backgroundColor: '#f8fafc',
            borderRadius: '12px', border: '1px solid #cbd5e1', overflow: 'hidden'
          }}>
            {/* SVG Visual Map & Line */}
            <svg width="100%" height="100%" viewBox="0 0 400 240" style={{ position: 'absolute', top: 0, left: 0 }}>
              <defs>
                <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4f46e5" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>

              {/* Grid Background Pattern */}
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="1" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Route Path Line */}
              <line x1={startX} y1={startY} x2={endX} y2={endY} stroke="url(#routeGradient)" strokeWidth="4" strokeDasharray="6,6" />

              {/* Shelter Marker */}
              <g transform={`translate(${startX}, ${startY})`}>
                <circle r="16" fill="#4f46e5" opacity="0.2" />
                <circle r="10" fill="#4f46e5" />
                <text x="0" y="24" textAnchor="middle" fill="#1e293b" fontSize="11" fontWeight="bold">
                  {shelterDistrict} (Shelter)
                </text>
              </g>

              {/* Adopter Marker */}
              <g transform={`translate(${endX}, ${endY})`}>
                <circle r="16" fill="#10b981" opacity="0.2" />
                <circle r="10" fill="#10b981" />
                <text x="0" y="-14" textAnchor="middle" fill="#1e293b" fontSize="11" fontWeight="bold">
                  {adopterDistrict} (Adopter)
                </text>
              </g>

              {/* Animated Transport Vehicle Marker */}
              {isEligibleForRouteAnimation && (
                <g transform={`translate(${currentX}, ${currentY})`}>
                  <circle r="14" fill="#f59e0b" shadow="0 4px 6px rgba(0,0,0,0.1)" />
                  <text x="0" y="4" textAnchor="middle" fill="#fff" fontSize="10">🐾</text>
                </g>
              )}
            </svg>
          </div>

          {/* Driver & Schedule Banner inside Modal */}
          {driverInfo && (driverInfo.name || driverInfo.driverName) && (
            <div style={{
              padding: '0.75rem 1rem', borderRadius: '8px', backgroundColor: '#f0fdf4', border: '1px solid #86efac',
              color: '#166534', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px'
            }}>
              <div>
                <strong>🚚 Assigned Driver:</strong> {driverInfo.name || driverInfo.driverName} ({driverInfo.phone || driverInfo.driverPhone})
                {driverInfo.vehicleNumber && <span> • Vehicle: {driverInfo.vehicleNumber}</span>}
              </div>
              <div>
                <strong>📅 Delivery:</strong> {scheduledDeliveryDate ? new Date(scheduledDeliveryDate).toLocaleDateString() : 'Scheduled'} ({scheduledDeliveryTime || 'Slot'})
              </div>
            </div>
          )}

          {/* Details & Controls */}
          <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Adoption Status</div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={16} color="#10b981" /> {applicationStatus || 'Approved'}
              </div>
            </div>

            {isEligibleForRouteAnimation ? (
              <button
                onClick={startAnimation}
                disabled={animating}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.6rem 1.25rem' }}
              >
                <Truck size={18} />
                {animating ? `Transporting ${progress}%...` : 'Simulate Delivery Animation'}
              </button>
            ) : (
              <div style={{ fontSize: '0.85rem', color: '#b45309', backgroundColor: '#fef3c7', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                Route animation unlocks when adoption application is Approved or Successful.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdoptionMapModal;
