import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, PawPrint, PlusCircle, FileText, CheckCircle2,
  AlertTriangle, User, LogOut, ShieldCheck, Heart, Settings, MessageSquare
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (p) => location.pathname === p;

  return (
    <aside className="dashboard-sidebar card shadow-sm p-3">
      {/* User Information Widget */}
      <div className="sidebar-user-info p-3 mb-3 bg-light rounded d-flex align-center gap-3">
        <div className="sidebar-avatar-wrap">
          {user?.profileImage ? (
            <img src={user.profileImage} alt={user.name} className="sidebar-avatar-img" />
          ) : (
            <div className="sidebar-avatar-placeholder">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
        </div>
        <div className="sidebar-user-details overflow-hidden">
          <h4 className="mb-0 text-truncate font-size-md">{user?.name || 'User'}</h4>
          <span className="role-pill-badge mt-1 d-inline-block font-size-xs">
            {user?.role === 'shelter' ? 'Shelter Partner' : user?.role === 'admin' ? 'System Admin' : 'Adopter'}
          </span>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="sidebar-nav d-flex flex-column gap-1 mb-4">
        {/* ADOPTER ROLE LINKS */}
        {user?.role === 'adopter' && (
          <>
            <Link to="/applications" className={`sidebar-link ${isActive('/applications') ? 'active' : ''}`}>
              <FileText size={17} />
              <span>My Applications</span>
            </Link>
            <Link to="/favorites" className={`sidebar-link ${isActive('/favorites') ? 'active' : ''}`}>
              <Heart size={17} />
              <span>Saved Favorites</span>
            </Link>
            <Link to="/profile" className={`sidebar-link ${isActive('/profile') ? 'active' : ''}`}>
              <User size={17} />
              <span>Adopter Profile</span>
            </Link>
            <Link to="/pets" className={`sidebar-link ${isActive('/pets') ? 'active' : ''}`}>
              <PawPrint size={17} />
              <span>Browse Pets</span>
            </Link>
          </>
        )}

        {/* SHELTER ROLE LINKS (Section 21) */}
        {user?.role === 'shelter' && (
          <>
            <Link to="/shelter/dashboard" className={`sidebar-link ${isActive('/shelter/dashboard') ? 'active' : ''}`}>
              <LayoutDashboard size={17} />
              <span>Dashboard</span>
            </Link>
            <Link to="/shelter/pets" className={`sidebar-link ${isActive('/shelter/pets') ? 'active' : ''}`}>
              <PawPrint size={17} />
              <span>Pets</span>
            </Link>
            <Link to="/shelter/add-pet" className={`sidebar-link ${isActive('/shelter/add-pet') ? 'active' : ''}`}>
              <PlusCircle size={17} />
              <span>Add Pet</span>
            </Link>
            <Link to="/shelter/applications" className={`sidebar-link ${isActive('/shelter/applications') ? 'active' : ''}`}>
              <FileText size={17} />
              <span>Applications</span>
            </Link>
            <Link to="/shelter/adoptions" className={`sidebar-link ${isActive('/shelter/adoptions') ? 'active' : ''}`}>
              <CheckCircle2 size={17} />
              <span>Adoptions</span>
            </Link>
            <Link to="/rescue" className={`sidebar-link ${isActive('/rescue') ? 'active' : ''}`}>
              <AlertTriangle size={17} />
              <span>Rescue Reports</span>
            </Link>
            <Link to="/profile" className={`sidebar-link ${isActive('/profile') ? 'active' : ''}`}>
              <User size={17} />
              <span>Shelter Profile</span>
            </Link>
            <Link to="/shelter/settings" className={`sidebar-link ${isActive('/shelter/settings') ? 'active' : ''}`}>
              <Settings size={17} />
              <span>Settings</span>
            </Link>
          </>
        )}

        {/* ADMIN ROLE LINKS */}
        {user?.role === 'admin' && (
          <>
            <Link to="/admin/dashboard" className={`sidebar-link ${isActive('/admin/dashboard') ? 'active' : ''}`}>
              <ShieldCheck size={17} />
              <span>Admin Dashboard</span>
            </Link>
            <Link to="/admin/security/audit-logs" className={`sidebar-link ${isActive('/admin/security/audit-logs') ? 'active' : ''}`}>
              <Shield size={17} />
              <span>Security Audit Logs</span>
            </Link>
            <Link to="/rescue" className={`sidebar-link ${isActive('/rescue') ? 'active' : ''}`}>
              <AlertTriangle size={17} />
              <span>Rescue Reports</span>
            </Link>
            <Link to="/profile" className={`sidebar-link ${isActive('/profile') ? 'active' : ''}`}>
              <User size={17} />
              <span>Admin Profile</span>
            </Link>
          </>
        )}
      </nav>

      {/* Footer / Logout */}
      <div className="sidebar-footer mt-auto pt-3 border-top">
        <button onClick={logout} className="sidebar-logout-btn btn btn-outline btn-sm full-width d-flex align-center justify-center gap-2">
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
