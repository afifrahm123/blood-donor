import React, { useState, useEffect } from 'react';
import './RequestHistory.css';

function RequestHistory() {
  const [bloodRequests, setBloodRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterBloodType, setFilterBloodType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRequestHistory();
  }, [currentPage, filterStatus, filterBloodType, searchTerm]);

  const fetchRequestHistory = async () => {
    try {
      setLoading(true);
      let url = `${process.env.REACT_APP_API_URL}/api/admin/blood-requests?page=${currentPage}`;
      
      if (filterStatus) {
        url += `&status=${filterStatus}`;
      }
      if (filterBloodType) {
        url += `&bloodType=${filterBloodType}`;
      }
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
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
      } else {
        setError('Failed to fetch request history');
      }
    } catch (error) {
      console.error('Error fetching request history:', error);
      setError('Error fetching request history');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchRequestHistory();
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="request-history">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading request history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="request-history">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={fetchRequestHistory} className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="request-history">
      <div className="history-header">
        <h2>Blood Request History</h2>
        <p>Complete history of all blood requests and their status changes</p>
      </div>

      <div className="filters-section">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search by patient name..."
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

      <div className="history-summary">
        <div className="summary-card">
          <h3>Total Requests</h3>
          <p>{bloodRequests.length}</p>
        </div>
        <div className="summary-card">
          <h3>Pending</h3>
          <p>{bloodRequests.filter(req => req.status === 'pending').length}</p>
        </div>
        <div className="summary-card">
          <h3>Approved</h3>
          <p>{bloodRequests.filter(req => req.status === 'approved').length}</p>
        </div>

      </div>

      <div className="table-container">
        <table className="history-table">
          <thead>
            <tr>
              <th>Patient Name</th>
              <th>Blood Type</th>
              <th>Units</th>
              <th>Urgency</th>
              <th>Request Date</th>
              <th>Required By</th>
              <th>Status</th>
              <th>Hospital</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {bloodRequests.map((request) => (
              <tr key={request._id}>
                <td className="patient-name">
                  {request.patient?.firstName} {request.patient?.lastName}
                </td>
                <td className="blood-type">{request.bloodType}</td>
                <td className="units">{request.units} unit(s)</td>
                <td className="urgency">{getUrgencyBadge(request.urgency)}</td>
                <td className="request-date">{formatDate(request.createdAt)}</td>
                <td className="required-date">{formatDate(request.requiredBy)}</td>
                <td className="status">{getStatusBadge(request.status)}</td>
                <td className="hospital">{request.hospital?.name || 'N/A'}</td>
                <td className="reason">{request.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
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

      {bloodRequests.length === 0 && !loading && (
        <div className="no-data">
          <p>No blood requests found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}

export default RequestHistory;