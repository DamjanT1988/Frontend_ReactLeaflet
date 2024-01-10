// Import necessary modules and components
import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, LayersControl, FeatureGroup, GeoJSON } from 'react-leaflet';
import { EditControl } from "react-leaflet-draw";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

// Destructure BaseLayer from LayersControl
const { BaseLayer } = LayersControl;

// Define the Map component
const Map = ({ selectedProjectId, onSave, geoJsonData }) => {
    // State for current GeoJSON data
    const [currentGeoJsonData, setCurrentGeoJsonData] = useState(null);
    // Reference to the FeatureGroup
    const featureGroupRef = useRef(null);
    // State for save status message
    const [saveStatus, setSaveStatus] = useState('');

    // Initial map position and zoom level
    const position = [51.505, -0.09];
    const zoom = 13;

    // Effect hook to handle received GeoJSON data
    useEffect(() => {
        if (geoJsonData && featureGroupRef.current) {
            const featureGroup = featureGroupRef.current;
            featureGroup.clearLayers();
            // Convert GeoJSON data to Leaflet layers and add them to the FeatureGroup
            L.geoJSON(geoJsonData, {
                onEachFeature: (feature, layer) => featureGroup.addLayer(layer)
            });
        }
    }, [geoJsonData]);

    // Function to handle save operation
    const handleSave = () => {
        if (currentGeoJsonData && selectedProjectId) {
            setSaveStatus('Saving...');
            onSave(currentGeoJsonData)
              .then(() => setSaveStatus('Data saved successfully!'))
              .catch(() => setSaveStatus('Error saving data'));
        } else {
            setSaveStatus('No data to save');
        }
    }

    // Function to update GeoJSON data
    const updateGeoJson = () => {
        if (featureGroupRef.current) {
            const drawnItems = featureGroupRef.current.toGeoJSON();
            setCurrentGeoJsonData(drawnItems);
        }
    };

    // Functions to handle create, edit, and delete events
    const onCreate = () => updateGeoJson();
    const onEdited = () => updateGeoJson();
    const onDeleted = () => updateGeoJson();

    // Render the Map component
    return (
        <div>
            <button className="toggle-form-button" onClick={handleSave}>Spara ritning</button>
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
                {geoJsonData && <GeoJSON data={geoJsonData} />}
            </MapContainer>
        </div>
    );
};

// Export the Map component
export default Map;