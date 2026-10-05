import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Activity,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  AlertCircle,
  Clock,
  Globe,
  Monitor,
  User,
  ArrowUpDown,
  Calendar,
  CheckCircle,
  XCircle,
  Layers
} from 'lucide-react';

const ACTION_OPTIONS = [
  { value: 'ALL', label: 'All Actions' },
  { value: 'LOGIN_SUCCESS', label: 'LOGIN_SUCCESS' },
  { value: 'LOGIN_FAILED', label: 'LOGIN_FAILED' },
  { value: 'LOGOUT', label: 'LOGOUT' },
  { value: 'PASSWORD_CHANGED', label: 'PASSWORD_CHANGED' },
  { value: 'USER_CREATED', label: 'USER_CREATED' },
  { value: 'USER_UPDATED', label: 'USER_UPDATED' },
  { value: 'USER_DELETED', label: 'USER_DELETED' },
  { value: 'SHELTER_CREATED', label: 'SHELTER_CREATED' },
  { value: 'SHELTER_UPDATED', label: 'SHELTER_UPDATED' },
  { value: 'PET_CREATED', label: 'PET_CREATED' },
  { value: 'PET_UPDATED', label: 'PET_UPDATED' },
  { value: 'PET_DELETED', label: 'PET_DELETED' },
  { value: 'APPLICATION_APPROVED', label: 'APPLICATION_APPROVED' },
  { value: 'APPLICATION_REJECTED', label: 'APPLICATION_REJECTED' },
  { value: 'ADOPTION_COMPLETED', label: 'ADOPTION_COMPLETED' },
  { value: 'ADMIN_SETTINGS_UPDATED', label: 'ADMIN_SETTINGS_UPDATED' }
];

