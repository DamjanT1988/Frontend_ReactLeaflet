import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URLS } from '../constants/APIURLS';
import './DashboardView.css'; // Import the CSS for DashboardView

const DashboardView = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');

    // If no access token is found, redirect to the login page
    if (/*!accessToken*/false) {
      navigate('/login');
      return;
    }

    const savedRememberMe = localStorage.getItem('rememberMe') === 'true';
    setRememberMe(savedRememberMe);

    const fetchUserInfo = async () => {
      try {
        const response = await fetch(API_URLS.USER_INFO, {
          headers: {
            Authorization: `Bearer ${accessToken}`, // Adjust according to your token type
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUserInfo(data); // Store user info in state
        } else {
          // If the token is invalid or expired, redirect to login
          localStorage.removeItem('accessToken');
          navigate('/login');
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
        //navigate('/login');
      }
    };

    fetchUserInfo();

    const fetchProjects = async () => {
      try {
        const response = await fetch(API_URLS.PROJECTS, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
  
        if (response.ok) {
          const data = await response.json();
          setProjects(data.reverse().slice(0, 3)); // Store only the latest five projects
        } else {
          console.error('Failed to fetch projects');
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };
  
    //fetchUserInfo();
    //fetchProjects();
  }, [navigate]);

  // Render user info or any other content
  return (
    <div>
      {userInfo ? <h1>Välkommen {userInfo.first_name}!</h1> : 'Loading...'}
      <div className="dashboard-container">
        <h2>Senaste tre projekt</h2>
        {projects.length > 0 ? (
          projects.map((project, index) => (
    <div key={index} className="project">
      <h3>{project.project_name} - #{project.id}</h3>
      <p>{project.description}</p>
      <button className="toggle-form-button" onClick={() => navigate(`/project/${project.id}`)}>Gå tilll projekt!</button>
      {/* Replace '/project/${project.id}' with your actual path */}
            </div>
          ))
        ) : (
          <p>Inga projekt finns.</p>
        )}
      </div>
    </div>
  );  
};

export default DashboardView;
