import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './ScheduleDonation.css';

function ScheduleDonation() {
  const { addNotification } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    donationDate: '',
    units: 1,
    donationCenter: {
      name: '',
      address: '',
      contact: ''
    },
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/donor/schedule-donation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Donation scheduled successfully!');
        
        // Add notification for successful donation scheduling
        addNotification(`New donation scheduled for ${formData.units} unit(s)`, 'info');
        
        setFormData({
          donationDate: '',
          units: 1,
          donationCenter: { name: '', address: '', contact: '' },
          notes: ''
        });
        setTimeout(() => navigate('/donor-dashboard/donations'), 2000);
      } else {
        setMessage(data.message || 'Failed to schedule donation');
      }
    } catch (error) {
      setMessage('Error scheduling donation');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('donationCenter.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        donationCenter: {
          ...prev.donationCenter,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="schedule-donation">
      <h2>Schedule Blood Donation</h2>
      {message && (
        <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="donation-form">
        <div className="form-group">
          <label htmlFor="donationDate">Donation Date:</label>
          <input
            type="datetime-local"
            id="donationDate"
            name="donationDate"
            value={formData.donationDate}
            onChange={handleChange}
            required
            min={new Date().toISOString().slice(0, 16)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="units">Units (1-2):</label>
          <select
            id="units"
            name="units"
            value={formData.units}
            onChange={handleChange}
            required
          >
            <option value={1}>1 Unit</option>
            <option value={2}>2 Units</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="centerName">Donation Center Name:</label>
          <input
            type="text"
            id="centerName"
            name="donationCenter.name"
            value={formData.donationCenter.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="centerAddress">Donation Center Address:</label>
          <textarea
            id="centerAddress"
            name="donationCenter.address"
            value={formData.donationCenter.address}
            onChange={handleChange}
            required
            rows="3"
          />
        </div>

        <div className="form-group">
          <label htmlFor="centerContact">Donation Center Contact:</label>
          <input
            type="text"
            id="centerContact"
            name="donationCenter.contact"
            value={formData.donationCenter.contact}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notes (Optional):</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="3"
          />
        </div>

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? 'Scheduling...' : 'Schedule Donation'}
        </button>
      </form>
    </div>
  );
}

export default ScheduleDonation;
