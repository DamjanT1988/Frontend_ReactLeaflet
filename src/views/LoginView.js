// LoginView.js
import React from 'react';
import './AuthView.css'; // Make sure the path is correct
import Logo from '../media/vagmiljo_logotyp_grey.png';

const LoginView = () => {
  return (
    <div className="auth-container">
      <img src={Logo} alt="logo" className="auth-logo" />
      <div className="auth-form">
        <h1 className="auth-header">Vänligen logga in nedan!</h1>
        <label htmlFor="userNumber">Fyll i ditt användarnummer:</label>
        <input type="text" id="userNumber" />
        <label htmlFor="userPassword">Fyll i ditt lösenord:</label>
        <input type="password" id="userPassword" />
        <br/>
        <div className="auth-remember">
        <label htmlFor="rememberMe">Komihåg</label>
        <input type="checkbox" id="rememberMe" />
        </div>
        <button className="auth-login-button">LOGGA IN! </button>
        <br/>
        <a href="/forgot-password" className="auth-forgot-link">Glömt inloggningsuppgifter? Tryck här!</a>
      </div>
    </div>
  );
};

export default LoginView;
