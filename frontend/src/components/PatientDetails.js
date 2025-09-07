import React, { useState, useEffect } from 'react';
import './PatientDetails.css';

function PatientDetails() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterBloodType, setFilterBloodType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPatients();
  }, [currentPage, filterBloodType, searchTerm]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      let url = `${process.env.REACT_APP_API_URL}/api/admin/patient-management?page=${currentPage}`;
      
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
          setPatients(data.patients);
          setTotalPages(data.totalPages);
        } else {
          setError('Failed to fetch patient data');
        }
      } else {
        setError('Failed to fetch patient data');
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      setError('Error fetching patient data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPatients();
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

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="patient-details">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading patient data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="patient-details">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={fetchPatients} className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-details">
      <div className="patient-header">
        <h2>Patient Management</h2>
        <div className="header-controls">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Search patients..."
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

      <div className="patient-summary">
        <div className="summary-card">
          <h3>Total Patients</h3>
          <p>{patients.length}</p>
        </div>
        <div className="summary-card">
          <h3>Active Patients</h3>
          <p>{patients.filter(patient => patient.isActive).length}</p>
        </div>
        <div className="summary-card">
          <h3>Total Blood Requests</h3>
          <p>{patients.reduce((sum, patient) => sum + patient.totalRequests, 0)}</p>
        </div>
        <div className="summary-card">
          <h3>Pending Requests</h3>
          <p>{patients.reduce((sum, patient) => sum + patient.pendingRequests, 0)}</p>
        </div>
      </div>

      <div className="table-container">
        <table className="patient-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Blood Group</th>
              <th>Age</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Total Requests</th>
              <th>Last Request</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((patient) => (
              <tr key={patient._id}>
                <td className="patient-name">{patient.firstName} {patient.lastName}</td>
                <td className="blood-type">{patient.bloodType}</td>
                <td className="age">{patient.age || 'N/A'}</td>
                <td className="email">{patient.email}</td>
                <td className="phone">{patient.phone}</td>
                <td className="address">{formatAddress(patient.address)}</td>
                <td className="requests">{patient.totalRequests}</td>
                <td className="last-request">{formatDate(patient.lastRequestDate)}</td>
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

      {patients.length === 0 && !loading && (
        <div className="no-data">
          <p>No patients found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}

export default PatientDetails;