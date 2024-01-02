import React from 'react';
import Logo from '../../media/vagmiljo_logotyp_grey.png'; // Adjust the path based on your directory structure
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="header">
    <div className="logo-container">
      <img src={Logo} alt="logo" className="logo" />
      <span>Welcome, Username!</span>
    </div>
    <nav className="main-nav">
      {/* Adjust the paths as necessary */}
      <Link to="/dashboard">PANEL</Link>
      <Link to="/project">PROJEKT</Link>
      <Link to="/report">RAPPORT</Link>
    </nav>
    <div className="user-actions">
      <Link to="/news">NYHETER</Link>
      <Link to="/settings">INSTÄLLNINGAR</Link>
      <button>LOGGA UT</button>
    </div>
  </header>
  );
};

export default Header;
