// Import necessary modules and components
import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, LayersControl, FeatureGroup, GeoJSON } from 'react-leaflet';
import { EditControl, drawControl } from "react-leaflet-draw";
import { API_URLS } from '../../constants/APIURLS'; // Import the API_URLS constant
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

// Destructure BaseLayer from LayersControl
const { BaseLayer } = LayersControl;

// Direct manipulation for Swedish localization
L.drawLocal.draw.toolbar.buttons = {
  polyline: 'Rita en polylinje',
  polygon: 'Rita en polygon',
  rectangle: 'Rita en rektangel',
  circle: 'Rita en cirkel',
  marker: 'Placera en markör',
  circlemarker: 'Placera en cirkelmarkör',
};
L.drawLocal.draw.toolbar.actions = {
  title: 'Avbryt ritning',
  text: 'Avbryt',
};
L.drawLocal.draw.toolbar.finish = {
  title: 'Avsluta ritning',
  text: 'Avsluta',
};
L.drawLocal.draw.toolbar.undo = {
  title: 'Ta bort sista punkten',
  text: 'Ta bort sista punkten',
};
L.drawLocal.draw.handlers.circle.tooltip = {
  start: 'Klicka och dra för att rita en cirkel.',
};
L.drawLocal.draw.handlers.circlemarker.tooltip = {
  start: 'Klicka på kartan för att placera en cirkelmarkör.',
};
L.drawLocal.draw.handlers.marker.tooltip = {
  start: 'Klicka på kartan för att placera en markör.',
};
L.drawLocal.draw.handlers.polygon.tooltip = {
  start: 'Klicka för att börja rita en figur.',
  cont: 'Klicka för att fortsätta rita figuren.',
  end: 'Klicka på första punkten för att avsluta denna figur.',
};
L.drawLocal.draw.handlers.polyline.tooltip = {
  start: 'Klicka för att börja rita en linje.',
  cont: 'Klicka för att fortsätta rita linjen.',
  end: 'Klicka på sista punkten för att avsluta linjen.',
};
L.drawLocal.draw.handlers.rectangle.tooltip = {
  start: 'Klicka och dra för att rita en rektangel.',
};

L.drawLocal.edit.toolbar.actions.save = {
  title: 'Spara ändringar',
  text: 'Spara',
};
L.drawLocal.edit.toolbar.actions.cancel = {
  title: 'Avbryt redigering, kasta alla ändringar',
  text: 'Avbryt',
};
L.drawLocal.edit.toolbar.actions.clearAll = {
  title: 'Rensa alla lager',
  text: 'Rensa alla',
};
L.drawLocal.edit.toolbar.buttons.edit = 'Redigera lager';
L.drawLocal.edit.toolbar.buttons.editDisabled = 'Inga lager att redigera';
L.drawLocal.edit.toolbar.buttons.remove = 'Ta bort lager';
L.drawLocal.edit.toolbar.buttons.removeDisabled = 'Inga lager att ta bort';
L.drawLocal.edit.handlers.edit.tooltip = {
  text: 'Dra handtag eller markörer för att redigera funktioner.',
  subtext: 'Klicka på avbryt för att ångra ändringar.',
};
L.drawLocal.edit.handlers.remove.tooltip = {
  text: 'Klicka på en funktion för att ta bort',
};

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
      if (geoJsonData) {
        L.geoJSON(geoJsonData, {
          onEachFeature: (feature, layer) => {
            if (feature.properties && feature.properties.isCircle) {
              // If the feature is a circle, recreate it
              const center = L.latLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]);
              const circle = L.circle(center, { radius: feature.properties.radius });
              circle.addTo(featureGroupRef.current);
            } else {
              // Add other shapes directly
              layer.addTo(featureGroupRef.current);
            }
          }
        });
      }
    }
  }, [geoJsonData]);

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
          <BaseLayer checked name="Informationskarta">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          </BaseLayer>
          <BaseLayer name="Satellitkarta">
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