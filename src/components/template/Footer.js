import React from 'react';
import { Link } from 'react-router-dom'; // Import Link

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-section">
      <h4>Kontakt</h4>
        {/* Add contact information here */}
        <p>T: 073-739 19 65</p>
        <p>A: Dagvindsgatan 8, Karlstad</p>
        <p>E: <a href="mailto:info@vagochmiljo.se">info@vagochmiljo.se</a></p>
      </div>
      <div className="footer-section">
      <h4>Genvägar</h4>
        {/* Sitemap links */}
          <Link to="/dashboard">Panel</Link><br/>
          <Link to="/project">Projekt</Link><br/>
          <Link to="/report">Rapport</Link><br/>
          <Link to="/data">Data</Link><br/>
          <Link to="/news">Nyheter</Link><br/>
          <Link to="/settings">Användarkonto</Link><br/>
          {/* Add other links as needed */}
        
      </div>
      <div className="footer-section">
      <h4>Senaste nytt</h4>
        {/* Insert latest news feed here */}
        <p>Exempeltext: Jobb i Örebro - konsult</p>
      </div>
    </footer>
  );
};

export default Footer;
