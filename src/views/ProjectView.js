// Import necessary modules and components
import React, { useState, useEffect } from 'react'; // Import React and the useState and useEffect hooks
import { useNavigate } from 'react-router-dom'; // Import the useNavigate hook from react-router-dom for navigation
import { API_URLS } from '../constants/APIURLS'; // Import the API_URLS constant
import './ProjectView.css'; // Import the CSS for this component
import Map from '../components/map/Map.js'; // Import the Map component
import Survey from '../components/survey/Survey.js'; // Import the Survey component
import { useParams } from 'react-router-dom';


/**
 * Represents the view for managing projects.
 * @returns {JSX.Element} The ProjectView component.
 */
const ProjectView = () => {
  // Define state variables
  const [projects, setProjects] = useState([]); // State for storing the list of projects
  const [selectedProject, setSelectedProject] = useState(null); // State for storing the selected project
  const navigate = useNavigate(); // Hook for navigation
  const accessToken = localStorage.getItem('accessToken'); // Get the access token from local storage
  const [showForm, setShowForm] = useState(false); // State for controlling the visibility of the form
  const toggleFormVisibility = () => setShowForm(!showForm); // Function to toggle the visibility of the form
  const { projectId } = useParams(); // Assuming the URL parameter is named 'projectId'
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedProject, setEditedProject] = useState({
    project_name: '',
    description: ''
  });


  useEffect(() => {
    if (projectId) {
      viewProjectDetails(projectId);
    }
  }, [projectId]);

  // Use effect hook to fetch projects if access token is available
  useEffect(() => {
    if (!accessToken) { // If there is no access token
      navigate('/login'); // Navigate to the login page
    } else { // If there is an access token
      fetchProjects(); // Fetch the projects
      navigate('/project');
    }
  }, [accessToken]); // Dependency array for the useEffect hook

  // Function to handle saving map data
  const handleSaveMapData = (geoJsonData) => {
    // Check if there is a selected project and GeoJSON data to save
    if (!selectedProject || !geoJsonData || !geoJsonData.features || geoJsonData.features.length === 0) {
      console.error("No GeoJSON data to save."); // Log an error message
      return Promise.reject("Ingen GeoJSON-data att spara."); // Reject the promise
    }

    // Map over the features in the GeoJSON data
    const savePromises = geoJsonData.features.map(feature => {
      let url; // Variable for the URL
      let dataToSend; // Variable for the data to send

      // Switch statement for handling different types of features
      switch (feature.geometry.type) {
        case 'Polygon': // If the feature is a polygon
          url = `${API_URLS.PROJECT_DETAIL}${selectedProject.id}/add_polygon/`; // Set the URL for adding a polygon
          dataToSend = { // Set the data to send
            name: "Polygon Name", // Name of the polygon
            status: "Active", // Status of the polygon
            geo_data: feature.geometry // Geometry data of the polygon
          };
          break;
        case 'LineString': // If the feature is a line string
          url = `${API_URLS.PROJECT_DETAIL}${selectedProject.id}/add_line/`; // Set the URL for adding a line string
          dataToSend = { // Set the data to send
            name: "Line Name", // Name of the line string
            status: "Active", // Status of the line string
            geo_data: feature.geometry // Geometry data of the line string
          };
          break;
        case 'Point': // If the feature is a point
          url = `${API_URLS.PROJECT_DETAIL}${selectedProject.id}/add_point/`; // Set the URL for adding a point
          dataToSend = { // Set the data to send
            name: "Point Name", // Name of the point
            status: "Active", // Status of the point
            geo_data: feature.geometry, // Geometry data of the point
            attributes: {} // Attributes of the point
          };
          break;
        default: // If the feature type is not supported
          console.error('Unsupported feature type:', feature.geometry.type); // Log an error message
          return; // Return from the function
      }

      // Fetch request to save the feature
      return fetch(url, {
        method: 'POST', // HTTP method
        headers: { // HTTP headers
          'Content-Type': 'application/json', // Content type header
          'Authorization': `Bearer ${accessToken}`, // Authorization header
        },
        body: JSON.stringify(dataToSend), // Body of the request
      }).then(response => response.json()); // Parse the response as JSON
    });

    // Wait for all save promises to resolve
    return Promise.all(savePromises)
      .then(data => {
        console.log("All features saved:", data); // Log the saved data
        return data; // Resolve the promise with the saved data
      })
      .catch(error => {
        console.error("Error saving features:", error); // Log the error
        return Promise.reject(error); // Reject the promise on error
      });
  };


  // Function to fetch projects from the API
  const fetchProjects = () => {
    // Fetch request to the projects API endpoint
    fetch(API_URLS.PROJECTS, {
      method: 'GET', // HTTP method
      headers: new Headers({
        'Authorization': `Bearer ${accessToken}`, // Authorization header
      }),
    })
      .then(response => response.json()) // Parse the response as JSON
      .then(data => setProjects(data)) // Set the projects state with the fetched data
      .catch(error => console.error('Error fetching projects:', error)); // Log any errors
  };

  // State for storing GeoJSON data
  const [geoJsonData, setGeoJsonData] = useState(null);

  // Function to view the details of a project
  const viewProjectDetails = (projectId) => {
    // Fetch request to the project detail API endpoint
    fetch(`${API_URLS.PROJECT_DETAIL}${projectId}/`, {
      method: 'GET', // HTTP method
      headers: new Headers({
        'Authorization': `Bearer ${accessToken}`, // Authorization header
      }),
    })
      .then(response => response.json()) // Parse the response as JSON
      .then(data => {
        setSelectedProject(data); // Set the selected project state with the fetched data

        // Process GeoJSON data for polygons, lines, and points
        const processedGeoJsonData = {
          type: 'FeatureCollection',
          features: [
            // Process polygon data
            ...(data.polygon_data.features || []).map(polygon => ({
              type: 'Feature',
              geometry: polygon.geometry,
              properties: { ...polygon.properties, type: 'Polygon' }
            })),
            // Process line data
            ...(data.line_data.features || []).map(line => ({
              type: 'Feature',
              geometry: line.geometry,
              properties: { ...line.properties, type: 'LineString' }
            })),
            // Process point data
            ...(data.point_data.features || []).map(point => ({
              type: 'Feature',
              geometry: point.geometry,
              properties: { ...point.properties, type: 'Point' }
            })),
          ],
        };

        // Set the geoJsonData state with the processed GeoJSON data
        setGeoJsonData(processedGeoJsonData);
        setShowForm(false); // Hide the form
      })
      .catch(error => console.error('Error fetching project details:', error)); // Log any errors
  };

  // Function to handle the creation of a project
  const handleProjectCreate = (event) => {
    event.preventDefault(); // Prevent the default form submission behavior
    const formData = new FormData(event.target); // Create a FormData object from the form
    const newProject = {
      project_name: formData.get('project_name'), // Get the project name from the form data
      description: formData.get('description'), // Get the description from the form data
      // Add other fields as necessary
    };

    // Fetch request to the projects API endpoint to create a new project
    fetch(API_URLS.PROJECTS, {
      method: 'POST', // HTTP method
      headers: {
        'Content-Type': 'application/json', // Content type header
        'Authorization': `Bearer ${accessToken}`, // Authorization header
      },
      body: JSON.stringify(newProject), // Body of the request
    })
      .then(response => response.json()) // Parse the response as JSON
      .then(() => {
        fetchProjects(); // Re-fetch all projects to update the list
        setShowForm(false); // Hide the form after successful project creation
        console.log('Project created successfully'); // Log a success message
      })
      .catch(error => {
        console.error('Error creating project:', error); // Log any errors
        // Optionally, handle form visibility based on error response
      });
  };

  const updateProjectInfo = () => {
    if (!selectedProject) {
      console.error("No project selected for updating.");
      return;
    }

    // URL for updating the project details
    const url = `${API_URLS.PROJECT_DETAIL}${selectedProject.id}/`;

    // Example data to update (modify as needed)
    const updatedData = {
        project_name: editedProject.project_name,
        description: editedProject.description,
      // ...add other fields that you want to update
    };

    // Fetch request to update the project details
    fetch(url, {
      method: 'PUT', // PUT method for updating
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(updatedData)
    })
      .then(response => response.json())
      .then(updatedProject => {
        console.log("Project updated successfully:", updatedProject);
        setSelectedProject(updatedProject); // Update the selected project state
        toggleEditMode(); // Toggle the edit mode
      })
      .catch(error => console.error('Error updating project:', error));
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
    if (!isEditMode) {
      setEditedProject({
        project_name: selectedProject.project_name,
        description: selectedProject.description
      });
    }
  };
  
  // Call this function when the "Edit" button is clicked
  

  if (selectedProject) {
    // Display only the selected project
    return (
      <div className="project-details-container">
        <h1>Projekt</h1>
        <button className="project-back" onClick={() => setSelectedProject(null)}>Tillbaka till projektlista!</button>
        <button className="project-back" onClick={toggleEditMode}>
        {isEditMode ? "Avbryt" : "Redigera projektinformation!"}
      </button>
      {isEditMode && <button className="project-back" onClick={updateProjectInfo}>Spara ändringar</button>}
        {/* PROJECT INFO. */}
        {isEditMode ? (
        <>
        <br />
          <input 
            type="text"
            className="editable-field"
            value={editedProject.project_name}
            onChange={(e) => setEditedProject({...editedProject, project_name: e.target.value})}
          />
          <br />
          <textarea
            className="editable-field"
            value={editedProject.description}
            onChange={(e) => setEditedProject({...editedProject, description: e.target.value})}
          />
        </>
      ) : (
        <>
          <h2>Projekt: {selectedProject.project_name}</h2>
          <p>{selectedProject.description}</p>
        </>
      )}

        {/* SURVEY */}
        <Survey />

        {/* MAP */}
        <Map
          selectedProjectId={selectedProject.id}
          onSave={handleSaveMapData}
          geoJsonData={geoJsonData}
          userID={selectedProject.user}
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

          <button className="toggle-form-button" type="submit">Skapa projekt!</button> <br /><br />
        </form>
      )}

      {[...projects].reverse().map(project => (
        <div key={project.id} className='project'>
          <h2>{project.project_name} - #{project.id}</h2>
          <p>{project.description}</p>
          <button className="toggle-form-button" onClick={() => viewProjectDetails(project.id)}>Välj projekt!</button>
        </div>
      ))}
    </div>
  );
};

export default ProjectView;
