// Import necessary modules and components
import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, LayersControl, FeatureGroup, GeoJSON } from 'react-leaflet';
import { EditControl, drawControl } from "react-leaflet-draw";
import { API_URLS } from '../../constants/APIURLS'; // Import the API_URLS constant
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import shp from 'shpjs';
import { v4 as uuidv4 } from 'uuid';

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png')
});


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
  const zoom = 12;
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');
  const accessToken = localStorage.getItem('accessToken'); // Get the access token from local storage
  const [isRectangleDrawn, setIsRectangleDrawn] = useState(false);
  const [shapeLayers, setShapeLayers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [attributesObject, setAttributesObject] = useState(null);

  useEffect(() => {
    if (featureGroupRef.current) {
      featureGroupRef.current.clearLayers(); // Clear existing layers first
      if (geoJsonData) {
        L.geoJSON(geoJsonData, {
          onEachFeature: (feature, layer) => {
            layer.on('click', () => {
              if (feature.properties && feature.properties.id || feature.properties.attributes) {
                setSelectedId(feature.properties.id);
                setAttributesObject(feature.properties.attributes);
              }
            });

            if (feature.properties && feature.properties.isCircle) {
              // If the feature is a circle, recreate it
              const center = L.latLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]);
              const circle = L.circle(center, { radius: feature.properties.radius });
              circle.on('click', () => {
                setSelectedId(feature.properties.id);
                setAttributesObject(feature.properties.attributes);
              });
              circle.addTo(featureGroupRef.current);
            } else {
              layer.on('click', () => {
                setSelectedId(feature.properties.id);
                setAttributesObject(feature.properties.attributes);
              });
              // Add other shapes directly
              layer.addTo(featureGroupRef.current);
            }
          }
        });

        featureGroupRef.current.eachLayer(layer => {
          if (layer.feature && layer.feature.properties.shape === "rectangleCrop") {
            layer.setStyle({
              color: 'red',
              weight: 10,
              fillOpacity: 0
            });
            // Create an inverted mask
            createInvertedMask(layer);
          }
        });

        featureGroupRef.current.eachLayer(layer => {
          if (layer.feature && layer.feature.properties.shape === "rectangleCrop") {
            setIsRectangleDrawn(true);
          }
        });
      }
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
      fillOpacity: 0.5 // Adjust for desired opacity outside the smaller rectangle
    }).addTo(featureGroupRef.current);

    // Optionally, bring the original rectangle to front
    rectangleLayer.bringToFront();

    // Add a property to identify the mask
    invertedPolygon.isMask = true;
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

  // Function to save GeoJSON data to the server
  const saveDataToServer = async () => {
    try {
      setSaveStatus('Sparar...');
      const response = await fetch(`${API_URLS.PROJECT_FILES_POST}/${userID}/${selectedProjectId}/file`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}` // Include the accessToken in the Authorization header
        },
        body: JSON.stringify(geoJsonData),
      });
      if (response.ok) {
        setSaveStatus('Kartdata sparad!')
        console.log('Data saved successfully');
        console.log('geoJsonData: ', geoJsonData);
      } else {
        setSaveStatus('Fel i sparande av kartdata')
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
              radius: layer.getRadius(),
              id: uuidv4(),
              attributes: {
                inventoryLevel: ' ',
                natureValueClass: ' ',
                preliminaryAssesment: ' ',
                reason: ' ',
                natureType: ' ',
                habitat: ' ',
                date: ' ',
                executer: ' ',
                organsation: ' ',
                projectName: ' ',
                area: ' ',
                species: ' ',
                habitatQualities: ' ',
                valueElements: ' ',
              }
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
        } else {
          // For other shapes, use the default toGeoJSON method
          const layerFeature = layer.toGeoJSON();
          const UUID = uuidv4();
          layerFeature.properties.id = UUID;
          layerFeature.properties.attributes = {
            inventoryLevel: ' ',
            natureValueClass: ' ',
            preliminaryAssesment: ' ',
            reason: ' ',
            natureType: ' ',
            habitat: ' ',
            date: ' ',
            executer: ' ',
            organsation: ' ',
            projectName: ' ',
            area: ' ',
            species: ' ',
            habitatQualities: ' ',
            valueElements: ' ',
          };
          features.push(layerFeature);
          setIsRectangleDrawn(false);
        }

      });

      if (features == 0 || features == null || features == undefined || features == '') {
        setIsRectangleDrawn(false);
      }

      const geoJson = {
        type: 'FeatureCollection',
        features: features
      };


      setGeoJsonData(geoJson);

      /*
      if (geoJson.features.properties == null || geoJson.features.properties == undefined || geoJson.features.properties.id == null || geoJson.features.properties.id == undefined || geoJson.features.properties.id == '') {
        const feature = {
          type: 'Feature',
          properties: {
            id: uuidv4	(),
          }
        };
        features.push(feature);
      }
      */

      console.log('geojson: ', geoJson);

    }
  };

  const onCreate = (e) => {
    const newLayer = e.layer;

    // Check if the layer is a rectangle and update the state accordingly
    if (newLayer instanceof L.Rectangle) {
      setIsRectangleDrawn(true);
    }

    updateGeoJson();
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

    // Clone the current state
    let updatedFeatures = [...shapeLayers];

    e.layers.eachLayer((editedLayer) => {
      // Assuming each feature has a unique id
      const featureIndex = updatedFeatures.findIndex(f =>
        f.properties.id === editedLayer.feature.properties.id
      );

      if (featureIndex !== -1) {
        // Update the geometry of the feature
        updatedFeatures[featureIndex].geometry = editedLayer.toGeoJSON().geometry;
      }
    });
    // Update the state
    setShapeLayers(updatedFeatures);
    updateGeoJson(); // Update GeoJSON when shapes are edited
  };

  const onDeleted = (e) => {
    updateGeoJson(); // Update GeoJSON when shapes are deleted
  };


  /*
    const handleFileUploadGeoJSON = async (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const text = event.target.result;
            const geojson = JSON.parse(text); // Parse the file content as GeoJSON
            console.log('geojson: ', geojson);
            setGeoJsonLayers(geojson.features); // Update the state
          } catch (error) {
            console.error('Error parsing GeoJSON:', error);
          }
        };
        reader.readAsText(file); // Read the file as text
      }
    };
  */



  const handleFileUploadShape = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target.result;
          const parsedGeojson = await shp.parseZip(arrayBuffer);
          let featuresArray;

          if (Array.isArray(parsedGeojson)) {
            featuresArray = parsedGeojson.reduce((acc, featureCollection) => {
              if (featureCollection.type === "FeatureCollection" && featureCollection.features) {
                return [...acc, ...featureCollection.features];
              }
              return acc;
            }, []);
          } else {
            featuresArray = parsedGeojson.features;
          }

          const newGeoJsonData = {
            type: "FeatureCollection",
            features: featuresArray
          };

          // Clear existing layers
          featureGroupRef.current.clearLayers();

          // Add the new GeoJSON data to the feature group
          L.geoJSON(newGeoJsonData, {
            onEachFeature: (feature, layer) => {
              layer.addTo(featureGroupRef.current);
              layer.on('click', () => {
                if (feature.properties && feature.properties.id || feature.properties.attributes) {
                  setSelectedId(feature.properties.id);
                  setAttributesObject(feature.properties.attributes);
                }
              });
            }
          });

          console.log('Parsed Features:', featuresArray);
          console.log('New GeoJSON Data:', newGeoJsonData);

        } catch (error) {
          console.error('Error parsing shapefile:', error);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const saveAttributes = () => {
    const updatedFeatures = geoJsonData.features.map((feature) => {
      if (feature.properties.id === selectedId) {
        return {
          ...feature,
          properties: {
            ...feature.properties,
            attributes: { ...attributesObject },
          },
        };
      }
      return feature;
    });

    setGeoJsonData({ ...geoJsonData, features: updatedFeatures });
  };


  //      Import (GeoJSON): <input type="file" onChange={handleFileUploadGeoJSON} />


  return (
    <div>
    <div className='map-container'>
      <h3>Projektkarta</h3>
      <button className="toggle-form-button" onClick={saveDataToServer}>Spara ritning!</button>
      <span className="save-status">{saveStatus}</span>

      {selectedId && attributesObject && (
        <div className="attributes-container">
          <h3>Objektattribut</h3>
          <label>
            Objekt-ID:
            <input
              type="text"
              value={selectedId || ''}
              readOnly // Object ID is not editable
            />
          </label>
          <label>
            Inventeringsnivå:
            <input
              type="text"
              value={attributesObject.inventoryLevel || ''}
              onChange={(e) => setAttributesObject({ ...attributesObject, inventoryLevel: e.target.value })}
            />
          </label>
          <label>
            Naturvärdesklass:
            <input
              type="text"
              value={attributesObject.natureValueClass || ''}
              onChange={(e) => setAttributesObject({ ...attributesObject, natureValueClass: e.target.value })}
            />
          </label>
          <label>
            Preliminär bedömning:
            <input
              type="text"
              value={attributesObject.preliminaryAssessment || ''}
              onChange={(e) => setAttributesObject({ ...attributesObject, preliminaryAssessment: e.target.value })}
            />
          </label>
          <label>
            Motivering:
            <input
              type="text"
              value={attributesObject.reason || ''}
              onChange={(e) => setAttributesObject({ ...attributesObject, reason: e.target.value })}
            />
          </label>
          <label>
            Naturtyp:
            <input
              type="text"
              value={attributesObject.natureType || ''}
              onChange={(e) => setAttributesObject({ ...attributesObject, natureType: e.target.value })}
            />
          </label>
          <label>
            Biotop:
            <input
              type="text"
              value={attributesObject.habitat || ''}
              onChange={(e) => setAttributesObject({ ...attributesObject, habitat: e.target.value })}
            />
          </label>
          <label>
            Datum:
            <input
              type="date"
              value={attributesObject.date || ''}
              onChange={(e) => setAttributesObject({ ...attributesObject, date: e.target.value })}
            />
          </label>
          <label>
            Utförare:
            <input
              type="text"
              value={attributesObject.executor || ''}
              onChange={(e) => setAttributesObject({ ...attributesObject, executor: e.target.value })}
            />
          </label>
          <label>
            Organisation:
            <input
              type="text"
              value={attributesObject.organization || ''}
              onChange={(e) => setAttributesObject({ ...attributesObject, organization: e.target.value })}
            />
          </label>
          <label>
            Projektnamn:
            <input
              type="text"
              value={attributesObject.projectName || ''}
              onChange={(e) => setAttributesObject({ ...attributesObject, projectName: e.target.value })}
            />
          </label>
          <label>
            Area:
            <input
              type="number"
              value={attributesObject.area || ''}
              onChange={(e) => setAttributesObject({ ...attributesObject, area: e.target.value })}
            />
          </label>
          {/* Additional attributes like Species, Habitat Qualities, Value Elements can be added similarly */}
          <button className="save-attributes-btn" onClick={saveAttributes}>Save</button>
          <button className="cancel-btn" onClick={() => setSelectedId(null)}>Cancel</button>
        </div>
      )}



      <label htmlFor="file-upload" className="custom-file-upload">
        Importera shapefil
      </label>
      <input id="file-upload" className="project-import-input" type="file" onChange={handleFileUploadShape} style={{ display: 'none' }} />

    </div>
    <MapContainer center={position} zoom={zoom} style={{ height: '100vh', width: '100%' }} className="full-width-map">
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
              rectangle: isRectangleDrawn ? false : {
                shapeOptions: {
                  color: 'red',
                  weight: 2,
                  fillOpacity: 0.2
                },
                //icon: customRectangleIcon 
              },
              circlemarker: false,
            }}
          />
          {/*geoJsonLayers && geoJsonLayers.map((feature, index) => (
            <GeoJSON key={index} data={feature} />
          ))*/}
          {shapeLayers && shapeLayers.map((feature, index) => (
            <GeoJSON key={index} data={feature} />
          ))}

        </FeatureGroup>
      </MapContainer>
    </div>
  );
};
// Export the Map component
export default Map;