import React, { useState, useEffect } from 'react';
import './AdminHome.css';

function AdminHome() {
  const [bloodInventory, setBloodInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBloodInventory();
    
    // Set up automatic refresh every 30 seconds
    const interval = setInterval(fetchBloodInventory, 30000);
    
    // Refresh data when component comes into focus
    const handleFocus = () => {
      fetchBloodInventory();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const fetchBloodInventory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/dashboard/blood-inventory`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setBloodInventory(data.bloodInventory);
        } else {
          setError('Failed to fetch blood inventory data');
        }
      } else {
        setError('Failed to fetch blood inventory data');
      }
    } catch (error) {
      console.error('Error fetching blood inventory:', error);
      setError('Error fetching blood inventory data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    fetchBloodInventory();
  };

  if (loading) {
    return (
      <div className="admin-home">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading blood inventory data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-home">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={refreshData} className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-home">
      <div className="dashboard-header">
        <h2>Blood Inventory Dashboard</h2>
        <div className="header-controls">
          <span className="auto-refresh-info">🔄 Auto-refresh every 30s</span>
          <button onClick={refreshData} className="refresh-btn">
            🔄 Refresh Now
          </button>
        </div>
      </div>
      
      <div className="dashboard-summary">
        <div className="summary-card">
          <h3>Total Donors</h3>
          <p>{bloodInventory.reduce((sum, item) => sum + item.totalDonors, 0)}</p>
        </div>
        <div className="summary-card">
          <h3>Total Blood Requests</h3>
          <p>{bloodInventory.reduce((sum, item) => sum + item.totalRequests, 0)}</p>
        </div>
        <div className="summary-card">
          <h3>Approved Requests</h3>
          <p>{bloodInventory.reduce((sum, item) => sum + item.approvedRequests, 0)}</p>
        </div>
        <div className="summary-card">
          <h3>Total Blood Available</h3>
          <p>{bloodInventory.reduce((sum, item) => sum + item.bloodUnits, 0).toLocaleString()} ml</p>
        </div>
      </div>

      <div className="table-container">
        <table className="blood-inventory-table">
          <thead>
            <tr>
              <th>Blood Group</th>
              <th>Amount of Blood (ml)</th>
              <th>Total Donors</th>
              <th>Total Requests</th>
              <th>Approved Requests</th>
            </tr>
          </thead>
          <tbody>
            {bloodInventory.map((item) => (
              <tr key={item.bloodType}>
                <td className="blood-type">{item.bloodType}</td>
                <td className="blood-amount">{item.bloodUnits.toLocaleString()} ml</td>
                <td className="donor-count">{item.totalDonors}</td>
                <td className="request-count">{item.totalRequests}</td>
                <td className="approved-count">{item.approvedRequests}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="dashboard-footer">
        <p className="last-updated">
          Last updated: {new Date().toLocaleString()}
        </p>
        <p className="data-note">
          * Blood amounts are calculated as: Total Donors × 500ml per donor
        </p>
        <p className="data-note">
          * Data automatically refreshes every 30 seconds and when you return to this tab
        </p>
      </div>
    </div>
  );
}

export default AdminHome;