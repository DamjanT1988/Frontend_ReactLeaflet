import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // for navigation and linking to project details
import { API_URLS } from '../constants/APIURLS'; // Adjust according to your API_URLS location
import './ProjectView.css';

const ProjectView = () => {
  const [projects, setProjects] = useState([]); // State to store all projects
  const [selectedProject, setSelectedProject] = useState(null); // State to store the selected project for viewing details
  const navigate = useNavigate();
  const accessToken = localStorage.getItem('accessToken'); // Retrieve accessToken from localStorage
  const [showForm, setShowForm] = useState(false); // State to control form visibility
  const toggleFormVisibility = () => setShowForm(!showForm)
  // Fetch all projects on component mount
  useEffect(() => {
    if (!accessToken) {
      navigate('/login');
    } else {
      fetchProjects();
    }
  }, [accessToken]); // Rerun effect if accessToken changes

  // Function to fetch all projects
  const fetchProjects = () => {
    fetch(API_URLS.PROJECTS, {
      method: 'GET',
      headers: new Headers({
        'Authorization': `Bearer ${accessToken}`, // Append the accessToken for authorization
      }),
    })
      .then(response => response.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProjects(data);
        } else {
          console.error("Expected an array of projects, but got:", data);
          setProjects([]);
        }
      })
      .catch(error => console.error('Error fetching projects:', error));
  };

  // Function to view project details
  const viewProjectDetails = (projectId) => {
    navigate(`/projects/${projectId}`); // Navigate to project detail page
  };

  // Function to handle project creation form submission
  const handleProjectCreate = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);

    const newProject = {
      project_name: formData.get('project_name'),
      description: formData.get('description'),
      // Add other fields as necessary
    };

    fetch(API_URLS.PROJECTS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`, // Append the accessToken for authorization
      },
      body: JSON.stringify(newProject),
    })
      .then(response => response.json())
      .then(data => {
        fetchProjects(); // Re-fetch all projects to update the list
        console.log('Project created:', data);
      })
      .catch(error => console.error('Error creating project:', error));
  };

  return (
    <div className="project-container">
      <h1>Mina projekt</h1>
      <button className="toggle-form-button" onClick={toggleFormVisibility}>
        {showForm ? "Dölj formulär" : "Lägg till nytt projekt"}
      </button>

      {showForm && (
        <form className={`form-container ${showForm ? "visible" : ""}`} onSubmit={handleProjectCreate}>
          <h2>Skapa nytt projekt</h2>
          <label htmlFor="project_name">Projektnamn:</label>
          <input type="text" id="project_name" name="project_name" required />

          <label htmlFor="description">Beskrivning:</label>
          <textarea id="description" name="description" required></textarea>

          <button type="submit">Skapa projekt!</button> <br /><br />
        </form>
      )}

      {projects.map(project => (
        <div key={project.id} className='project'>
          <h2>{project.project_name}</h2>
          <p>{project.description}</p>
          <button onClick={() => viewProjectDetails(project.id)}>Välj projekt!</button>
        </div>
      ))}
    </div>
  );
};

export default ProjectView;
