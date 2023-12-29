import React, { useState, useRef } from 'react';
import { MapContainer, TileLayer, LayersControl, FeatureGroup, GeoJSON } from 'react-leaflet';
import { EditControl } from "react-leaflet-draw";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

const { BaseLayer } = LayersControl;

const Map = () => {
    const [geoJsonData, setGeoJsonData] = useState(null);
    const featureGroupRef = useRef(null); // Using useRef to access the FeatureGroup

    const position = [51.505, -0.09];
    const zoom = 13;

    const updateGeoJson = () => {
        if (featureGroupRef.current) {
            const drawnItems = featureGroupRef.current.toGeoJSON();
            setGeoJsonData(drawnItems);
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
                        draw={{ rectangle: false }}
                    />
                </FeatureGroup>
                {geoJsonData && <GeoJSON data={geoJsonData} />}
            </MapContainer>
        </div>
    );
};

export default Map;
