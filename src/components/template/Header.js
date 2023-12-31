import React from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import Logo from '../../media/vagmiljo_logotyp_grey.png'; // Adjust the path based on your directory structure

const Header = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Remove the tokens from localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    // Redirect to the login page
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="logo-container">
        <img src={Logo} alt="logo" className="logo" />
      </div>
      <nav className="main-nav">
        <NavLink to="/dashboard" activeClassName="active">PANEL</NavLink>
        <NavLink to="/project" activeClassName="active">PROJEKT</NavLink>
        <NavLink to="/report" activeClassName="active">RAPPORT</NavLink>
        <NavLink to="/data" activeClassName="active">DATA</NavLink>
      </nav>
      <div className="user-actions">
        <NavLink to="/news" activeClassName="active">NYHETER</NavLink>
        <NavLink to="/settings" activeClassName="active">ANVÄNDARKONTO</NavLink>
        <button onClick={handleLogout}>LOGGA UT</button>
      </div>
    </header>
  );
};

export default Header;
