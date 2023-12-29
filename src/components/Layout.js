import React from 'react';
import Logo from '../media/vagmiljo_logotyp_vit.png'; // Adjust the path based on your directory structure
import './Layout.css'; // Importing CSS for layout
import { Link } from 'react-router-dom'; // Importing Link component for navigation

const Layout = ({ children }) => {
  return (
    <div className="layout">
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

      <main>{children}</main>

      <footer className="footer">
        <div className="footer-section">
          <h4>Contact</h4>
          {/* Contact details */}
        </div>
        <div className="footer-section">
          <h4>Links</h4>
          {/* Link details */}
        </div>
        <div className="footer-section">
          <h4>Latest News</h4>
          {/* Latest news details */}
        </div>
      </footer>
    </div>
  );
};

export default Layout;
