import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ErrorMessage from '../components/ErrorMessage';
import { ShieldCheck, Eye, EyeOff, Lock } from 'lucide-react';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login, logout } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);
      const res = await login(email, password);
      if (res.success && res.user) {
        if (res.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          logout();
          setError('Access Denied: Only authorized system administrators can log in here.');
        }
      } else {
        setError(res.message || 'Invalid administrator email or password');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during admin authentication');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="auth-page section-padding" style={{ backgroundColor: '#0f172a', minHeight: '82vh', display: 'flex', alignItems: 'center' }}>
      <div className="container max-w-md">
        <div className="card auth-card" style={{ border: '1px solid #1e293b', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
          <div className="text-center mb-4">
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#4f46e5',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px'
            }}>
              <ShieldCheck size={32} color="#ffffff" />
            </div>
            <h2 style={{ color: '#0f172a', margin: 0 }}>Shelter Admin Portal</h2>
            <p className="text-muted" style={{ fontSize: '0.875rem', marginTop: '4px' }}>
              Single Administrator Account Access &amp; Approval Portal
            </p>
          </div>

          {error && <ErrorMessage message={error} />}
          <div className="text-center text-muted mb-3" style={{ fontSize: '0.78rem' }}>
            AUTHORIZED ADMINISTRATOR CREDENTIALS
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group mb-3">
              <label>Administrator Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group mb-4">
              <label>Password</label>
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  style={{ width: '100%', paddingRight: '42px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px',
                    borderRadius: '4px'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary full-width" disabled={loading} style={{ backgroundColor: '#4f46e5', borderColor: '#4f46e5' }}>
              {loading ? 'Authenticating Admin...' : 'Log In as Administrator'}
            </button>
          </form>

          <div style={{ marginTop: '20px', padding: '10px', borderRadius: '6px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.78rem', color: '#64748b', textAlign: 'center' }}>
            <Lock size={12} style={{ display: 'inline', marginRight: '4px' }} />
            Protected Route. Single administrator account configured on backend.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
