import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './NewBloodRequest.css';

function DonorNewBloodRequest() {
  const { user, addNotification } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    bloodType: user?.bloodType || '',
    units: 1,
    urgency: 'medium',
    reason: '',
    hospital: {
      name: '',
      address: '',
      contact: ''
    },
    requiredBy: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/donor/blood-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Blood request submitted successfully!');
        
        // Add notification for successful blood request
        addNotification(`New blood request submitted for ${formData.bloodType} blood`, 'info');
        
        setFormData({
          bloodType: user?.bloodType || '',
          units: 1,
          urgency: 'medium',
          reason: '',
          hospital: { name: '', address: '', contact: '' },
          requiredBy: ''
        });
        setTimeout(() => navigate('/donor-dashboard/blood-requests'), 2000);
      } else {
        setMessage(data.message || 'Failed to submit blood request');
      }
    } catch (error) {
      setMessage('Error submitting blood request');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('hospital.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        hospital: {
          ...prev.hospital,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="new-blood-request">
      <h2>Submit New Blood Request</h2>
      <p className="request-info">
        As a donor, you can also request blood for yourself or your family members. 
        This helps us track all blood needs in the system.
      </p>
      
      {message && (
        <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="blood-request-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="bloodType">Blood Type:</label>
            <select
              id="bloodType"
              name="bloodType"
              value={formData.bloodType}
              onChange={handleChange}
              required
            >
              <option value="">Select Blood Type</option>
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

          <div className="form-group">
            <label htmlFor="units">Units Required:</label>
            <input
              type="number"
              id="units"
              name="units"
              value={formData.units}
              onChange={handleChange}
              min="1"
              required
              style={{ color: '#333', backgroundColor: '#ffffff' }}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="reason">Reason for Request:</label>
          <textarea
            id="reason"
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            required
            rows="3"
            placeholder="Please describe why you need blood..."
            style={{ color: '#333', backgroundColor: '#ffffff' }}
          />
        </div>

        <div className="form-group">
          <label htmlFor="requiredBy">Required By Date:</label>
          <input
            type="datetime-local"
            id="requiredBy"
            name="requiredBy"
            value={formData.requiredBy}
            onChange={handleChange}
            required
            min={new Date().toISOString().slice(0, 16)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="hospitalName">Hospital Name:</label>
          <input
            type="text"
            id="hospitalName"
            name="hospital.name"
            value={formData.hospital.name}
            onChange={handleChange}
            required
            style={{ color: '#333', backgroundColor: '#ffffff' }}
          />
        </div>

        <div className="form-group">
          <label htmlFor="hospitalAddress">Hospital Address:</label>
          <textarea
            id="hospitalAddress"
            name="hospital.address"
            value={formData.hospital.address}
            onChange={handleChange}
            required
            rows="3"
          />
        </div>

        <div className="form-group">
          <label htmlFor="hospitalContact">Hospital Contact:</label>
          <input
            type="text"
            id="hospitalContact"
            name="hospital.contact"
            value={formData.hospital.contact}
            onChange={handleChange}
            required
            placeholder="Phone number or email"
          />
        </div>

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? 'Submitting...' : 'Submit Blood Request'}
        </button>
      </form>
    </div>
  );
}

export default DonorNewBloodRequest;
