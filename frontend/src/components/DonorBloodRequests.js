import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './DonorBloodRequests.css';

function DonorBloodRequests() {
  const { user, addNotification } = useAuth();
  const navigate = useNavigate();
  const [bloodRequests, setBloodRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterBloodType, setFilterBloodType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'my-requests'
  const [myRequestsCount, setMyRequestsCount] = useState(0); // New state for total my requests

  const fetchBloodRequests = useCallback(async () => {
    try {
      setLoading(true);
      let url = `${process.env.REACT_APP_API_URL}/api/donor/blood-requests?page=${currentPage}`;
      
      if (filterStatus) {
        url += `&status=${filterStatus}`;
      }
      if (filterBloodType) {
        url += `&bloodType=${filterBloodType}`;
      }
      if (activeTab === 'my-requests') {
        url += `&patientId=${user._id}`;
      }
      if (searchTerm) {
        url += `&search=${searchTerm}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBloodRequests(data.bloodRequests);
        setTotalPages(data.totalPages);
        setMyRequestsCount(data.totalMyRequests);
      } else {
        // console.error('Failed to fetch blood requests', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching blood requests:', error);
      setError('Error fetching blood requests');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filterStatus, filterBloodType, searchTerm, activeTab, user._id]);

  useEffect(() => {
    if (!user) {
      navigate('/user');
      return;
    }
    fetchBloodRequests();
  }, [fetchBloodRequests, user, navigate]);

  const handleInterest = async (requestId, isInterested) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/donor/blood-requests/${requestId}/interest`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ isInterested })
      });

      if (response.ok) {
        addNotification(
          isInterested 
            ? 'Interest expressed successfully!' 
            : 'Interest removed successfully!', 
          'success'
        );
        // Refresh the requests to update the UI
        fetchBloodRequests();
      } else {
        addNotification('Failed to update interest', 'error');
      }
    } catch (error) {
      console.error('Error updating interest:', error);
      addNotification('Error updating interest', 'error');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchBloodRequests();
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    if (name === 'status') {
      setFilterStatus(value);
    } else if (name === 'bloodType') {
      setFilterBloodType(value);
    }
    setCurrentPage(1);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setFilterStatus('');
    setFilterBloodType('');
    setSearchTerm('');
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'status-pending',
      approved: 'status-approved',
      rejected: 'status-rejected',
      cancelled: 'status-cancelled'
    };
    return <span className={`status-badge ${statusClasses[status] || ''}`}>{status}</span>;
  };

  const getUrgencyBadge = (urgency) => {
    const urgencyClasses = {
      low: 'urgency-low',
      medium: 'urgency-medium',
      high: 'urgency-high',
      critical: 'urgency-critical'
    };
    return <span className={`urgency-badge ${urgencyClasses[urgency] || ''}`}>{urgency}</span>;
  };

  const getDonationBadge = (count) => {
    if (count === 0) {
      return null;
    } else if (count < 5) {
      return <span className="donation-badge badge-life-saver">Life Saver 🩸</span>;
    } else if (count >= 5 && count < 15) {
      return <span className="donation-badge badge-hope-giver">Hope Giver ❤️</span>;
    } else {
      return <span className="donation-badge badge-guardian-angel">Guardian Angel 👑</span>;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isMyRequest = (request) => {
    return request.patient?._id === user?._id;
  };

  const getRequestBadge = (count) => {
    if (count === 0) {
      return null;
    } else if (count < 5) {
      return <span className="request-badge badge-hope-seeker">Hope Seeker 🌱</span>;
    } else if (count >= 5 && count < 15) {
      return <span className="request-badge badge-life-fighter">Life Fighter 💪🩸</span>;
    } else {
      return <span className="request-badge badge-survivor-spirit">Survivor's Spirit 🕊️❤️</span>;
    }
  };

  if (loading) {
    return (
      <div className="donor-blood-requests">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading blood requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="donor-blood-requests">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={fetchBloodRequests} className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="donor-blood-requests">
      <div className="requests-header">
        <h2>Blood Requests</h2>
        <p>View blood requests and express your interest in donating</p>
        
        <div className="header-actions">
          <button 
            onClick={() => navigate('/donor-dashboard/new-request')}
            className="new-request-btn"
          >
            🆘 New Blood Request
          </button>
        </div>
      </div>

      <div className="tabs-section">
        <button 
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => handleTabChange('all')}
        >
          All Requests
        </button>
        <button 
          className={`tab-btn ${activeTab === 'my-requests' ? 'active' : ''}`}
          onClick={() => handleTabChange('my-requests')}
        >
          My Requests {activeTab === 'my-requests' && myRequestsCount > 0 && 
            <span className="my-requests-tab-count">({myRequestsCount}) {getRequestBadge(myRequestsCount)}</span>
          }
        </button>
      </div>

      <div className="filters-section">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder={activeTab === 'my-requests' ? "Search in your requests..." : "Search by patient name or reason..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-btn">🔍</button>
        </form>

        <div className="filter-controls">
          <select 
            name="status"
            value={filterStatus} 
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select 
            name="bloodType"
            value={filterBloodType} 
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">All Blood Types</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>
        </div>
      </div>

      {bloodRequests.length === 0 ? (
        <div className="no-requests">
          <p>
            {activeTab === 'my-requests' 
              ? 'You haven\'t submitted any blood requests yet.' 
              : 'No blood requests found matching your criteria.'
            }
          </p>
          {activeTab === 'my-requests' && (
            <button 
              onClick={() => navigate('/donor-dashboard/new-request')}
              className="new-request-btn"
            >
              Submit Your First Request
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="requests-list">
            {bloodRequests.map((request) => (
              <div key={request._id} className={`request-card ${isMyRequest(request) ? 'my-request' : ''}`}>
                <div className="request-header">
                  <div className="request-info">
                    <div className="patient-info">
                      <strong>Patient:</strong> {request.patient?.firstName} {request.patient?.lastName}
                      {isMyRequest(request) && <span className="my-request-badge">(You)</span>}
                      {request.patient?.totalDonationCount > 0 && getDonationBadge(request.patient.totalDonationCount)}
                      {request.patient?.totalRequestsCount > 0 && getRequestBadge(request.patient.totalRequestsCount)}
                    </div>
                    <div className="request-date">
                      <strong>Submitted:</strong> {formatDate(request.createdAt)}
                    </div>
                    <div className="request-required">
                      <strong>Required by:</strong> {formatDate(request.requiredBy)}
                    </div>
                  </div>
                  <div className="request-badges">
                    {getStatusBadge(request.status)}
                    {getUrgencyBadge(request.urgency)}
                  </div>
                </div>

                <div className="request-details">
                  <div className="detail-row">
                    <span className="detail-label">Blood Type:</span>
                    <span className="detail-value">{request.bloodType}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Units Required:</span>
                    <span className="detail-value">{request.units} unit(s)</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Reason:</span>
                    <span className="detail-value">{request.reason}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Hospital:</span>
                    <span className="detail-value">{request.hospital?.name || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Hospital Address:</span>
                    <span className="detail-value">{request.hospital?.address || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Hospital Contact:</span>
                    <span className="detail-value">{request.hospital?.contact || 'N/A'}</span>
                  </div>
                  {request.adminNotes && (
                    <div className="detail-row">
                      <span className="detail-label">Admin Notes:</span>
                      <span className="detail-value">{request.adminNotes}</span>
                    </div>
                  )}
                </div>

                <div className="request-actions">
                  {!isMyRequest(request) && request.status === 'pending' && (
                    <button
                      className={`interest-btn ${request.isInterested ? 'interested' : ''}`}
                      onClick={() => handleInterest(request._id, !request.isInterested)}
                    >
                      {request.isInterested ? '❤️ Interested' : '🤍 Show Interest'}
                    </button>
                  )}
                  {!isMyRequest(request) && request.isInterested && (
                    <span className="interest-status">You have shown interest in this request</span>
                  )}
                  {isMyRequest(request) && (
                    <span className="my-request-status">This is your blood request</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                Previous
              </button>
              <span className="page-info">
                Page {currentPage} of {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default DonorBloodRequests;