const SecurityAuditLogs = () => {
  const { user } = useAuth();

  // State
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    totalLogs: 0,
    successCount: 0,
    failedCount: 0,
    todayCount: 0
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters State
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [dateRange, setDateRange] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Selected Log for Modal
  const [selectedLog, setSelectedLog] = useState(null);

  // Fetch Logs from Backend
  const fetchAuditLogs = useCallback(async (pageOverride) => {
    try {
      setLoading(true);
      setError(null);

      const targetPage = pageOverride !== undefined ? pageOverride : pagination.page;

      const params = {
        page: targetPage,
        limit: pagination.limit,
        sortBy
      };

      if (search.trim()) params.search = search.trim();
      if (roleFilter && roleFilter !== 'ALL') params.role = roleFilter;
      if (statusFilter && statusFilter !== 'ALL') params.status = statusFilter;
      if (actionFilter && actionFilter !== 'ALL') params.action = actionFilter;
      if (dateRange) params.dateRange = dateRange;
      if (dateRange === 'custom') {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      }

      const res = await adminAPI.getAuditLogs(params);

      if (res && res.success) {
        setLogs(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
        if (res.stats) {
          setStats(res.stats);
        }
      } else {
        setError(res?.message || 'Unable to load audit logs.');
      }
    } catch (err) {
      console.error('Fetch audit logs error:', err);
      setError('Unable to load audit logs.');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, sortBy, search, roleFilter, statusFilter, actionFilter, dateRange, startDate, endDate]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  // Handle Search Submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearch('');
    setRoleFilter('ALL');
    setStatusFilter('ALL');
    setActionFilter('ALL');
    setDateRange('');
    setStartDate('');
    setEndDate('');
    setSortBy('newest');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Format Date & Time safely
  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'Unavailable';
    try {
      const d = new Date(timestamp);
      return d.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch {
      return String(timestamp);
    }
  };

  // Badge helpers
  const getActionBadgeClass = (action) => {
    if (!action) return 'badge-secondary';
    const a = action.toUpperCase();
    if (a.includes('SUCCESS') || a.includes('APPROVED') || a.includes('COMPLETED')) return 'audit-badge-success';
    if (a.includes('FAILED') || a.includes('DELETED') || a.includes('REJECTED')) return 'audit-badge-danger';
    if (a.includes('UPDATED') || a.includes('CHANGED')) return 'audit-badge-warning';
    return 'audit-badge-info';
  };

  const getStatusBadge = (status) => {
    const isSuccess = (status || '').toUpperCase() === 'SUCCESS';
    return (
      <span className={`audit-status-badge ${isSuccess ? 'audit-status-success' : 'audit-status-failed'}`}>
        {isSuccess ? <CheckCircle size={13} /> : <XCircle size={13} />}
        <span>{isSuccess ? 'SUCCESS' : 'FAILED'}</span>
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const r = (role || 'USER').toUpperCase();
    let badgeStyle = 'audit-role-user';
    if (r === 'ADMIN') badgeStyle = 'audit-role-admin';
    else if (r === 'SHELTER') badgeStyle = 'audit-role-shelter';
    return <span className={`audit-role-pill ${badgeStyle}`}>{r}</span>;
  };

  return (
    <div className="container dashboard-container py-4">
      <div className="dashboard-grid">
        {/* Sidebar Navigation */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="dashboard-main-content">
          {/* Page Heading */}
          <div className="audit-header card shadow-sm p-4 mb-4">
            <div className="d-flex justify-between align-center flex-wrap gap-3">
              <div>
                <div className="d-flex align-center gap-2 mb-1">
                  <div className="audit-icon-badge">
                    <Shield size={24} className="text-primary" />
                  </div>
                  <h1 className="h2 mb-0 font-weight-bold">Security Audit Logs</h1>
                </div>
                <p className="text-muted mb-0 font-size-sm">
                  Monitor important security and administrative activities across PawHomes.
                </p>
              </div>

              <div className="d-flex align-center gap-2">
                <button
                  onClick={() => fetchAuditLogs()}
                  className="btn btn-outline btn-sm d-flex align-center gap-2"
                  disabled={loading}
                  title="Refresh Logs from MongoDB"
                >
                  <RefreshCw size={15} className={loading ? 'spin-animation' : ''} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>

          {/* Real Statistics Cards */}
          <div className="audit-stats-grid mb-4">
            <div className="audit-stat-card card shadow-sm p-3">
              <div className="d-flex align-center justify-between">
                <div>
                  <span className="audit-stat-label">Total Logs</span>
                  <h3 className="audit-stat-value text-primary mb-0 mt-1">{stats.totalLogs.toLocaleString()}</h3>
                </div>
                <div className="audit-stat-icon-wrap bg-primary-soft">
                  <Shield size={22} className="text-primary" />
                </div>
              </div>
            </div>

            <div className="audit-stat-card card shadow-sm p-3">
              <div className="d-flex align-center justify-between">
                <div>
                  <span className="audit-stat-label">Successful Actions</span>
                  <h3 className="audit-stat-value text-success mb-0 mt-1">{stats.successCount.toLocaleString()}</h3>
                </div>
                <div className="audit-stat-icon-wrap bg-success-soft">
                  <ShieldCheck size={22} className="text-success" />
                </div>
              </div>
            </div>

            <div className="audit-stat-card card shadow-sm p-3">
              <div className="d-flex align-center justify-between">
                <div>
                  <span className="audit-stat-label">Failed Actions</span>
                  <h3 className="audit-stat-value text-danger mb-0 mt-1">{stats.failedCount.toLocaleString()}</h3>
                </div>
                <div className="audit-stat-icon-wrap bg-danger-soft">
                  <ShieldAlert size={22} className="text-danger" />
                </div>
              </div>
            </div>

            <div className="audit-stat-card card shadow-sm p-3">
              <div className="d-flex align-center justify-between">
                <div>
                  <span className="audit-stat-label">Today's Activities</span>
                  <h3 className="audit-stat-value text-warning mb-0 mt-1">{stats.todayCount.toLocaleString()}</h3>
                </div>
                <div className="audit-stat-icon-wrap bg-warning-soft">
                  <Activity size={22} className="text-warning" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="audit-filters-card card shadow-sm p-3 mb-4">
            <form onSubmit={handleSearchSubmit}>
              <div className="audit-filters-grid">
                {/* Search Bar */}
                <div className="filter-item-search">
                  <label className="filter-label">Search</label>
                  <div className="search-input-wrap">
                    <Search size={16} className="search-icon" />
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search by user, email, action, details..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>

                {/* Role Filter */}
                <div className="filter-item">
                  <label className="filter-label">Role</label>
                  <select
                    className="form-control"
                    value={roleFilter}
                    onChange={(e) => {
                      setRoleFilter(e.target.value);
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                  >
                    <option value="ALL">All Roles</option>
                    <option value="USER">USER</option>
                    <option value="SHELTER">SHELTER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div className="filter-item">
                  <label className="filter-label">Status</label>
                  <select
                    className="form-control"
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="SUCCESS">SUCCESS</option>
                    <option value="FAILED">FAILED</option>
                  </select>
                </div>

                {/* Action Filter */}
                <div className="filter-item">
                  <label className="filter-label">Action</label>
                  <select
                    className="form-control"
                    value={actionFilter}
                    onChange={(e) => {
                      setActionFilter(e.target.value);
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                  >
                    {ACTION_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Date Filter */}
                <div className="filter-item">
                  <label className="filter-label">Date Range</label>
                  <select
                    className="form-control"
                    value={dateRange}
                    onChange={(e) => {
                      setDateRange(e.target.value);
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                  >
                    <option value="">All Time</option>
                    <option value="today">Today</option>
                    <option value="7days">Last 7 Days</option>
                    <option value="30days">Last 30 Days</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>

                {/* Sort Order */}
                <div className="filter-item">
                  <label className="filter-label">Sort By</label>
                  <select
                    className="form-control"
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
              </div>

              {/* Custom Date Inputs */}
              {dateRange === 'custom' && (
                <div className="custom-date-row mt-3 pt-3 border-top d-flex align-center gap-3 flex-wrap">
                  <div className="d-flex align-center gap-2">
                    <span className="text-muted font-size-sm">Start Date:</span>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="d-flex align-center gap-2">
                    <span className="text-muted font-size-sm">End Date:</span>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: 1 }))}
                  >
                    Apply Dates
                  </button>
                </div>
              )}

              {/* Action Buttons Row */}
              <div className="d-flex justify-between align-center mt-3 pt-2">
                <button type="submit" className="btn btn-primary btn-sm d-flex align-center gap-1">
                  <Filter size={14} />
                  <span>Filter Logs</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="btn btn-link btn-sm text-muted p-0"
                >
                  Reset All Filters
                </button>
              </div>
            </form>
          </div>

          {/* Audit Logs Table Card */}
          <div className="audit-table-card card shadow-sm p-0 mb-4">
            {/* Loading State */}
            {loading && (
              <div className="audit-state-box p-5 text-center">
                <RefreshCw size={36} className="spin-animation text-primary mb-3 mx-auto" />
                <h4 className="font-weight-medium">Loading audit logs...</h4>
                <p className="text-muted font-size-sm">Fetching real activity records from MongoDB</p>
              </div>
            )}

            {/* Error State */}
            {!loading && error && (
              <div className="audit-state-box p-5 text-center">
                <AlertCircle size={40} className="text-danger mb-3 mx-auto" />
                <h4 className="text-danger font-weight-medium">Unable to load audit logs.</h4>
                <p className="text-muted font-size-sm mb-3">{error}</p>
                <button
                  onClick={() => fetchAuditLogs()}
                  className="btn btn-primary btn-sm d-inline-flex align-center gap-2"
                >
                  <RefreshCw size={14} />
                  <span>Retry</span>
                </button>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && logs.length === 0 && (
              <div className="audit-state-box p-5 text-center">
                <div className="audit-empty-icon mb-3">
                  <Shield size={44} className="text-muted" />
                </div>
                <h4 className="font-weight-medium mb-1">No security activity recorded yet.</h4>
                <p className="text-muted font-size-sm mb-3">
                  Audit logs will automatically record security and administrative actions as they occur.
                </p>
                {(search || roleFilter !== 'ALL' || statusFilter !== 'ALL' || actionFilter !== 'ALL' || dateRange) && (
                  <button onClick={handleResetFilters} className="btn btn-outline btn-sm">
                    Clear Active Filters
                  </button>
                )}
              </div>
            )}

            {/* Table Content */}
            {!loading && !error && logs.length > 0 && (
              <div className="table-responsive">
                <table className="audit-table">
                  <thead>
                    <tr>
                      <th>Date &amp; Time</th>
                      <th>User</th>
                      <th>Role</th>
                      <th>Action</th>
                      <th>Module</th>
                      <th>Status</th>
                      <th>IP Address</th>
                      <th>Details</th>
                      <th className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => {
                      const logId = log._id?.toString() || Math.random().toString();
                      const logDate = log.createdAt || log.timestamp;
                      const displayName = log.userName || log.authorizedUser?.name || 'System';
                      const displayEmail = log.userEmail || log.authorizedUser?.email || '';
                      const displayRole = log.role || log.authorizedUser?.role || 'SYSTEM';
                      const displayModule = log.module || log.entityType || 'SYSTEM';

                      return (
                        <tr
                          key={logId}
                          className="audit-table-row"
                          onClick={() => setSelectedLog(log)}
                        >
                          <td className="audit-cell-datetime">
                            <div className="d-flex align-center gap-1">
                              <Clock size={13} className="text-muted flex-shrink-0" />
                              <span className="font-weight-medium">{formatDateTime(logDate)}</span>
                            </div>
                          </td>

                          <td className="audit-cell-user">
                            <div className="audit-user-info">
                              <span className="audit-user-name font-weight-medium text-truncate">{displayName}</span>
                              {displayEmail && (
                                <span className="audit-user-email text-muted text-truncate font-size-xs">{displayEmail}</span>
                              )}
                            </div>
                          </td>

                          <td className="audit-cell-role">
                            {getRoleBadge(displayRole)}
                          </td>

                          <td className="audit-cell-action">
                            <span className={`audit-badge ${getActionBadgeClass(log.action)}`}>
                              {log.action || 'SYSTEM_ACTION'}
                            </span>
                          </td>

                          <td className="audit-cell-module">
                            <span className="audit-module-tag">
                              {displayModule.toUpperCase()}
                            </span>
                          </td>

                          <td className="audit-cell-status">
                            {getStatusBadge(log.status)}
                          </td>

                          <td className="audit-cell-ip">
                            <code className="audit-ip-code">{log.ipAddress || 'Unavailable'}</code>
                          </td>

                          <td className="audit-cell-details">
                            <span className="audit-details-text text-truncate" title={log.details || log.reason || ''}>
                              {log.details || log.reason || '-'}
                            </span>
                          </td>

                          <td className="audit-cell-actions text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setSelectedLog(log)}
                              className="btn btn-outline btn-xs audit-view-btn"
                              title="View full audit record"
                            >
                              <Eye size={13} />
                              <span>View</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {!loading && !error && pagination.total > 0 && (
              <div className="audit-pagination-bar p-3 border-top d-flex justify-between align-center flex-wrap gap-2">
                <div className="text-muted font-size-sm">
                  Showing <strong>{Math.min(pagination.total, (pagination.page - 1) * pagination.limit + 1)}</strong>–
                  <strong>{Math.min(pagination.total, pagination.page * pagination.limit)}</strong> of{' '}
                  <strong>{pagination.total}</strong> logs
                </div>

                <div className="d-flex align-center gap-1">
                  <button
                    onClick={() => {
                      const prev = Math.max(1, pagination.page - 1);
                      setPagination(p => ({ ...p, page: prev }));
                      fetchAuditLogs(prev);
                    }}
                    disabled={pagination.page <= 1}
                    className="btn btn-outline btn-sm audit-page-btn"
                  >
                    <ChevronLeft size={15} />
                    <span>Previous</span>
                  </button>

                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNumber;
                    if (pagination.totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNumber = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNumber = pagination.totalPages - 4 + i;
                    } else {
                      pageNumber = pagination.page - 2 + i;
                    }

                    return (
                      <button
                        key={pageNumber}
                        onClick={() => {
                          setPagination(p => ({ ...p, page: pageNumber }));
                          fetchAuditLogs(pageNumber);
                        }}
                        className={`btn btn-sm audit-num-btn ${pagination.page === pageNumber ? 'btn-primary' : 'btn-outline'}`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => {
                      const next = Math.min(pagination.totalPages, pagination.page + 1);
                      setPagination(p => ({ ...p, page: next }));
                      fetchAuditLogs(next);
                    }}
                    disabled={pagination.page >= pagination.totalPages}
                    className="btn btn-outline btn-sm audit-page-btn"
                  >
                    <span>Next</span>
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Audit Log Details Modal */}
      {selectedLog && (
        <div className="audit-modal-backdrop" onClick={() => setSelectedLog(null)}>
          <div className="audit-modal-content card shadow-lg" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="audit-modal-header d-flex justify-between align-center p-3 border-bottom">
              <div className="d-flex align-center gap-2">
                <Shield size={20} className="text-primary" />
                <h3 className="h4 mb-0 font-weight-bold">Audit Log Record Details</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="audit-modal-close btn btn-link text-muted p-1"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="audit-modal-body p-4">
              <div className="audit-detail-grid">
                {/* User Identity */}
                <div className="audit-detail-item">
                  <span className="audit-detail-label d-flex align-center gap-1">
                    <User size={14} className="text-muted" /> User
                  </span>
                  <div className="audit-detail-value font-weight-medium">
                    {selectedLog.userName || selectedLog.authorizedUser?.name || 'System'}
                  </div>
                </div>

                <div className="audit-detail-item">
                  <span className="audit-detail-label">Email</span>
                  <div className="audit-detail-value">
                    {selectedLog.userEmail || selectedLog.authorizedUser?.email || 'N/A'}
                  </div>
                </div>

                <div className="audit-detail-item">
                  <span className="audit-detail-label">Role</span>
                  <div className="audit-detail-value">
                    {getRoleBadge(selectedLog.role || selectedLog.authorizedUser?.role || 'SYSTEM')}
                  </div>
                </div>

                <div className="audit-detail-item">
                  <span className="audit-detail-label">Status</span>
                  <div className="audit-detail-value">
                    {getStatusBadge(selectedLog.status)}
                  </div>
                </div>

                <div className="audit-detail-item">
                  <span className="audit-detail-label">Action</span>
                  <div className="audit-detail-value font-weight-bold text-primary">
                    {selectedLog.action || 'SYSTEM_ACTION'}
                  </div>
                </div>

                <div className="audit-detail-item">
                  <span className="audit-detail-label d-flex align-center gap-1">
                    <Layers size={14} className="text-muted" /> Module
                  </span>
                  <div className="audit-detail-value font-weight-medium">
                    {selectedLog.module || selectedLog.entityType || 'SYSTEM'}
                  </div>
                </div>

                <div className="audit-detail-item">
                  <span className="audit-detail-label d-flex align-center gap-1">
                    <Clock size={14} className="text-muted" /> Date &amp; Time
                  </span>
                  <div className="audit-detail-value">
                    {formatDateTime(selectedLog.createdAt || selectedLog.timestamp)}
                  </div>
                </div>

                <div className="audit-detail-item">
                  <span className="audit-detail-label d-flex align-center gap-1">
                    <Globe size={14} className="text-muted" /> IP Address
                  </span>
                  <div className="audit-detail-value">
                    <code className="audit-ip-code">{selectedLog.ipAddress || 'Unavailable'}</code>
                  </div>
                </div>

                <div className="audit-detail-item full-width">
                  <span className="audit-detail-label d-flex align-center gap-1">
                    <Monitor size={14} className="text-muted" /> Browser / Device (User Agent)
                  </span>
                  <div className="audit-detail-value text-break audit-ua-text">
                    {selectedLog.userAgent || 'Unavailable'}
                  </div>
                </div>

                <div className="audit-detail-item full-width">
                  <span className="audit-detail-label">Event Details</span>
                  <div className="audit-detail-details-box p-3 bg-light rounded mt-1">
                    <p className="mb-0 text-break font-size-sm">
                      {selectedLog.details || selectedLog.reason || 'No additional details provided.'}
                    </p>
                    {selectedLog.previousStatus && selectedLog.newStatus && (
                      <div className="mt-2 pt-2 border-top font-size-xs text-muted">
                        Transition: <strong>{selectedLog.previousStatus}</strong> &rarr; <strong>{selectedLog.newStatus}</strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Security Privacy Notice */}
              <div className="audit-security-notice mt-4 p-3 rounded d-flex align-center gap-2">
                <ShieldCheck size={18} className="text-success flex-shrink-0" />
                <span className="font-size-xs text-muted">
                  PawHomes Security Guarantee: Passwords, tokens, credentials, and sensitive payment data are strictly excluded from audit logs.
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="audit-modal-footer p-3 border-top text-right">
              <button onClick={() => setSelectedLog(null)} className="btn btn-outline btn-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityAuditLogs;
