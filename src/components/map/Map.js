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
            const featureGroup = featureGroupRef.current.leafletElement;
            featureGroup.clearLayers();
            L.geoJSON(geoJsonData, {
                onEachFeature: (feature, layer) => featureGroup.addLayer(layer)
            });
        }
    }, [geoJsonData]);

    
        /*
        const addGeoJsonLayers = () => {
            if (geoJsonData && featureGroupRef.current) {
                const featureGroup = featureGroupRef.current.leafletElement;
                if (featureGroup) {
                    featureGroup.clearLayers();
                    L.geoJSON(geoJsonData).eachLayer(layer => featureGroup.addLayer(layer));
                }
            }
        };

        if (!featureGroupRef.current) {
            const intervalId = setInterval(() => {
                if (featureGroupRef.current) {
                    clearInterval(intervalId);
                    addGeoJsonLayers();
                }
            }, 100);
        } else {
            addGeoJsonLayers();
        }
    }, [geoJsonData]);
    */

    // Function to handle when a new layer is added to the map
    const onLayerAdd = () => {
        if (geoJsonData && featureGroupRef.current) {
            const featureGroup = featureGroupRef.current.leafletElement;
            if (featureGroup) {
                featureGroup.clearLayers();
                // Create a new GeoJSON layer and add it to the FeatureGroup
                L.geoJSON(geoJsonData).eachLayer(layer => featureGroup.addLayer(layer));
            }
        }
    };



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
 /*   
    const updateGeoJson = () => {
        if (featureGroupRef.current) {
            const drawnItems = featureGroupRef.current.toGeoJSON();
            setCurrentGeoJsonData(drawnItems);
        }
    };
*/

const updateGeoJson = () => {
    if (featureGroupRef.current) {
        const updatedGeoJson = featureGroupRef.current.leafletElement.toGeoJSON();
        setCurrentGeoJsonData(updatedGeoJson);
    }
};

    // Functions to handle create, edit, and delete events
    const onCreate = () => updateGeoJson();
    const onEdited = () => updateGeoJson();
    const onDeleted = () => updateGeoJson();

    // Function to handle when FeatureGroup is mounted
    const onMounted = () => {
        if (geoJsonData && featureGroupRef.current) {
            const featureGroup = featureGroupRef.current.leafletElement;
            if (featureGroup) {
                featureGroup.clearLayers();
                // Create a new GeoJSON layer and add it to the FeatureGroup
                L.geoJSON(geoJsonData).eachLayer(layer => featureGroup.addLayer(layer));
            }
        }
    };

    // Render the Map component
    return (
        <div>
            <h3>Projektkarta</h3>
            <button className="toggle-form-button" onClick={handleSave}>Spara ritning</button>
            <span className="save-status">{saveStatus}</span>
            <MapContainer center={position} zoom={zoom} style={{ height: '100vh', width: '100%' }} onlayeradd={onLayerAdd}>
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
                        onMounted={onMounted}
                        draw={{ rectangle: false }}
                    />
                    {geoJsonData && <GeoJSON
                        data={geoJsonData}
                        onEachFeature={(feature, layer) => {
                            if (featureGroupRef.current) {
                                const featureGroup = featureGroupRef.current.leafletElement;
                                if (featureGroup) {
                                    featureGroup.addLayer(layer);
                                }
                            }
                        }}
                    />}
                </FeatureGroup>
            </MapContainer>
        </div>
    );
};

// Export the Map component
export default Map;