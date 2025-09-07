import React, { useState, useEffect } from 'react';
import './DonorDetails.css';

function DonorDetails() {
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterBloodType, setFilterBloodType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDonors();
  }, [currentPage, filterBloodType, searchTerm]);

  const fetchDonors = async () => {
    try {
      setLoading(true);
      let url = `${process.env.REACT_APP_API_URL}/api/admin/donor-management?page=${currentPage}`;
      
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
        if (data.success) {
          setDonors(data.donors);
          setTotalPages(data.totalPages);
        } else {
          setError('Failed to fetch donor data');
        }
      } else {
        setError('Failed to fetch donor data');
      }
    } catch (error) {
      console.error('Error fetching donors:', error);
      setError('Error fetching donor data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchDonors();
  };

  const handleFilterChange = (e) => {
    setFilterBloodType(e.target.value);
    setCurrentPage(1);
  };

  const formatAddress = (address) => {
    if (!address) return 'N/A';
    const parts = [address.street, address.city, address.state, address.zipCode];
    return parts.filter(part => part).join(', ');
  };

  if (loading) {
    return (
      <div className="donor-details">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading donor data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="donor-details">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={fetchDonors} className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="donor-details">
      <div className="donor-header">
        <h2>Donor Management</h2>
        <div className="header-controls">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Search donors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-btn">🔍</button>
          </form>
          <select 
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

      <div className="donor-summary">
        <div className="summary-card">
          <h3>Total Donors</h3>
          <p>{donors.length}</p>
        </div>
        <div className="summary-card">
          <h3>Active Donors</h3>
          <p>{donors.filter(donor => donor.isActive).length}</p>
        </div>
        <div className="summary-card">
          <h3>Total Donations</h3>
          <p>{donors.reduce((sum, donor) => sum + donor.completedDonations, 0)}</p>
        </div>
      </div>

      <div className="table-container">
        <table className="donor-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Blood Group</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Total Donations</th>
            </tr>
          </thead>
          <tbody>
            {donors.map((donor) => (
              <tr key={donor._id}>
                <td className="donor-name">{donor.firstName} {donor.lastName}</td>
                <td className="blood-type">{donor.bloodType}</td>
                <td className="email">{donor.email}</td>
                <td className="phone">{donor.phone}</td>
                <td className="address">{formatAddress(donor.address)}</td>
                <td className="donations">{donor.completedDonations}</td>
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

      {donors.length === 0 && !loading && (
        <div className="no-data">
          <p>No donors found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}

export default DonorDetails;