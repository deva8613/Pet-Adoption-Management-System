import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import ErrorMessage from '../components/ErrorMessage';
import { KeyRound, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [resetToken, setResetToken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await authAPI.forgotPassword(email);
      if (res.success) {
        setSuccessMsg(res.message);
        if (res.resetToken) {
          setResetToken(res.resetToken);
        }
      } else {
        setError(res.message || 'Failed to request password reset');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '450px', padding: '3rem 1rem' }}>
      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#e0e7ff',
            color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto'
          }}>
            <KeyRound size={24} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Forgot Password</h2>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '4px' }}>
            Enter your email address and we'll help you reset your account password.
          </p>
        </div>

        {error && <ErrorMessage message={error} />}

        {successMsg ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '1rem', color: '#047857', marginBottom: '1.5rem' }}>
              <CheckCircle2 size={24} style={{ marginBottom: '8px' }} />
              <div>{successMsg}</div>
            </div>

            {resetToken && (
              <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                <strong>Reset Token generated:</strong>
                <div style={{ wordBreak: 'break-all', fontFamily: 'monospace', backgroundColor: '#e2e8f0', padding: '4px 8px', borderRadius: '4px', marginTop: '6px' }}>
                  {resetToken}
                </div>
                <Link to={`/reset-password/${resetToken}`} className="btn btn-primary btn-sm full-width mt-3" style={{ textDecoration: 'none' }}>
                  Proceed to Reset Password
                </Link>
              </div>
            )}

            <Link to="/login" style={{ fontSize: '0.875rem', color: '#4f46e5', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <ArrowLeft size={16} /> Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group mb-4">
              <label>Email Address</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary full-width" disabled={loading}>
              {loading ? 'Processing...' : 'Send Reset Link / Token'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <Link to="/login" style={{ fontSize: '0.875rem', color: '#4f46e5', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <ArrowLeft size={16} /> Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
