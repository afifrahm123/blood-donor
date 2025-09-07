import React, { useState, useEffect } from 'react';
import './BloodInventory.css';

function BloodInventory() {
  const [bloodInventory, setBloodInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBloodInventory();
    
    // Set up automatic refresh every 30 seconds
    const interval = setInterval(fetchBloodInventory, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchBloodInventory = async () => {
    try {
      setLoading(true);
      // Use donor endpoint for inventory in donor/user dashboard
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/donor/blood-inventory`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.inventory)) {
          // Normalize to the shape this component expects
          const normalized = data.inventory.map(item => ({
            bloodType: item.bloodType,
            bloodUnits: item.availableUnits || 0,
            totalDonors: Math.round((item.availableUnits || 0) / 500),
          }));
          setBloodInventory(normalized);
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
      <div className="blood-inventory">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading blood inventory data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="blood-inventory">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={refreshData} className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="blood-inventory">
      <div className="inventory-header">
        <h2>Blood Inventory</h2>
        <div className="header-controls">
          <span className="auto-refresh-info">🔄 Auto-refresh every 30s</span>
          <button onClick={refreshData} className="refresh-btn">
            🔄 Refresh Now
          </button>
        </div>
      </div>
      
      <div className="inventory-summary">
        <div className="summary-card">
          <h3>Total Donors</h3>
          <p>{bloodInventory.reduce((sum, item) => sum + item.totalDonors, 0)}</p>
        </div>
        <div className="summary-card">
          <h3>Total Blood Available</h3>
          <p>{bloodInventory.reduce((sum, item) => sum + item.bloodUnits, 0).toLocaleString()} ml</p>
        </div>
        <div className="summary-card">
          <h3>Blood Types Available</h3>
          <p>{bloodInventory.filter(item => item.totalDonors > 0).length}</p>
        </div>
        <div className="summary-card">
          <h3>Average per Blood Type</h3>
          <p>{Math.round(bloodInventory.reduce((sum, item) => sum + item.bloodUnits, 0) / Math.max(bloodInventory.filter(item => item.totalDonors > 0).length, 1)).toLocaleString()} ml</p>
        </div>
      </div>

      <div className="table-container">
        <table className="blood-inventory-table">
          <thead>
            <tr>
              <th>Blood Group</th>
              <th>Available Blood (ml)</th>
              <th>Total Donors</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {bloodInventory.map((item) => (
              <tr key={item.bloodType}>
                <td className="blood-type">{item.bloodType}</td>
                <td className="blood-amount">{item.bloodUnits.toLocaleString()} ml</td>
                <td className="donor-count">{item.totalDonors}</td>
                <td className="status">
                  <span className={`status-badge ${item.totalDonors > 0 ? 'available' : 'unavailable'}`}>
                    {item.totalDonors > 0 ? 'Available' : 'Unavailable'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="inventory-footer">
        <p className="last-updated">
          Last updated: {new Date().toLocaleString()}
        </p>
        <p className="data-note">
          * Blood amounts are calculated as: Total Donors × 500ml per donor
        </p>
        <p className="data-note">
          * This information helps you understand blood availability for your requests
        </p>
      </div>
    </div>
  );
}

export default BloodInventory;
