import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, LayersControl, FeatureGroup, GeoJSON } from 'react-leaflet';
import { EditControl } from "react-leaflet-draw";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

const { BaseLayer } = LayersControl;

const Map = ({ selectedProjectId, onSave, geoJsonData }) => {
    const [currentGeoJsonData, setCurrentGeoJsonData] = useState(null); // Corrected state declaration
    //const [localGeoJsonData, setLocalGeoJsonData] = useState(null); // Changed line
    const featureGroupRef = useRef(null); // Reference to the FeatureGroup

    const position = [51.505, -0.09];
    const zoom = 13;

    useEffect(() => {
        if (geoJsonData && featureGroupRef.current) {
            featureGroupRef.current.clearLayers(); // Clear existing layers
            L.geoJSON(geoJsonData).addTo(featureGroupRef.current); // Add new layers
        }
    }, [geoJsonData]);

    const handleSave = () => {
        if (currentGeoJsonData && selectedProjectId) {
            onSave(currentGeoJsonData); // Using updated state
        } else {
            console.error("No GeoJSON data or selected project ID.");
        }
    }


    const updateGeoJson = () => {
        if (featureGroupRef.current) {
            const drawnItems = featureGroupRef.current.toGeoJSON();
            console.log("Updated GeoJSON Data:", drawnItems);

            setCurrentGeoJsonData(drawnItems); // Update state with the new GeoJSON data
        }
    };

    /*
        const updateGeoJson = () => {
            if (featureGroupRef.current) {
                const drawnItems = featureGroupRef.current.toGeoJSON();
                console.log("Updated GeoJSON Data:", drawnItems);
                setLocalGeoJsonData(drawnItems); // Changed line
            }
        };
    */

    const onCreate = (e) => {
        updateGeoJson();
    };

    const onEdited = (e) => {
        updateGeoJson();
    };

    const onDeleted = (e) => {
        updateGeoJson();
    };

    return (
        <div>
            <button onClick={handleSave}>Spara ritning</button>
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

export default Map;
