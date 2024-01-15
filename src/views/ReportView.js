import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, LayersControl, GeoJSON, FeatureGroup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

const { BaseLayer } = LayersControl;

const ReportView = () => {
  const [geoJsonData, setGeoJsonData] = useState(null);

  // Include the polygon in the initial state
  const initialGeoJsonData = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [[
          [18.423, 59.331], // [longitude, latitude]
          [18.424, 59.332],
          [18.422, 59.333],
          [18.423, 59.331]]]
        }
      }
    ]
  };

//  const [currentGeoJsonData, setCurrentGeoJsonData] = useState(initialGeoJsonData);

  const [currentGeoJsonData, setCurrentGeoJsonData] = useState({
    type: 'FeatureCollection',
    features: [],
  });
  const featureGroupRef = useRef(null);

  const position = [59.330850809743905, 18.423004150390625];
  const zoom = 15;

  
  // Define the polygon coordinates here (example coordinates provided)
  const polygonCoordinates = [
    [59.331, 18.423],
    [59.332, 18.424],
    [59.333, 18.422],
    [59.331, 18.423] // The first and last coordinates should be the same
  ];

  // Add the polygon to the currentGeoJsonData on component mount
  useEffect(() => {
    const polygonFeature = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [polygonCoordinates]
      }
    };

    setCurrentGeoJsonData(prevData => ({
      ...prevData,
      features: [...prevData.features, polygonFeature]
    }));
  }, []);

  const updateGeoJson2 = () => {
    if (featureGroupRef.current && featureGroupRef.current.leafletElement) {
      const updatedGeoJson = featureGroupRef.current.leafletElement.toGeoJSON();
      setCurrentGeoJsonData(updatedGeoJson);
    }
  };


  const handleSave = () => {
    if (currentGeoJsonData && currentGeoJsonData.features.length > 0) {
      localStorage.setItem('reportGeoJson', JSON.stringify(currentGeoJsonData));
      alert('Data saved successfully!');
    } else {
      alert('No data to save');
    }
  };


  const loadGeoJsonFromStorage = () => {
    const storedData = localStorage.getItem('reportGeoJson');
    if (storedData) {
      const geoJsonData = JSON.parse(storedData);
      setCurrentGeoJsonData(geoJsonData);
      if (featureGroupRef.current) {
        featureGroupRef.current.clearLayers();
        L.geoJSON(geoJsonData).eachLayer(layer => featureGroupRef.current.addLayer(layer));
      }
    } else {
      alert('No saved data found');
    }
  };



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

  return (
    <div>
      <h3>Report View</h3>
      <button className="toggle-form-button" onClick={handleSave}>Save Data</button>
      <button className="toggle-form-button" onClick={loadGeoJsonFromStorage}>Load Saved Data</button>
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
            onCreated={updateGeoJson2}
            onEdited={updateGeoJson2}
            onDeleted={updateGeoJson2}
            draw={{ rectangle: false }}
          />
          {currentGeoJsonData && <GeoJSON data={currentGeoJsonData} />}
        </FeatureGroup>
      </MapContainer>
    </div>
  );
};

/*
  return (
    <div>
      <h3>Report View</h3>
      <input type="file" onChange={onFileChange} accept=".geojson,application/json" />
      <button className="toggle-form-button" onClick={downloadGeoJson}>Save Data</button>
      <button className="toggle-form-button" onClick={loadGeoJsonFromStorage}>Load Saved Data</button>
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
*/

export default ReportView;
