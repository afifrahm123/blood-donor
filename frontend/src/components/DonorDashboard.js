import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SideNav from './SideNav';
import DonorHome from './DonorHome';
import DonationsDetails from './DonationsDetails';
import ScheduleDonation from './ScheduleDonation';
import DonorProfile from './DonorProfile';
import DonorBloodRequests from './DonorBloodRequests';
import DonorNewBloodRequest from './DonorNewBloodRequest';
import BloodInventory from './BloodInventory';
import './AdminDashboard.css';

function DonorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [totalDonationCount, setTotalDonationCount] = useState(0); // State to hold total donations
  const [totalRequestsCount, setTotalRequestsCount] = useState(0); // New state to hold total requests

  useEffect(() => {
    if (!user || user.role !== 'donor') {
      navigate('/donor');
    }
    fetchTotalDonations(); // Fetch total donations on component mount
    fetchTotalRequests(); // Fetch total requests on component mount
  }, [user, navigate]);

  const fetchTotalDonations = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/donor/donations?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTotalDonationCount(data.total);
      } else {
        console.error('Failed to fetch total donations', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching total donations:', error);
    }
  }, []);

  const fetchTotalRequests = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/donor/blood-requests?myRequests=true&limit=1000`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTotalRequestsCount(data.total);
      } else {
        console.error('Failed to fetch total requests', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching total requests:', error);
    }
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/user'); // Redirect to user login page after logout
  };

  if (!user || user.role !== 'donor') {
    return null;
  }

  const navItems = [
    { path: '/donor-dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/donor-dashboard/new-request', label: 'New Blood Request', icon: '🆘' },
    { path: '/donor-dashboard/blood-requests', label: 'Blood Requests', icon: '🩸' },
    { path: '/donor-dashboard/blood-inventory', label: 'Blood Inventory', icon: '🧪' },
    { path: '/donor-dashboard/donations', label: 'My Donations', icon: '💉' },
    { path: '/donor-dashboard/schedule', label: 'Schedule Donation', icon: '📅' },
    { path: '/donor-dashboard/profile', label: 'Profile', icon: '👤' },
    { path: '#', label: 'Logout', icon: '🚪', action: handleLogout }
  ];

  return (
    <div className="admin-dashboard">
      <SideNav 
        navItems={navItems} 
        user={user} 
        onLogout={handleLogout}
        title="User Dashboard"
        totalDonationCount={totalDonationCount} // Pass total donation count
        totalRequestsCount={totalRequestsCount} // Pass total requests count
      />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<DonorHome />} />
          <Route path="/new-request" element={<DonorNewBloodRequest />} />
          <Route path="/blood-requests" element={<DonorBloodRequests />} />
          <Route path="/blood-inventory" element={<BloodInventory />} />
          <Route path="/donations" element={<DonationsDetails />} />
          <Route path="/schedule" element={<ScheduleDonation />} />
          <Route path="/profile" element={<DonorProfile />} />
        </Routes>
      </div>
    </div>
  );
}

export default DonorDashboard;
