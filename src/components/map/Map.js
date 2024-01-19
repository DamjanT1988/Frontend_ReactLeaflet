// Import necessary modules and components
import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, LayersControl, FeatureGroup, GeoJSON } from 'react-leaflet';
import { EditControl, drawControl } from "react-leaflet-draw";
import { API_URLS } from '../../constants/APIURLS'; // Import the API_URLS constant
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

// Destructure BaseLayer from LayersControl
const { BaseLayer } = LayersControl;

// Define the Map component
const Map = ({ selectedProjectId, onSave, userID, /*geoJsonData*/ }) => {
  const featureGroupRef = useRef(null);
  const position = [51.505, -0.09];
  const zoom = 13;
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');
  const accessToken = localStorage.getItem('accessToken'); // Get the access token from local storage

  useEffect(() => {
    if (featureGroupRef.current) {
      featureGroupRef.current.clearLayers(); // Clear existing layers first
      L.geoJSON(geoJsonData).eachLayer(layer => featureGroupRef.current.addLayer(layer)); // Re-add layers
    }
    if (featureGroupRef.current && geoJsonData) {
      featureGroupRef.current.clearLayers();
      geoJsonData.features.forEach(feature => {
        if (feature.properties && feature.properties.isCircle) {
          // Recreate circles
          const center = L.latLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]);
          const circle = L.circle(center, { radius: feature.properties.radius });
          circle.addTo(featureGroupRef.current);
        } else {
          // Handle other shapes normally
          L.geoJSON(feature).addTo(featureGroupRef.current);
        }
      });
    }
  }, [geoJsonData])

  // Function to save GeoJSON data to the server
  const saveDataToServer = async () => {
    try {
      setSaveStatus('Saving...');
      const response = await fetch(`${API_URLS.PROJECT_FILES_POST}/${userID}/${selectedProjectId}/file`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}` // Include the accessToken in the Authorization header
        },
        body: JSON.stringify(geoJsonData),
      });
      if (response.ok) {
        setSaveStatus('Data saved successfully!')
        console.log('Data saved successfully');
        console.log('geoJsonData: ', geoJsonData);
      } else {
        setSaveStatus('Error saving data')
        console.error('Failed to save data');
      }
    } catch (error) {
      setSaveStatus('No data to save');
      console.error('Error:', error);
    }
  };

  // Function to load data from the server
  const loadDataFromServer = async () => {
    try {
      const response = await fetch(`${API_URLS.PROJECT_FILES_GET}/${userID}/${selectedProjectId}/file`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}` // Include the accessToken in the Authorization header
        }
      });
      if (response.ok) {
        const data = await response.json();
        setGeoJsonData(data);
        console.log('data: ', data);
      } else {
        console.error('Failed to load data');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // useEffect hook to call loadDataFromServer on component mount
  useEffect(() => {
    loadDataFromServer();
  }, []);

  const updateGeoJson = () => {
    if (featureGroupRef.current) {
      const features = [];

      featureGroupRef.current.eachLayer(layer => {
        if (layer instanceof L.Circle) {
          const circleFeature = {
            type: 'Feature',
            properties: {
              isCircle: true,
              radius: layer.getRadius()
            },
            geometry: {
              type: 'Point',
              coordinates: [layer.getLatLng().lng, layer.getLatLng().lat]
            }
          };
          features.push(circleFeature);
        } else {
          // For other shapes, use the default toGeoJSON method
          const layerFeature = layer.toGeoJSON();
          features.push(layerFeature);
        }
      });

      const geoJson = {
        type: 'FeatureCollection',
        features: features
      };

      console.log('geojson: ', geoJson);
      setGeoJsonData(geoJson);
    }
  };

  const onCreate = (e) => {
    updateGeoJson(); // Update GeoJSON when new shape is created
  };

  const onEdited = (e) => {
    updateGeoJson(); // Update GeoJSON when shapes are edited
  };

  const onDeleted = (e) => {
    updateGeoJson(); // Update GeoJSON when shapes are deleted
  };

  return (
    <div>
      <h3>Projektkarta</h3>
      <button className="toggle-form-button" onClick={saveDataToServer}>Spara ritning!</button>
      <span className="save-status">{saveStatus}</span>
      <MapContainer center={position} zoom={zoom} style={{ height: '100vh', width: '100%' }}>
        <LayersControl position="topright">
          <BaseLayer checked name="OpenStreetMap">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          </BaseLayer>
          <BaseLayer name="Esri WorldImagery">
            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
          </BaseLayer>
        </LayersControl>
        <FeatureGroup ref={featureGroupRef}>
          <EditControl
            position="topright"
            onCreated={onCreate}
            onEdited={onEdited}
            onDeleted={onDeleted}
            draw={{ rectangle: false }}
          />
        </FeatureGroup>
      </MapContainer>
    </div>
  );
};
// Export the Map component
export default Map;