import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Polyline, LayersControl, FeatureGroup, GeoJSON } from 'react-leaflet';
import { EditControl } from "react-leaflet-draw";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';


const { BaseLayer } = LayersControl;

const MyMap = () => {
    const [geoJsonData, setGeoJsonData] = useState(null); // State to hold GeoJSON data
    const [featureGroupRef, setFeatureGroupRef] = useState(null); // Ref for the feature group    
    const [markers, setMarkers] = useState([]); // Array of marker positions
    const [lines, setLines] = useState([]); // Array of arrays of polyline positions
    const [polygons, setPolygons] = useState([]); // Array of arrays of polygon positions

    const position = [51.505, -0.09]; // Change to your preferred initial position
    const zoom = 13; // Initial zoom level

    const updateGeoJson = () => {
        if (featureGroupRef.current) {
            const featureGroup = featureGroupRef.current.leafletElement; // Get the Leaflet FeatureGroup
            if (featureGroup && featureGroup.toGeoJSON) {
                const drawnItems = featureGroup.toGeoJSON();
                setGeoJsonData(drawnItems); // Update your state with the new GeoJSON
            }
        }
    };
    
    const onCreate = (e) => {
        const { layerType, layer } = e;
        const featureGroup = e.target; // Get the feature group (contains all layers)'
        updateGeoJson(); 
        updateGeoJson(featureGroup); // Convert to GeoJSON and update state
        updateGeoJson(featureGroupRef.leafletElement); // Convert to GeoJSON and update state

        if (layerType === "marker") {
            const { lat, lng } = layer.getLatLng();
            setMarkers((prevMarkers) => [...prevMarkers, [lat, lng]]);
        } else if (layerType === "polyline") {
            setLines((prevLines) => [...prevLines, layer.getLatLngs()]);
        } else if (layerType === "polygon") {
            setPolygons((prevPolygons) => [...prevPolygons, layer.getLatLngs()]);
        }
        // Handle other types as necessary
    };

    const onEdited = (e) => {
        const { layers: { _layers } } = e;
        const featureGroup = e.target; // Get the feature group (contains all layers)
        updateGeoJson(featureGroup); // Update the GeoJSON with edited shapes
        updateGeoJson(featureGroupRef.leafletElement); // Update the GeoJSON with edited shapes

        // Update lines and polygons accordingly
        Object.values(_layers).forEach((layer) => {
            // Check the type and update state as needed
            if (layer instanceof L.Marker) {
                // Update a specific marker
                // You might need to find which marker was edited and update its position
            } else if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
                // Update a specific line
                // Find the line in your state and replace with the updated positions
            } else if (layer instanceof L.Polygon) {
                // Update a specific polygon
                // Find the polygon in your state and replace with the updated positions
            }
        });
    };

    const onDeleted = (e) => {
        const { layers: { _layers } } = e;
        const featureGroup = e.target; // Get the feature group (contains all layers)
        updateGeoJson(featureGroup); // Update the GeoJSON with the remaining shapes
        updateGeoJson(featureGroupRef.leafletElement); // Update the GeoJSON with the remaining shapes

        Object.values(_layers).forEach((layer) => {
            if (layer instanceof L.Marker) {
                // Remove the marker from state
                const { lat, lng } = layer.getLatLng();
                setMarkers((prevMarkers) => prevMarkers.filter(marker => marker[0] !== lat && marker[1] !== lng));
            } else if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
                // Remove the line from state
                // Find and remove the line that matches the one deleted
            } else if (layer instanceof L.Polygon) {
                // Remove the polygon from state
                // Find and remove the polygon that matches the one deleted
            }
        });
    };

    useEffect(() => {
        if (featureGroupRef.current) {
            // Additional initialization if needed
        }
    }, [featureGroupRef]);
    

    {
        markers.map((position, idx) => (
            <Marker key={`marker-${idx}`} position={position}>
                <Popup>Marker at {position}</Popup>
            </Marker>
        ))
    }

    {
        lines.map((line, idx) => <Polyline key={`line-${idx}`} positions={line} />)
    }

    {
        polygons.map((polygon, idx) => <Polygon key={`polygon-${idx}`} positions={polygon} />)
    }


    return (

        <MapContainer center={position} zoom={zoom} style={{ height: '100vh', width: '100%' }}>
            <LayersControl position="topright">
                <BaseLayer checked name="OpenStreetMap">
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <FeatureGroup ref={(fg) => { if(fg) { setFeatureGroupRef(fg); } }}>
                        <EditControl
                            position="topright"
                            onCreated={onCreate}
                            onEdited={onEdited}
                            onDeleted={onDeleted}
                            draw={{
                                rectangle: false,  // Disables drawing rectangles
                                // Customize other draw options as per your requirement
                            }}
                        />
                    </FeatureGroup>
                    {geoJsonData && <GeoJSON data={geoJsonData} />}
            {/* ... other base layers ... */}
                </BaseLayer>
                <BaseLayer name="Esri WorldImagery">
                    <TileLayer
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                    />
                </BaseLayer>
            </LayersControl>
        </MapContainer>
    );
};

export default MyMap;

