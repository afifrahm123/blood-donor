import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './UserLogin.css';

function UserLogin() {
  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUserDirectly, addNotification } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Attempting login with:', formData);
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/user-login`, formData);
      console.log('Login response:', response.data);
      
      if (response.data.success) {
        // Store token and user data
        localStorage.setItem('token', response.data.token);
        
        // Set user in context directly
        setUserDirectly(response.data.user);
        
        // Add success notification
        addNotification(`Welcome back, ${response.data.user.firstName}!`, 'success');
        
        // Redirect based on user type
        if (response.data.user.role === 'donor') {
          navigate('/donor-dashboard');
        } else if (response.data.user.role === 'patient') {
          navigate('/patient-dashboard');
        }
      }
    } catch (error) {
      console.error('Login error:', error.response?.data || error);
      setError(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>User Login</h2>
          <p>Login as Donor or Patient</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="emailOrUsername">Email or Username</label>
            <input
              type="text"
              id="emailOrUsername"
              name="emailOrUsername"
              value={formData.emailOrUsername}
              onChange={handleChange}
              required
              placeholder="Enter your email or username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="login-footer">
          <p>Don't have an account? <Link to="/user-register">Register here</Link></p>
          <p>Are you an admin? <Link to="/admin">Admin Login</Link></p>
        </div>
      </div>
    </div>
  );
}

export default UserLogin;
