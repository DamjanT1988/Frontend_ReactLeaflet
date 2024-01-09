import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URLS } from '../constants/APIURLS';
import './ProjectView.css';
import Map from '../components/map/Map.js';

const ProjectView = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const navigate = useNavigate();
  const accessToken = localStorage.getItem('accessToken');
  const [showForm, setShowForm] = useState(false);
  const toggleFormVisibility = () => setShowForm(!showForm);

  useEffect(() => {
    if (!accessToken) {
      navigate('/login');
    } else {
      fetchProjects();
    }
  }, [accessToken]);

  const handleSaveMapData = (geoJsonData) => {
    if (!selectedProject || !geoJsonData || !geoJsonData.features || geoJsonData.features.length === 0) {
      console.error("No GeoJSON data to save.");
      return;
    }

    geoJsonData.features.forEach(feature => {
      let url;
      let dataToSend;

      switch (feature.geometry.type) {
        case 'Polygon':
          url = `${API_URLS.PROJECT_DETAIL}${selectedProject.id}/add_polygon/`;
          dataToSend = {
            name: "Polygon Name", // You may want to dynamically set this
            status: "Active",    // And this
            geo_data: feature.geometry
          };
          break;
        case 'LineString':
          url = `${API_URLS.PROJECT_DETAIL}${selectedProject.id}/add_line/`;
          dataToSend = {
            name: "Line Name", // Dynamic value
            status: "Active", // Dynamic value
            geo_data: feature.geometry
          };
          break;
        case 'Point':
          url = `${API_URLS.PROJECT_DETAIL}${selectedProject.id}/add_point/`;
          dataToSend = {
            name: "Point Name", // Dynamic value
            status: "Active", // Dynamic value
            geo_data: feature.geometry
          };
          break;
        default:
          console.error('Unsupported feature type:', feature.geometry.type);
          return;
      }

      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(dataToSend),
      })
        .then(response => response.json())
        .then(data => {
          console.log(`${feature.geometry.type} data saved:`, data);
        })
        .catch(error => console.error(`Error saving ${feature.geometry.type} data:`, error));
    });
  };


  const fetchProjects = () => {
    fetch(API_URLS.PROJECTS, {
      method: 'GET',
      headers: new Headers({
        'Authorization': `Bearer ${accessToken}`,
      }),
    })
      .then(response => response.json())
      .then(data => setProjects(data))
      .catch(error => console.error('Error fetching projects:', error));
  };

  // State for storing GeoJSON data
  const [geoJsonData, setGeoJsonData] = useState(null);



  const viewProjectDetails = (projectId) => {
    // Fetch the details of the selected project along with its GIS data
    fetch(`${API_URLS.PROJECT_DETAIL}${projectId}/`, {
      method: 'GET',
      headers: new Headers({
        'Authorization': `Bearer ${accessToken}`,
      }),
    })
      .then(response => response.json())
      .then(data => {
          console.log('Project details:', data);
        // Check if polygon_data, line_data, and point_data have the 'features' property
        const polygonFeatures = data.polygon_data && data.polygon_data.features ? data.polygon_data.features : [];
        const lineFeatures = data.line_data && data.line_data.features ? data.line_data.features : [];
        const pointFeatures = data.point_data && data.point_data.features ? data.point_data.features : [];

        // Update the data object with the features property
        const updatedData = {
          ...data,
          polygon_data: polygonFeatures,
          line_data: lineFeatures,
          point_data: pointFeatures,
      };
        setSelectedProject(updatedData);

        // Assuming your project data includes fields for polygon_data, line_data, and point_data
        const processedGeoJsonData = {
          type: 'FeatureCollection',
          features: [
            ...data.polygon_data.map(polygon => ({
              type: 'Feature',
              geometry: polygon.geo_data,
              properties: { ...polygon, type: 'Polygon' }
            })),
            ...data.line_data.map(line => ({
              type: 'Feature',
              geometry: line.geo_data,
              properties: { ...line, type: 'LineString' }
            })),
            ...data.point_data.map(point => ({
              type: 'Feature',
              geometry: point.geo_data,
              properties: { ...point, type: 'Point' }
            })),
          ],
        };
        // Set the geoJsonData in the Map component
        setGeoJsonData(processedGeoJsonData);
      })
      .catch(error => console.error('Error fetching project details:', error));
  };


  const handleProjectCreate = (event) => {
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
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(newProject),
    })
      .then(response => response.json())
      .then(() => {
        fetchProjects(); // Re-fetch all projects to update the list
        setShowForm(false); // Hide the form after successful project creation
        console.log('Project created successfully');
      })
      .catch(error => {
        console.error('Error creating project:', error);
        // Optionally, handle form visibility based on error response
      });
  };



  if (selectedProject) {
    // Display only the selected project
    return (
      <div className="project-details-container">
        <h2>{selectedProject.project_name}</h2>
        <p>{selectedProject.description}</p>
        {/* Display other details */}
        {/*<button onClick={() => setSelectedProject(null)}>Back to Projects</button>*/}
        <Map
          selectedProjectId={selectedProject.id}
          onSave={handleSaveMapData}
          geoJsonData={geoJsonData}
        />
      </div>
    );
  }

  return (
    <div className="project-container">
      <h1>Mina projekt</h1>
      <button className="toggle-form-button" onClick={toggleFormVisibility}>
        {showForm ? "Dölj formulär" : "Lägg till nytt projekt"}
      </button>

      {showForm && (
        <form className={`form-container ${showForm ? "visible" : ""}`} onSubmit={handleProjectCreate}>
          {/* Form fields and submit button */}
          <h2>Skapa nytt projekt</h2>
          <label htmlFor="project_name">Projektnamn:</label>
          <input type="text" id="project_name" name="project_name" required />

          <label htmlFor="description">Beskrivning:</label>
          <textarea id="description" name="description" required></textarea>

          <button type="submit">Skapa projekt!</button> <br /><br />
        </form>
      )}

      {[...projects].reverse().map(project => (
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
