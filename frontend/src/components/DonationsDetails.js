import React, { useState, useEffect } from 'react';
import './DonationsDetails.css';

function DonationsDetails() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [refreshKey, setRefreshKey] = useState(0); // Added refreshKey state
  const [totalDonationCount, setTotalDonationCount] = useState(0); // New state for total count

  useEffect(() => {
    fetchDonations();
  }, [currentPage, filterStatus, refreshKey]); // Added refreshKey to dependencies

  const fetchDonations = async () => {
    setLoading(true);
    try {
      let url = `${process.env.REACT_APP_API_URL}/api/donor/donations?page=${currentPage}&limit=1000`; // Fetch all for accurate count
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
        setDonations(data.donations);
        setTotalPages(data.totalPages);
        setTotalDonationCount(data.total); // Set total count from API response
      } else {
        console.error('Failed to fetch donations', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching donations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  const handleCancelDonation = async (donationId) => {
    if (window.confirm('Are you sure you want to cancel this donation?')) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/donor/donations/${donationId}/cancel`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          // Refresh the donations list
          fetchDonations();
        } else {
          alert('Failed to cancel donation');
        }
      } catch (error) {
        console.error('Error cancelling donation:', error);
        alert('Error cancelling donation');
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      scheduled: 'status-scheduled',
      completed: 'status-completed',
      cancelled: 'status-cancelled'
    };
    return <span className={`status-badge ${statusClasses[status] || ''}`}>{status}</span>;
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

  if (loading) {
    return <div className="loading">Loading donations...</div>;
  }

  return (
    <div className="donations-details">
      <div className="page-header">
        <h1>My Donations</h1>
        <p>Track your blood donation history and scheduled appointments</p>
        <button className="refresh-btn" onClick={handleRefresh}>Refresh Data</button>
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
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {donations.length === 0 ? (
        <div className="no-donations">
          <p>No donations found. Schedule your first donation to get started!</p>
        </div>
      ) : (
        <>
          <div className="donations-summary">
            <h3>
              Total Donations: {totalDonationCount} 
              {getDonationBadge(totalDonationCount)}
            </h3>
          </div>
          <div className="donations-list">
            {donations.map((donation) => (
              <div key={donation._id} className="donation-card">
                <div className="donation-header">
                  <div className="donation-date">
                    <strong>Date:</strong> {new Date(donation.donationDate).toLocaleDateString()}
                  </div>
                  {getStatusBadge(donation.status)}
                </div>
                
                <div className="donation-details">
                  <div className="detail-row">
                    <span className="detail-label">Blood Type:</span>
                    <span className="detail-value">{donation.bloodType}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Units:</span>
                    <span className="detail-value">{donation.units} unit(s)</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Center:</span>
                    <span className="detail-value">{donation.donationCenter?.name}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Address:</span>
                    <span className="detail-value">{donation.donationCenter?.address}</span>
                  </div>
                  {donation.notes && (
                    <div className="detail-row">
                      <span className="detail-label">Notes:</span>
                      <span className="detail-value">{donation.notes}</span>
                    </div>
                  )}
                </div>

                {donation.status === 'scheduled' && (
                  <div className="donation-actions">
                    <button
                      className="cancel-btn"
                      onClick={() => handleCancelDonation(donation._id)}
                    >
                      Cancel Donation
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

export default DonationsDetails;