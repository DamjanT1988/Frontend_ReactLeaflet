import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <nav>
      {/* Left links */}
      <Link to="/dashboard">PANEL</Link>
      <Link to="/project">PROJEKT</Link>
      <Link to="/report">RAPPORT</Link>

      {/* Right links */}
      <Link to="/logout">LOGGA UT</Link>
      <Link to="/news">NYHETER</Link>
      <Link to="/settings">INSTÄLLNINGAR</Link>
    </nav>
  );
};

export default Header;
