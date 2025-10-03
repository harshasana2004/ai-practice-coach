import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : '?';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-logo">
           <svg className="header-logo-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          <span className="header-logo-text">Smart Speak</span>
        </div>
        <nav className="header-nav">
          <NavLink to="/" className={({ isActive }) => (isActive ? "active" : "")}>Practice</NavLink>
          <NavLink to="/history" className={({ isActive }) => (isActive ? "active" : "")}>History</NavLink>
        </nav>
        <div className="header-profile">
          <div className="profile-initial">
            {userInitial}
          </div>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;