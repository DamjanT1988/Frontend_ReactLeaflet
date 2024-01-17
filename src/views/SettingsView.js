// SettingsView.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URLS } from '../constants/APIURLS';
import './SettingsView.css';

// Define the SettingsView component
const SettingsView = () => {
  // State to hold user and payment details
  const [userDetails, setUserDetails] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    confirmPassword: '',
    user_additional: {
      organization_number: '',
      organization_name: '',
      role: '',
      job_title: '',
      department: '',
      phone_number: '',
    }
  });
  const [paymentDetails, setPaymentDetails] = useState({
    active_account: false,
    Payment_latest_invoice: false,
    payment_date: '',
    payment_price: '',
    payment_invoice_number: '',
    payment_invoice_date: '',
    payment_invoice_due_date: '',
    payment_email: '',
    payment_adress: '',
    payment_telephone: '',
    payment_reference: '',
    payment_comment: ''
  });
  const [paymentExists, setPaymentExists] = useState(false);
  const [statusMessagePayment, setStatusMessagePayment] = useState('');
  const [statusMessageUser, setStatusMessageUser] = useState('');
  const [existingPassword, setExistingPassword] = useState('');
  const [showPasswordUpdate, setShowPasswordUpdate] = useState(false);
  const [isExistingPasswordConfirmed, setIsExistingPasswordConfirmed] = useState(false);

  const navigate = useNavigate();

  // Fetch user and payment details on component mount
  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      navigate('/login');
    } else {
      fetchUserDetails(accessToken);
      fetchPaymentDetails(accessToken);
    }
  }, [navigate]);

  // Function to fetch user details
  const fetchUserDetails = (accessToken) => {
    fetch(API_URLS.USER_INFO, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then(response => response.json())
      .then(data => setUserDetails(data))
      .catch(error => {
        console.error('Error fetching user data:', error);
        navigate('/login');
      });
  };

  // Function to fetch payment details
  const fetchPaymentDetails = (accessToken) => {
    fetch(API_URLS.USER_PAYMENT_INFO, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('No payment data');
      })
      .then(data => {
        setPaymentDetails(data);
        setPaymentExists(true);
      })
      .catch(error => {
        console.error("Error fetching payment data:", error);
        setPaymentExists(false);
      });
  };

  // Function to validate the existing password
  const validateExistingPassword = (password) => {
    return new Promise((resolve, reject) => {
      fetch(API_URLS.USER_VALIDATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ username: userDetails.username, password }),
      })
        .then(response => {
          if (response.ok) {
            resolve(true);
            userDetails.password = password;
          } else {
            reject("Invalid password");
          }
        })
        .catch(error => reject(error));
    });
  };

  // Function to handle password change request
  const handlePasswordChangeRequest = () => {
    validateExistingPassword(existingPassword)
      .then(isValid => {
        if (isValid) {
          setIsExistingPasswordConfirmed(true);
          setShowPasswordUpdate(true);
        } else {
          alert("Existing password is incorrect.");
          setIsExistingPasswordConfirmed(false);
          setShowPasswordUpdate(false);
        }
      })
      .catch(error => {
        alert("Error: " + error);
        setIsExistingPasswordConfirmed(false);
        setShowPasswordUpdate(false);
      });
  };

  // Function to handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parentKey, childKey] = name.split('.');
      setUserDetails(prevState => ({
        ...prevState,
        user_additional: {
          ...prevState.user_additional,
          [childKey]: value
        }
      }));
    } else {
      setUserDetails(prevState => ({
        ...prevState,
        [name]: value
      }));
    }
  };

  // Function to handle payment input changes
  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentDetails(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Function to handle profile update
  const handleUpdateProfile = (e) => {
    e.preventDefault();
    const accessToken = localStorage.getItem('accessToken');

    if (!existingPassword) {
      setStatusMessageUser("Please enter your existing password.");
      return;
    }

    validateExistingPassword(existingPassword)
      .then(isValid => {
        if (isValid) {
          updateProfile(accessToken);
        } else {
          setStatusMessageUser("Incorrect existing password.");
        }
      })
      .catch(error => {
        setStatusMessageUser("Error: " + error);
      });
  };

  // Function to update the profile
  const updateProfile = (accessToken) => {
    let updatedUserDetails = { ...userDetails };

    // If password change is confirmed and new password matches confirm password,
    // set it as the new password in userDetails
    if (showPasswordUpdate && userDetails.newPassword === userDetails.confirmPassword) {
      updatedUserDetails.password = userDetails.newPassword;
    }

    // Remove confirmPassword and newPassword from the payload as they are not needed in the API call
    delete updatedUserDetails.confirmPassword;
    delete updatedUserDetails.newPassword;

    fetch(API_URLS.USER_INFO, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(updatedUserDetails),
    })
      .then(response => response.json())
      .then(data => {
        setStatusMessageUser("User information saved successfully!");
        // Update userDetails state to reflect the new password and reset newPassword and confirmPassword
        setUserDetails({ ...updatedUserDetails, newPassword: '', confirmPassword: '' });
      })
      .catch(error => {
        setStatusMessageUser("Failed to save. Please try again later.");
      });
  };


  // Function to handle payment update
  const handleUpdatePayment = (e) => {
    e.preventDefault();
    const accessToken = localStorage.getItem('accessToken');
    const paymentApiUrl = paymentExists ? API_URLS.USER_PAYMENT_INFO : API_URLS.USER_PAYMENT_CREATE;

    fetch(paymentApiUrl, {
      method: paymentExists ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(paymentDetails),
    })
      .then(response => response.json())
      .then(data => {
        setStatusMessagePayment("Payment information saved!");
        if (!paymentExists) {
          setPaymentExists(true);
        }
      })
      .catch(error => {
        setStatusMessagePayment("Failed to save. Please try again later.");
      });
  };

  return (
    <div className="settings-container">
      <h1>Kontoinställningar</h1>
      <form className="settings-form" onSubmit={handleUpdatePayment}>
        <h2>Redigera fakturainformation</h2>

        {/* Payment Email */}
        <div>
          <label htmlFor="payment_email">Fakturerings e-post:</label>
          <input type="email" id="payment_email" name="payment_email" value={paymentDetails.payment_email} onChange={handlePaymentInputChange} />
        </div>

        {/* Payment Address */}
        <div>
          <label htmlFor="payment_adress">Faktureringsadress:</label>
          <textarea type="text" id="payment_adress" rows="4" name="payment_adress" value={paymentDetails.payment_adress} onChange={handlePaymentInputChange}></textarea>
        </div>

        {/* Payment Telephone */}
        <div>
          <label htmlFor="payment_telephone">Telefonnummer:</label>
          <input type="text" id="payment_telephone" name="payment_telephone" value={paymentDetails.payment_telephone} onChange={handlePaymentInputChange} />
        </div>

        {/* Payment Reference */}
        <div>
          <label htmlFor="payment_reference">Er referens:</label>
          <input type="text" id="payment_reference" name="payment_reference" value={paymentDetails.payment_reference} onChange={handlePaymentInputChange} />
        </div>

        <button type="submit" className="auth-login-button">Spara fakturainformation</button>

        {/* Status Message */}
        {statusMessagePayment && <p className="status-message">{statusMessagePayment}</p>}
      </form>

      <br /><br /><br /><br />

      <form className="settings-form" onSubmit={handleUpdateProfile}>
        <h2>Redigera företags- och användarinformation</h2>
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

        {!showPasswordUpdate && (
          <div>
            <label htmlFor="existingPassword">Befintligt lösenord:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={existingPassword}
              onChange={(e) => setExistingPassword(e.target.value)}
            />
            <button type="button" className="auth-login-button" onClick={handlePasswordChangeRequest}>
              Ändra lösenord
            </button>
          </div>
        )}

        {showPasswordUpdate && isExistingPasswordConfirmed && (
          <>
            <label htmlFor="password">Nytt lösenord:</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={userDetails.newPassword}
              onChange={handleInputChange}
            />
            <label htmlFor="confirmPassword">Bekräfta nytt lösenord:</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={userDetails.confirmPassword}
              onChange={handleInputChange}
            />
            {/* Submit button for password change */}
            <button type="submit" className="auth-login-button">Spara nytt lösenord</button>
          </>
        )}

        {/* Submit button */}
        <button type="submit" className="auth-login-button">Spara användarändringar</button>

        {/* Status Message */}
        {statusMessageUser && <p className="status-message">{statusMessageUser}</p>}
      </form>
    </div>
  );
};

export default SettingsView;
