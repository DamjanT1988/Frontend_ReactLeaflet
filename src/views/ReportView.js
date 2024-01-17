import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import the useNavigate hook from react-router-dom for navigation
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import UserSpecies from '../components/Species/UserSpecies';

const ReportView = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if the access token exists in localStorage
    const accessToken = localStorage.getItem('accessToken');

    // If the access token doesn't exist, redirect to LoginView
    if (!accessToken) {
      navigate('/login');
    }
  }, []); // Empty dependency array ensures effect runs once after initial render

  return (
      <div>
      <UserSpecies />
      </div>
  );
};


export default ReportView;
