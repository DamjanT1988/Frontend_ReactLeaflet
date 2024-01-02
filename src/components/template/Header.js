import React from 'react';
import Logo from '../../media/vagmiljo_logotyp_grey.png'; // Adjust the path based on your directory structure
import { NavLink  } from 'react-router-dom';

const Header = () => {
  return (
    <header className="header">
    <div className="logo-container">
      <img src={Logo} alt="logo" className="logo" />
    </div>
    <nav className="main-nav">
      {/* Adjust the paths as necessary */}
      <NavLink to="/dashboard" activeClassName="active">PANEL</NavLink>
      <NavLink to="/project" activeClassName="active">PROJEKT</NavLink>
      <NavLink to="/report" activeClassName="active">RAPPORT</NavLink>
      <NavLink to="/data" activeClassName="active" >DATA</NavLink>
      </nav>    
    <div className="user-actions">
      <NavLink to="/news" activeClassName="active">NYHETER</NavLink>
      <NavLink to="/settings" activeClassName="active">INSTÄLLNINGAR</NavLink>
      <button>LOGGA UT</button>
    </div>

  </header>
  );
};

export default Header;
