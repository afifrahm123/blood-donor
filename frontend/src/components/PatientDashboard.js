import React, { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SideNav from './SideNav';
import PatientHome from './PatientHome';
import BloodRequests from './BloodRequests';
import NewBloodRequest from './NewBloodRequest';
import PatientProfile from './PatientProfile';
import BloodInventory from './BloodInventory';
import './AdminDashboard.css';

function PatientDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'patient') {
      navigate('/patient');
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/logout');
  };

  if (!user || user.role !== 'patient') {
    return null;
  }

  const navItems = [
    { path: '/patient-dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/patient-dashboard/requests', label: 'Blood Requests', icon: '🩸' },
    { path: '/patient-dashboard/new-request', label: 'New Request', icon: '➕' },
    { path: '/patient-dashboard/blood-inventory', label: 'Blood Inventory', icon: '🩺' },
    { path: '/patient-dashboard/profile', label: 'Profile', icon: '👤' }
  ];

  return (
    <div className="admin-dashboard">
      <SideNav 
        navItems={navItems} 
        user={user} 
        onLogout={handleLogout}
        title="Patient Dashboard"
      />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<PatientHome />} />
          <Route path="/requests" element={<BloodRequests />} />
          <Route path="/new-request" element={<NewBloodRequest />} />
          <Route path="/blood-inventory" element={<BloodInventory />} />
          <Route path="/profile" element={<PatientProfile />} />
        </Routes>
      </div>
    </div>
  );
}

export default PatientDashboard;
