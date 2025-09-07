import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import './AdminBloodRequests.css';

function AdminBloodRequests({ onStatusUpdate }) {
  const { addNotification } = useAuth();
  const [bloodRequests, setBloodRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterUrgency, setFilterUrgency] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [expandedRequest, setExpandedRequest] = useState(null);
  const [updateForm, setUpdateForm] = useState({
    status: '',
    adminNotes: ''
  });

  const fetchBloodRequests = useCallback(async () => {
    try {
      let url = `${process.env.REACT_APP_API_URL}/api/admin/blood-requests?page=${currentPage}`;
      if (filterStatus) {
        url += `&status=${filterStatus}`;
      }
      if (filterUrgency) {
        url += `&urgency=${filterUrgency}`;
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
  }, [currentPage, filterStatus, filterUrgency]);

  useEffect(() => {
    fetchBloodRequests();
  }, [fetchBloodRequests]);

  const handleStatusUpdate = async (requestId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/blood-requests/${requestId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updateForm)
      });

      if (response.ok) {
        // Refresh the requests list
        fetchBloodRequests();
        setSelectedRequest(null);
        setUpdateForm({ status: '', adminNotes: '' });
        
        // Call the callback to update the badge count
        if (onStatusUpdate) {
          onStatusUpdate();
        }
        
        // Add notification for successful status update
        const statusText = updateForm.status.charAt(0).toUpperCase() + updateForm.status.slice(1);
        addNotification(`Blood request ${statusText.toLowerCase()} successfully`, 'success');
        
        // Remove the alert and use notification instead
        // alert('Blood request status updated successfully!');
      } else {
        addNotification('Failed to update blood request status', 'error');
        // alert('Failed to update blood request status');
      }
    } catch (error) {
      console.error('Error updating blood request status:', error);
      addNotification('Error updating blood request status', 'error');
      // alert('Error updating blood request status');
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
    return <div className="loading">Loading blood requests...</div>;
  }

  return (
    <div className="admin-blood-requests">
      <div className="page-header">
        <h1>Blood Requests Management</h1>
        <p>Review and manage all blood requests from patients and donors</p>
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

        <div className="filter-group">
          <label htmlFor="urgencyFilter">Filter by Urgency:</label>
          <select
            id="urgencyFilter"
            value={filterUrgency}
            onChange={(e) => setFilterUrgency(e.target.value)}
          >
            <option value="">All Urgency Levels</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {bloodRequests.length === 0 ? (
        <div className="no-requests">
          <p>No blood requests found.</p>
        </div>
      ) : (
        <>
          <div className="requests-list">
            {bloodRequests.map((request) => (
              <div key={request._id} className="request-card">
                <div className="request-header">
                  <div className="request-info">
                    <div className="patient-info">
                      <strong>Patient:</strong> {request.patient?.firstName} {request.patient?.lastName}
                      {request.patient?.totalDonationCount > 0 && getDonationBadge(request.patient.totalDonationCount)}
                      {request.patient?.totalRequestsCount > 0 && getRequestBadge(request.patient.totalRequestsCount)}
                    </div>
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
                    {request.interestedDonors && request.interestedDonors.length > 0 && (
                      <span className="donor-interest-indicator">
                        🩸 Donor is interested in that request
                      </span>
                    )}
                  </div>
                </div>

                <div className="request-details">
                  {/* Primary Information */}
                  <div className="primary-info">
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
                  </div>

                  {/* More Information Section */}
                  <div className="more-info-section">
                    <button 
                      className="more-info-toggle"
                      onClick={() => setExpandedRequest(expandedRequest === request._id ? null : request._id)}
                    >
                      {expandedRequest === request._id ? '▼ Hide Details' : '▶ Show More Information'}
                    </button>
                    
                    {expandedRequest === request._id && (
                      <div className="more-info-content">
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
                        
                        {/* Donor Interest Information */}
                        {request.interestedDonors && request.interestedDonors.length > 0 && (
                          <div className="donor-interest-section">
                            <div className="detail-row">
                              <span className="detail-label">Interested Donors:</span>
                              <span className="detail-value">
                                <span className="interest-count">{request.interestedDonors.length} donor(s) interested</span>
                                <div className="interested-donors-list">
                                  {request.interestedDonors.map((donor, index) => (
                                    <div key={donor._id || index} className="interested-donor">
                                      <span className="donor-name">
                                        {donor.firstName} {donor.lastName}
                                      </span>
                                      <span className="donor-contact">
                                        {donor.email} • {donor.phone || 'No phone'}
                                      </span>
                                      <span className="donor-blood-type">
                                        Blood Type: {donor.bloodType}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                                 <div className="request-actions">
                   <button
                     className="update-btn"
                     onClick={() => {
                       setSelectedRequest(request);
                       setExpandedRequest(null); // Close any expanded details when opening modal
                     }}
                   >
                     Update Status
                   </button>
                 </div>
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

      {/* Status Update Modal */}
      {selectedRequest && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Update Blood Request Status</h3>
            <div className="form-group">
              <label htmlFor="status">Status:</label>
              <select
                id="status"
                value={updateForm.status}
                onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                required
              >
                <option value="">Select Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="adminNotes">Admin Notes:</label>
              <textarea
                id="adminNotes"
                value={updateForm.adminNotes}
                onChange={(e) => setUpdateForm({ ...updateForm, adminNotes: e.target.value })}
                rows="3"
                placeholder="Add any notes or comments..."
              />
            </div>
            <div className="modal-actions">
              <button
                className="submit-btn"
                onClick={() => handleStatusUpdate(selectedRequest._id)}
                disabled={!updateForm.status}
              >
                Update Status
              </button>
              <button
                className="cancel-btn"
                onClick={() => {
                  setSelectedRequest(null);
                  setUpdateForm({ status: '', adminNotes: '' });
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminBloodRequests;
