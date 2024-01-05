import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URLS } from '../constants/APIURLS';

const DashboardView = () => {
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');

    // If no access token is found, redirect to the login page
    if (!accessToken) {
      navigate('/login');
      return;
    }

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
        navigate('/login');
      }
    };

    fetchUserInfo();
  }, [navigate]);

  // Render user info or any other content
  return <div>{userInfo ? <p>Welcome {userInfo.username}</p> : 'Loading...'}</div>;
};

export default DashboardView;
