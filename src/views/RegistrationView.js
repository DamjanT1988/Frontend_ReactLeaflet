// RegistrationView.js
import React, { useState, useEffect } from 'react';
import './AuthView.css';
import Logo from '../media/vagmiljo_logotyp_grey.png';
import { API_URLS } from '../constants/APIURLS';

const RegistrationView = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirm_password: '', // Added for password confirmation
    first_name: '',
    last_name: '',
    user_additional: {
      organization_number: '',
      organization_name: '',
      role: '',
      job_title: '',
      department: '',
      phone_number: ''
    },
    billing_details: { // Added for billing information
      payment_email: '',
      payment_adress: '',
      payment_telephone: '',
      payment_reference: ''
    }
  });

  useEffect(() => {
    // When the component mounts
    document.body.style.backgroundColor = '#d3d3d3';

    // When the component unmounts
    return () => {
      document.body.style.backgroundColor = null; // or set to a default color
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const keys = name.split('.');
    if (keys.length === 2) {
      const [parentKey, childKey] = keys;
      setFormData(prevState => ({
        ...prevState,
        [parentKey]: {
          ...prevState[parentKey],
          [childKey]: value
        }
      }));
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Check if passwords match
    if (formData.password !== formData.confirm_password) {
      alert("Lösenorden matchar inte!");
      return; // Stop the form from submitting
    }
    // Proceed with API call if passwords match
    try {
      const response = await fetch(API_URLS.USER_CREATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        console.log("User registered successfully");
        // Handle success
      } else {
        console.log("Failed to register");
        // Handle errors
      }
    } catch (error) {
      console.error("Failed to send data", error);
    }
  };

  return (
    <div className="auth-container">
      <img src={Logo} alt="Logo" className="auth-logo" />
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1 className="auth-header">Registrera ny användare</h1>

        <h2>OM ORGANISATIONEN</h2>
        <p>Fyll i kort om organisationen och välj lösenord.</p>
        <br />
        {/* Organization Name */}
        <label htmlFor="organization_name">Organisationsnamn:</label>
        <input type="text" id="organization_name" name="user_additional.organization_name" onChange={handleInputChange} />

        {/* Organization Number */}
        <label htmlFor="organization_number">Organisationsnummer:</label>
        <p>Endast siffror.</p>
        <input type="text" id="organization_number" name="user_additional.organization_name" onChange={handleInputChange} />

        {/* Password */}
        <label htmlFor="password">Lösenord:</label>
        <input type="password" id="password" name="password" onChange={handleInputChange} />

        {/* Confirm Password */}
        <label htmlFor="confirm_password">Bekräfta Lösenord:</label>
        <input type="password" id="confirm_password" name="confirm_password" onChange={handleInputChange} />

        <br /><br />
        <h2>OM ANVÄNDARANSVARIGE</h2>
        <p>Fyll i information om den som ansvarar för användarkontot. Oftast är det även kontaktpersonen för tjänsten i organisationen.</p>
        <br />

        {/* User Additional Information */}
        {/* Username */}
        <label htmlFor="username">Önskat användarnamn:</label>
        <input type="text" id="username" name="username" onChange={handleInputChange} />

        {/* First Name */}
        <label htmlFor="first_name">Ansvarig förnamn:</label>
        <input type="text" id="first_name" name="first_name" onChange={handleInputChange} />

        {/* Last Name */}
        <label htmlFor="last_name">Ansvarig efternamn:</label>
        <input type="text" id="last_name" name="last_name" onChange={handleInputChange} />

        {/* Role */}
        <label htmlFor="role">Roll:</label>
        <input type="text" id="role" name="user_additional.role" onChange={handleInputChange} />

        {/* Job Title */}
        <label htmlFor="job_title">Jobbtitel:</label>
        <input type="text" id="job_title" name="user_additional.job_title" onChange={handleInputChange} />

        {/* Department */}
        <label htmlFor="department">Avdelning:</label>
        <input type="text" id="department" name="user_additional.department" onChange={handleInputChange} />

        {/* Email */}
        <label htmlFor="email">Kontakt e-mejl:</label>
        <p>Kolla inbox efter registration for bekräftelsemejl.</p>
        <input type="email" id="email" name="email" onChange={handleInputChange} />

        {/* Phone Number */}
        <label htmlFor="phone_number">Kontakt telefonnummer:</label>
        <p>Endast siffror. Inga bindestreck.</p>
        <input type="text" id="phone_number" name="user_additional.phone_number" onChange={handleInputChange} />

        <br /><br />
        <h2>ER FAKTURERINGSINFORMATION</h2>
        <p>Fyll i information om fakturering.</p>
        <br />
        {/* Billing information fields */}
        <label htmlFor="billing_details.payment_email">Fakturerings e-post:</label>
        <input type="email" id="billing_details.payment_email" name="billing_details.payment_email" onChange={handleInputChange} />

        <label htmlFor="billing_details.payment_adress">Faktureringsadress:</label>
        <textarea
          id="billing_details.payment_adress"
          name="billing_details.payment_adress"
          rows="5"
          onChange={handleInputChange}
          value={formData.billing_details.payment_adress}
        ></textarea>
        <label htmlFor="billing_details.payment_telephone">Kontakttelefonnummer:</label>
        <input type="text" id="billing_details.payment_telephone" name="billing_details.payment_telephone" onChange={handleInputChange} />

        <label htmlFor="billing_details.payment_reference">Referens:</label>
        <p>Personens namn som har hand om ekonomin.</p>
        <input type="text" id="billing_details.payment_reference" name="billing_details.payment_reference" onChange={handleInputChange} />

        {/* Submit button */}
        <br /><br /><br />
        <button type="submit" className="auth-login-button">Registrera</button>

      </form>
    </div>
  );
};

export default RegistrationView;
