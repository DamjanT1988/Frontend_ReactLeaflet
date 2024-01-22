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
  //const [cropCoordinates, setCropCoordinates] = useState(null);
  //const [invertedMaskLayer, setInvertedMaskLayer] = useState(null);
  //const [rectangleLayer, setRectangleLayer] = useState(null);


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

        featureGroupRef.current.eachLayer(layer => {
          if (layer.feature && layer.feature.properties.shape === "rectangleCrop") {
            layer.setStyle({
              color: 'red',
              weight: 5,
              fillOpacity: 0
            });
            // Create an inverted mask
            createInvertedMask(layer);
          }
        });

      }

      //load  in crop coordinates
      /*
      const bounds = [[51.531763, -0.213547], [51.5, -0.06]];

        // Create and style the rectangle
        const rectangle = L.rectangle(bounds, {
          color: 'red',
          weight: 2,
          fillOpacity: 0.2
        });
  
        // Add the rectangle to the map
        rectangle.addTo(featureGroupRef.current);
        */
    }
  }, [geoJsonData]);


  const createInvertedMask = (rectangleLayer) => {
    const bounds = rectangleLayer.getBounds();

    // Large bounds to cover the whole map, adjust as needed
    const largeBounds = [[90, -180], [-90, 180]];

    // Coordinates for the large polygon covering the entire map
    const outerCoords = [
      largeBounds[0], // Top-left of map
      [90, 180], // Top-right of map
      largeBounds[1], // Bottom-right of map
      [-90, -180], // Bottom-left of map
      largeBounds[0] // Close the loop
    ];

    // Coordinates for the inner rectangle (smaller rectangle)
    const innerCoords = [
      [bounds.getNorthWest().lat, bounds.getNorthWest().lng],
      [bounds.getNorthEast().lat, bounds.getNorthEast().lng],
      [bounds.getSouthEast().lat, bounds.getSouthEast().lng],
      [bounds.getSouthWest().lat, bounds.getSouthWest().lng],
      [bounds.getNorthWest().lat, bounds.getNorthWest().lng] // Close the loop
    ];

    // Create a multi-polygon with the outer large rectangle and inner cut-out rectangle
    const invertedPolygon = L.polygon([outerCoords, innerCoords], {
      color: 'grey',
      fillColor: 'black',
      fillOpacity: 0.3 // Adjust for desired opacity outside the smaller rectangle
    }).addTo(featureGroupRef.current);


    //invertedPolygon.on('click', deleteRectangleAndMask);
    //setInvertedMaskLayer(invertedPolygon);
    //setRectangleLayer(layer);

    // Optionally, bring the original rectangle to front
    rectangleLayer.bringToFront();

    // Add a property to identify the mask
    invertedPolygon.isMask = true;

    // Store the inverted mask layer reference
    //setInvertedMaskLayer(invertedPolygon);
    //return invertedPolygon;
    console.log('createlayer: ', featureGroupRef.current);
    console.log('rectanglelayr: ', rectangleLayer);
  };

  const updateInvertedMask = (rectangleLayer, invertedMask) => {
    const bounds = rectangleLayer.getBounds();
    const largeBounds = [[90, -180], [-90, 180]];

    // Update the coordinates of the inverted mask
    const newOuterCoords = [
      largeBounds[0], // Top-left of map
      [90, 180], // Top-right of map
      largeBounds[1], // Bottom-right of map
      [-90, -180], // Bottom-left of map
      largeBounds[0] // Close the loop
    ];
    const newInnerCoords = [
      [bounds.getNorthWest().lat, bounds.getNorthWest().lng],
      [bounds.getNorthEast().lat, bounds.getNorthEast().lng],
      [bounds.getSouthEast().lat, bounds.getSouthEast().lng],
      [bounds.getSouthWest().lat, bounds.getSouthWest().lng],
      [bounds.getNorthWest().lat, bounds.getNorthWest().lng] // Closing the loop
    ];

    invertedMask.setLatLngs([newOuterCoords, newInnerCoords]);


  };

  /*  const deleteRectangleAndMask = (rectangleLayer, invertedMask) => {
      featureGroupRef.current.removeLayer(rectangleLayer);
      featureGroupRef.current.removeLayer(invertedMask);
    };
  */
  /*
  const deleteRectangleAndMask = () => {
    if (invertedMaskLayer) {
      //featureGroupRef.current.removeLayer(rectangleLayer);
      featureGroupRef.current.removeLayer(invertedMaskLayer);
      setInvertedMaskLayer(null);
    }
  };
  */

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

  /*
  const redCrop = () => {

      featureGroupRef.current.clearLayers(); // Clear existing layers first
      L.geoJSON(geoJsonData, {
        style: (feature) => {
          if (feature.properties.shape === "rectangle") {
            return {
              color: 'red',
              weight: 2,
              fillOpacity: 0.2
            };
          }
        }
      }).addTo(featureGroupRef.current);

      featureGroupRef.current.eachLayer(layer => {
        if (layer.feature && layer.feature.properties.shape === "rectangle") {
          layer.setStyle({
            color: 'red',
            weight: 2,
            fillOpacity: 0.2
          });
        }
      });

    
  };
  */


  const updateGeoJson = () => {
    if (featureGroupRef.current) {
      const features = [];

      featureGroupRef.current.eachLayer(layer => {
        // Exclude the mask layer
        if (layer.isMask) {
          return;
        }
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
        } else if (layer instanceof L.Rectangle) {

          // Handle rectangle layer
          const bounds = layer.getBounds();
          const rectangleCoordinates = [
            [bounds.getSouthWest().lng, bounds.getSouthWest().lat],
            [bounds.getNorthWest().lng, bounds.getNorthWest().lat],
            [bounds.getNorthEast().lng, bounds.getNorthEast().lat],
            [bounds.getSouthEast().lng, bounds.getSouthEast().lat],
            [bounds.getSouthWest().lng, bounds.getSouthWest().lat] // Closing the loop
          ];

          const rectangleFeature = {
            type: "Feature",
            properties: {
              shape: "rectangleCrop"
            },
            geometry: {
              type: "Polygon",
              coordinates: [rectangleCoordinates]
            }
          };
          features.push(rectangleFeature);

          //updateInvertedMask(layer, featureGroupRef.current.getLayers()[1]);
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
    /*   const { layer } = e;
       if (layer instanceof L.Rectangle) {
         // Style the rectangle
         layer.setStyle({
           color: 'red',        // Color of the rectangle border
           fillColor: 'red',    // Color of the rectangle fill
           fillOpacity: 0.2,    // Transparency of the fill
           weight: 2            // Width of the rectangle border
         });
         
         /*
         const bounds = layer.getBounds();
         setCropCoordinates(bounds.toBBoxString()); // or use bounds.getNorthEast(), bounds.getSouthWest()
         */
    /*
    const bounds = layer.getBounds();
    const rectangleCoordinates = [
      bounds.getSouthWest().lng, bounds.getSouthWest().lat,
      bounds.getNorthWest().lng, bounds.getNorthWest().lat,
      bounds.getNorthEast().lng, bounds.getNorthEast().lat,
      bounds.getSouthEast().lng, bounds.getSouthEast().lat,
      bounds.getSouthWest().lng, bounds.getSouthWest().lat // Closing the loop
    ];

    // Create a new GeoJSON feature
    const newFeature = {
      type: "Feature",
      properties: {
        shape: "rectangle"
      },
      geometry: {
        type: "Polygon",
        coordinates: [rectangleCoordinates]
      }
    };

    // Update the geoJsonData state
    setGeoJsonData(prevData => ({
      ...prevData,
      features: [...prevData.features, newFeature]
    }));
    */
    // Optionally, send this data to the server
    // ...
    //}
    // Send these coordinates to the server or use as needed
    updateGeoJson(); // Update GeoJSON when new shape is created
  };



  const onEdited = (e) => {
    e.layers.eachLayer((editedLayer) => {
      if (editedLayer.feature && editedLayer.feature.properties.shape === "rectangleCrop") {
        // Remove existing inverted mask
        let maskToRemove = null;
        featureGroupRef.current.eachLayer((layer) => {
          if (layer !== editedLayer && !layer.feature) { // Assuming the mask doesn't have a 'feature' property
            maskToRemove = layer;
          }
        });
        if (maskToRemove) {
          featureGroupRef.current.removeLayer(maskToRemove);
        }

        // Recreate the inverted mask with new coordinates
        createInvertedMask(editedLayer);
      }
    });

    updateGeoJson(); // Update GeoJSON when shapes are edited
  };

  const onDeleted = (e) => {
    //deleteRectangleAndMask();
    // Attach the event handler to the rectangle layer
    //featureGroupRef.on('click', deleteRectangleAndMask);
    // Check if the deleted layer is a rectangle with the 'rectangleCrop' property
    /*
          if (e.layer.feature && e.layer.feature.properties.shape === "rectangleCrop") {
      // Find the associated inverted mask and delete it
      featureGroupRef.current.eachLayer(layer => {
        if (layer !== e.layer && !layer.feature) { // Assuming the mask doesn't have a 'feature' property
          featureGroupRef.current.removeLayer(layer);
        }
      });
    }
*/
    // Attach a click event to the rectangle layer to delete both
    //e.layer.on('click', () => deleteRectangleAndMask(e.layer));

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

            draw={{
              rectangle: {
                shapeOptions: {
                  color: 'red',
                  weight: 2,
                  fillOpacity: 0.2
                }
              }
            }}
          />
        </FeatureGroup>
      </MapContainer>
    </div>
  );
};
// Export the Map component
export default Map;