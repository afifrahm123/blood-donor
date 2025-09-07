import React from 'react';
import { Link } from 'react-router-dom';
import './Nav.css';

const Nav = () => {
    return (   
        <nav className="navbar">
            <div className="nav-container">
                <div className="nav-logo">
                    <Link to="/">
                        <span className="logo-icon">🩸</span>
                        <span className="logo-text">BloodDonor</span>
                    </Link>
                </div>
                <ul className="nav-menu">
                    <li className="nav-item">
                        <Link to="/" className="nav-link">Home</Link>
                    </li>
                    <li className="nav-item">
                        <Link to="/user" className="nav-link">User</Link>
                    </li>
                    <li className="nav-item">
                        <Link to="/admin" className="nav-link">Admin</Link>
                    </li>
                </ul>
            </div>
        </nav>
    )
}

export default Nav;