// SettingsView.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URLS } from '../constants/APIURLS'; 
import './SettingsView.css'

const SettingsView = () => {
    const [userDetails, setUserDetails] = useState({
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      password: '',
      user_additional: {
          organization_number: '',
          organization_name: '',
          role: '',
          job_title: '',
          department: '',
          phone_number: '',
      }
    });

    const [statusMessage, setStatusMessage] = useState('');
    const navigate = useNavigate();    

    useEffect(() => {
        // Check if the access token exists and is valid
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
            navigate('/login');
        } else {
            // Fetch the user details
            fetch(API_URLS.USER_INFO, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`, // Adjust depending on your token type
                },
            })
                .then(response => response.json())
                .then(data => setUserDetails(data))
                .catch(error => {
                    console.error('Error fetching user data:', error);
                    navigate('/login'); // Redirect to login if there's an issue (e.g., token expired)
                });
        }
    }, [navigate]);

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      if (name.includes('.')) {
          const [parentKey, childKey] = name.split('.');
          setUserDetails({
              ...userDetails,
              user_additional: {
                  ...userDetails.user_additional,
                  [childKey]: value,
              },
          });
      } else {
          setUserDetails({
              ...userDetails,
              [name]: value,
          });
      }
  };
  

    const handleUpdateProfile = (e) => {
        e.preventDefault();

        // Check if new password and confirm password match
        if (userDetails.password !== userDetails.confirmPassword) {
          setStatusMessage("New password and confirm password do not match.");
          return;
      }

      const accessToken = localStorage.getItem('accessToken');
      fetch(API_URLS.USER_INFO, {
          method: 'PUT', // or 'PUT' depending on your API
          headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`, // Adjust depending on your token type
          },
          body: JSON.stringify(userDetails),
      })
          .then(response => response.json())
          .then(data => {
              console.log("Kontoinformation uppdaterad!", data);
              setStatusMessage("Kontoinformation uppdaterad!");
              
          })
          .catch(error => {
              console.error("Fel i uppdatering:", error);
              setStatusMessage("Fel i uppdatering. Ladda om sidan och prova igen.");
          });
  };


    return (
      <div className="settings-container">
      <h1>Inställningar</h1>
      <form className="settings-form" onSubmit={handleUpdateProfile}>
      <h2>Redigera användarinformation</h2>
              {/* Organization Name */}
              <label htmlFor="organization_name">Organisationsnamn:</label>
              <input type="text" id="organization_name" name="user_additional.organization_name" value={userDetails.user_additional.organization_name} onChange={handleInputChange} />

              {/* Organization Number */}
              <label htmlFor="organization_number">Organisationsnummer:</label>
              <input type="text" id="organization_number" name="user_additional.organization_number" value={userDetails.user_additional.organization_number} onChange={handleInputChange} />

              {/* Username */}
              <label htmlFor="username">Användarnamn:</label>
              <input type="text" id="username" name="username" value={userDetails.username} onChange={handleInputChange} />

              {/* Email */}
              <label htmlFor="email">E-post:</label>
              <input type="email" id="email" name="email" value={userDetails.email} onChange={handleInputChange} />

              {/* First Name */}
              <label htmlFor="first_name">Förnamn:</label>
              <input type="text" id="first_name" name="first_name" value={userDetails.first_name} onChange={handleInputChange} />

              {/* Last Name */}
              <label htmlFor="last_name">Efternamn:</label>
              <input type="text" id="last_name" name="last_name" value={userDetails.last_name} onChange={handleInputChange} />

              {/* Role */}
              <label htmlFor="role">Roll:</label>
              <input type="text" id="role" name="user_additional.role" value={userDetails.user_additional.role} onChange={handleInputChange} />

              {/* Job Title */}
              <label htmlFor="job_title">Jobbtitel:</label>
              <input type="text" id="job_title" name="user_additional.job_title" value={userDetails.user_additional.job_title} onChange={handleInputChange} />

              {/* Department */}
              <label htmlFor="department">Avdelning:</label>
              <input type="text" id="department" name="user_additional.department" value={userDetails.user_additional.department} onChange={handleInputChange} />

              {/* Phone Number */}
              <label htmlFor="phone_number">Telefonnummer:</label>
              <input type="text" id="phone_number" name="user_additional.phone_number" value={userDetails.user_additional.phone_number} onChange={handleInputChange} />

  {/* Password */}
  <label htmlFor="password">Nytt lösenord:</label>
            <input type="password" id="password" name="password" value={userDetails.password} onChange={handleInputChange} />

            {/* Confirm Password */}
            <label htmlFor="confirmPassword">Bekräfta nytt lösenord:</label>
            <input type="password" id="confirmPassword" name="confirmPassword" value={userDetails.confirmPassword} onChange={handleInputChange} />

            {/* Submit button */}
            <button type="submit" className="auth-login-button">Spara ändringar</button>

            {/* Status Message */}
            {statusMessage && <div className="status-message">{statusMessage}</div>}
        </form>
  </div>
    );
};

export default SettingsView;
