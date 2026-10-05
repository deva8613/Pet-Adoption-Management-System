import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

const VerifyEmail = () => {
  const { token } = useParams();
  const { refreshUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token) {
      handleVerification();
    } else {
      setLoading(false);
      setError('Verification token is missing from the link.');
    }
  }, [token]);

  const handleVerification = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await authAPI.verifyEmail(token);
      if (res.success) {
        setSuccess(true);
        setMessage(res.message || 'Your email address has been verified successfully!');
        if (refreshUser) refreshUser();
      } else {
        setSuccess(false);
        setError(res.message || 'Email verification failed or token expired.');
      }
    } catch (err) {
      setSuccess(false);
      setError(err.message || 'Error processing email verification.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Verifying your email address..." />;

  return (
    <div className="section-padding container">
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {success ? (
          <div className="card text-center p-5 shadow-sm">
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              backgroundColor: '#ecfdf5', color: '#10b981',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <CheckCircle2 size={36} />
            </div>
            <h2 style={{ color: '#065f46', marginBottom: '8px' }}>Email Verified!</h2>
            <p className="text-muted mb-4">{message}</p>
            <div className="d-flex justify-center gap-3">
              <Link to="/profile" className="btn btn-primary">Go to Profile</Link>
              <Link to="/dashboard" className="btn btn-outline">Go to Dashboard</Link>
            </div>
          </div>
        ) : (
          <div className="card text-center p-5 shadow-sm">
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              backgroundColor: '#fef2f2', color: '#ef4444',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <AlertTriangle size={36} />
            </div>
            <h2 style={{ color: '#991b1b', marginBottom: '8px' }}>Verification Failed</h2>
            <ErrorMessage message={error} />
            <div className="mt-4">
              <Link to="/profile" className="btn btn-outline">Back to Profile</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
