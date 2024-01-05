import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Map from '../components/map/Map'; // Adjust the path based on your directory structure

const ProjectView = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if the access token exists in localStorage
    const accessToken = localStorage.getItem('accessToken');

    // If the access token doesn't exist, redirect to LoginView
    if (!accessToken) {
      navigate('/login');
    }

    // Dependency array is empty, meaning it will run once on mount
  }, []); // Empty dependency array ensures effect runs once after initial render

  return (
    <div>
      <Map />  {/* This line is where the Map component is included */}
    </div>
  );
};

export default ProjectView;