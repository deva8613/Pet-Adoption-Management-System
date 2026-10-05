import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import ErrorMessage from '../components/ErrorMessage';
import {
  Eye, EyeOff, ArrowRight, ShieldCheck, PawPrint,
  Sparkles, Building2, Crown
} from 'lucide-react';

const Login = ({ initialAdminMode = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  // Check if routed with admin parameter or initialAdminMode
  const isDirectAdminRoute =
    initialAdminMode ||
    location.pathname === '/admin/login' ||
    new URLSearchParams(location.search).get('role') === 'admin';

  const [adminIdentifier, setAdminIdentifier] = useState({ email: 'admin@pawhomes.com', name: 'PawHomes Chief Admin' });
  const [email, setEmail] = useState(
    isDirectAdminRoute ? 'admin@pawhomes.com' : (location.state?.registeredEmail || '')
  );
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Admin Auto-fill & Suggestion State
  const [showAdminSuggestion, setShowAdminSuggestion] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(isDirectAdminRoute);

  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const suggestionRef = useRef(null);

  // Fetch safe admin identifier from backend (NO password exposed)
  useEffect(() => {
    const fetchAdminInfo = async () => {
      try {
        const res = await authAPI.getAdminIdentifier();
        if (res.success && res.email) {
          setAdminIdentifier(res);
          if (isDirectAdminRoute) {
            setEmail(res.email);
            setIsAdminMode(true);
            setTimeout(() => {
              passwordInputRef.current?.focus();
            }, 100);
          } else if (email.toLowerCase().trim() === res.email.toLowerCase()) {
            setIsAdminMode(true);
          }
        }
      } catch (e) {
        // Safe fallback already present
      }
    };
    fetchAdminInfo();
  }, [isDirectAdminRoute]);

  // Handle outside clicks to close admin suggestion
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        suggestionRef.current &&
        !suggestionRef.current.contains(e.target) &&
        emailInputRef.current &&
        !emailInputRef.current.contains(e.target)
      ) {
        setShowAdminSuggestion(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Detect admin typing pattern
  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    setError(null);

    const trimmed = val.trim().toLowerCase();
    const adminEmail = (adminIdentifier?.email || 'admin@pawhomes.com').toLowerCase();

    // If matches full admin email
    if (trimmed === adminEmail) {
      setIsAdminMode(true);
      setShowAdminSuggestion(false);
      return;
    }

    // Check if user is typing admin prefix: "a", "ad", "adm", "admin" or prefix of adminEmail
    const isTypingAdmin =
      trimmed.length > 0 &&
      (
        'admin'.startsWith(trimmed) ||
        trimmed.startsWith('admin') ||
        adminEmail.startsWith(trimmed)
      );

    if (isTypingAdmin) {
      setShowAdminSuggestion(true);
    } else {
      setShowAdminSuggestion(false);
      setIsAdminMode(false);
    }
  };

  // Keyboard navigation for suggestion (Escape closes, Enter selects if open)
  const handleEmailKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowAdminSuggestion(false);
    } else if (e.key === 'ArrowDown' && showAdminSuggestion) {
      e.preventDefault();
      suggestionRef.current?.focus();
    }
  };

  // When user selects admin account from suggestion
  const handleSelectAdminSuggestion = () => {
    const targetEmail = adminIdentifier?.email || 'admin@pawhomes.com';
    setEmail(targetEmail);
    setIsAdminMode(true);
    setShowAdminSuggestion(false);
    setError(null);

    // Focus password field automatically
    setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 50);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(email.trim(), password);
      if (!res.success) {
        setLoading(false);
        setError(res.message || 'Invalid email or password');
        if (isAdminMode) {
          passwordInputRef.current?.focus();
        }
        return;
      }

      if (rememberMe) {
        localStorage.setItem('pawhomes_remember_email', email.trim());
      } else {
        localStorage.removeItem('pawhomes_remember_email');
      }

      const from = location.state?.from;
      if (from) {
        navigate(from);
      } else if (res.user?.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (res.user?.role === 'shelter') {
        navigate('/shelter/dashboard');
      } else {
        navigate('/home');
      }
    } catch (err) {
      setError(err.message || 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestContinue = () => {
    navigate('/home');
  };

  return (
    <div className={`paw-auth-page ${isAdminMode ? 'paw-auth-page-admin-mode' : ''}`}>
      <div className="paw-auth-container">
        {/* LEFT COLUMN: Large High-Quality Pet Image & PawHomes Branding */}
        <section className="paw-auth-visual">
          <div className="paw-auth-brand-badge">
            <span className="brand-paw-icon">🐾</span>
            <span className="brand-title">PawHomes</span>
          </div>

          <div className="paw-auth-hero-copy">
            <span className="paw-auth-tagline">
              <Sparkles size={16} /> Certified Pet Adoption &amp; Rescue Platform
            </span>
            <h1 className="paw-auth-heading">Every Paw Deserves a Loving Home.</h1>
            <p className="paw-auth-subtext">
              Find a companion, give them a home, and create a bond that lasts forever.
            </p>
          </div>

          <div className="paw-auth-image-card">
            <img
              src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=1200&q=85"
              alt="Happy adopted pets"
              className="paw-auth-img"
            />
            <div className="paw-auth-floating-note">
              <ShieldCheck size={20} className="text-teal" />
              <div>
                <strong>100% Verified Adoptions</strong>
                <p>Connecting loving families with vetted shelters</p>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: Modern Split-Screen Login Card */}
        <section className="paw-auth-form-section">
          <div className={`paw-auth-card ${isAdminMode ? 'paw-auth-card-admin' : ''}`}>
            <div className="paw-auth-mobile-header">
              <span className="brand-paw-icon">🐾</span>
              <span className="brand-title">PawHomes</span>
            </div>

            {/* CARD HEADER: Dynamically adapts to Admin Login Mode */}
            <div className="paw-card-header">
              {isAdminMode ? (
                <>
                  <div className="d-flex align-center gap-2 mb-2">
                    <span className="badge-pill badge-pill-admin">
                      👑 Administrator Login
                    </span>
                  </div>
                  <h2 className="admin-login-title">👑 Admin Login</h2>
                  <p className="paw-card-subtitle">
                    Sign in to manage PawHomes.
                  </p>
                </>
              ) : (
                <>
                  <span className="badge-pill">Welcome Back</span>
                  <h2>Sign In to PawHomes</h2>
                  <p className="paw-card-subtitle">
                    Enter your credentials to access your pet adoption dashboard.
                  </p>
                </>
              )}
            </div>


            {location.state?.registeredEmail && (
              <div className="alert alert-success">
                Your PawHomes account has been created! Please log in with your credentials.
              </div>
            )}

            {error && <ErrorMessage message={error} />}

            <form onSubmit={handleSubmit} className="paw-form">
              {/* EMAIL / USERNAME FIELD WITH AUTO-FILL SUGGESTION */}
              <div className="form-group position-relative">
                <label htmlFor="login-email">
                  {isAdminMode ? 'Admin Email / Identifier' : 'Email Address'}
                </label>
                <div className="position-relative">
                  <input
                    ref={emailInputRef}
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    onKeyDown={handleEmailKeyDown}
                    placeholder="name@example.com"
                    autoComplete="email"
                    required
                    className={isAdminMode ? 'input-admin-focused' : ''}
                  />

                  {/* ADMIN AUTO-FILL SUGGESTION DROPDOWN */}
                  {showAdminSuggestion && (
                    <div
                      ref={suggestionRef}
                      className="paw-admin-suggestion-dropdown shadow-lg"
                      tabIndex={0}
                      onClick={handleSelectAdminSuggestion}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSelectAdminSuggestion();
                        if (e.key === 'Escape') setShowAdminSuggestion(false);
                      }}
                      role="button"
                      aria-label="Select Admin Account"
                    >
                      <div className="admin-sugg-left">
                        <div className="admin-sugg-crown-badge">
                          <Crown size={16} />
                        </div>
                        <div className="admin-sugg-meta">
                          <span className="admin-sugg-title">👑 Admin Account</span>
                          <span className="admin-sugg-sub">Login as Administrator</span>
                        </div>
                      </div>
                      <span className="admin-sugg-arrow">→</span>
                    </div>
                  )}
                </div>
              </div>

              {/* PASSWORD FIELD */}
              <div className="form-group">
                <div className="label-with-link">
                  <label htmlFor="login-password">Password</label>
                  {!isAdminMode && (
                    <Link to="/forgot-password" className="forgot-link">
                      Forgot password?
                    </Link>
                  )}
                </div>
                <div className="password-input-wrapper">
                  <input
                    ref={passwordInputRef}
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isAdminMode ? 'Enter administrator password' : 'Enter your password'}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle-btn"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-options-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
              </div>

              {/* DYNAMIC SUBMIT BUTTON */}
              <button
                type="submit"
                className={`btn btn-primary btn-block btn-lg ${isAdminMode ? 'btn-admin-submit' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  isAdminMode ? 'Verifying Administrator...' : 'Signing In...'
                ) : isAdminMode ? (
                  <>
                    <Crown size={18} />
                    <span>Login as Administrator</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="paw-auth-divider">
              <span>or</span>
            </div>

            {/* Guest Browsing Feature */}
            <button
              type="button"
              onClick={handleGuestContinue}
              className="btn btn-outline btn-block guest-btn"
            >
              <PawPrint size={18} />
              <span>Continue as Guest</span>
            </button>
            <p className="guest-note">
              Guest users can freely browse pets and shelters, but must log in to submit adoption applications.
            </p>

            <div className="paw-auth-footer">
              <p>
                New to PawHomes?{' '}
                <Link to="/register" className="highlight-link">
                  Create an Account
                </Link>
              </p>

              <div className="portal-links">
                <Link to="/shelter/register" className="portal-link">
                  <Building2 size={14} /> Shelter Registration
                </Link>
                <span className="dot-sep">•</span>
                <Link to="/admin/login" className="portal-link">
                  <ShieldCheck size={14} /> Admin Portal
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;
