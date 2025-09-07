import React, { useState, useEffect } from 'react';
import { useNavigate, Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import SideNav from './components/SideNav';
import AdminHome from './components/AdminHome';
import DonorDetails from './components/DonorDetails';
import AdminBloodRequests from './components/AdminBloodRequests';
import RequestHistory from './components/RequestHistory';
import BloodManagement from './components/BloodManagement';
import './AdminDashboard.css';

function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchPendingRequestsCount();
    }
  }, [user]);

  // Refresh count when navigating to blood requests page
  useEffect(() => {
    if (location.pathname === '/admin-dashboard/blood-requests') {
      fetchPendingRequestsCount();
    }
  }, [location.pathname]);

  const fetchPendingRequestsCount = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/pending-requests-count`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPendingRequestsCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching pending requests count:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin');
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  const navItems = [
    { path: '/admin-dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/admin-dashboard/donor', label: 'Donor Management', icon: '🩸' },
    { path: '/admin-dashboard/blood-management', label: 'Blood Management', icon: '🩺' },
    { 
      path: '/admin-dashboard/blood-requests', 
      label: 'Blood Requests', 
      icon: '🆘',
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : null
    },
    { path: '/admin-dashboard/request-history', label: 'Request History', icon: '📋' },
    { path: '#', label: 'Logout', icon: '🚪', action: handleLogout }
  ];

  return (
    <div className="admin-dashboard">
      <SideNav 
        navItems={navItems}
        user={user}
        onLogout={handleLogout}
        title="Admin Dashboard"
      />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<AdminHome />} />
          <Route path="/donor" element={<DonorDetails />} />
          <Route path="/blood-management" element={<BloodManagement />} />
          <Route path="/blood-requests" element={<AdminBloodRequests onStatusUpdate={fetchPendingRequestsCount} />} />
          <Route path="/request-history" element={<RequestHistory />} />
        </Routes>
      </div>
    </div>
  );
}

export default AdminDashboard;