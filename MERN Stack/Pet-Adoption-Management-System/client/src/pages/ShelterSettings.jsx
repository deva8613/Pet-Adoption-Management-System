import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import ShelterLayout from '../components/ShelterLayout';
import ErrorMessage from '../components/ErrorMessage';
import {
  Settings,
  User,
  Bell,
  Lock,
  Shield,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  Key,
  ShieldCheck,
  Building,
  Phone,
  Mail,
  Globe
} from 'lucide-react';

const ShelterSettings = () => {
  const { user, refreshUser } = useAuth();

  const [activeTab, setActiveTab] = useState('account'); // 'account' | 'notifications' | 'password' | 'security'

  // Account Settings Form State
  const [accountForm, setAccountForm] = useState({
    shelterName: '',
    phone: '',
    website: '',
    description: '',
    licenseNumber: ''
  });
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountSuccess, setAccountSuccess] = useState('');
  const [accountError, setAccountError] = useState('');

  // Notification Preferences State
  const [notificationPrefs, setNotificationPrefs] = useState({
    emailOnNewApp: true,
    emailOnStatusChange: true,
    rescueAlerts: true,
    weeklyReport: false
  });
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifSuccess, setNotifSuccess] = useState('');

  // Password Change Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (user) {
      setAccountForm({
        shelterName: user.shelterName || user.name || '',
        phone: user.phone || '',
        website: user.website || '',
        description: user.description || '',
        licenseNumber: user.licenseNumber || ''
      });
      if (user.preferences?.notifications) {
        setNotificationPrefs({
          ...notificationPrefs,
          ...user.preferences.notifications
        });
      }
    }
  }, [user]);

  // Handle Account Update
  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    try {
      setAccountSaving(true);
      setAccountError('');
      setAccountSuccess('');

      const res = await userAPI.updateProfile(accountForm);
      if (res.success) {
        setAccountSuccess('Shelter account details updated successfully.');
        if (refreshUser) refreshUser();
      } else {
        setAccountError(res.message || 'Failed to update account details.');
      }
    } catch (err) {
      setAccountError('Error occurred while updating shelter details.');
    } finally {
      setAccountSaving(false);
    }
  };

  // Handle Notification Preferences Update
  const handleNotifSubmit = async (e) => {
    e.preventDefault();
    try {
      setNotifSaving(true);
      setNotifSuccess('');
      const res = await userAPI.updateProfile({
        preferences: {
          ...(user?.preferences || {}),
          notifications: notificationPrefs
        }
      });
      if (res.success) {
        setNotifSuccess('Notification preferences saved successfully.');
        if (refreshUser) refreshUser();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setNotifSaving(false);
    }
  };

  // Handle Password Change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirmation password do not match.');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    try {
      setPasswordSaving(true);
      const res = await userAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      if (res.success) {
        setPasswordSuccess('Password changed successfully! Keep your new credentials safe.');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setPasswordError(res.message || 'Failed to change password.');
      }
    } catch (err) {
      setPasswordError('Error processing password change request.');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <ShelterLayout
      title="Settings"
      subtitle="Manage your shelter account, security preferences, and operational configurations."
      activePage="/shelter/settings"
    >
      <div className="shelter-settings-layout">
        {/* Navigation Tabs */}
        <div className="shelter-settings-nav card shadow-sm p-2 mb-4 d-flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('account')}
            className={`btn btn-sm ${activeTab === 'account' ? 'btn-primary' : 'btn-outline'}`}
          >
            <Building size={15} />
            <span>Account Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`btn btn-sm ${activeTab === 'notifications' ? 'btn-primary' : 'btn-outline'}`}
          >
            <Bell size={15} />
            <span>Notification Preferences</span>
          </button>

          <button
            onClick={() => setActiveTab('password')}
            className={`btn btn-sm ${activeTab === 'password' ? 'btn-primary' : 'btn-outline'}`}
          >
            <Lock size={15} />
            <span>Password Change</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`btn btn-sm ${activeTab === 'security' ? 'btn-primary' : 'btn-outline'}`}
          >
            <ShieldCheck size={15} />
            <span>Security &amp; Sessions</span>
          </button>
        </div>

        {/* TAB 1: ACCOUNT SETTINGS */}
        {activeTab === 'account' && (
          <div className="card shadow-sm p-4">
            <div className="d-flex align-center gap-2 mb-3 pb-2 border-bottom">
              <Building size={20} className="text-primary" />
              <div>
                <h3 className="h5 font-weight-bold mb-0">Shelter Account Information</h3>
                <p className="text-muted font-size-xs mb-0">Update shelter operational identity and public contact details</p>
              </div>
            </div>

            {accountSuccess && (
              <div className="alert alert-success d-flex align-center gap-2 mb-3 p-3 rounded">
                <CheckCircle2 size={16} />
                <span>{accountSuccess}</span>
              </div>
            )}
            {accountError && (
              <div className="alert alert-danger d-flex align-center gap-2 mb-3 p-3 rounded">
                <AlertCircle size={16} />
                <span>{accountError}</span>
              </div>
            )}

            <form onSubmit={handleAccountSubmit}>
              <div className="grid grid-2 gap-3 mb-4">
                <div className="form-group">
                  <label className="form-label">Registered Shelter Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={accountForm.shelterName}
                    onChange={(e) => setAccountForm({ ...accountForm, shelterName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Official Shelter Email (Account ID)</label>
                  <input
                    type="email"
                    className="form-control bg-light"
                    value={user?.email || ''}
                    disabled
                    title="Account email address cannot be changed directly."
                  />
                  <span className="font-size-xs text-muted mt-1 d-block">
                    Your authenticated primary login identifier.
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Contact Phone Number</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. +91 98765 43210"
                    value={accountForm.phone}
                    onChange={(e) => setAccountForm({ ...accountForm, phone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Official License / Registration No.</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. AWBI-TN-2023-8871"
                    value={accountForm.licenseNumber}
                    onChange={(e) => setAccountForm({ ...accountForm, licenseNumber: e.target.value })}
                  />
                </div>

                <div className="form-group col-span-2">
                  <label className="form-label">Official Website URL</label>
                  <input
                    type="url"
                    className="form-control"
                    placeholder="https://myshelter.org"
                    value={accountForm.website}
                    onChange={(e) => setAccountForm({ ...accountForm, website: e.target.value })}
                  />
                </div>

                <div className="form-group col-span-2">
                  <label className="form-label">About Shelter / Mission Statement</label>
                  <textarea
                    rows={4}
                    className="form-control"
                    placeholder="Share your shelter's mission, adoption policies, visiting hours, and volunteer guidelines..."
                    value={accountForm.description}
                    onChange={(e) => setAccountForm({ ...accountForm, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="d-flex justify-end pt-3 border-top">
                <button
                  type="submit"
                  disabled={accountSaving}
                  className="btn btn-primary btn-sm d-flex align-center gap-2"
                >
                  <Save size={16} />
                  <span>{accountSaving ? 'Saving Changes...' : 'Save Account Settings'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: NOTIFICATION PREFERENCES */}
        {activeTab === 'notifications' && (
          <div className="card shadow-sm p-4">
            <div className="d-flex align-center gap-2 mb-3 pb-2 border-bottom">
              <Bell size={20} className="text-primary" />
              <div>
                <h3 className="h5 font-weight-bold mb-0">Operational Notification Alerts</h3>
                <p className="text-muted font-size-xs mb-0">Control when and how you receive alerts from prospective adopters</p>
              </div>
            </div>

            {notifSuccess && (
              <div className="alert alert-success d-flex align-center gap-2 mb-3 p-3 rounded">
                <CheckCircle2 size={16} />
                <span>{notifSuccess}</span>
              </div>
            )}

            <form onSubmit={handleNotifSubmit}>
              <div className="notification-toggles-list mb-4">
                <label className="notification-toggle-card p-3 border rounded mb-2 d-flex justify-between align-center">
                  <div>
                    <strong className="d-block font-size-sm">New Adoption Application Alerts</strong>
                    <span className="text-muted font-size-xs">Receive instant in-app alerts whenever an adopter submits an application for your pets.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationPrefs.emailOnNewApp}
                    onChange={(e) => setNotificationPrefs({ ...notificationPrefs, emailOnNewApp: e.target.checked })}
                    className="toggle-checkbox"
                  />
                </label>

                <label className="notification-toggle-card p-3 border rounded mb-2 d-flex justify-between align-center">
                  <div>
                    <strong className="d-block font-size-sm">Application Status &amp; Adopter Response Alerts</strong>
                    <span className="text-muted font-size-xs">Get notified when an adopter answers an information request or confirms transport.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationPrefs.emailOnStatusChange}
                    onChange={(e) => setNotificationPrefs({ ...notificationPrefs, emailOnStatusChange: e.target.checked })}
                    className="toggle-checkbox"
                  />
                </label>

                <label className="notification-toggle-card p-3 border rounded mb-2 d-flex justify-between align-center">
                  <div>
                    <strong className="d-block font-size-sm">Nearby Emergency Rescue Report Broadcasts</strong>
                    <span className="text-muted font-size-xs">Receive notifications when animal distress rescue reports are flagged within your district.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationPrefs.rescueAlerts}
                    onChange={(e) => setNotificationPrefs({ ...notificationPrefs, rescueAlerts: e.target.checked })}
                    className="toggle-checkbox"
                  />
                </label>

                <label className="notification-toggle-card p-3 border rounded mb-2 d-flex justify-between align-center">
                  <div>
                    <strong className="d-block font-size-sm">Weekly Shelter Summary &amp; Analytics</strong>
                    <span className="text-muted font-size-xs">Receive a weekly digest of pet inquiries, pending reviews, and successful adoptions.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationPrefs.weeklyReport}
                    onChange={(e) => setNotificationPrefs({ ...notificationPrefs, weeklyReport: e.target.checked })}
                    className="toggle-checkbox"
                  />
                </label>
              </div>

              <div className="d-flex justify-end pt-3 border-top">
                <button
                  type="submit"
                  disabled={notifSaving}
                  className="btn btn-primary btn-sm d-flex align-center gap-2"
                >
                  <Save size={16} />
                  <span>{notifSaving ? 'Saving...' : 'Save Notification Preferences'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: PASSWORD CHANGE */}
        {activeTab === 'password' && (
          <div className="card shadow-sm p-4" style={{ maxWidth: '600px' }}>
            <div className="d-flex align-center gap-2 mb-3 pb-2 border-bottom">
              <Lock size={20} className="text-primary" />
              <div>
                <h3 className="h5 font-weight-bold mb-0">Change Shelter Password</h3>
                <p className="text-muted font-size-xs mb-0">Keep your shelter account and animal records secure</p>
              </div>
            </div>

            {passwordSuccess && (
              <div className="alert alert-success d-flex align-center gap-2 mb-3 p-3 rounded">
                <CheckCircle2 size={16} />
                <span>{passwordSuccess}</span>
              </div>
            )}
            {passwordError && (
              <div className="alert alert-danger d-flex align-center gap-2 mb-3 p-3 rounded">
                <AlertCircle size={16} />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group mb-3">
                <label className="form-label">Current Password *</label>
                <div className="password-input-wrap">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    className="form-control"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="password-toggle-btn"
                  >
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group mb-3">
                <label className="form-label">New Password *</label>
                <div className="password-input-wrap">
                  <input
                    type={showNew ? 'text' : 'password'}
                    className="form-control"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="password-toggle-btn"
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <span className="font-size-xs text-muted mt-1 d-block">
                  Must be at least 6 characters long. Include numbers and symbols for high security.
                </span>
              </div>

              <div className="form-group mb-4">
                <label className="form-label">Confirm New Password *</label>
                <div className="password-input-wrap">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    className="form-control"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="password-toggle-btn"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="d-flex justify-end pt-3 border-top">
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="btn btn-primary btn-sm d-flex align-center gap-2"
                >
                  <Key size={16} />
                  <span>{passwordSaving ? 'Updating Password...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 4: SECURITY & SESSIONS */}
        {activeTab === 'security' && (
          <div className="card shadow-sm p-4">
            <div className="d-flex align-center gap-2 mb-3 pb-2 border-bottom">
              <ShieldCheck size={20} className="text-primary" />
              <div>
                <h3 className="h5 font-weight-bold mb-0">Security &amp; Verification Status</h3>
                <p className="text-muted font-size-xs mb-0">Official platform verification and audit trail details</p>
              </div>
            </div>

            <div className="grid grid-2 gap-4 mb-4">
              <div className="p-3 bg-light rounded border">
                <span className="text-muted font-size-xs d-block mb-1">Verification Status</span>
                <div className="d-flex align-center gap-2">
                  <span className={`shelter-badge ${user?.verificationStatus === 'Approved' ? 'shelter-badge-success' : 'shelter-badge-pending'}`}>
                    {user?.verificationStatus === 'Approved' ? '✓ Verified Partner Shelter' : (user?.verificationStatus || 'Pending Review')}
                  </span>
                </div>
                <p className="text-muted font-size-xs mt-2 mb-0">
                  {user?.verificationStatus === 'Approved'
                    ? 'Your shelter account is fully verified and authorized to list pets and approve adoptions.'
                    : 'Your account verification request is awaiting administrative review.'}
                </p>
              </div>

              <div className="p-3 bg-light rounded border">
                <span className="text-muted font-size-xs d-block mb-1">Account Role &amp; Permissions</span>
                <strong className="d-block font-size-sm">Shelter Partner (Full Shelter Scope)</strong>
                <p className="text-muted font-size-xs mt-2 mb-0">
                  Includes listing management, application adjudications, adoption handovers, and rescue responses.
                </p>
              </div>
            </div>

            <div className="p-3 bg-teal-soft rounded border border-teal d-flex align-center gap-3">
              <Shield size={24} className="text-teal flex-shrink-0" />
              <div>
                <strong className="font-size-sm d-block text-teal">PawHomes Security Audit Protection:</strong>
                <span className="font-size-xs text-muted">
                  All shelter logins, pet additions, application approvals, and password updates are automatically recorded in the encrypted PawHomes Security Audit Logs for accountability and fraud prevention.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </ShelterLayout>
  );
};

export default ShelterSettings;
