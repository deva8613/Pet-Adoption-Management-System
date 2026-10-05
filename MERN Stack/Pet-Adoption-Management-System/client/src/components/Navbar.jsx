import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';
import {
  PawPrint, User, Heart, ClipboardList, LogOut, Building2,
  ShieldCheck, Settings, Menu, X, ChevronDown, Bell, Search,
  Compass, AlertTriangle
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/home') {
      return location.pathname === '/' || location.pathname === '/home';
    }
    return location.pathname.startsWith(path);
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';
  const role = user?.role || 'guest';

  return (
    <header className="paw-navbar-header">
      <div className="paw-navbar-container">
        {/* Left Side: Brand Logo */}
        <Link to="/home" className="paw-navbar-brand">
          <div className="paw-brand-icon-wrapper">
            <span className="paw-brand-paw">🐾</span>
          </div>
          <div className="paw-brand-text-col">
            <span className="paw-brand-name">PawHomes</span>
            <span className="paw-brand-sub">Pet Adoption</span>
          </div>
        </Link>

        {/* Center Navigation Links (Desktop) */}
        <nav className="paw-navbar-center">
          {role === 'shelter' ? (
            // Shelter Specific Center Nav
            <>
              <Link
                to="/shelter/dashboard"
                className={`paw-nav-link ${isActive('/shelter/dashboard') ? 'active' : ''}`}
              >
                Dashboard
              </Link>
              <Link
                to="/shelter/pets"
                className={`paw-nav-link ${isActive('/shelter/pets') ? 'active' : ''}`}
              >
                Pets
              </Link>
              <Link
                to="/shelter/applications"
                className={`paw-nav-link ${isActive('/shelter/applications') ? 'active' : ''}`}
              >
                Applications
              </Link>
              <Link
                to="/shelter/adoptions"
                className={`paw-nav-link ${isActive('/shelter/adoptions') ? 'active' : ''}`}
              >
                Adoptions
              </Link>
            </>
          ) : role === 'admin' ? (
            // Admin Specific Center Nav
            <>
              <Link
                to="/admin/dashboard"
                className={`paw-nav-link ${isActive('/admin/dashboard') ? 'active' : ''}`}
              >
                Admin Dashboard
              </Link>
              <Link
                to="/pets"
                className={`paw-nav-link ${isActive('/pets') ? 'active' : ''}`}
              >
                Find Pets
              </Link>
              <Link
                to="/rescue"
                className={`paw-nav-link ${isActive('/rescue') ? 'active' : ''}`}
              >
                Rescue
              </Link>
            </>
          ) : (
            // Standard Adopter / Guest Center Nav
            <>
              <Link
                to="/home"
                className={`paw-nav-link ${isActive('/home') ? 'active' : ''}`}
              >
                Home
              </Link>
              <Link
                to="/pets"
                className={`paw-nav-link ${isActive('/pets') ? 'active' : ''}`}
              >
                Find Pets
              </Link>
              <Link
                to="/favorites"
                className={`paw-nav-link ${isActive('/favorites') ? 'active' : ''}`}
              >
                Favorites
              </Link>
              <Link
                to="/rescue"
                className={`paw-nav-link ${isActive('/rescue') ? 'active' : ''}`}
              >
                Rescue
              </Link>
              <Link
                to="/applications"
                className={`paw-nav-link ${isActive('/applications') ? 'active' : ''}`}
              >
                My Applications
              </Link>
            </>
          )}
        </nav>

        {/* Right Side: Notifications & User Profile / Auth */}
        <div className="paw-navbar-right">
          {user ? (
            <div className="paw-user-nav-actions">
              {/* Notification Bell with unread badge */}
              <div className="paw-notif-wrapper">
                <NotificationDropdown />
              </div>

              {/* Profile Menu Dropdown */}
              <div className="paw-profile-dropdown-container" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="paw-profile-trigger"
                  aria-expanded={profileDropdownOpen}
                  aria-label="User Menu"
                >
                  <div className="paw-avatar-circle">
                    {user.profileImage ? (
                      <img src={user.profileImage} alt={user.name} />
                    ) : (
                      <span>{userInitial}</span>
                    )}
                  </div>
                  <span className="paw-username-display">{user.name?.split(' ')[0] || 'Account'}</span>
                  <ChevronDown size={14} className={`paw-caret ${profileDropdownOpen ? 'rotate' : ''}`} />
                </button>

                {profileDropdownOpen && (
                  <div className="paw-dropdown-popover">
                    <div className="paw-dropdown-header">
                      <div className="paw-dropdown-user-info">
                        <strong className="paw-dropdown-name">{user.name}</strong>
                        <span className="paw-dropdown-email">{user.email}</span>
                      </div>
                      <span className="paw-dropdown-role-badge">
                        {role === 'shelter' ? '🏛️ Shelter Partner' : role === 'admin' ? '🛡️ Administrator' : '🐾 Pet Adopter'}
                      </span>
                    </div>

                    <div className="paw-dropdown-menu-list">
                      <Link to="/profile" className="paw-dropdown-item">
                        <User size={16} className="paw-dropdown-icon text-teal" />
                        <span>My Profile</span>
                      </Link>

                      <Link to="/applications" className="paw-dropdown-item">
                        <ClipboardList size={16} className="paw-dropdown-icon text-teal" />
                        <span>My Applications</span>
                      </Link>

                      <Link to="/favorites" className="paw-dropdown-item">
                        <Heart size={16} className="paw-dropdown-icon text-teal" />
                        <span>Favorites</span>
                      </Link>

                      {/* Shelter Shortcuts in dropdown */}
                      {role === 'shelter' && (
                        <Link to="/shelter/dashboard" className="paw-dropdown-item highlight-role">
                          <Building2 size={16} className="paw-dropdown-icon text-teal" />
                          <span>Shelter Dashboard</span>
                        </Link>
                      )}

                      {/* Admin Shortcuts in dropdown */}
                      {role === 'admin' && (
                        <Link to="/admin/dashboard" className="paw-dropdown-item highlight-role">
                          <ShieldCheck size={16} className="paw-dropdown-icon text-teal" />
                          <span>Admin Dashboard</span>
                        </Link>
                      )}

                      <Link to="/profile" className="paw-dropdown-item">
                        <Settings size={16} className="paw-dropdown-icon text-muted" />
                        <span>Settings</span>
                      </Link>
                    </div>

                    <div className="paw-dropdown-footer">
                      <button onClick={handleLogout} className="paw-dropdown-logout-btn">
                        <LogOut size={16} />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="paw-auth-actions">
              <Link to="/login" className="btn btn-outline btn-sm">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Register
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            className="paw-mobile-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* MOBILE NAVIGATION DRAWER */}
      {mobileMenuOpen && (
        <div className="paw-mobile-backdrop" onClick={() => setMobileMenuOpen(false)}>
          <div className="paw-mobile-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="paw-mobile-drawer-header">
              <div className="paw-navbar-brand">
                <span className="paw-brand-paw">🐾</span>
                <span className="paw-brand-name">PawHomes</span>
              </div>
              <button
                type="button"
                className="paw-mobile-close-btn"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close Navigation"
              >
                <X size={22} />
              </button>
            </div>

            {user && (
              <div className="paw-mobile-user-card">
                <div className="paw-avatar-circle">
                  {user.profileImage ? (
                    <img src={user.profileImage} alt={user.name} />
                  ) : (
                    <span>{userInitial}</span>
                  )}
                </div>
                <div className="paw-mobile-user-meta">
                  <strong>{user.name}</strong>
                  <span className="text-muted font-size-xs">{user.email}</span>
                </div>
              </div>
            )}

            <div className="paw-mobile-nav-list">
              {role === 'shelter' ? (
                <>
                  <Link to="/shelter/dashboard" className="paw-mobile-link">
                    <Building2 size={18} />
                    <span>Dashboard</span>
                  </Link>
                  <Link to="/shelter/pets" className="paw-mobile-link">
                    <PawPrint size={18} />
                    <span>Pets</span>
                  </Link>
                  <Link to="/shelter/applications" className="paw-mobile-link">
                    <ClipboardList size={18} />
                    <span>Applications</span>
                  </Link>
                  <Link to="/shelter/adoptions" className="paw-mobile-link">
                    <ShieldCheck size={18} />
                    <span>Adoptions</span>
                  </Link>
                </>
              ) : role === 'admin' ? (
                <>
                  <Link to="/admin/dashboard" className="paw-mobile-link">
                    <ShieldCheck size={18} />
                    <span>Admin Dashboard</span>
                  </Link>
                  <Link to="/pets" className="paw-mobile-link">
                    <PawPrint size={18} />
                    <span>Find Pets</span>
                  </Link>
                  <Link to="/rescue" className="paw-mobile-link">
                    <AlertTriangle size={18} />
                    <span>Rescue</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/home" className="paw-mobile-link">
                    <PawPrint size={18} />
                    <span>Home</span>
                  </Link>
                  <Link to="/pets" className="paw-mobile-link">
                    <Search size={18} />
                    <span>Find Pets</span>
                  </Link>
                  <Link to="/favorites" className="paw-mobile-link">
                    <Heart size={18} />
                    <span>Favorites</span>
                  </Link>
                  <Link to="/rescue" className="paw-mobile-link">
                    <AlertTriangle size={18} />
                    <span>Rescue</span>
                  </Link>
                  <Link to="/applications" className="paw-mobile-link">
                    <ClipboardList size={18} />
                    <span>My Applications</span>
                  </Link>
                </>
              )}

              {user ? (
                <>
                  <div className="paw-mobile-divider" />
                  <Link to="/profile" className="paw-mobile-link">
                    <User size={18} />
                    <span>Profile</span>
                  </Link>
                  <Link to="/profile" className="paw-mobile-link">
                    <Settings size={18} />
                    <span>Settings</span>
                  </Link>
                  <button onClick={handleLogout} className="paw-mobile-logout-btn">
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <div className="paw-mobile-auth-cta">
                  <Link to="/login" className="btn btn-outline full-width">
                    Sign In
                  </Link>
                  <Link to="/register" className="btn btn-primary full-width">
                    Create Account
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
