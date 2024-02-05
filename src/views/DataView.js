// Import necessary modules and components
import React, { useState, useEffect } from 'react'; // Import React and the useState and useEffect hooks
import { useNavigate, useParams } from 'react-router-dom'; // Import the useNavigate hook from react-router-dom for navigation
import { API_URLS } from '../constants/APIURLS'; // Import the API_URLS constant
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import Map from '../components/map/Map';
import './DataView.css'; // Import the CSS for the DataView component



const DataView = () => {
  // Define state variables
  const [projects, setProjects] = useState([]); // State for storing the list of projects
  const [selectedProject, setSelectedProject] = useState(null); // State for storing the selected project
  const navigate = useNavigate(); // Hook for navigation
  const accessToken = localStorage.getItem('accessToken'); // Get the access token from local storage
  const [showForm, setShowForm] = useState(false); // State for controlling the visibility of the form
  const { projectId } = useParams(); // Assuming the URL parameter is named 'projectId'
  const [geoJsonData, setGeoJsonData] = useState(null);
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
      //viewProjectDetails(projectId);
      navigate('/data');
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


  const handleAttributeValueChange = (featureIndex, attributeName, newValue) => {
    const updatedGeoJsonData = { ...geoJsonData };
    updatedGeoJsonData.features[featureIndex].properties[attributeName] = newValue;
    setGeoJsonData(updatedGeoJsonData);
  };

    if (selectedProject) {
      return (

        <div className="dataView-container">
          <div className="top-bar">
            <div className="project-name">Project Name</div>
            <div className="top-bar-buttons">
              <button>Filter</button>
              <button>Rapport</button>
              <button>Export</button>
            </div>
            <div className="hamburger-menu">Menu</div>
          </div>

          <div className="content">
            <div className="left-window">
              <div className="buttons-section">
                <button>Kartläggning biologisk mångfald</button>
                <button>Naturvärdesbiologi</button>
                <button>Landskapsområden</button>
              </div>
              <div className="additional-section">
                Tillägg
                {/* Additional buttons can be added here */}
              </div>
              <div className="mapping-types-section">
                Utförda kartläggningstyper
                {/* More buttons can be added here */}
              </div>
            </div>

            <div className="middle-window">
              <div className="parent-one">
                <Map
                  selectedProjectId={selectedProject.id}
                  geoJsonData={geoJsonData}
                  userID={selectedProject.user}
                  shouldHide={true}
                />
              </div>
              <div className="attribute-table">
                <h3>Attribute Table</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Feature ID</th>
                      <th>Attribute</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {geoJsonData && geoJsonData.features.map((feature, featureIndex) => (
                      Object.entries(feature.properties).map(([attributeName, value], index) => (
                        <tr key={index}>
                          {index === 0 && <td rowSpan={Object.keys(feature.properties).length}>{feature.id}</td>}
                          <td>{attributeName}</td>
                          <td>
                            <input
                              type="text"
                              value={value}
                              onChange={(e) => handleAttributeValueChange(featureIndex, attributeName, e.target.value)}
                            />
                          </td>
                        </tr>
                      ))
                    ))}
                  </tbody>
                </table>
              </div>
            </div>


            <div className="right-window">
              <div className="project-info">Project Information</div>
              <div className="project-image">Project Image</div>
              <div className="edit-section">Redigera objekt</div>
            </div>

          </div>
        </div>
      );
    }


    return (

      <div className="project-container">
        <h1>Välj projekt för analys</h1>

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
      </div>
    )
  }




export default DataView;