import React, { useState, useEffect } from 'react';
import './BloodRequests.css';

function BloodRequests() {
  const [bloodRequests, setBloodRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchBloodRequests();
  }, [currentPage, filterStatus]);

  const fetchBloodRequests = async () => {
    try {
      let url = `${process.env.REACT_APP_API_URL}/api/patient/blood-requests?page=${currentPage}`;
      if (filterStatus) {
        url += `&status=${filterStatus}`;
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
      }
    } catch (error) {
      console.error('Error fetching blood requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (window.confirm('Are you sure you want to cancel this blood request?')) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/patient/blood-requests/${requestId}/cancel`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          // Refresh the requests list
          fetchBloodRequests();
        } else {
          alert('Failed to cancel blood request');
        }
      } catch (error) {
        console.error('Error cancelling blood request:', error);
        alert('Error cancelling blood request');
      }
    }
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

  if (loading) {
    return <div className="loading">Loading blood requests...</div>;
  }

  return (
    <div className="blood-requests">
      <div className="page-header">
        <h1>My Blood Requests</h1>
        <p>Track your blood request history and current status</p>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <label htmlFor="statusFilter">Filter by Status:</label>
          <select
            id="statusFilter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>

            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {bloodRequests.length === 0 ? (
        <div className="no-requests">
          <p>No blood requests found. Submit your first request to get started!</p>
        </div>
      ) : (
        <>
          <div className="requests-list">
            {bloodRequests.map((request) => (
              <div key={request._id} className="request-card">
                <div className="request-header">
                  <div className="request-info">
                    <div className="request-date">
                      <strong>Submitted:</strong> {new Date(request.createdAt).toLocaleDateString()}
                    </div>
                    <div className="request-required">
                      <strong>Required by:</strong> {new Date(request.requiredBy).toLocaleDateString()}
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
                    <span className="detail-value">{request.hospital?.name}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Hospital Address:</span>
                    <span className="detail-value">{request.hospital?.address}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Hospital Contact:</span>
                    <span className="detail-value">{request.hospital?.contact}</span>
                  </div>
                  {request.adminNotes && (
                    <div className="detail-row">
                      <span className="detail-label">Admin Notes:</span>
                      <span className="detail-value">{request.adminNotes}</span>
                    </div>
                  )}
                </div>

                {request.status === 'pending' && (
                  <div className="request-actions">
                    <button
                      className="cancel-btn"
                      onClick={() => handleCancelRequest(request._id)}
                    >
                      Cancel Request
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </button>
              <span className="page-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="page-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
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

export default BloodRequests;