import React from 'react';
import { NavLink } from 'react-router-dom';
import './SideNav.css';

function SideNav({ navItems = [], user, onLogout, title, totalDonationCount = 0, totalRequestsCount = 0 }) {
  // const location = useLocation(); // Removed unused location

  // Function to get donation badge based on count
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

  // Function to get request badge based on count
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

  // Safety check for required props
  if (!navItems || !Array.isArray(navItems)) {
    return (
      <div className="side-nav">
        <div className="side-nav-header">
          <h2>{title || 'Dashboard'}</h2>
          <div className="user-info">
            <div className="user-avatar">
              {user?.firstName?.charAt(0) || user?.username?.charAt(0) || 'U'}
            </div>
            <div className="user-details">
              <h4>{user?.firstName} {user?.lastName}</h4>
              <p>{user?.role ? (user.role === 'donor' ? 'User' : (user.role.charAt(0).toUpperCase() + user.role.slice(1))) : ''}</p>
              {getDonationBadge(totalDonationCount)}
              {getRequestBadge(totalRequestsCount)}
            </div>
          </div>
        </div>
        <div className="nav-menu">
          <p style={{ padding: '20px', textAlign: 'center', opacity: 0.7 }}>
            Navigation items not configured
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="side-nav">
      <div className="side-nav-header">
        <h2>{title || 'Dashboard'}</h2>
        <div className="user-info">
          <div className="user-avatar">
            {user?.firstName?.charAt(0) || user?.username?.charAt(0) || 'U'}
          </div>
          <div className="user-details">
            <h4>{user?.firstName} {user?.lastName}</h4>
            <p>{user?.role ? (user.role === 'donor' ? 'User' : (user.role.charAt(0).toUpperCase() + user.role.slice(1))) : ''}</p>
            {getDonationBadge(totalDonationCount)}
            {getRequestBadge(totalRequestsCount)}
          </div>
        </div>
      </div>

      <nav className="nav-menu">
        {navItems.map((item) => (
          <div key={item.path} className="nav-item">
            {item.action ? (
              <button onClick={item.action} className="nav-link logout-nav-item">
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            ) : (
              <NavLink
                to={item.path}
                className={({ isActive }) => 
                  `nav-link ${isActive ? 'active' : ''}`
                }
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {item.badge && (
                  <span className="nav-badge">{item.badge}</span>
                )}
              </NavLink>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
}

export default SideNav;