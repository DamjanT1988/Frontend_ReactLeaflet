import React from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import Logo from '../../media/vagmiljo_logotyp_grey.png'; // Adjust the path based on your directory structure

const Header = () => {
  const navigate = useNavigate();

  // Function to handle the logout
  const handleLogout = () => {
    // Remove the tokens from localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    // Redirect to the login page
    navigate('/login');
  };

  // Function to get the class name for the active link
  const getNavLinkClass = (isActive) => {
    return isActive ? 'active' : undefined;
  };

  return (
    <header className="header">
    <div className='header-content'>
      <div className="logo-container">
        <img src={Logo} alt="logo" className="logo" />
      </div>
      <nav className="main-nav">
        <NavLink to="/dashboard" className={({ isActive }) => getNavLinkClass(isActive)}>PANEL</NavLink>
        <NavLink to="/project" className={({ isActive }) => getNavLinkClass(isActive)}>PROJEKT</NavLink>
        <NavLink to="/report" className={({ isActive }) => getNavLinkClass(isActive)}>RAPPORT</NavLink>
        <NavLink to="/data" className={({ isActive }) => getNavLinkClass(isActive)}>DATA</NavLink>
      </nav>
      <div className="user-actions">
        <NavLink to="/news" className={({ isActive }) => getNavLinkClass(isActive)}>NYHETER</NavLink>
        <NavLink to="/settings" className={({ isActive }) => getNavLinkClass(isActive)}>ANVÄNDARKONTO</NavLink>
        <button onClick={handleLogout}>LOGGA UT</button>
      </div>
      </div>
    </header>
  );
};

export default Header;
