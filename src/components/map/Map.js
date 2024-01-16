// Import necessary modules and components
import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, LayersControl, FeatureGroup, GeoJSON } from 'react-leaflet';
import { EditControl, drawControl } from "react-leaflet-draw";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

// Destructure BaseLayer from LayersControl
const { BaseLayer } = LayersControl;

// Define the Map component
const Map = ({ selectedProjectId, onSave, userID, /*geoJsonData*/ }) => {
    // Reference to the FeatureGroup
    const featureGroupRef = useRef(null);
    // State for save status message
    //const [saveStatus, setSaveStatus] = useState('');

    // Initial map position and zoom level
    const position = [51.505, -0.09];
    const zoom = 13;

    const [geoJsonData, setGeoJsonData] = useState(null);
  
    useEffect(() => {
    
        if (featureGroupRef.current) {
          featureGroupRef.current.clearLayers(); // Clear existing layers first
          L.geoJSON(geoJsonData).eachLayer(layer => featureGroupRef.current.addLayer(layer)); // Re-add layers
        }
  
        if (featureGroupRef.current && geoJsonData) {
          featureGroupRef.current.clearLayers();
          geoJsonData.features.forEach(feature => {
            if (feature.properties.isCircle) {
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
      // Dependency array is empty, meaning it will run once on mount
  
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
      
          setGeoJsonData(geoJson);
        }
      };
      
      // Whenever you load or update the map with geoJsonData:
      useEffect(() => {
        
      }, [geoJsonData]);
      
  
    const onCreate = (e) => {
        updateGeoJson(); // Update GeoJSON when new shape is created
    };
  
    const onEdited = (e) => {
        updateGeoJson(); // Update GeoJSON when shapes are edited
    };
  
    const onDeleted = (e) => {
        updateGeoJson(); // Update GeoJSON when shapes are deleted
    };
  
    const onFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (data && featureGroupRef.current) {
                        featureGroupRef.current.clearLayers(); // Clear existing layers
                        const layers = L.geoJSON(data); // Create new layers from GeoJSON
                        layers.eachLayer(layer => featureGroupRef.current.addLayer(layer)); // Add new layers to feature group
                        updateGeoJson(); // Update GeoJSON with newly added layers
                    }
                } catch (error) {
                    console.error("Error reading GeoJSON: ", error);
                }
            };
            reader.readAsText(file);
        }
    };
  
    const downloadGeoJson = () => {
        if (geoJsonData) {
            const blob = new Blob([JSON.stringify(geoJsonData)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'map-data.geojson';
            link.click();
        } else {
            console.error("No GeoJSON data to save.");
        }
    };
  
    return (
        <div>
        <h3>Projektkarta</h3>
            <input type="file" onChange={onFileChange} accept=".geojson,application/json" />
            <button onClick={downloadGeoJson}>Spara ritning</button>
            <MapContainer center={position} zoom={zoom} style={{ height: '100vh', width: '100%' }}>
                <LayersControl position="topright">
                    <BaseLayer checked name="OpenStreetMap">
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
                    </BaseLayer>
                    <BaseLayer name="Esri WorldImagery">
                        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"/>
                    </BaseLayer>
                </LayersControl>
                <FeatureGroup ref={featureGroupRef}>
                    <EditControl
                        position="topright"
                        onCreated={onCreate}
                        onEdited={onEdited}
                        onDeleted={onDeleted}
                        draw={{ rectangle: false  }}
                    />
                </FeatureGroup>
            </MapContainer>
        </div>
    );
  };
// Export the Map component
export default Map;