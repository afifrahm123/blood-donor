import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './PatientHome.css';

function PatientHome() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/patient/dashboard`, {
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

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="patient-home">
      <div className="welcome-section">
        <h1>Welcome, {user?.firstName}!</h1>
        <p>We're here to help you get the blood you need. Your health is our priority.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🩸</div>
          <div className="stat-content">
            <h3>Total Requests</h3>
            <p className="stat-number">{dashboardData?.totalRequests || 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>Pending Requests</h3>
            <p className="stat-number">{dashboardData?.pendingRequests || 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Approved Requests</h3>
            <p className="stat-number">
              {(dashboardData?.bloodRequests?.filter(req => req.status === 'approved').length) || 0}
            </p>
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

      <div className="recent-requests">
        <h2>Recent Blood Requests</h2>
        {dashboardData?.bloodRequests && dashboardData.bloodRequests.length > 0 ? (
          <div className="requests-list">
            {dashboardData.bloodRequests.map((request) => (
              <div key={request._id} className="request-item">
                <div className="request-header">
                  <span className="request-date">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </span>
                  <span className={`request-status status-${request.status}`}>
                    {request.status}
                  </span>
                </div>
                <div className="request-details">
                  <div className="request-info">
                    <span className="request-blood-type">{request.bloodType}</span>
                    <span className="request-units">{request.units} unit(s)</span>
                    <span className={`request-urgency urgency-${request.urgency}`}>
                      {request.urgency}
                    </span>
                  </div>
                  <div className="request-reason">
                    {request.reason}
                  </div>
                  <div className="request-hospital">
                    {request.hospital?.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-requests">No blood requests yet. Submit your first request!</p>
        )}
      </div>



      <div className="blood-info">
        <h2>About Blood Types</h2>
        <div className="blood-type-grid">
          <div className="blood-type-card">
            <h4>Type A</h4>
            <p>Can receive: A+, A-</p>
            <p>Can donate to: A+, AB+</p>
          </div>
          <div className="blood-type-card">
            <h4>Type B</h4>
            <p>Can receive: B+, B-</p>
            <p>Can donate to: B+, AB+</p>
          </div>
          <div className="blood-type-card">
            <h4>Type AB</h4>
            <p>Can receive: All types</p>
            <p>Can donate to: AB+ only</p>
          </div>
          <div className="blood-type-card">
            <h4>Type O</h4>
            <p>Can receive: O+ only</p>
            <p>Can donate to: All types</p>
          </div>
        </div>
      </div>

      <div className="emergency-info">
        <h2>Emergency Information</h2>
        <div className="emergency-content">
          <p>
            <strong>For urgent blood needs:</strong> Please contact your hospital directly 
            or call emergency services. Critical requests are processed with highest priority.
          </p>
          <div className="emergency-contacts">
            <div className="contact-item">
              <span className="contact-label">Emergency:</span>
              <span className="contact-value">911</span>
            </div>
            <div className="contact-item">
              <span className="contact-label">Red Cross:</span>
              <span className="contact-value">1-800-RED-CROSS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PatientHome;
