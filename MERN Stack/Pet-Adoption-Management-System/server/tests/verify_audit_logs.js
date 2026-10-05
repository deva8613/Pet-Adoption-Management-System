import { MongoClient } from 'mongodb';

const BASE_URL = 'http://localhost:5000/api';
const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'pet_adoption_management';

async function runVerification() {
  console.log('--- STARTING SECURITY AUDIT LOGS VERIFICATION ---\n');

  // Step 1: Direct MongoDB Collection Inspection
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  const auditLogsCol = db.collection('auditLogs');
  const countBefore = await auditLogsCol.countDocuments();
  console.log(`[MongoDB] Initial auditLogs collection count: ${countBefore}`);

  // Step 2: Test Failed Login Audit Logging
  console.log('\n[1/6] Testing Failed Login (incorrect password)...');
  const failedRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@pawhomes.com', password: 'WrongPassword123!' })
  });
  const failedJson = await failedRes.json();
  console.log(`Failed login response status: ${failedRes.status}, success: ${failedJson.success}`);

  // Step 3: Test Successful Login Audit Logging
  console.log('\n[2/6] Testing Successful Admin Login...');
  const successRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@pawhomes.com', password: 'Admin@123456' })
  });
  const successJson = await successRes.json();
  console.log(`Successful login response status: ${successRes.status}, role: ${successJson.user?.role}`);
  const token = successJson.token;
  if (!token) throw new Error('No token received from admin login');

  // Step 4: Test Logout Audit Logging
  console.log('\n[3/6] Testing User Logout...');
  const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const logoutJson = await logoutRes.json();
  console.log(`Logout response status: ${logoutRes.status}, success: ${logoutJson.success}`);

  // Step 5: Test GET /api/admin/audit-logs Endpoint
  console.log('\n[4/6] Testing GET /api/admin/audit-logs (Default query)...');
  const auditRes = await fetch(`${BASE_URL}/admin/audit-logs?limit=5`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const auditData = await auditRes.json();
  console.log(`API response success: ${auditData.success}`);
  console.log(`Returned logs count: ${auditData.data?.length}`);
  console.log('Pagination info:', auditData.pagination);
  console.log('Stats info:', auditData.stats);

  // Inspect the top log record
  if (auditData.data?.length > 0) {
    const topLog = auditData.data[0];
    console.log('\nTop Audit Record:');
    console.log(`- Action: ${topLog.action}`);
    console.log(`- Module: ${topLog.module}`);
    console.log(`- Status: ${topLog.status}`);
    console.log(`- User: ${topLog.userName} (${topLog.userEmail})`);
    console.log(`- Role: ${topLog.role}`);
    console.log(`- IP: ${topLog.ipAddress}`);
    console.log(`- User-Agent: ${topLog.userAgent?.substring(0, 30)}...`);
    console.log(`- Details: ${topLog.details}`);
    console.log(`- CreatedAt: ${topLog.createdAt}`);
  }

  // Step 6: Test Filtering
  console.log('\n[5/6] Testing Filter by Status=FAILED...');
  const failedAuditRes = await fetch(`${BASE_URL}/admin/audit-logs?status=FAILED`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const failedAuditData = await failedAuditRes.json();
  console.log(`Filtered FAILED logs count: ${failedAuditData.data?.length}`);
  const allAreFailed = failedAuditData.data.every(l => l.status.toUpperCase() === 'FAILED');
  console.log(`All returned logs have status FAILED: ${allAreFailed}`);

  console.log('\nTesting Filter by Action=LOGIN_SUCCESS...');
  const actionAuditRes = await fetch(`${BASE_URL}/admin/audit-logs?action=LOGIN_SUCCESS`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const actionAuditData = await actionAuditRes.json();
  console.log(`Filtered LOGIN_SUCCESS logs count: ${actionAuditData.data?.length}`);
  const allAreLoginSuccess = actionAuditData.data.every(l => l.action === 'LOGIN_SUCCESS');
  console.log(`All returned logs have action LOGIN_SUCCESS: ${allAreLoginSuccess}`);

  console.log('\nTesting Filter by Role=ADMIN...');
  const roleAuditRes = await fetch(`${BASE_URL}/admin/audit-logs?role=ADMIN`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const roleAuditData = await roleAuditRes.json();
  console.log(`Filtered Role ADMIN logs count: ${roleAuditData.data?.length}`);

  console.log('\nTesting Search by Keyword "admin"...');
  const searchAuditRes = await fetch(`${BASE_URL}/admin/audit-logs?search=admin`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const searchAuditData = await searchAuditRes.json();
  console.log(`Search "admin" logs count: ${searchAuditData.data?.length}`);

  // Step 7: Security check on MongoDB records
  console.log('\n[6/6] Verifying Security Compliance (No passwords or tokens stored)...');
  const recentLogs = await auditLogsCol.find({}).sort({ createdAt: -1 }).limit(20).toArray();
  let leaksFound = 0;
  for (const log of recentLogs) {
    const stringified = JSON.stringify(log);
    if (stringified.includes('password') && !stringified.includes('PASSWORD_CHANGED') && !stringified.includes('incorrect password') && !stringified.includes('missing email or password')) {
      leaksFound++;
    }
    if (stringified.includes('Bearer') || stringified.includes('eyJ')) {
      leaksFound++;
    }
  }
  console.log(`Sensitive credential leaks in audit logs: ${leaksFound}`);

  await client.close();
  console.log('\n--- VERIFICATION COMPLETED SUCCESSFULLY ---');
}

runVerification().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
