import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import './AdminLogin.css';

function AdminLogin() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debug, setDebug] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setDebug('');

    try {
      setDebug('Attempting login...');
      
      // Make direct API call to login endpoint
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      setDebug(`API Response: ${JSON.stringify(data, null, 2)}`);
      
      if (response.ok) {
        setDebug(`User data: ${JSON.stringify(data.user, null, 2)}`);
        
        if (data.user && data.user.role === 'admin') {
          setDebug('Admin login successful, storing token and navigating...');
          
          // Store token
          localStorage.setItem('token', data.token);
          
          // Update auth context
          login(formData).then(() => {
            navigate('/admin-dashboard');
          });
        } else {
          setError('Access denied. Admin privileges required.');
        }
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (error) {
      setDebug(`Error caught: ${error.message}`);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>Admin Login</h2>
          <p>Access administrative dashboard</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {debug && <div className="debug-message">{debug}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username or Email</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Enter your username or email"
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
          <p>Are you a regular user? <Link to="/user">User Login</Link></p>
          <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}><strong>Test Admin Login:</strong></p>
            <button 
              type="button" 
              onClick={() => {
                setFormData({ username: 'admin', password: 'admin123' });
                setDebug('Test credentials loaded. Click Login to proceed.');
              }}
              style={{ 
                padding: '8px 16px', 
                backgroundColor: '#007bff', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              Load Test Credentials
            </button>
            <span style={{ fontSize: '12px', color: '#666' }}>
              Username: admin, Password: admin123
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;