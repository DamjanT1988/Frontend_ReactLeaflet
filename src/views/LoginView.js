import React, { useState } from 'react';
import './AuthView.css';
import Logo from '../media/vagmiljo_logotyp_grey.png';

const LoginView = () => {
  const [userNumber, setUserNumber] = useState('');
  const [userPassword, setUserPassword] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/api/user/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: userNumber, // assuming userNumber is the username
          password: userPassword,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Login successful!');
        // Store the token, for example in localStorage (Consider security implications depending on your application needs)
        localStorage.setItem('refreshToken', data.refresh);
        localStorage.setItem('accessToken', data.access);
        // Redirect or update UI
      } else {
        console.error('Failed to login:', data.error);
        // Handle errors, such as displaying a message to the user
      }
    } catch (error) {
      console.error('Failed to send request:', error);
      // Handle network errors, show user feedback
    }
  };

  return (
    <div className="auth-container">
      <img src={Logo} alt="logo" className="auth-logo" />
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1 className="auth-header">Vänligen logga in nedan!</h1>
        <label htmlFor="userNumber">Fyll i ditt användarnummer:</label>
        <input type="text" id="userNumber" value={userNumber} onChange={(e) => setUserNumber(e.target.value)} />
        <label htmlFor="userPassword">Fyll i ditt lösenord:</label>
        <input type="password" id="userPassword" value={userPassword} onChange={(e) => setUserPassword(e.target.value)} />
        <br/>
        <div className="auth-remember">
          <label htmlFor="rememberMe">Komihåg</label>
          <input type="checkbox" id="rememberMe" /> 
        </div>
        <button type="submit" className="auth-login-button">LOGGA IN!</button>
        <br/>
        <a href="/forgot-password" className="auth-forgot-link">Glömt inloggningsuppgifter? Tryck här!</a>
      </form>
    </div>
  );
};

export default LoginView;
