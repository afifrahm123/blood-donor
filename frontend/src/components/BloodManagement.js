import React, { useState, useEffect } from 'react';
import './BloodManagement.css';

function BloodManagement() {
  const [bloodData, setBloodData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedBloodTypes, setExpandedBloodTypes] = useState([]);

  useEffect(() => {
    fetchBloodManagementData();
    
    // Set up automatic refresh every 30 seconds
    const interval = setInterval(fetchBloodManagementData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchBloodManagementData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/blood-management`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setBloodData(data.bloodManagement);
        } else {
          setError('Failed to fetch blood management data');
        }
      } else {
        setError('Failed to fetch blood management data');
      }
    } catch (error) {
      console.error('Error fetching blood management data:', error);
      setError('Error fetching blood management data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    fetchBloodManagementData();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="blood-management">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading blood management data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="blood-management">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={refreshData} className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  const totalDonors = bloodData.reduce((sum, item) => sum + item.totalDonors, 0);
  const totalDonations = bloodData.reduce((sum, item) => sum + item.totalDonations, 0);
  const totalAvailableBlood = bloodData.reduce((sum, item) => sum + item.availableBlood, 0);

  return (
    <div className="blood-management">
      <div className="blood-header">
        <h2>Blood Management</h2>
        <div className="header-controls">
          <span className="auto-refresh-info">🔄 Auto-refresh every 30s</span>
          <button onClick={refreshData} className="refresh-btn">
            🔄 Refresh Now
          </button>
        </div>
      </div>

      <div className="blood-summary">
        <div className="summary-card">
          <h3>Total Donors</h3>
          <p>{totalDonors}</p>
        </div>
        <div className="summary-card">
          <h3>Total Donations</h3>
          <p>{totalDonations}</p>
        </div>
        <div className="summary-card">
          <h3>Available Blood</h3>
          <p>{totalAvailableBlood.toLocaleString()} ml</p>
        </div>
        <div className="summary-card">
          <h3>Blood Types</h3>
          <p>{bloodData.filter(item => item.totalDonors > 0).length}</p>
        </div>
      </div>

      <div className="blood-types-grid">
        {bloodData.map((bloodType) => (
          <div key={bloodType.bloodType} className="blood-type-card">
            <div className="blood-type-header">
              <h3 className="blood-type-title">{bloodType.bloodType}</h3>
              <div className="blood-type-stats">
                <span className="donor-count">{bloodType.totalDonors} Donors</span>
                <span className="donation-count">{bloodType.totalDonations} Donations</span>
              </div>
            </div>
            
            <div className="blood-type-details">
              <div className="detail-item">
                <span className="label">Available Blood:</span>
                <span className="value">{bloodType.availableBlood.toLocaleString()} ml</span>
              </div>
              <div className="detail-item">
                <span className="label">Total Units:</span>
                <span className="value">{bloodType.totalUnits} units</span>
              </div>
            </div>

            {bloodType.donors.length > 0 && (
              <div className="donors-list">
                <button 
                  className="donor-list-toggle"
                  onClick={() => {
                    const newExpanded = expandedBloodTypes.includes(bloodType.bloodType) 
                      ? expandedBloodTypes.filter(type => type !== bloodType.bloodType)
                      : [...expandedBloodTypes, bloodType.bloodType];
                    setExpandedBloodTypes(newExpanded);
                  }}
                >
                  {expandedBloodTypes.includes(bloodType.bloodType) ? '▼ Hide Donor List' : '▶ Show Donor List'}
                </button>
                
                {expandedBloodTypes.includes(bloodType.bloodType) && (
                  <div className="donors-table">
                    <h4>Donors ({bloodType.donors.length})</h4>
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Last Donation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bloodType.donors.slice(0, 5).map((donor) => (
                          <tr key={donor._id}>
                            <td>{donor.firstName} {donor.lastName}</td>
                            <td>{donor.email}</td>
                            <td>{donor.phone}</td>
                            <td>{formatDate(donor.lastDonation)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {bloodType.donors.length > 5 && (
                      <p className="more-donors">
                        +{bloodType.donors.length - 5} more donors
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {bloodType.donors.length === 0 && (
              <div className="no-donors">
                <p>No donors available for this blood type</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="blood-footer">
        <p className="last-updated">
          Last updated: {new Date().toLocaleString()}
        </p>
        <p className="data-note">
          * Available blood is calculated as: Total Donors × 500ml per donor
        </p>
        <p className="data-note">
          * Data automatically refreshes every 30 seconds
        </p>
      </div>
    </div>
  );
}

export default BloodManagement;
