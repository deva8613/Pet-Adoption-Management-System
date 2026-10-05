import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';
import { useAuth } from './context/AuthContext';

import Home from './pages/Home';
import PetListing from './pages/PetListing';
import PetDetails from './pages/PetDetails';
import UserDashboard from './pages/UserDashboard';
import MyApplications from './pages/MyApplications';
import AdoptionHistory from './pages/AdoptionHistory';
import Profile from './pages/Profile';
import ShelterDashboard from './pages/ShelterDashboard';
import ShelterApplications from './pages/ShelterApplications';
import ShelterPets from './pages/ShelterPets';
import ShelterAdoptions from './pages/ShelterAdoptions';
import ShelterRegister from './pages/ShelterRegister';
import AddPet from './pages/AddPet';
import ShelterSettings from './pages/ShelterSettings';
import AdminDashboard from './pages/AdminDashboard';
import SecurityAuditLogs from './pages/SecurityAuditLogs';
import AdminLogin from './pages/AdminLogin';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import About from './pages/About';
import Contact from './pages/Contact';
import SmartMatch from './pages/SmartMatch';
import RescueManagement from './pages/RescueManagement';
import PostAdoptionCare from './pages/PostAdoptionCare';
import Favorites from './pages/Favorites';
import AdoptionStatus from './pages/AdoptionStatus';
import VerifyEmail from './pages/VerifyEmail';

function App() {
  const { user } = useAuth();
  const location = useLocation();
  const bareLayout = ['/login', '/register', '/shelter/register', '/admin/login', '/forgot-password', '/reset-password', '/verify-email'].some(path => location.pathname.startsWith(path));

  return (
    <div className={bareLayout ? 'app-layout auth-bare-layout' : 'app-layout'}>
      {!bareLayout && <Navbar />}
      <main className="main-content">
        <Routes>
          {/* Index route: Login page is first for unauthenticated users (Section 5) */}
          <Route path="/" element={user ? <Home /> : <Navigate to="/login" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/pets" element={<PetListing />} />
          <Route path="/pets/:id" element={<PetDetails />} />
          <Route path="/smart-match" element={<SmartMatch />} />
          <Route path="/rescue" element={<RescueManagement />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/shelter/register" element={<ShelterRegister />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
          <Route path="/admin/login" element={<Login initialAdminMode={true} />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />

          {/* Protected Routes */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/favorites" element={
            <ProtectedRoute>
              <Favorites />
            </ProtectedRoute>
          } />
          <Route path="/applications" element={
            <ProtectedRoute>
              <MyApplications />
            </ProtectedRoute>
          } />
          <Route path="/care/:petId" element={
            <ProtectedRoute>
              <PostAdoptionCare />
            </ProtectedRoute>
          } />
          <Route path="/application-status/:id" element={
            <ProtectedRoute>
              <AdoptionStatus />
            </ProtectedRoute>
          } />

          {/* Adopter Dashboard & History */}
          <Route path="/dashboard" element={
            <RoleRoute allowedRoles={['adopter']}>
              <UserDashboard />
            </RoleRoute>
          } />
          <Route path="/adoption-history" element={
            <RoleRoute allowedRoles={['adopter']}>
              <AdoptionHistory />
            </RoleRoute>
          } />

          {/* Shelter Routes (Section 21) */}
          <Route path="/shelter/dashboard" element={
            <RoleRoute allowedRoles={['shelter']}>
              <ShelterDashboard />
            </RoleRoute>
          } />
          <Route path="/shelter/applications" element={
            <RoleRoute allowedRoles={['shelter']}>
              <ShelterApplications />
            </RoleRoute>
          } />
          <Route path="/shelter/pets" element={
            <RoleRoute allowedRoles={['shelter']}>
              <ShelterPets />
            </RoleRoute>
          } />
          <Route path="/shelter/adoptions" element={
            <RoleRoute allowedRoles={['shelter']}>
              <ShelterAdoptions />
            </RoleRoute>
          } />
          <Route path="/shelter/add-pet" element={
            <RoleRoute allowedRoles={['shelter']}>
              <AddPet />
            </RoleRoute>
          } />
          <Route path="/shelter/settings" element={
            <RoleRoute allowedRoles={['shelter']}>
              <ShelterSettings />
            </RoleRoute>
          } />

          {/* Admin Routes (Section 27) */}
          <Route path="/admin/dashboard" element={
            <RoleRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </RoleRoute>
          } />
          <Route path="/admin/security/audit-logs" element={
            <RoleRoute allowedRoles={['admin']}>
              <SecurityAuditLogs />
            </RoleRoute>
          } />

          {/* Fallback to Home or Login */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!bareLayout && <Footer />}
    </div>
  );
}

export default App;
