import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './DonorProfile.css';

function DonorProfile() {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    address: user?.address || { street: '', city: '', state: '', zipCode: '' }
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const result = await updateProfile(formData);
      if (result.success) {
        setMessage('Profile updated successfully!');
      } else {
        setMessage(result.message);
      }
    } catch (error) {
      setMessage('Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="donor-profile">
      <h2>My Profile</h2>
      {message && (
        <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="firstName">First Name:</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="lastName">Last Name:</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone:</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="addressStreet">Street Address:</label>
          <input
            type="text"
            id="addressStreet"
            name="address.street"
            value={formData.address.street}
            onChange={handleChange}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="addressCity">City:</label>
            <input
              type="text"
              id="addressCity"
              name="address.city"
              value={formData.address.city}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="addressState">State:</label>
            <input
              type="text"
              id="addressState"
              name="address.state"
              value={formData.address.state}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="addressZipCode">ZIP Code:</label>
            <input
              type="text"
              id="addressZipCode"
              name="address.zipCode"
              value={formData.address.zipCode}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Blood Type:</label>
          <input
            type="text"
            value={user?.bloodType || ''}
            disabled
            className="disabled-input"
          />
        </div>

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? 'Updating...' : 'Update Profile'}
        </button>
      </form>
    </div>
  );
}

export default DonorProfile;
