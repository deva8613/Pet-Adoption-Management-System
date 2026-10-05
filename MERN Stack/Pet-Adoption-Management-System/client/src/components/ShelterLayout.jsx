import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';
import {
  PawPrint,
  LayoutDashboard,
  PlusCircle,
  FileText,
  CheckCircle2,
  AlertTriangle,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ShieldCheck,
  Search,
  ExternalLink,
  Bell
} from 'lucide-react';

const ShelterLayout = ({
  children,
  title,
  subtitle,
  activePage,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  actions
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Click outside to close profile dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (path) => {
    if (activePage) return activePage === path;
    return location.pathname === path;
  };

  const shelterName = user?.shelterName || user?.name || 'Shelter Partner';
  const isVerified = user?.verificationStatus === 'Approved';

  const navItems = [
    { label: 'Dashboard', path: '/shelter/dashboard', icon: LayoutDashboard },
    { label: 'Pets', path: '/shelter/pets', icon: PawPrint },
    { label: 'Add Pet', path: '/shelter/add-pet', icon: PlusCircle },
    { label: 'Applications', path: '/shelter/applications', icon: FileText },
    { label: 'Adoptions', path: '/shelter/adoptions', icon: CheckCircle2 },
    { label: 'Rescue Reports', path: '/rescue', icon: AlertTriangle },
    { label: 'Shelter Profile', path: '/profile', icon: User },
    { label: 'Settings', path: '/shelter/settings', icon: Settings },
  ];

  return (
    <div className="shelter-portal-wrapper">
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="shelter-sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* LEFT SIDEBAR */}
      <aside className={`shelter-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="shelter-sidebar-brand">
          <Link to="/shelter/dashboard" className="shelter-brand-link">
            <div className="shelter-brand-icon">
              <PawPrint size={22} className="brand-paw-icon" />
            </div>
            <div className="shelter-brand-text">
              <span className="shelter-brand-title">PawHomes</span>
              <span className="shelter-brand-subtitle">Shelter Operations</span>
            </div>
          </Link>

          {/* Mobile Close Button */}
          <button
            className="shelter-mobile-close-btn"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Shelter Identity Mini Card */}
        <div className="shelter-sidebar-profile-card">
          <div className="shelter-mini-avatar">
            {user?.profileImage ? (
              <img src={user.profileImage} alt={shelterName} />
            ) : (
              <div className="shelter-avatar-placeholder">
                {shelterName.charAt(0).toUpperCase()}
              </div>
            )}
            {isVerified && (
              <span className="shelter-verified-dot" title="Verified Shelter">
                ✓
              </span>
            )}
          </div>
          <div className="shelter-mini-info">
            <h4 className="shelter-mini-name text-truncate" title={shelterName}>
              {shelterName}
            </h4>
            <span className={`shelter-status-tag ${isVerified ? 'verified' : 'pending'}`}>
              {isVerified ? 'Verified Partner' : (user?.verificationStatus || 'Pending Approval')}
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="shelter-sidebar-nav">
          <span className="shelter-nav-section-label">MAIN OPERATIONS</span>
          <ul className="shelter-nav-list">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <li key={item.path} className="shelter-nav-item">
                  <Link
                    to={item.path}
                    className={`shelter-nav-link ${active ? 'active' : ''}`}
                  >
                    <Icon size={18} className="shelter-nav-icon" />
                    <span className="shelter-nav-text">{item.label}</span>
                    {active && <span className="shelter-active-indicator" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer Logout */}
        <div className="shelter-sidebar-footer">
          <button
            onClick={logout}
            className="shelter-logout-btn"
            title="Sign out of shelter account"
          >
            <LogOut size={17} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="shelter-main-container">
        {/* TOP HEADER */}
        <header className="shelter-top-header">
          <div className="shelter-header-left">
            <button
              className="shelter-hamburger-btn"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle navigation"
            >
              <Menu size={22} />
            </button>

            <div className="shelter-header-title-wrap">
              <h1 className="shelter-header-title">{title || 'Shelter Dashboard'}</h1>
              {subtitle && <p className="shelter-header-subtitle">{subtitle}</p>}
            </div>
          </div>

          <div className="shelter-header-right">
            {/* Search Input (Global & Contextual) */}
            <div className="shelter-header-search">
              <Search size={16} className="shelter-search-icon" />
              {onSearchChange ? (
                <>
                  <input
                    type="text"
                    placeholder={searchPlaceholder || 'Search pets, applications...'}
                    value={searchValue || ''}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="shelter-search-input"
                  />
                  {searchValue && (
                    <button
                      type="button"
                      onClick={() => onSearchChange('')}
                      className="shelter-header-search-clear"
                      title="Clear search"
                    >
                      <X size={12} />
                    </button>
                  )}
                </>
              ) : (
                <input
                  type="text"
                  placeholder={searchPlaceholder || 'Search pets, applications...'}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      navigate(`/shelter/pets?search=${encodeURIComponent(e.target.value.trim())}`);
                    }
                  }}
                  className="shelter-search-input"
                />
              )}
            </div>

            {/* Custom Header Actions Slot */}
            {actions && <div className="shelter-header-actions">{actions}</div>}

            {/* Real Notification Dropdown */}
            <div className="shelter-notification-wrap">
              <NotificationDropdown />
            </div>

            {/* Profile Avatar & Dropdown */}
            <div className="shelter-profile-dropdown-wrap" ref={profileDropdownRef}>
              <button
                className="shelter-profile-trigger"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                aria-expanded={profileDropdownOpen}
              >
                <div className="shelter-header-avatar">
                  {user?.profileImage ? (
                    <img src={user.profileImage} alt={shelterName} />
                  ) : (
                    <div className="shelter-header-avatar-placeholder">
                      {shelterName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="shelter-header-user-meta hide-mobile">
                  <span className="shelter-header-user-name text-truncate">{shelterName}</span>
                  <span className="shelter-header-user-role">Shelter</span>
                </div>
                <ChevronDown size={14} className="shelter-chevron hide-mobile" />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="shelter-dropdown-menu">
                  <div className="shelter-dropdown-header">
                    <p className="shelter-dropdown-name">{shelterName}</p>
                    <p className="shelter-dropdown-email">{user?.email}</p>
                  </div>
                  <div className="shelter-dropdown-divider" />
                  <Link
                    to="/profile"
                    className="shelter-dropdown-item"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <User size={15} />
                    <span>Shelter Profile</span>
                  </Link>
                  <Link
                    to="/shelter/settings"
                    className="shelter-dropdown-item"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <Settings size={15} />
                    <span>Account Settings</span>
                  </Link>
                  <Link
                    to="/home"
                    className="shelter-dropdown-item"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <ExternalLink size={15} />
                    <span>View Public Site</span>
                  </Link>
                  <div className="shelter-dropdown-divider" />
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      logout();
                    }}
                    className="shelter-dropdown-item text-danger"
                  >
                    <LogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* CONTENT BODY */}
        <main className="shelter-content-body">
          {children}
        </main>
      </div>
    </div>
  );
};

export default ShelterLayout;
