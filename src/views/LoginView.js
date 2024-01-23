import React, { useState, useEffect } from 'react';
import './AuthView.css';
import Logo from '../media/vagmiljo_logotyp_grey.png';
import { useNavigate } from 'react-router-dom';
import { API_URLS } from '../constants/APIURLS';

const LoginView = () => {
  const [userNumber, setUserNumber] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [resetUsername, setResetUsername] = useState('');
  const [showPasswordReset, setShowPasswordReset] = useState(false); // State to track visibility of password reset fields
  const navigate = useNavigate();
  const [statusMessage, setStatusMessage] = useState('');

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
    setStatusMessage(''); // Clear any existing messages
    try {
      const response = await fetch(API_URLS.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: userNumber,
          password: userPassword,
          rememberMe: rememberMe
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Lyckad inloggning!');
        localStorage.setItem('refreshToken', data.refresh);
        localStorage.setItem('accessToken', data.access);
        navigate('/dashboard');
        // When setting the token
        localStorage.setItem('rememberMe', rememberMe);
        setStatusMessage('Lyckad inloggning! Omdirigerar...');

      } else {
        console.error('Misslyckad inlogg:', data.error);
        setStatusMessage('Misslyckad inloggning. Kontrollera dina uppgifter.');
        // Handle errors, such as displaying a message to the user
      }
    } catch (error) {
      console.error('Kan inte skicka förfrågan:', error);
      // Handle network errors, show user feedback
    }
  };

  const handlePasswordReset = async () => {
    setStatusMessage(''); // Clear any existing messages
    try {
      const response = await fetch(API_URLS.RESET, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: resetUsername }),
      });
  
      if (response.ok) {
        console.log('Password reset email sent.');
        setStatusMessage('Ett e-postmeddelande för återställning av lösenord har skickats.');
        // Show some confirmation message to the user
      } else {
        console.error('Failed to send password reset email.');
        setStatusMessage('Misslyckades. Kontrollera angivna uppgifter.');
        // Handle errors, such as displaying a message to the user
      }
    } catch (error) {
      console.error('Error sending password reset request:', error);
      setStatusMessage('Ett fel uppstod vid skickande av lösenordsåterställning.');
      // Handle network errors, show user feedback
    }
  };  

  const togglePasswordReset = () => {
    setShowPasswordReset(!showPasswordReset); // Toggle the visibility
  };


  return (
    <div className="auth-container">
      <img src={Logo} alt="logo" className="auth-logo" />
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1 className="auth-header">Vänligen logga in nedan!</h1>
        <label htmlFor="userNumber">Fyll i ditt användarnamn:</label>
        <input type="text" id="userNumber" value={userNumber} onChange={(e) => setUserNumber(e.target.value)} />
        <label htmlFor="userPassword">Fyll i ditt lösenord:</label>
        <input type="password" id="userPassword" value={userPassword} onChange={(e) => setUserPassword(e.target.value)} />
        <br />
        <div className="auth-remember">
          <label htmlFor="rememberMe">Komihåg</label>
          <input
            type="checkbox"
            id="rememberMe"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
        </div>
        <button type="submit" className="auth-login-button">LOGGA IN!</button>
        <br /><br />
        <p className="status-message">{statusMessage}</p>
        <br /><br />
        <button type="button" onClick={togglePasswordReset} className="auth-forgot-link">
          Glömt inloggningsuppgifter? Tryck här!
        </button>
        </form>
        <br />

        <br /><br />
        {showPasswordReset && (
          <div className="password-reset-section auth-form">
          <label>Ange ditt användarnamn:</label>
            <input
              type="text"
              value={resetUsername}
              onChange={(e) => setResetUsername(e.target.value)}
            />
            <p>Ett nytt lösenord skickas till ert kontoemejl. Därefter kan ni logga in för att sätta egen lösenord i kontoinställningar.</p>
            <button className="auth-login-button" onClick={handlePasswordReset}>Skicka nytt lösenord!</button>
          </div>
        )}
    </div>
  );
};

export default LoginView;
