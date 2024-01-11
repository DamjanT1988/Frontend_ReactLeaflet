// SettingsView.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URLS } from '../constants/APIURLS';
import './SettingsView.css';

const SettingsView = () => {
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
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      navigate('/login');
    } else {
      fetchUserDetails(accessToken);
      fetchPaymentDetails(accessToken);
    }
  }, [navigate]);

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

  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentDetails(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    const accessToken = localStorage.getItem('accessToken');

    if (userDetails.password !== userDetails.confirmPassword) {
      setStatusMessageUser("New password and confirm password do not match.");
      return;
    }

    fetch(API_URLS.USER_INFO, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(userDetails),
    })
      .then(response => response.json())
      .then(data => {
        setStatusMessageUser("Användarinformation sparad!");
      })
      .catch(error => {
        setStatusMessageUser("Misslyckats att spara. Försök igen senare.");
      });

  };

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
        setStatusMessagePayment("Betalinformation sparad!");
        if (!paymentExists) {
          setPaymentExists(true); // Update state to reflect that payment now exists
        }
      })
      .catch(error => {
        setStatusMessagePayment("Misslyckats att spara. Försök igen senare.");
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
          <input type="text" id="payment_adress" name="payment_adress" value={paymentDetails.payment_adress} onChange={handlePaymentInputChange} />
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

        {/* Password */}
        <label htmlFor="password">Nytt lösenord:</label>
        <input type="password" id="password" name="password" value={userDetails.password} onChange={handleInputChange} />

        {/* Confirm Password */}
        <label htmlFor="confirmPassword">Bekräfta nytt lösenord:</label>
        <input type="password" id="confirmPassword" name="confirmPassword" value={userDetails.confirmPassword} onChange={handleInputChange} />

        {/* Submit button */}
        <button type="submit" className="auth-login-button">Spara användarändringar</button>

        {/* Status Message */}
        {statusMessageUser && <p className="status-message">{statusMessageUser}</p>}
      </form>
    </div>
  );
};

export default SettingsView;
