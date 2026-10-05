import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI, rescueAPI, applicationAPI } from '../services/api';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, FileText, PieChart as PieIcon, BarChart2 } from 'lucide-react';

const COLORS = ['#10b981', '#f59e0b', '#6366f1', '#ef4444', '#8b5cf6'];

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [pets, setPets] = useState([]);
  const [applications, setApplications] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [rescueReports, setRescueReports] = useState([]);
  const [activeTab, setActiveTab] = useState('applications');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verification Modal State
  const [selectedShelter, setSelectedShelter] = useState(null);
  const [targetStatus, setTargetStatus] = useState('');
  const [reason, setReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Application Approval Modal State
  const tomorrowDateStr = new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0];
  const [selectedAppDetail, setSelectedAppDetail] = useState(null);
  const [appActionModal, setAppActionModal] = useState({
    open: false,
    app: null,
    status: '',
    reason: '',
    driverName: 'Ramesh (Pet Transport Specialist)',
    driverPhone: '+91 98765 43210',
    vehicleNumber: 'TN-01-AB-1234',
    scheduledDeliveryDate: tomorrowDateStr,
    scheduledDeliveryTime: '10:00 AM - 01:00 PM'
  });

  const handleOpenAppAction = (app, status) => {
    setAppActionModal({
      open: true,
      app,
      status,
      reason: '',
      driverName: app.driverInfo?.name || 'Ramesh (Pet Transport Specialist)',
      driverPhone: app.driverInfo?.phone || '+91 98765 43210',
      vehicleNumber: app.driverInfo?.vehicleNumber || 'TN-01-AB-1234',
      scheduledDeliveryDate: app.scheduledDeliveryDate || tomorrowDateStr,
      scheduledDeliveryTime: app.scheduledDeliveryTime || '10:00 AM - 01:00 PM'
    });
  };

  const handleAppActionSubmit = async (e) => {
    e.preventDefault();
    if (!appActionModal.app || !appActionModal.status) return;

    try {
      setActionLoading(true);
      const payload = {
        applicationStatus: appActionModal.status,
        reason: appActionModal.reason,
        driverName: appActionModal.driverName,
        driverPhone: appActionModal.driverPhone,
        vehicleNumber: appActionModal.vehicleNumber,
        scheduledDeliveryDate: appActionModal.scheduledDeliveryDate,
        scheduledDeliveryTime: appActionModal.scheduledDeliveryTime
      };

      const res = await applicationAPI.updateStatus(
        appActionModal.app._id,
        appActionModal.status,
        payload
      );

      if (res.success) {
        setAppActionModal({
          open: false,
          app: null,
          status: '',
          reason: '',
          driverName: 'Ramesh (Pet Transport Specialist)',
          driverPhone: '+91 98765 43210',
          vehicleNumber: 'TN-01-AB-1234',
          scheduledDeliveryDate: tomorrowDateStr,
          scheduledDeliveryTime: '10:00 AM - 01:00 PM'
        });
        await fetchAdminData();
      } else {
        alert(res.message || `Failed to set status to ${appActionModal.status}`);
      }
    } catch (err) {
      alert(err.message || 'Error updating application status');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, petsRes, appsRes, auditRes, rescueRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getUsers(),
        adminAPI.getPets(),
        adminAPI.getApplications(),
        adminAPI.getAuditLogs(),
        rescueAPI.getReports({ verifiedOnly: 'false' }).catch(() => ({ success: false, data: [] }))
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (usersRes.success) setUsers(usersRes.data);
      if (petsRes.success) setPets(petsRes.data);
      if (appsRes.success) setApplications(appsRes.data);
      if (auditRes.success) setAuditLogs(auditRes.data);
      if (rescueRes.success) setRescueReports(rescueRes.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch admin dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const shelters = users.filter(u => u.role === 'shelter');
  const pendingSheltersCount = shelters.filter(s => s.verificationStatus === 'Pending').length;

  // Analytics chart calculations
  const petStatusCounts = {
    Available: pets.filter(p => p.adoptionStatus === 'Available').length,
    Adopted: pets.filter(p => p.adoptionStatus === 'Adopted').length,
    Reserved: pets.filter(p => p.adoptionStatus === 'Reserved').length
  };

  const petStatusData = [
    { name: 'Available', value: petStatusCounts.Available },
    { name: 'Adopted', value: petStatusCounts.Adopted },
    { name: 'Reserved', value: petStatusCounts.Reserved }
  ];

  const speciesCounts = pets.reduce((acc, pet) => {
    const s = pet.species || 'Other';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const speciesData = Object.keys(speciesCounts).map(key => ({
    name: key,
    count: speciesCounts[key]
  }));

  const appStatusCounts = applications.reduce((acc, app) => {
    const st = app.applicationStatus || 'Pending';
    acc[st] = (acc[st] || 0) + 1;
    return acc;
  }, {});

  const applicationStatusData = Object.keys(appStatusCounts).map(key => ({
    name: key,
    count: appStatusCounts[key]
  }));

  const handleOpenVerifyModal = (shelter, status) => {
    setSelectedShelter(shelter);
    setTargetStatus(status);
    setReason('');
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!selectedShelter || !targetStatus) return;

    try {
      setActionLoading(true);
      const res = await adminAPI.verifyShelter(selectedShelter._id, targetStatus, reason);
      if (res.success) {
        setSelectedShelter(null);
        await fetchAdminData();
      } else {
        alert(res.message || 'Failed to update shelter status');
      }
    } catch (err) {
      alert('Error updating shelter verification');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="container section-padding">
      <div className="dashboard-header mb-5">
        <h1>System Admin Portal</h1>
        <p className="subtitle">Platform analytics, shelter verification approval, rescue report management, and security audit logs.</p>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading live platform database records..." />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <>
          {/* Adoption Applications Dashboard Summary Cards */}
          <div className="grid grid-4 mb-5">
            <StatCard
              title="Total Applications"
              value={applications.length}
              icon="📝"
            />
            <StatCard
              title="Pending Applications"
              value={applications.filter(a => (a.applicationStatus || 'Pending') === 'Pending').length}
              icon="⏳"
            />
            <StatCard
              title="Approved Applications"
              value={applications.filter(a => a.applicationStatus === 'Approved' || a.applicationStatus === 'Successful').length}
              icon="✅"
            />
            <StatCard
              title="Rejected Applications"
              value={applications.filter(a => a.applicationStatus === 'Rejected').length}
              icon="❌"
            />
          </div>

          <div className="admin-tabs mb-4">
            <button
              className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              📊 Adoption Analytics
            </button>
            <button
              className={`tab-btn ${activeTab === 'shelters' ? 'active' : ''}`}
              onClick={() => setActiveTab('shelters')}
            >
              Shelter Verifications ({shelters.length}) {pendingSheltersCount > 0 && `• ${pendingSheltersCount} Pending`}
            </button>
            <button
              className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              All Users ({users.length})
            </button>
            <button
              className={`tab-btn ${activeTab === 'pets' ? 'active' : ''}`}
              onClick={() => setActiveTab('pets')}
            >
              Pets Catalog ({pets.length})
            </button>
            <button
              className={`tab-btn ${activeTab === 'applications' ? 'active' : ''}`}
              onClick={() => setActiveTab('applications')}
            >
              Applications ({applications.length})
            </button>
            <button
              className={`tab-btn ${activeTab === 'rescue' ? 'active' : ''}`}
              onClick={() => setActiveTab('rescue')}
            >
              Rescue Reports ({rescueReports.length})
            </button>
            <button
              className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
              onClick={() => setActiveTab('audit')}
            >
              Security Audit Logs ({auditLogs.length})
            </button>
          </div>

          <div className="card shadow-sm p-4">

            {/* ANALYTICS TAB */}
            {activeTab === 'analytics' && (
              <div>
                <h3 className="mb-4 d-flex align-center gap-2">
                  <BarChart2 className="text-primary" size={22} /> Platform Adoption &amp; Rescue Metrics
                </h3>

                <div className="grid grid-2 gap-4 mb-5">
                  <div className="card shadow-sm p-3" style={{ background: '#fafafa' }}>
                    <h4 className="text-center mb-3">Pet Adoption Status Breakdown</h4>
                    <div style={{ width: '100%', height: 280 }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={petStatusData}
                            cx="50%"
                            cy="50%"
                            outerRadius={90}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            {petStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="card shadow-sm p-3" style={{ background: '#fafafa' }}>
                    <h4 className="text-center mb-3">Applications Status Distribution</h4>
                    <div style={{ width: '100%', height: 280 }}>
                      <ResponsiveContainer>
                        <BarChart data={applicationStatusData}>
                          <XAxis dataKey="name" />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="card shadow-sm p-3" style={{ background: '#fafafa' }}>
                  <h4 className="text-center mb-3">Pets Catalog by Species</h4>
                  <div style={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer>
                      <BarChart data={speciesData}>
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* SHELTER VERIFICATION TAB */}
            {activeTab === 'shelters' && (
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Shelter Name</th>
                      <th>Contact Person</th>
                      <th>Email &amp; Phone</th>
                      <th>District</th>
                      <th>Verification Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shelters.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center p-4 text-muted">No shelter profiles found.</td>
                      </tr>
                    ) : (
                      shelters.map(s => {
                        const status = s.verificationStatus || 'Pending';
                        return (
                          <tr key={s._id}>
                            <td>
                              <strong>{s.shelterName || s.name}</strong>
                              {s.licenseNumber && (
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                  Lic: {s.licenseNumber}
                                </div>
                              )}
                            </td>
                            <td>{s.name}</td>
                            <td>
                              <div>{s.email}</div>
                              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{s.phone || 'N/A'}</div>
                            </td>
                            <td>{s.district || s.city || 'TN'}</td>
                            <td>
                              <span className={`badge ${
                                status === 'Approved' ? 'badge-success' :
                                status === 'Rejected' ? 'badge-danger' :
                                status === 'Suspended' ? 'badge-warning' : 'badge-info'
                              }`}>
                                {status}
                              </span>
                              {s.verificationReason && (
                                <div style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '2px' }}>
                                  Reason: {s.verificationReason}
                                </div>
                              )}
                            </td>
                            <td>
                              <div className="action-btn-group">
                                {status !== 'Approved' && (
                                  <button
                                    onClick={() => handleOpenVerifyModal(s, 'Approved')}
                                    className="btn btn-success btn-xs"
                                  >
                                    Approve
                                  </button>
                                )}
                                {status !== 'Rejected' && (
                                  <button
                                    onClick={() => handleOpenVerifyModal(s, 'Rejected')}
                                    className="btn btn-danger btn-xs"
                                  >
                                    Reject
                                  </button>
                                )}
                                {status !== 'Suspended' && (
                                  <button
                                    onClick={() => handleOpenVerifyModal(s, 'Suspended')}
                                    className="btn btn-warning btn-xs"
                                  >
                                    Suspend
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* USERS TAB */}
            {activeTab === 'users' && (
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>District</th>
                      <th>Role</th>
                      <th>Email Verified</th>
                      <th>Joined Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id}>
                        <td><strong>{u.name}</strong></td>
                        <td>{u.email}</td>
                        <td>{u.district || u.city || 'N/A'}</td>
                        <td><span className="badge badge-info">{u.role}</span></td>
                        <td>
                          <span className={`badge ${u.isEmailVerified ? 'badge-success' : 'badge-secondary'}`}>
                            {u.isEmailVerified ? 'Verified' : 'Unverified'}
                          </span>
                        </td>
                        <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* PETS TAB */}
            {activeTab === 'pets' && (
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Pet Name</th>
                      <th>Species</th>
                      <th>Breed</th>
                      <th>District</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pets.map(p => (
                      <tr key={p._id}>
                        <td><strong>{p.petName}</strong></td>
                        <td>{p.species}</td>
                        <td>{p.breed}</td>
                        <td>{p.district || p.location}</td>
                        <td><StatusBadge status={p.adoptionStatus} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* APPLICATIONS TAB */}
            {activeTab === 'applications' && (
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Pet Name</th>
                      <th>Applicant Name</th>
                      <th>Email &amp; Phone</th>
                      <th>District</th>
                      <th>Submitted Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center p-4 text-muted">No adoption applications submitted yet.</td>
                      </tr>
                    ) : (
                      applications.map(a => {
                        const status = a.applicationStatus || 'Pending';
                        return (
                          <tr key={a._id}>
                            <td><strong>{a.pet?.petName || 'Pet Record'}</strong></td>
                            <td>{a.applicant?.name || 'Applicant'}</td>
                            <td>
                              <div>{a.applicant?.email || '-'}</div>
                              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{a.applicant?.phone || ''}</div>
                            </td>
                            <td>{a.applicantDistrict || a.applicant?.district || a.applicant?.city || 'Tamil Nadu'}</td>
                            <td>{new Date(a.createdAt).toLocaleDateString()}</td>
                            <td>
                              <StatusBadge status={status} />
                              {a.closingReason && (
                                <div style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '2px' }}>
                                  Reason: {a.closingReason}
                                </div>
                              )}
                            </td>
                            <td>
                              <div className="action-btn-group">
                                <button
                                  className="btn btn-outline btn-xs"
                                  onClick={() => setSelectedAppDetail(a)}
                                >
                                  View Details
                                </button>
                                {status === 'Pending' && (
                                  <>
                                    <button
                                      className="btn btn-success btn-xs"
                                      onClick={() => handleOpenAppAction(a, 'Approved')}
                                    >
                                      Approve &amp; Schedule
                                    </button>
                                    <button
                                      className="btn btn-danger btn-xs"
                                      onClick={() => handleOpenAppAction(a, 'Rejected')}
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}
                                {status === 'Approved' && (
                                  <>
                                    <button
                                      className="btn btn-success btn-xs"
                                      onClick={() => handleOpenAppAction(a, 'Successful')}
                                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                    >
                                      🚚 Mark Delivered &amp; Successful
                                    </button>
                                    <button
                                      className="btn btn-danger btn-xs"
                                      onClick={() => handleOpenAppAction(a, 'Rejected')}
                                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                    >
                                      Cancel Adoption
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* RESCUE REPORTS TAB */}
            {activeTab === 'rescue' && (
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Pet Name / Species</th>
                      <th>Location / District</th>
                      <th>Reporter Contact</th>
                      <th>Verification</th>
                      <th>Submitted Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rescueReports.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center p-4 text-muted">No rescue reports found.</td>
                      </tr>
                    ) : (
                      rescueReports.map(r => (
                        <tr key={r._id}>
                          <td>
                            <span className={`badge ${r.reportType === 'Lost' ? 'badge-danger' : r.reportType === 'Found' ? 'badge-success' : 'badge-warning'}`}>
                              {r.reportType}
                            </span>
                          </td>
                          <td><strong>{r.petName || 'Unknown'}</strong> ({r.species})</td>
                          <td>{r.location}, {r.district}</td>
                          <td>{r.contactPhone}</td>
                          <td>
                            <span className={`badge ${r.isVerified ? 'badge-success' : 'badge-secondary'}`}>
                              {r.isVerified ? 'Verified' : 'Pending'}
                            </span>
                          </td>
                          <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* SECURITY AUDIT LOGS TAB */}
            {activeTab === 'audit' && (
              <div>
                <div className="d-flex justify-between align-center mb-3 flex-wrap gap-2 p-3 bg-light rounded">
                  <div>
                    <h4 className="mb-0 font-weight-bold">Security Activity Feed</h4>
                    <span className="text-muted font-size-xs">Recent security and administrative events recorded in MongoDB</span>
                  </div>
                  <Link to="/admin/security/audit-logs" className="btn btn-primary btn-sm d-flex align-center gap-2">
                    <ShieldCheck size={16} />
                    <span>Open Full Security Audit Logs Manager &rarr;</span>
                  </Link>
                </div>

                <div className="table-responsive">
                  <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Entity</th>
                      <th>Action</th>
                      <th>Authorized User</th>
                      <th>Previous → New Status</th>
                      <th>Recorded Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center p-4 text-muted">No audit logs recorded yet.</td>
                      </tr>
                    ) : (
                      auditLogs.map(log => (
                        <tr key={log._id}>
                          <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td>
                            <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>
                              {log.entityType}
                            </span>
                          </td>
                          <td><strong>{log.action}</strong></td>
                          <td>
                            <div>{log.authorizedUser?.name || 'System'}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{log.authorizedUser?.role}</div>
                          </td>
                          <td>
                            {log.previousStatus || 'None'} → <strong>{log.newStatus || '-'}</strong>
                          </td>
                          <td style={{ fontSize: '0.85rem' }}>{log.reason || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          </div>
        </>
      )}

      {/* Verification Action Modal */}
      {selectedShelter && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>{targetStatus} Shelter Account</h2>
              <button className="close-btn" onClick={() => setSelectedShelter(null)}>✕</button>
            </div>

            <form onSubmit={handleVerifySubmit} className="modal-body">
              <p>
                You are updating the status of <strong>{selectedShelter.shelterName || selectedShelter.name}</strong> to{' '}
                <strong style={{ color: targetStatus === 'Approved' ? '#047857' : '#b91c1c' }}>{targetStatus}</strong>.
              </p>

              <div className="form-group mb-4">
                <label>Recorded Reason / Administrative Note *</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={`Specify the official reason for setting status to ${targetStatus}...`}
                  required
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setSelectedShelter(null)} disabled={actionLoading}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`btn ${targetStatus === 'Approved' ? 'btn-success' : 'btn-danger'}`}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Saving...' : `Confirm ${targetStatus}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Application Details Modal */}
      {selectedAppDetail && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>Application Details</h2>
              <button className="close-btn" onClick={() => setSelectedAppDetail(null)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="detail-row">
                <strong>Pet:</strong> {selectedAppDetail.pet?.petName || 'Pet Record'} ({selectedAppDetail.pet?.species || 'Species'})
              </div>
              <div className="detail-row">
                <strong>Applicant Name:</strong> {selectedAppDetail.applicant?.name || 'N/A'}
              </div>
              <div className="detail-row">
                <strong>Applicant Email:</strong> {selectedAppDetail.applicant?.email || 'N/A'}
              </div>
              <div className="detail-row">
                <strong>Applicant Phone:</strong> {selectedAppDetail.applicant?.phone || 'N/A'}
              </div>
              <div className="detail-row">
                <strong>Applicant District:</strong> {selectedAppDetail.applicantDistrict || selectedAppDetail.applicant?.district || selectedAppDetail.applicant?.city || 'N/A'}
              </div>
              <div className="detail-row">
                <strong>Current Status:</strong> <StatusBadge status={selectedAppDetail.applicationStatus} />
              </div>
              {selectedAppDetail.closingReason && (
                <div className="detail-row" style={{ color: '#b45309' }}>
                  <strong>Closing Reason:</strong> {selectedAppDetail.closingReason}
                </div>
              )}
              <hr />
              <div className="detail-row">
                <strong>Reason for Adoption:</strong>
                <p className="detail-text">{selectedAppDetail.reasonForAdoption}</p>
              </div>
              <div className="detail-row">
                <strong>Experience with Pets:</strong>
                <p className="detail-text">{selectedAppDetail.experienceWithPets}</p>
              </div>
              <div className="detail-row">
                <strong>Living Situation:</strong> {selectedAppDetail.livingSituation}
              </div>
              <div className="detail-row">
                <strong>Other Pets:</strong> {selectedAppDetail.hasOtherPets}
              </div>
              <div className="detail-row">
                <strong>Preferred Contact:</strong> {selectedAppDetail.preferredContact}
              </div>

              {selectedAppDetail.driverInfo && (selectedAppDetail.driverInfo.name || selectedAppDetail.driverInfo.driverName) && (
                <>
                  <hr />
                  <div style={{ backgroundColor: '#f0fdf4', padding: '14px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#166534', fontSize: '0.95rem' }}>🚚 Allocated Driver & Delivery Schedule</h4>
                    <div className="detail-row">
                      <strong>Assigned Driver:</strong> {selectedAppDetail.driverInfo.name || selectedAppDetail.driverInfo.driverName} (📞 {selectedAppDetail.driverInfo.phone || selectedAppDetail.driverInfo.driverPhone})
                    </div>
                    {selectedAppDetail.driverInfo.vehicleNumber && (
                      <div className="detail-row">
                        <strong>Vehicle Reg No:</strong> {selectedAppDetail.driverInfo.vehicleNumber}
                      </div>
                    )}
                    <div className="detail-row">
                      <strong>Scheduled Date:</strong> {selectedAppDetail.scheduledDeliveryDate ? new Date(selectedAppDetail.scheduledDeliveryDate).toLocaleDateString() : 'Scheduled'}
                    </div>
                    <div className="detail-row">
                      <strong>Time Slot:</strong> {selectedAppDetail.scheduledDeliveryTime || 'Morning Slot'}
                    </div>
                  </div>
                </>
              )}

              <div className="modal-actions mt-4">
                <button className="btn btn-outline" onClick={() => setSelectedAppDetail(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Application Action Confirmation Modal */}
      {appActionModal.open && appActionModal.app && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>Confirm Application {appActionModal.status}</h2>
              <button className="close-btn" onClick={() => setAppActionModal({ open: false, app: null, status: '', reason: '' })}>✕</button>
            </div>

            <form onSubmit={handleAppActionSubmit} className="modal-body">
              <p>
                Are you sure you want to set the application status for pet <strong>{appActionModal.app.pet?.petName || 'Pet'}</strong> (Applicant: <strong>{appActionModal.app.applicant?.name || 'Applicant'}</strong>) to{' '}
                <strong style={{ color: appActionModal.status === 'Approved' ? '#047857' : '#b91c1c' }}>{appActionModal.status}</strong>?
              </p>

              {appActionModal.status === 'Approved' && (
                <div style={{ backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '12px', border: '1px solid #bbf7d0', marginBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#166534', fontSize: '0.95rem' }}>🚚 Driver &amp; Delivery Schedule Allocation</h4>
                  <div className="form-group mb-3">
                    <label>Assigned Transport Specialist / Driver Name *</label>
                    <input
                      type="text"
                      value={appActionModal.driverName}
                      onChange={(e) => setAppActionModal({ ...appActionModal, driverName: e.target.value })}
                      placeholder="e.g. Ramesh (Pet Transport Specialist)"
                      required
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label>Driver Phone Number *</label>
                    <input
                      type="text"
                      value={appActionModal.driverPhone}
                      onChange={(e) => setAppActionModal({ ...appActionModal, driverPhone: e.target.value })}
                      placeholder="e.g. +91 98765 43210"
                      required
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label>Vehicle / Transport Registration No.</label>
                    <input
                      type="text"
                      value={appActionModal.vehicleNumber}
                      onChange={(e) => setAppActionModal({ ...appActionModal, vehicleNumber: e.target.value })}
                      placeholder="e.g. TN-01-AB-1234 (AC Transport Van)"
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Scheduled Delivery Date *</label>
                      <input
                        type="date"
                        value={appActionModal.scheduledDeliveryDate}
                        onChange={(e) => setAppActionModal({ ...appActionModal, scheduledDeliveryDate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Scheduled Time Slot *</label>
                      <select
                        value={appActionModal.scheduledDeliveryTime}
                        onChange={(e) => setAppActionModal({ ...appActionModal, scheduledDeliveryTime: e.target.value })}
                        required
                      >
                        <option value="09:00 AM - 12:00 PM">09:00 AM - 12:00 PM</option>
                        <option value="10:00 AM - 01:00 PM">10:00 AM - 01:00 PM</option>
                        <option value="02:00 PM - 05:00 PM">02:00 PM - 05:00 PM</option>
                        <option value="06:00 PM - 09:00 PM">06:00 PM - 09:00 PM</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {appActionModal.status === 'Rejected' && (
                <div className="form-group mb-4">
                  <label>Rejection Reason (Optional)</label>
                  <textarea
                    value={appActionModal.reason}
                    onChange={(e) => setAppActionModal({ ...appActionModal, reason: e.target.value })}
                    placeholder="Specify reason for rejecting this application..."
                    rows="3"
                  />
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setAppActionModal({ open: false, app: null, status: '', reason: '' })} disabled={actionLoading}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`btn ${appActionModal.status === 'Approved' || appActionModal.status === 'Successful' ? 'btn-success' : 'btn-danger'}`}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Saving...' : appActionModal.status === 'Approved' ? 'Confirm Approval & Schedule Delivery 🚚' : appActionModal.status === 'Successful' ? 'Confirm Delivery & Mark Successful ✅' : `Confirm ${appActionModal.status}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
