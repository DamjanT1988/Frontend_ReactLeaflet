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
    description: '',
    reason: '',
    mapping_area_description: '',
    ordering_organization_name: '', // Updated to include 'name'
    ordering_organization_number: '', // New field for organization number
    executing_organization_name: '', // Updated to include 'name'
    executing_organization_number: '', // New field for organization number
    object_version: '',
    project_identity: '',
    period_start: '',
    period_end: '',
    version_start: '',
    version_end: '',
  });
  const [searchTerm, setSearchTerm] = useState(''); // State for search term
  const [sortOrder, setSortOrder] = useState('desc'); // State for sort order ('asc' or 'desc')

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

  // Function to handle the search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  // Function to toggle the sort order
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  // Filter and sort projects
  const filteredProjects = projects
    .filter(project => project.project_name.toLowerCase().includes(searchTerm))
    .sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.id - b.id; // Ascending order
      } else {
        return b.id - a.id; // Descending order
      }
    });


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

        setShowForm(false); // Hide the form
      })
      .catch(error => console.error('Error fetching project details:', error)); // Log any errors
  };

  // Function to handle the creation of a project
  const handleProjectCreate = (event) => {
    event.preventDefault(); // Prevent the default form submission behavior
    const formData = new FormData(event.target); // Create a FormData object from the form
    const newProject = {
      project_name: formData.get('project_name'),
      description: formData.get('description'),
      reason: formData.get('reason'),
      mapping_area_description: formData.get('mappingAreaDescription'),
      ordering_organization_name: formData.get('orderingOrganizationName'),
      ordering_organization_number: formData.get('orderingOrganizationNumber'),
      object_identity: formData.get('objectIdentity'),
      object_version: formData.get('objectVersion'),
      project_identity: formData.get('projectIdentity'),
      executing_organization_name: formData.get('executingOrganizationName'),
      executing_organization_number: formData.get('executingOrganizationNumber'),
      period_start: formData.get('periodStart'),
      period_end: formData.get('periodEnd'),
      version_start: formData.get('versionStart'),
      version_end: formData.get('versionEnd')
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
      reason: editedProject.reason,
      mapping_area_description: editedProject.mapping_area_description,
      ordering_organization_name: editedProject.ordering_organization_name,
      ordering_organization_number: editedProject.ordering_organization_number,
      object_version: editedProject.object_version,
      project_identity: editedProject.project_identity,
      executing_organization_name: editedProject.executing_organization_name,
      executing_organization_number: editedProject.executing_organization_number,
      valid_from: editedProject.valid_from,
      valid_to: editedProject.valid_to,
      period_start: editedProject.period_start,
      period_end: editedProject.period_end
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
        description: selectedProject.description,
        reason: selectedProject.reason,
        mapping_area_description: selectedProject.mapping_area_description,
        ordering_organization_name: selectedProject.ordering_organization_name,
        ordering_organization_number: selectedProject.ordering_organization_number,
        object_version: selectedProject.object_version,
        project_identity: selectedProject.project_identity,
        executing_organization_name: selectedProject.executing_organization_name,
        executing_organization_number: selectedProject.executing_organization_number,
        version_start: selectedProject.version_start,
        version_end: selectedProject.version_end,
        period_start: selectedProject.period_start,
        period_end: selectedProject.period_end
      });
    }
  };
  

  // Call this function when the "Edit" button is clicked


  if (selectedProject) {
    return (
      <div>
        <div className="project-details-container">
            <h1>Projekt</h1>
            <button className="project-back" onClick={() => setSelectedProject(null)}>Tillbaka till projektlista!</button>
            <button className="project-back" onClick={toggleEditMode}>
                {isEditMode ? "Avbryt" : "Redigera information!"}
            </button>
            {isEditMode && <button className="project-back" onClick={updateProjectInfo}>Spara ändringar</button>}

            {isEditMode ? (
                <>
                    {/* Input fields for editable project information */}
                    <label>Projektnamn:</label>
                    <input type="text" className="editable-field" value={editedProject.project_name} onChange={(e) => setEditedProject({ ...editedProject, project_name: e.target.value })} />

                    <label>Projektidentitet:</label>
                    <input type="text" className="editable-field" value={editedProject.project_identity} onChange={(e) => setEditedProject({ ...editedProject, project_identity: e.target.value })} />

                    <label>Objektversion:</label>
                    <input type="number" className="editable-field" value={editedProject.object_version} onChange={(e) => setEditedProject({ ...editedProject, object_version: e.target.value })} />

                    <label>Beskrivning och anteckningar:</label>
                    <textarea className="project-textarea" value={editedProject.description} onChange={(e) => setEditedProject({ ...editedProject, description: e.target.value })} />

                    <label>Anledning:</label>
                    <input type="text" className="editable-field" value={editedProject.reason} onChange={(e) => setEditedProject({ ...editedProject, reason: e.target.value })} />

                    <label>Kartläggningsområdesbeskrivning:</label>
                    <textarea className="project-textarea" value={editedProject.mapping_area_description} onChange={(e) => setEditedProject({ ...editedProject, mapping_area_description: e.target.value })} />

                    <label>Beställande organisation namn:</label>
                    <input type="text" className="editable-field" value={editedProject.ordering_organization_name} onChange={(e) => setEditedProject({ ...editedProject, ordering_organization_name: e.target.value })} />

                    <label>Beställande organisation nummer:</label>
                    <input type="text" className="editable-field" value={editedProject.ordering_organization_number} onChange={(e) => setEditedProject({ ...editedProject, ordering_organization_number: e.target.value })} />

                    <label>Utförande organisation namn:</label>
                    <input type="text" className="editable-field" value={editedProject.executing_organization_name} onChange={(e) => setEditedProject({ ...editedProject, executing_organization_name: e.target.value })} />

                    <label>Utförande organisation nummer:</label>
                    <input type="text" className="editable-field" value={editedProject.executing_organization_number} onChange={(e) => setEditedProject({ ...editedProject, executing_organization_number: e.target.value })} />

                    <label>Projektperiod Start:</label>
                    <input type="date" className="editable-field" value={editedProject.period_start} onChange={(e) => setEditedProject({ ...editedProject, period_start: e.target.value })} />

                    <label>Projektperiod Slut:</label>
                    <input type="date" className="editable-field" value={editedProject.period_end} onChange={(e) => setEditedProject({ ...editedProject, period_end: e.target.value })} />

                    <label>Versionsgiltighetsperiod Start:</label>
                    <input type="date" className="editable-field" value={editedProject.version_start} onChange={(e) => setEditedProject({ ...editedProject, version_start: e.target.value })} />

                    <label>Versionsgiltighetsperiod Slut:</label>
                    <input type="date" className="editable-field" value={editedProject.version_end} onChange={(e) => setEditedProject({ ...editedProject, version_end: e.target.value })} />
                </>
            ) : (
                <>
                    {/* Displaying project information in read-only mode */}
                    <p><strong>Projektnamn:</strong> {selectedProject.project_name}</p>
                    <p><strong>Projektidentitet:</strong> {selectedProject.project_identity}</p>
                    <p><strong>Objektversion:</strong> {selectedProject.object_version}</p>
                    <p><strong>Projektbeskrivning:</strong></p><textarea readOnly className="project-textarea" value={selectedProject.description} />
                    <p><strong>Anledning:</strong> {selectedProject.reason}</p>
                    <p><strong>Kartläggningsområdesbeskrivning:</strong></p><textarea readOnly className="project-textarea" value={selectedProject.mapping_area_description} />
                    <p><strong>Beställande organisation namn:</strong> {selectedProject.ordering_organization_name}</p>
                    <p><strong>Beställande organisation nummer:</strong> {selectedProject.ordering_organization_number}</p>
                    <p><strong>Utförande organisation namn:</strong> {selectedProject.executing_organization_name}</p>
                    <p><strong>Utförande organisation nummer:</strong> {selectedProject.executing_organization_number}</p>
                    <p><strong>Projektperiod Start:</strong> {selectedProject.period_start}</p>
                    <p><strong>Projektperiod Slut:</strong> {selectedProject.period_end}</p>
                    <p><strong>Versionsgiltighetsperiod Start:</strong> {selectedProject.version_start}</p>
                    <p><strong>Versionsgiltighetsperiod Slut:</strong> {selectedProject.version_end}</p>
                </>
        )}

      </div>
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

          <label htmlFor="projectIdentity">Projektidentitet:</label>
          <input type="text" id="projectIdentity" name="projectIdentity" required />

          <label htmlFor="description">Projektbeskrivning:</label>
          <textarea id="description" name="description" required></textarea>

          {/* New fields for specified attributes */}
          <label htmlFor="reason">Anledning:</label>
          <input type="text" id="reason" name="reason" />

          <label htmlFor="mappingAreaDescription">Beskrivning av kartläggningsområde:</label>
          <textarea id="mappingAreaDescription" name="mappingAreaDescription"></textarea>

          <label htmlFor="orderingOrganizationName">Beställande organisation namn:</label>
          <input type="text" id="orderingOrganizationName" name="orderingOrganizationName" required />

          <label htmlFor="orderingOrganizationNumber">Beställande organisation nummer:</label>
          <input type="text" id="orderingOrganizationNumber" name="orderingOrganizationNumber" required />

          <label htmlFor="executingOrganizationName">Utförande organisation namn:</label>
          <input type="text" id="executingOrganizationName" name="executingOrganizationName" required />
          
          <label htmlFor="executingOrganizationNumber">Utförande organisation nummer:</label>
          <input type="text" id="executingOrganizationNumber" name="executingOrganizationNumber" required />

          <label htmlFor="objectVersion">Objektversion:</label>
          <input type="number" id="objectVersion" name="objectVersion" />

          <label htmlFor="periodStart">Projektperiod Start:</label>
          <input type="date" id="periodStart" name="periodStart" required />

          <label htmlFor="periodEnd">Projektperiod Slut:</label>
          <input type="date" id="periodEnd" name="periodEnd" required />

          <label htmlFor="versionStart">Versionsgiltighetsperiod Start:</label>
          <input type="date" id="versionStart" name="versionStart" required />

          <label htmlFor="versionEnd">Versionsgiltighetsperiod Slut:</label>
          <input type="date" id="versionEnd" name="versionEnd" required />

          <button className="toggle-form-button" type="submit">Skapa projekt!</button>
        </form>
      )
      }

      <div className="project-controls">
        <input
          type="text"
          placeholder="Sök projekt..."
          onChange={handleSearchChange}
        />
        <button onClick={toggleSortOrder}>
          Sortera: {sortOrder === 'asc' ? 'äldst' : 'senaste'}
        </button>
      </div>

      {
        filteredProjects.map(project => (
          <div key={project.id} className='project'>
            <h2>{project.project_name} - #{project.id}</h2>
            <p>{project.description}</p>
            <button className="toggle-form-button" onClick={() => viewProjectDetails(project.id)}>Välj projekt!</button>
          </div>
        ))
      }

    </div >
  );
};

export default ProjectView;
