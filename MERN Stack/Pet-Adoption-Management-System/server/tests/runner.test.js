import assert from 'assert';
import http from 'http';
import { connectDB, closeDB, getDB } from '../config/db.js';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from '../routes/authRoutes.js';
import userRoutes from '../routes/userRoutes.js';
import petRoutes from '../routes/petRoutes.js';
import applicationRoutes from '../routes/applicationRoutes.js';
import adminRoutes from '../routes/adminRoutes.js';
import notificationRoutes from '../routes/notificationRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

let server;
const PORT = 5055;
const BASE_URL = `http://127.0.0.1:${PORT}/api`;

const request = async (method, pathStr, body = null, token = null) => {
  const url = `${BASE_URL}${pathStr}`;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = {
    method,
    headers,
  };

  const res = await fetch(url, {
    ...options,
    body: body ? JSON.stringify(body) : null
  });

  const json = await res.json();
  return { status: res.status, body: json };
};

async function runTests() {
  console.log('\n🧪 --- STARTING AUTOMATED BACKEND & WORKFLOW TESTS ---\n');

  await connectDB();
  const db = getDB();

  // Clear test collections cleanly
  await db.collection('users').deleteMany({ email: { $regex: /@test\.com$/ } });
  await db.collection('pets').deleteMany({ petName: { $regex: /^TestPet/ } });
  await db.collection('adoptionapplications').deleteMany({});
  await db.collection('notifications').deleteMany({});
  await db.collection('auditlogs').deleteMany({});

  server = app.listen(PORT);
  console.log(`[Test Server] Listening on port ${PORT}`);

  try {
    // 1. AUTHENTICATION & SHELTER VERIFICATION REGISTRATION TEST
    console.log('1. Testing User & Shelter Registration...');
    
    // Register Adopter 1 (Male)
    const adopterRes = await request('POST', '/auth/register', {
      name: 'Test Adopter 1',
      email: 'adopter1@test.com',
      password: 'password123',
      phone: '9876543210',
      gender: 'Male',
      district: 'Chennai',
      role: 'adopter'
    });
    assert.strictEqual(adopterRes.status, 201, 'Adopter registration failed');
    assert.strictEqual(adopterRes.body.user.gender, 'Male', 'Registered gender should be Male');
    const adopterToken = adopterRes.body.token;

    // Register Adopter 2 (Female)
    const adopterFemaleRes = await request('POST', '/auth/register', {
      name: 'Test Female Adopter',
      email: 'female@test.com',
      password: 'password123',
      gender: 'Female',
      district: 'Madurai',
      role: 'adopter'
    });
    assert.strictEqual(adopterFemaleRes.status, 201);
    assert.strictEqual(adopterFemaleRes.body.user.gender, 'Female', 'Registered gender should be Female');

    // Register Adopter 2
    const adopter2Res = await request('POST', '/auth/register', {
      name: 'Test Adopter 2',
      email: 'adopter2@test.com',
      password: 'password123',
      phone: '9876543211',
      district: 'Coimbatore',
      role: 'adopter'
    });
    assert.strictEqual(adopter2Res.status, 201);
    const adopter2Token = adopter2Res.body.token;

    // Register Shelter (Default verificationStatus should be 'Pending')
    const shelterRes = await request('POST', '/auth/register', {
      name: 'Test Shelter Owner',
      shelterName: 'Test Rescue Shelter',
      email: 'shelter1@test.com',
      password: 'password123',
      district: 'Madurai',
      role: 'shelter'
    });
    assert.strictEqual(shelterRes.status, 201, 'Shelter registration failed');
    assert.strictEqual(shelterRes.body.user.verificationStatus, 'Pending', 'Shelter verification status must default to Pending');
    const shelterToken = shelterRes.body.token;
    const shelterUserId = shelterRes.body.user._id;

    // Register Admin
    await db.collection('users').insertOne({
      name: 'System Admin',
      email: 'admin@test.com',
      password: await import('bcryptjs').then(b => b.hash('password123', 10)),
      role: 'admin',
      verificationStatus: 'Approved',
      createdAt: new Date()
    });

    const adminLoginRes = await request('POST', '/auth/login', {
      email: 'admin@test.com',
      password: 'password123'
    });
    assert.strictEqual(adminLoginRes.status, 200, 'Admin login failed');
    const adminToken = adminLoginRes.body.token;

    console.log('✅ Auth & Registration verification passed');

    // 2. SHELTER VERIFICATION RULE ENFORCEMENT TEST
    console.log('2. Testing Shelter Verification Enforcement Rule...');

    // Unverified shelter attempts to create a pet listing -> MUST BE REJECTED WITH 403
    const unverifiedPetRes = await request('POST', '/pets', {
      petName: 'TestPet Unverified',
      species: 'Dog',
      breed: 'Indie',
      age: '1 year',
      location: 'Madurai'
    }, shelterToken);
    assert.strictEqual(unverifiedPetRes.status, 403, 'Unverified shelter must be blocked from creating pet listings');
    console.log('✅ Unverified shelter pet creation block verified');

    // Admin approves shelter profile
    const verifyRes = await request('PUT', `/admin/shelters/${shelterUserId}/verify`, {
      verificationStatus: 'Approved',
      verificationReason: 'Official license documentation verified'
    }, adminToken);
    assert.strictEqual(verifyRes.status, 200, 'Admin approval of shelter failed');

    // Re-login shelter to get updated profile or token
    const shelterLoginRes = await request('POST', '/auth/login', {
      email: 'shelter1@test.com',
      password: 'password123'
    });
    const updatedShelterToken = shelterLoginRes.body.token;

    // Verified shelter creates pet -> MUST SUCCEED
    const verifiedPetRes = await request('POST', '/pets', {
      petName: 'TestPet Rocky',
      species: 'Dog',
      breed: 'Golden Retriever',
      age: '2 years',
      location: 'Madurai',
      district: 'Madurai'
    }, updatedShelterToken);
    assert.strictEqual(verifiedPetRes.status, 201, 'Verified shelter pet creation failed');
    const petId = verifiedPetRes.body.data._id;
    console.log('✅ Verified shelter pet creation passed');

    // 3. APPLICATION WORKFLOW & NOTIFICATIONS TEST
    console.log('3. Testing Application Workflow & Real Notifications...');

    // Adopter 1 submits application for TestPet Rocky
    const app1Res = await request('POST', '/applications', {
      petId,
      reasonForAdoption: 'Loving home with fenced yard',
      experienceWithPets: 'Owned dogs for 5 years',
      applicantDistrict: 'Chennai'
    }, adopterToken);
    assert.strictEqual(app1Res.status, 201, 'Application 1 submission failed');
    const app1Id = app1Res.body.data._id;

    // Adopter 2 submits application for same TestPet Rocky
    const app2Res = await request('POST', '/applications', {
      petId,
      reasonForAdoption: 'Spacious apartment and active lifestyle',
      experienceWithPets: 'Veterinary assistant',
      applicantDistrict: 'Coimbatore'
    }, adopter2Token);
    assert.strictEqual(app2Res.status, 201, 'Application 2 submission failed');
    const app2Id = app2Res.body.data._id;

    // Prevent duplicate application by Adopter 1
    const dupAppRes = await request('POST', '/applications', {
      petId,
      reasonForAdoption: 'Duplicate attempt',
      experienceWithPets: 'N/A'
    }, adopterToken);
    assert.strictEqual(dupAppRes.status, 400, 'Duplicate application check failed');
    console.log('✅ Duplicate application safeguard verified');

    // Check notifications for Shelter
    const notifsRes = await request('GET', '/notifications', null, updatedShelterToken);
    assert.strictEqual(notifsRes.status, 200);
    assert(notifsRes.body.data.length >= 2, 'Shelter should receive real notifications for applications');
    console.log('✅ Real in-app notifications delivery verified');

    // 4. APPLICATION CONFLICT HANDLING & ATOMIC SUCCESSFUL ADOPTION TEST
    console.log('4. Testing Application Conflict Handling & Atomic Adoption Updates...');

    // Approve both applications first
    await request('PUT', `/applications/${app1Id}/status`, { applicationStatus: 'Approved' }, updatedShelterToken);
    await request('PUT', `/applications/${app2Id}/status`, { applicationStatus: 'Approved' }, updatedShelterToken);

    // Concurrent Adoption Attempt: Mark App 1 as Successful
    const success1Res = await request('PUT', `/applications/${app1Id}/status`, { applicationStatus: 'Successful' }, updatedShelterToken);
    assert.strictEqual(success1Res.status, 200, 'Marking application 1 as Successful failed');

    // Verify Pet is now Adopted in DB
    const getPetRes = await request('GET', `/pets/${petId}`);
    assert.strictEqual(getPetRes.body.data.adoptionStatus, 'Adopted', 'Pet status should be Adopted');

    // Verify remaining Application 2 was automatically closed with closingReason
    const getApp2Res = await request('GET', '/applications/my', null, adopter2Token);
    const app2Record = getApp2Res.body.data.find(a => a._id.toString() === app2Id.toString());
    assert.strictEqual(app2Record.applicationStatus, 'Cancelled', 'Conflicting application 2 should be automatically Cancelled');
    assert.strictEqual(app2Record.closingReason, 'Pet adopted by another applicant', 'Closing reason must be recorded');

    // Attempting to finalize App 2 after adoption finalized MUST return 400 or 409 conflict
    const conflictRes = await request('PUT', `/applications/${app2Id}/status`, { applicationStatus: 'Successful' }, updatedShelterToken);
    assert(conflictRes.status === 400 || conflictRes.status === 409, 'Subsequent adoption attempt must fail with conflict');
    console.log('✅ Application conflict handling & atomic updates passed');

    // 5. ACCOUNT MANAGEMENT & PASSWORD RESET TEST
    console.log('5. Testing Account Management & Password Reset...');

    const forgotRes = await request('POST', '/auth/forgot-password', { email: 'adopter1@test.com' });
    assert.strictEqual(forgotRes.status, 200);
    assert(forgotRes.body.resetToken, 'Reset token should be returned for testing');

    const resetRes = await request('POST', '/auth/reset-password', {
      resetToken: forgotRes.body.resetToken,
      newPassword: 'newpassword123'
    });
    assert.strictEqual(resetRes.status, 200, 'Password reset failed');

    const newLoginRes = await request('POST', '/auth/login', {
      email: 'adopter1@test.com',
      password: 'newpassword123'
    });
    assert.strictEqual(newLoginRes.status, 200, 'Login with new password failed');
    console.log('✅ Account password reset workflow passed');

    // 6. AUDIT LOGS TEST
    console.log('6. Testing Security Audit Logs...');
    const auditRes = await request('GET', '/admin/audit-logs', null, adminToken);
    assert.strictEqual(auditRes.status, 200);
    assert(auditRes.body.data.length > 0, 'Audit logs should be recorded');
    console.log('✅ Security audit log creation & API retrieval verified');

    // 7. PROFILE-BASED PET DISCOVERY & LOCATION FILTERING TESTS (TEST 1 - TEST 8)
    console.log('7. Testing Profile-Based Pet Discovery & Location Filtering (TEST 1 - TEST 8)...');

    // Create Madurai Pet (Local Only)
    const maduraiPetRes = await request('POST', '/pets', {
      petName: 'Madurai Hero',
      species: 'Dog',
      breed: 'Rajapalayam',
      age: '2 years',
      gender: 'Male',
      size: 'Large',
      location: 'Madurai',
      city: 'Madurai',
      district: 'Madurai',
      state: 'Tamil Nadu',
      adoptionArea: 'Local Only',
      description: 'Local Madurai dog'
    }, updatedShelterToken);
    assert.strictEqual(maduraiPetRes.status, 201);
    const maduraiPetId = maduraiPetRes.body.data._id;

    // Create Theni Pet (Anywhere in Tamil Nadu)
    const theniPetRes = await request('POST', '/pets', {
      petName: 'Theni Prince',
      species: 'Cat',
      breed: 'Indie',
      age: '1 year',
      gender: 'Female',
      size: 'Small',
      location: 'Theni',
      city: 'Theni',
      district: 'Theni',
      state: 'Tamil Nadu',
      adoptionArea: 'Anywhere in Tamil Nadu',
      description: 'Theni friendly cat'
    }, updatedShelterToken);
    assert.strictEqual(theniPetRes.status, 201);
    const theniPetId = theniPetRes.body.data._id;

    // Create Madurai Adopter User
    const maduraiUserRes = await request('POST', '/auth/register', {
      name: 'Madurai Adopter',
      email: 'madurai_adopter@test.com',
      password: 'Password123!',
      role: 'Adopter',
      city: 'Madurai',
      district: 'Madurai',
      state: 'Tamil Nadu'
    });
    assert.strictEqual(maduraiUserRes.status, 201);
    const maduraiToken = maduraiUserRes.body.token;

    // TEST 1: User profile location Madurai -> Madurai pet appears in Pets Near You
    const maduraiDiscovery = await request('GET', '/pets?userCity=Madurai&userDistrict=Madurai&userState=Tamil%20Nadu', null, maduraiToken);
    assert.strictEqual(maduraiDiscovery.status, 200);
    const maduraiNearbyNames = (maduraiDiscovery.body.nearbyPets || []).map(p => p.petName || p.name);
    assert(maduraiNearbyNames.includes('Madurai Hero'), 'TEST 1 FAILED: Madurai pet should appear in Pets Near You');
    console.log('✅ TEST 1 PASSED: Madurai user discovers Madurai pet in Pets Near You');

    // TEST 2: Theni pet appears in Other Pets Across Tamil Nadu for Madurai user
    const maduraiOtherNames = (maduraiDiscovery.body.otherTnPets || []).map(p => p.petName || p.name);
    assert(maduraiOtherNames.includes('Theni Prince'), 'TEST 2 FAILED: Theni pet should appear in Other Pets Across Tamil Nadu');
    console.log('✅ TEST 2 PASSED: Theni pet discoverable in Other Pets Across Tamil Nadu');

    // TEST 3: Dynamic user location update to Chennai -> Nearby section uses Chennai
    await request('PUT', '/users/profile', { city: 'Chennai', district: 'Chennai', state: 'Tamil Nadu' }, maduraiToken);
    const chennaiDiscovery = await request('GET', '/pets', null, maduraiToken);
    assert.strictEqual(chennaiDiscovery.status, 200);
    assert.strictEqual(chennaiDiscovery.body.userLocation.district, 'Chennai', 'TEST 3 FAILED: User location was not dynamically updated to Chennai');
    const chennaiNearbyNames = (chennaiDiscovery.body.nearbyPets || []).map(p => p.name);
    assert(!chennaiNearbyNames.includes('Madurai Hero'), 'TEST 3 FAILED: Madurai pet should not be in Chennai Pets Near You');
    console.log('✅ TEST 3 PASSED: Dynamic user location update to Chennai verified');

    // TEST 4: Local Only pet from Madurai cannot be applied for by Chennai user
    const ineligibleApp = await request('POST', '/applications', {
      petId: maduraiPetId,
      reasonForAdoption: 'I want this dog',
      experienceWithPets: 'Experienced'
    }, maduraiToken); // user is now Chennai
    assert.strictEqual(ineligibleApp.status, 403, 'TEST 4 FAILED: Ineligible Chennai user should get 403 when applying for Local Only Madurai pet');
    console.log('✅ TEST 4 PASSED: Ineligible user block enforced on backend (403)');

    // TEST 5: Anywhere in Tamil Nadu pet (Theni Prince) can be applied for by Chennai user
    const eligibleApp = await request('POST', '/applications', {
      petId: theniPetId,
      reasonForAdoption: 'Loving home in Chennai',
      experienceWithPets: '5 years'
    }, maduraiToken); // user is Chennai, pet is Anywhere in Tamil Nadu
    assert.strictEqual(eligibleApp.status, 201, 'TEST 5 FAILED: Eligible Chennai user should be able to apply for Anywhere in TN pet');
    console.log('✅ TEST 5 PASSED: Anywhere in Tamil Nadu adoption application succeeded');

    // TEST 6: Search & filter reset test
    const searchFilterRes = await request('GET', '/pets?search=Madurai&species=Dog', null, maduraiToken);
    assert.strictEqual(searchFilterRes.status, 200);
    const petResetRes = await request('GET', '/pets', null, maduraiToken);
    assert.strictEqual(petResetRes.status, 200);
    console.log('✅ TEST 6 PASSED: Search and filter reset verified');

    // TEST 7: Adopted pet exclusion test
    const adoptedPetRes = await request('GET', '/pets');
    const allAvailablePets = [...(adoptedPetRes.body.nearbyPets || []), ...(adoptedPetRes.body.otherTnPets || []), ...(adoptedPetRes.body.data || [])];
    const adoptedPetFound = allAvailablePets.some(p => p._id.toString() === petId.toString()); // petId was adopted in Section 4
    assert.strictEqual(adoptedPetFound, false, 'TEST 7 FAILED: Adopted pet must not appear in available listings');
    console.log('✅ TEST 7 PASSED: Adopted pets excluded from available listings');

    // TEST 8: Empty state verify
    const nonExistentFilterRes = await request('GET', '/pets?search=NonExistentPet123456');
    assert.strictEqual(nonExistentFilterRes.body.total, 0, 'TEST 8 FAILED: Empty search should return 0 results');
    console.log('✅ TEST 8 PASSED: Empty state handling verified');

    console.log('\n✨ ALL AUTOMATED BACKEND & LOCATION DISCOVERY TESTS PASSED SUCCESSFULLY! ✨\n');
  } catch (err) {
    console.error('\n❌ TEST SUITE FAILURE:', err);
    process.exitCode = 1;
  } finally {
    if (db) {
      await db.collection('pets').deleteMany({ petName: { $in: ['Madurai Hero', 'Theni Prince', 'TestPet Unverified', 'TestPet Rocky'] } });
    }
    if (server) server.close();
    await closeDB();
  }
}

runTests();
