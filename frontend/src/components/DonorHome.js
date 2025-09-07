import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './DonorHome.css';

function DonorHome() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    fetchInventory();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/donor/dashboard`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/donor/blood-inventory`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) setInventory(data.inventory || []);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="donor-home">
      <div className="welcome-section">
        <h1>Welcome back, {user?.firstName}!</h1>
        <p>Thank you for being a blood donor. Your contributions save lives every day.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🩸</div>
          <div className="stat-content">
            <h3>Total Donations</h3>
            <p className="stat-number">{dashboardData?.totalDonations || 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>Last Donation</h3>
            <p className="stat-text">
              {dashboardData?.lastDonation 
                ? new Date(dashboardData.lastDonation.donationDate).toLocaleDateString()
                : 'Never'
              }
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🆕</div>
          <div className="stat-content">
            <h3>Recent Donations</h3>
            <p className="stat-number">{dashboardData?.donations?.length || 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💪</div>
          <div className="stat-content">
            <h3>Blood Type</h3>
            <p className="stat-text">{user?.bloodType}</p>
          </div>
        </div>
      </div>

      <div className="recent-donations">
        <h2>Recent Donations</h2>
        {dashboardData?.donations && dashboardData.donations.length > 0 ? (
          <div className="donations-list">
            {dashboardData.donations.map((donation) => (
              <div key={donation._id} className="donation-item">
                <div className="donation-date">
                  {new Date(donation.donationDate).toLocaleDateString()}
                </div>
                <div className="donation-details">
                  <span className="donation-units">{donation.units} unit(s)</span>
                  <span className={`donation-status status-${donation.status}`}>
                    {donation.status}
                  </span>
                </div>
                <div className="donation-center">
                  {donation.donationCenter?.name}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-donations">No donations yet. Schedule your first donation!</p>
        )}
      </div>

      <div className="blood-inventory">
        <h2>Blood Inventory</h2>
        {inventory && inventory.length > 0 ? (
          <div className="inventory-grid">
            {inventory.map(item => (
              <div key={item.bloodType} className="inventory-card">
                <div className="inventory-header">
                  <span className="inventory-type">{item.bloodType}</span>
                </div>
                <div className="inventory-stats">
                  <div className="inventory-stat">
                    <span className="label">Available</span>
                    <span className="value">{item.availableUnits} units</span>
                  </div>
                  <div className="inventory-stat">
                    <span className="label">Open Requests</span>
                    <span className="value">{item.openRequests}</span>
                  </div>
                  <div className="inventory-stat">
                    <span className="label">Requested</span>
                    <span className="value">{item.requestedUnits} units</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-inventory">No inventory data available.</p>
        )}
      </div>

      <div className="donation-tips">
        <h2>Donation Tips</h2>
        <div className="tips-grid">
          <div className="tip-card">
            <h4>Before Donation</h4>
            <ul>
              <li>Get a good night's sleep</li>
              <li>Eat a healthy meal</li>
              <li>Stay hydrated</li>
              <li>Avoid fatty foods</li>
            </ul>
          </div>
          <div className="tip-card">
            <h4>After Donation</h4>
            <ul>
              <li>Rest for 10-15 minutes</li>
              <li>Drink extra fluids</li>
              <li>Avoid heavy lifting</li>
              <li>Keep the bandage on for 4 hours</li>
            </ul>
          </div>
          <div className="tip-card">
            <h4>Eligibility</h4>
            <ul>
              <li>Must be 18+ years old</li>
              <li>Weigh at least 110 lbs</li>
              <li>Wait 56 days between donations</li>
              <li>Be in good health</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DonorHome;
