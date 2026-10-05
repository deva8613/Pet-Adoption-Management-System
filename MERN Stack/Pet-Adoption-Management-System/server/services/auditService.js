import { getDB } from '../config/db.js';

/**
 * Extract client IP address safely
 */
export const getClientIp = (req) => {
  if (!req) return 'Unavailable';
  const forwarded = req.headers ? req.headers['x-forwarded-for'] : null;
  if (forwarded) {
    const firstIp = forwarded.split(',')[0].trim();
    if (firstIp === '::1' || firstIp === '::ffff:127.0.0.1') return '127.0.0.1';
    return firstIp;
  }
  const remote = req.socket?.remoteAddress || req.connection?.remoteAddress || req.ip;
  if (!remote) return 'Unavailable';
  if (remote === '::1' || remote === '::ffff:127.0.0.1') return '127.0.0.1';
  return remote;
};

/**
 * Extract client User-Agent safely
 */
export const getClientUserAgent = (req) => {
  if (!req || !req.headers) return 'Unavailable';
  const ua = req.headers['user-agent'];
  return ua || 'Unavailable';
};

/**
 * Record an audit entry in the auditLogs collection
 * NEVER stores passwords, JWT tokens, or credentials
 */
export const createAuditLog = async ({
  req = null,
  userId = null,
  userName = null,
  userEmail = null,
  role = null,
  action = 'SYSTEM_ACTION',
  module = 'SYSTEM',
  status = 'SUCCESS',
  ipAddress = null,
  userAgent = null,
  details = '',
  // Backwards compatibility params:
  entityType = null,
  entityId = null,
  authorizedUser = null,
  previousStatus = null,
  newStatus = null,
  reason = ''
}) => {
  try {
    const db = getDB();
    if (!db) return;

    // Resolve User Identity
    const finalUserId = userId || authorizedUser?._id?.toString() || req?.user?._id?.toString() || null;
    const finalUserName = userName || authorizedUser?.name || req?.user?.name || 'System';
    const finalUserEmail = userEmail || authorizedUser?.email || req?.user?.email || '';
    const rawRole = role || authorizedUser?.role || req?.user?.role || 'SYSTEM';
    const finalRole = rawRole.toUpperCase();

    // Resolve IP & Browser
    const finalIp = ipAddress || getClientIp(req);
    const finalUa = userAgent || getClientUserAgent(req);

    // Resolve Module & Action
    const finalAction = action ? action.toUpperCase() : 'UNKNOWN_ACTION';
    const finalModule = module && module !== 'SYSTEM'
      ? module.toUpperCase()
      : (entityType ? entityType.toUpperCase() : 'GENERAL');

    // Resolve Status
    const finalStatus = (status || 'SUCCESS').toUpperCase();

    // Resolve Details
    const finalDetails = details || reason || (previousStatus && newStatus ? `Status changed from ${previousStatus} to ${newStatus}` : `${finalAction} executed`);

    const now = new Date();

    const auditEntry = {
      userId: finalUserId,
      userName: finalUserName,
      userEmail: finalUserEmail,
      role: finalRole,
      action: finalAction,
      module: finalModule,
      status: finalStatus,
      ipAddress: finalIp,
      userAgent: finalUa,
      details: finalDetails,
      createdAt: now,
      // Backwards-compatible fields for test runners & existing inspectors
      timestamp: now,
      entityType: entityType || finalModule.toLowerCase(),
      entityId: entityId ? entityId.toString() : null,
      authorizedUser: {
        _id: finalUserId,
        name: finalUserName,
        email: finalUserEmail,
        role: finalRole.toLowerCase()
      },
      previousStatus: previousStatus || null,
      newStatus: newStatus || null,
      reason: reason || finalDetails
    };

    // Insert into both auditLogs and auditlogs for full compatibility
    await Promise.all([
      db.collection('auditLogs').insertOne({ ...auditEntry }),
      db.collection('auditlogs').insertOne({ ...auditEntry })
    ]);

    return auditEntry;
  } catch (error) {
    console.error('[Audit Log Error]: Failed to create audit log:', error);
  }
};

