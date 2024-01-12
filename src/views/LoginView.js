import React, { useState, useEffect } from 'react';
import './AuthView.css';
import Logo from '../media/vagmiljo_logotyp_grey.png';
import { useNavigate } from 'react-router-dom';
import { API_URLS } from '../constants/APIURLS';

const LoginView = () => {
  const [userNumber, setUserNumber] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
     // When the component mounts
     document.body.style.backgroundColor = '#d3d3d3';
   

    // Check if the access token exists
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      navigate('/dashboard'); // If the access token exists in localStorage, navigate to Dashboard
    }
    // Dependency array is empty, meaning it will run once on mount
            // When the component unmounts
            return () => {
              document.body.style.backgroundColor = null; // or set to a default color
            };
  }, []); // Empty dependency array means it only runs on the first render

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(API_URLS.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: userNumber,
          password: userPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Lyckad inloggning!');
        localStorage.setItem('refreshToken', data.refresh);
        localStorage.setItem('accessToken', data.access);
        navigate('/dashboard');
      } else {
        console.error('Misslyckad inlogg:', data.error);
        // Handle errors, such as displaying a message to the user
      }
    } catch (error) {
      console.error('Kan inte skicka förfrågan:', error);
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
