// Import necessary modules and components
import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, LayersControl, FeatureGroup, GeoJSON, useMapEvents, useMap } from 'react-leaflet';
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

const dotIconBlue = L.divIcon({
    className: 'custom-dot-icon',
    html: '<svg width="15" height="15" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" fill="#3388ff"/></svg>',
    iconSize: [8, 8], // Size of the icon
    iconAnchor: [4, 4] // Anchor point of the icon
});
const dotIconRed = L.divIcon({
    className: 'custom-dot-icon',
    html: '<svg width="20" height="20" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" fill="red"/></svg>',
    iconSize: [8, 8], // Size of the icon
    iconAnchor: [4, 4] // Anchor point of the icon
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



window.toggleAttributeContainer = (id, attributes) => {
    // Function implementation will be set in the component
};


// Define the Map component
const MapTest = ({ selectedProjectId, selectedProject, onSave, userID, shouldHide }) => {
    const featureGroupRef = useRef(null);
    const position = [51.505, -0.09];
    const zoom = 11;
    const [geoJsonData, setGeoJsonData] = useState(null);
    const [saveStatus, setSaveStatus] = useState('');
    const accessToken = localStorage.getItem('accessToken'); // Get the access token from local storage
    const [isRectangleDrawn, setIsRectangleDrawn] = useState(false);
    const [shapeLayers, setShapeLayers] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [attributesObject, setAttributesObject] = useState(null);
    const [showAdditionalFields, setShowAdditionalFields] = useState(false);
    const [showAttributeTable, setShowAttributeTable] = useState(false);
    const [showRectangleButton, setShowRectangleButton] = useState(true);
    const [highlightedId, setHighlightedId] = useState(null);
    const [highlightedFeatureId, setHighlightedFeatureId] = useState(null);
    const [selectedRowIds, setSelectedRowIds] = useState(new Set());
    const [highlightedIds, setHighlightedIds] = useState(new Set());
    const [activeTab, setActiveTab] = useState('Punkter');
    const [selectedMarkerId, setSelectedMarkerId] = useState(null);
    const [lastClickedMarker, setLastClickedMarker] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imageList, setImageList] = useState([]);
    const [fullscreenImage, setFullscreenImage] = useState(null); // State to track the selected image for fullscreen view


    const uploadImage = async () => {
        if (!selectedImage) return;

        // Function to convert the image file to a Base64 string
        const toBase64 = file => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });

        try {
            // Convert the image to Base64
            const base64Image = await toBase64(selectedImage);

            // Prepare the JSON payload
            const payload = {
                projectId: 24,
                imageData: base64Image
            };

            // Send the request
            const response = await fetch(`${API_URLS.PROJECT_IMAGE_POST}`, {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: {
                    'Authorization': `Bearer ${accessToken}`, // Include your auth token if required
                    'Content-Type': 'application/json'
                },
            });

            if (response.ok) {
                console.log('Image uploaded successfully');
                fetchImages(); // Refresh the image list after uploading
                setSelectedImage(null); // Reset the selected image
            } else {
                console.error('Failed to upload image');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
        }
    };


    const fetchImages = async () => {
        try {
            const response = await fetch(`${API_URLS.PROJECT_IMAGE_GET.replace('<int:project_id>', selectedProjectId)}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });
    
            if (response.ok) {
                const data = await response.json();
                console.log('image data: ', data);
                const images = data.images; // Use the 'images' key from the response
                setImageList(images.map(image => ({
                    url: image.url, // Include the image URL
                    caption: image.caption, // Include the caption
                    mapObjectId: image.mapObjectId // Include the mapObjectId
                })));
            } else {
                console.error('Failed to fetch images, status:', response.status);
            }
        } catch (error) {
            console.error('Error fetching images:', error);
        }
    };
    


    useEffect(() => {
        fetchImages();
    }, [selectedProjectId]); // Re-fetch images when selectedProjectId changes


    // Function to reset styles for all layers
    const resetAllLayerStyles = () => {
        featureGroupRef.current.eachLayer(layer => {
            if (layer.options.icon === dotIconRed) {
                // Reset marker icons to blue
                layer.setIcon(dotIconBlue);
            } else if (layer instanceof L.Circle) {
                // Reset circle styles to default
                layer.setStyle({
                    color: '#3388ff', // Default color
                    fillColor: '#3388ff', // Default fill color
                    fillOpacity: 0.2,
                    weight: 2,
                });
            }
        });
    };


    const RectangleDrawButton = () => {
        const map = useMap();

        const startRectangleDraw = () => {
            // Initialize the draw control for rectangles
            const drawControl = new L.Draw.Rectangle(map, {
                shapeOptions: {
                    color: '#f00', // Example color, change as needed
                },
            });
            drawControl.enable(); // Enable the draw control for rectangles

            // Event listener for when a rectangle is created
            const onRectangleCreated = (e) => {
                const { layer } = e;
                const rectangleBounds = layer.getBounds();
                const newRectangle = {
                    type: 'Feature',
                    properties: {
                        shape: "rectangleCrop",
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[
                            [rectangleBounds.getSouthWest().lng, rectangleBounds.getSouthWest().lat],
                            [rectangleBounds.getNorthWest().lng, rectangleBounds.getNorthWest().lat],
                            [rectangleBounds.getNorthEast().lng, rectangleBounds.getNorthEast().lat],
                            [rectangleBounds.getSouthEast().lng, rectangleBounds.getSouthEast().lat],
                            [rectangleBounds.getSouthWest().lng, rectangleBounds.getSouthWest().lat] // Close the loop
                        ]]
                    }
                };


                console.log('custom rectangle: ', newRectangle);
                // Update GeoJSON data with the new rectangle
                setGeoJsonData(prevData => ({
                    ...prevData,
                    features: [...prevData.features, newRectangle]
                }));

                layer.addTo(map); // Add the drawn rectangle to the map
                removeDuplicateRectangles(); // Call function to remove duplicates
                drawControl.disable(); // Disable the draw control after drawing  
                setShowRectangleButton(false);


                // Remove the event listener to prevent duplicate rectangles
                map.off(L.Draw.Event.CREATED, onRectangleCreated);
            };

            // Attach the event listener to the map
            map.once(L.Draw.Event.CREATED, onRectangleCreated);
        };

        if (!shouldHide) {
            // Conditionally render the button based on showRectangleButton state
            return showRectangleButton ? (
                <button onClick={startRectangleDraw} className='draw-rectangle-btn'>
                    Beskär karta
                </button>
            ) : null;
        }
    };


    const removeDuplicateRectangles = () => {
        const layers = featureGroupRef.current.getLayers();
        const rectangles = layers.filter(layer => layer instanceof L.Rectangle);
        let uniqueRectangles = [];

        rectangles.forEach(currentRect => {
            const duplicateIndex = uniqueRectangles.findIndex(uniqueRect =>
                uniqueRect.getBounds().equals(currentRect.getBounds())
            );

            if (duplicateIndex === -1) {
                uniqueRectangles.push(currentRect);
            } else {
                const duplicateRect = uniqueRectangles[duplicateIndex];
                const hasCurrentRectCropProperty = currentRect.options && currentRect.options.shape === "rectangleCrop";
                const hasDuplicateRectCropProperty = duplicateRect.options && duplicateRect.options.shape === "rectangleCrop";

                if (hasCurrentRectCropProperty && !hasDuplicateRectCropProperty) {
                    featureGroupRef.current.removeLayer(duplicateRect);
                    uniqueRectangles[duplicateIndex] = currentRect;
                } else if (!hasCurrentRectCropProperty) {
                    featureGroupRef.current.removeLayer(currentRect);
                }
            }
        });

        // Extract non-rectangle features from the existing geoJsonData
        const nonRectangleFeatures = geoJsonData.features.filter(feature => feature.properties.shape !== "rectangleCrop");

        // Convert unique rectangles to GeoJSON and ensure "shape" property is included
        const updatedRectangleFeatures = uniqueRectangles.map(rect => {
            const geoJsonFeature = rect.toGeoJSON();
            geoJsonFeature.properties.shape = rect.options.shape || 'rectangleCrop'; // Ensuring "shape" property is set
            return geoJsonFeature;
        });

        // Merge non-rectangle features with updated rectangle features
        setGeoJsonData({
            type: 'FeatureCollection',
            features: [...nonRectangleFeatures, ...updatedRectangleFeatures]
        });
    };






    useEffect(() => {
        window.toggleAttributeContainer = (id, attributes) => {
            setShowAttributeTable(true); // Always show the attribute table when the button is clicked
            setSelectedId(id);
            setAttributesObject(attributes);
        };

        return () => {
            window.toggleAttributeContainer = undefined; // Clean up
        };
    }, []);



    useEffect(() => {
        if (featureGroupRef.current) {
            featureGroupRef.current.clearLayers(); // Clear existing layers first
            let foundCropRectangle = false;

            if (geoJsonData) {



                L.geoJSON(geoJsonData, {
                    pointToLayer: (feature, latlng) => {
                        // For points that are not circle markers, use a custom dot icon
                        if (!feature.properties.isCircleMarker) {
                            const marker = L.marker(latlng, { icon: dotIconBlue });

                            marker.on('click', () => {
                                // Iterate over all markers and set their icons to blue
                                featureGroupRef.current.eachLayer(layer => {
                                    if (layer instanceof L.Marker && !layer.feature.properties.isCircleMarker) {
                                        layer.setIcon(dotIconBlue);
                                    }
                                });
                                resetAllLayerStyles()
                                // Change the clicked marker's icon to dotIconRed
                                marker.setIcon(dotIconRed);
                                console.log('marker clicked: ', feature.properties.id);
                                // Update the last clicked marker
                                setLastClickedMarker(marker);
                            });

                            return marker;
                        }

                        // For circle markers, return a L.circleMarker
                        return L.circleMarker(latlng, {
                            radius: feature.properties.radius // Use the radius from the feature properties
                        });

                        /*
                        // Use L.marker with the custom dot icon
                        const marker = L.marker(latlng, { icon: dotIconBlue, id: feature.properties.id });

                        marker.on('click', () => {
                            // Update the state with the currently selected marker's ID
                            setSelectedMarkerId(feature.properties.id);

                            // Iterate through all markers to update their icons
                            featureGroupRef.current.eachLayer(layer => {
                                if (layer instanceof L.Marker && !(layer instanceof L.CircleMarker)) {
                                    if (layer.options.id === feature.properties.id) {
                                        // Change the clicked marker's icon to red
                                        layer.setIcon(dotIconRed);
                                    } else {
                                        // Revert other markers' icons back to blue
                                        layer.setIcon(dotIconBlue);
                                    }
                                }
                            });
                        });

                        return marker;
                        */

                        /*                 
                        return L.circleMarker(latlng, {
                            radius: 8, // Radius of the circle marker (dot size)
                            fillColor: "#3388ff", // Default fill color
                            color: "#3388ff", // Border color
                            weight: 4, // Border width
                            opacity: 1,
                            fillOpacity: 5
                        });
                        */

                        /*  
                        if (feature.properties.isCircleMarker) {
                            // If the feature has a property indicating it's a circle marker, create a L.CircleMarker
                            return L.circleMarker(latlng, {
                                radius: feature.properties.radius // Use the radius from the feature properties
                            });
                        } else {
                            // For other points, return a default marker
                            return L.marker(latlng, { icon: dotIconBlue });
                        }
                        */

                    },

                    onEachFeature: (feature, layer) => {

                        layer.on('click', () => {
                            // Set the selected feature ID and its attributes for editing
                            setSelectedId(feature.properties.id);
                            setAttributesObject(feature.properties.attributes || {});
                            setShowAttributeTable(true); // Show the attribute table
                        });

                        layer.on('click', () => {
                            setHighlightedId(feature.properties.id); // Set the highlighted feature's ID
                            if (typeof layer.setStyle === 'function' && feature.properties.shape !== "rectangleCrop") {
                                layer.setStyle({
                                    color: 'red', // Change the polygon color to green
                                    weight: 5,
                                });
                            }
                        });

                        layer.on('click', () => {

                            resetAllLayerStyles();
                            // Your existing click event logic...
                            if (layer instanceof L.Marker) {
                                // Change the clicked marker's icon to red
                                layer.setIcon(dotIconRed);

                            }
                            setHighlightedIds(null);
                            setHighlightedId(null) // Clear existing layers first
                            setHighlightedIds(new Set([feature.properties.id]));
                        });
                        /*
                                                layer.on('click', () => {
                                                    setHighlightedFeatureId(feature.properties.id); // Update highlighted feature ID
                                                    // Existing code to set the selected feature's properties
                                                });
                        */
                        if (feature.properties.shape === "rectangleCrop") {
                            foundCropRectangle = true; // Set the flag if a crop rectangle is found
                        }

                        if (!shouldHide) {
                            // Generate popup content based on feature properties
                            const popupContent = generatePopupContent(feature.properties);

                            // Bind the popup to the layer
                            layer.bindPopup(popupContent);
                        }

                        if (feature.properties && feature.properties.isCircle) {


                            // If the feature is a circle, recreate it
                            const center = L.latLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]);

                            const circle = L.circle(center, {
                                radius: feature.properties.radius,
                                id: feature.properties.id,
                                color: '#3388ff', // Default color
                                fillColor: '#3388ff', // Default fill color
                                fillOpacity: 0.2,
                                weight: 3,
                                radius: feature.properties.radius

                            });

                            if (!shouldHide) {
                                const popupContent = generatePopupContent(feature.properties);
                                circle.bindPopup(popupContent); // Bind popup to circle
                            }

                            circle.options.id = feature.properties.id; // Assign the unique ID to the circle options for later reference

                            // Add the circle to the feature group
                            circle.addTo(featureGroupRef.current);

                            circle.on('click', () => {
                                resetAllLayerStyles();
                                setHighlightedIds(new Set([feature.properties.id]));
                                //setHighlightedId(null); // Set the highlighted feature's ID
                                console.log('circle clicked: ', feature.properties.id);
                                setHighlightedId(feature.properties.id); // Set the highlighted feature's ID
                                circle.setStyle({
                                    color: 'red', // Change color to green upon click
                                    fillColor: 'red', // Change fill color to green upon click
                                    fillOpacity: 0.1,
                                    weight: 5,
                                });
                                setSelectedId(feature.properties.id);
                                setAttributesObject(feature.properties.attributes || {});
                                setShowAttributeTable(true); // Show the attribute table
                            });
                        } else {
                            layer.addTo(featureGroupRef.current);
                        }


                    }
                })


                featureGroupRef.current.eachLayer(layer => {
                    if (layer.feature && layer.feature.properties.shape === "rectangleCrop") {
                        layer.setStyle({
                            //color: 'red',
                            //weight: 10,
                            fillOpacity: 0

                        });
                        layer.bringToBack();
                        // Create an inverted mask
                        createInvertedMask(layer);
                    }
                });

                featureGroupRef.current.eachLayer(layer => {
                    if (layer.feature && layer.feature.properties.shape === "rectangleCrop") {
                        layer.bringToBack();
                        setIsRectangleDrawn(true);

                    }
                });

                setIsRectangleDrawn(foundCropRectangle); // Update the state based on the presence of a crop rectangle
                setShowRectangleButton(!foundCropRectangle); // Hide or show the button based on the presence of a crop rectangle


            }
        }
    }, [geoJsonData]);


    // Function to generate popup content from feature properties
    const generatePopupContent = (properties) => {
        // Check if the feature is a rectangle and return null or empty content
        if (properties.shape === "rectangleCrop") {
            return 'Tillfällig markering'; // Return an empty string to avoid popup content for rectangles
        }

        // Define a mapping from attribute keys to Swedish names
        const attributeNames = {
            objectNumber: 'Objektnummer',
            inventoryLevel: 'Inventeringsnivå',
            natureValueClass: 'Naturvärdesklass',
            preliminaryAssessment: 'Preliminär bedömning',
            reason: 'Motivering',
            natureType: 'Naturtyp',
            habitat: 'Biotop',
            date: 'Datum',
            executor: 'Utförare',
            organization: 'Organisation',
            projectName: 'Projektnamn',
            area: 'Area',
            species: 'Arter',
            habitatQualities: 'Habitatkvaliteter',
            valueElements: 'Värdeelement',
            // Add more mappings as needed
        };

        if (!shouldHide) {
            // Start the popup content with a div wrapper
            let content = '<div class="popup-content">';

            // Loop through each attribute in the properties.attributes object
            if (properties.attributes) {
                Object.entries(properties.attributes).forEach(([key, value]) => {
                    // Check if the key has a Swedish name mapping and is not 'Objekt-ID'
                    if (attributeNames[key] && key !== 'id') {
                        content += `<p><strong>${attributeNames[key]}:</strong> ${value}</p>`;
                    }
                });
            }

            // Generate content based on properties...
            //const id = properties.id; // Assume each feature has a unique ID
            //const attributesJson = JSON.stringify(properties.attributes); // Convert attributes to a JSON string for passing in the onclick handler

            const id = properties.id;
            const attributesJson = JSON.stringify(properties.attributes);
            content += `<button className='primary-btn' onclick='window.toggleAttributeContainer("${id}", ${attributesJson})'>Redigera objektattribut</button>`;

            content += '</div>';
            return content;
        }
    };


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
            //color: 'grey',
            //fillColor: 'black',
            fillOpacity: 0.2 // Adjust for desired opacity outside the smaller rectangle
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
                setSaveStatus('... kartdata sparad!');
                console.log('Data saved successfully');
                console.log('geoJsonData: ', geoJsonData);
                // Clear the save status message after 2 seconds
                setTimeout(() => {
                    setSaveStatus('');
                }, 2500);
            } else {
                setSaveStatus('... fel i sparande av kartdata');
                console.error('Failed to save data');
                // Clear the save status message after 2 seconds
                setTimeout(() => {
                    setSaveStatus('');
                }, 2000);
            }
        } catch (error) {
            setSaveStatus('No data to save');
            console.error('Error:', error);
            // Clear the save status message after 2 seconds
            setTimeout(() => {
                setSaveStatus('');
            }, 2000);
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



    const updateGeoJsonEditDel = () => {
        if (featureGroupRef.current) {
            const features = [];

            featureGroupRef.current.eachLayer(layer => {
                let layerFeature = layer.toGeoJSON();

                if (layer.isMask) {
                    console.log('return mask: ', layer);
                    return;
                }


                // Assign unique ID if not already present
                if (!layerFeature.properties.id) {
                    layerFeature.properties.id = uuidv4();
                }

                // Update attributes for the layer
                if (!layerFeature.properties.attributes) {
                    layerFeature.properties.attributes = layer.options.attributes || {
                        objectNumber: ' ',
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
                }

                // Handle circle and circle marker radius correctly
                if (layer instanceof L.Circle || layer instanceof L.CircleMarker) {
                    const radiusInMeters = layer.getRadius();
                    layerFeature.properties = {
                        ...layerFeature.properties,
                        radius: radiusInMeters, // Ensure radius is stored in meters
                        isCircle: layer instanceof L.Circle,
                        isCircleMarker: layer instanceof L.CircleMarker
                    };
                }

                // Copy other layer properties
                layerFeature.properties.attributes = {
                    ...layerFeature.properties.attributes,
                    ...layer.options.attributes
                };

                features.push(layerFeature);
            });

            const newGeoJsonData = {
                type: 'FeatureCollection',
                features: features
            };

            setGeoJsonData(newGeoJsonData);
        }
    };


    const updateGeoJsonCreate = () => {
        if (featureGroupRef.current) {
            const features = [];

            featureGroupRef.current.eachLayer(layer => {
                // Exclude the mask layer

                if (layer.isMask) {
                    return;
                }


                if (layer instanceof L.Circle/* && layer.options.id !== undefined*/) {
                    if (!(layer.options && layer.options.attributes)) {
                        console.log('full layer 1: ', layer);
                        const circleFeature = {
                            type: 'Feature',
                            geometry: {
                                type: 'Point',
                                coordinates: [layer.getLatLng().lng, layer.getLatLng().lat]
                            },
                            properties: {
                                isCircle: true,
                                radius: layer.getRadius(),
                                id: layer.options.id,
                                attributes: {
                                    objectNumber: ' ',
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
                            }
                        };
                        features.push(circleFeature);
                        console.log('Layer after 1: ', layer);
                        console.log('Circlefeature after 2: ', circleFeature);
                    } else {
                        console.log('full layer 2: ', layer);
                        //console.log('layer 2 options id: ', layer.options.id);
                        //console.log('layer 2 options: ', layer.options);

                        const circleFeature = {
                            type: 'Feature',
                            geometry: {
                                type: 'Point',
                                coordinates: [layer.getLatLng().lng, layer.getLatLng().lat]
                            },
                            properties: {
                                isCircle: true,
                                radius: layer.getRadius(),
                                id: layer.options.id,
                                attributes: {

                                    objectNumber: layer.options.attributes.objectNumber,
                                    inventoryLevel: layer.options.attributes.inventoryLevel,
                                    natureValueClass: layer.options.attributes.natureValueClass,
                                    preliminaryAssesment: layer.options.attributes.preliminaryAssesment,
                                    reason: layer.options.attributes.reason,
                                    natureType: layer.options.attributes.natureType,
                                    habitat: layer.options.attributes.habitat,
                                    date: layer.options.attributes.date,
                                    executer: layer.options.attributes.executer,
                                    organsation: layer.options.attributes.organsation,
                                    projectName: layer.options.attributes.projectName,
                                    area: layer.options.attributes.area,
                                    species: layer.options.attributes.species,
                                    habitatQualities: layer.options.attributes.habitatQualities,
                                    valueElements: layer.options.attributes.valueElements,

                                }
                            }
                        };
                        features.push(circleFeature);
                        console.log('Layer after 2: ', layer);
                        console.log('Circlefeature after 2: ', circleFeature);
                    }
                }





                else if (layer instanceof L.Rectangle) {
                    const bounds = layer.getBounds();
                    if (layer.feature && layer.feature.properties.shape === "rectangleCrop") {
                        console.log('return crop rectangle: ', layer);
                        return;
                    } else if ((!(layer.options && layer.options.attributes))) {
                        const rectangleFeature = {
                            type: 'Feature',
                            geometry: {
                                type: 'Polygon',
                                coordinates: [[
                                    [bounds.getSouthWest().lng, bounds.getSouthWest().lat],
                                    [bounds.getNorthWest().lng, bounds.getNorthWest().lat],
                                    [bounds.getNorthEast().lng, bounds.getNorthEast().lat],
                                    [bounds.getSouthEast().lng, bounds.getSouthEast().lat],
                                    [bounds.getSouthWest().lng, bounds.getSouthWest().lat] // Close the loop
                                ]]
                            },
                            properties: {
                                isRectangle: true,
                                id: layer.options.id,
                                attributes: {
                                    objectNumber: ' ',
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
                                    valueElements: ' '
                                }
                            },

                        }
                        features.push(rectangleFeature);
                        console.log('layer 1 rectangle: ', layer);
                        console.log('rectangleFeature 1: ', rectangleFeature);
                    } else {
                        const rectangleFeature = {
                            type: 'Feature',
                            geometry: {
                                type: 'Polygon',
                                coordinates: [[
                                    [bounds.getSouthWest().lng, bounds.getSouthWest().lat],
                                    [bounds.getNorthWest().lng, bounds.getNorthWest().lat],
                                    [bounds.getNorthEast().lng, bounds.getNorthEast().lat],
                                    [bounds.getSouthEast().lng, bounds.getSouthEast().lat],
                                    [bounds.getSouthWest().lng, bounds.getSouthWest().lat] // Close the loop
                                ]]
                            },
                            properties: {
                                isRectangle: true,
                                id: layer.options.id,
                                attributes: layer.options.attributes
                            },
                        }
                        features.push(rectangleFeature);
                        console.log('layer 2 rectangle: ', layer);
                        console.log('rectangleFeature 2: ', rectangleFeature);

                    }
                }


                else if (layer instanceof L.Polygon && !(layer instanceof L.Rectangle)) {
                    // Get the first array of LatLngs for the first polygon (ignores holes)
                    const latlngs = layer.getLatLngs()[0];
                    const coordinates = latlngs.map((latlng) => [latlng.lng, latlng.lat]);

                    // Ensure the polygon is closed by adding the first point at the end
                    if (coordinates[0] !== coordinates[coordinates.length - 1]) {
                        coordinates.push(coordinates[0]);
                    }

                    if (layer.feature && layer.feature.properties.id !== undefined) {
                        return;
                    } else if ((!(layer.options && layer.options.attributes))) {
                        const polygonFeature = {
                            type: 'Feature',
                            geometry: {
                                type: 'Polygon',
                                coordinates: [coordinates]
                            },
                            properties: {
                                isPolygon: true,
                                id: layer.options.id,
                                attributes: layer.options.attributes ? { ...layer.options.attributes } : {
                                    objectNumber: ' ',
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
                                    valueElements: ' '
                                }
                            },

                        }
                        features.push(polygonFeature);
                        console.log('layer 1 polygon: ', layer);
                        console.log('polygonFeature 1: ', polygonFeature);
                    }
                }



                else if (layer instanceof L.Polyline) {
                    const position = layer.getLatLngs();
                    const coordinates = position.map(latlng => [latlng.lng, latlng.lat]);

                    if (layer.feature && layer.feature.properties.id !== undefined) {
                        console.log('return polyline: ', layer);
                        return;
                    } else {
                        const polylineFeature = {
                            type: 'Feature',
                            geometry: {
                                type: 'LineString',
                                coordinates: [coordinates]
                            },
                            properties: {
                                isPolyline: true,
                                id: layer.options.id,
                                attributes: layer.options.attributes ? { ...layer.options.attributes } : {
                                    objectNumber: ' ',
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
                                    valueElements: ' '
                                }
                            },

                        }
                        features.push(polylineFeature);
                        console.log('layer 1 polyline: ', layer);
                        console.log('polylineFeature 1: ', polylineFeature);

                    }
                }

                else if (layer instanceof L.CircleMarker) {
                    const position = layer.getLatLng();

                    if (layer.feature && layer.feature.properties.id !== undefined) {
                        console.log('return circlemarker: ', layer);
                        return;
                    } else {
                        const circleMarkerFeature = {
                            type: 'Feature',
                            geometry: {
                                type: 'Point',
                                coordinates: [position.lng, position.lat]
                            },
                            properties: {
                                isCircleMarker: true,
                                id: layer.options.id,
                                radius: layer.getRadius(), // Radius in pixels
                                attributes: layer.options.attributes ? { ...layer.options.attributes } : {
                                    objectNumber: ' ',
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
                                    valueElements: ' '
                                }
                            },

                        }
                        features.push(circleMarkerFeature);
                        console.log('layer 1 marker: ', layer);
                        console.log('circleMarker 1: ', circleMarkerFeature);

                    }


                } else if (layer instanceof L.Marker) {
                    let featureMarker;
                    // Handle L.Marker specifically
                    const position = layer.getLatLng();
                    featureMarker = {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [position.lng, position.lat]
                        },
                        properties: {
                            isMarker: true,
                            id: layer.options.id || uuidv4(), // Ensure each feature has a unique ID
                            attributes: layer.options.attributes || {
                                // Default attributes, can be customized
                                objectNumber: ' ',
                                inventoryLevel: ' ',
                                natureValueClass: ' ',
                                preliminaryAssessment: ' ',
                                reason: ' ',
                                natureType: ' ',
                                habitat: ' ',
                                date: ' ',
                                executor: ' ',
                                organization: ' ',
                                projectName: ' ',
                                area: ' ',
                                species: ' ',
                                habitatQualities: ' ',
                                valueElements: ' ',
                            }
                        }
                    };
                    features.push(featureMarker);
                }



                else {
                    // For other shapes, use the default toGeoJSON method
                    const layerFeature = layer.toGeoJSON();
                    const UUID = uuidv4();
                    layerFeature.properties.id = UUID;
                    layerFeature.properties.attributes = {
                        objectNumber: ' ',
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
                    //setIsRectangleDrawn(false);
                }

            });

            if (features == 0 || features == null || features == undefined || features == '') {
                //setIsRectangleDrawn(false);
            }

            const geoJson = {
                type: 'FeatureCollection',
                features: features
            };


            setGeoJsonData(geoJson);


            console.log('updateGeojson: ', geoJson);

        }
    };


    const onCreate = (e) => {
        const newLayer = e.layer;
        newLayer.options.id = uuidv4(); // Ensure each layer has a unique ID

        // Default attributes for all shapes
        newLayer.options.attributes = {
            objectNumber: ' ',
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

        let feature;
        if (newLayer instanceof L.Circle) {
            const center = newLayer.getLatLng();
            const radius = newLayer.getRadius();

            // Create a GeoJSON feature for the circle
            feature = {
                type: 'Feature',
                properties: {
                    isCircle: true,
                    id: newLayer.options.id,
                    radius: radius, // Save radius in meters
                    attributes: newLayer.options.attributes
                },
                geometry: {
                    type: 'Point',
                    coordinates: [center.lng, center.lat]
                }
            };

        } else if (newLayer instanceof L.CircleMarker) {
            const center = newLayer.getLatLng();
            feature = {
                type: 'Feature',
                properties: {
                    isCircleMarker: true,
                    id: newLayer.options.id,
                    radius: newLayer.getRadius(), // Radius in pixels
                    attributes: newLayer.options.attributes
                },
                geometry: {
                    type: 'Point',
                    coordinates: [center.lng, center.lat]
                }
            };
        }




        if (newLayer instanceof L.Polygon && !(newLayer instanceof L.Rectangle)) {
            // Get the first array of LatLngs for the first polygon (ignores holes)
            const latlngs = newLayer.getLatLngs()[0];
            const coordinates = latlngs.map((latlng) => [latlng.lng, latlng.lat]);

            // Ensure the polygon is closed by adding the first point at the end
            if (coordinates[0] !== coordinates[coordinates.length - 1]) {
                coordinates.push(coordinates[0]);
            }

            feature = {
                type: 'Feature',
                properties: {
                    isPolygon: true,
                    id: newLayer.options.id,
                    attributes: newLayer.options.attributes
                },
                geometry: {
                    type: 'Polygon',
                    coordinates: [coordinates]
                }
            };
        }


        if (newLayer instanceof L.Rectangle) {
            const bounds = newLayer.getBounds();
            feature = {
                type: 'Feature',
                properties: {
                    isRectangle: true,
                    id: newLayer.options.id,
                    attributes: newLayer.options.attributes
                },
                geometry: {
                    type: 'Polygon',
                    coordinates: [[
                        [bounds.getSouthWest().lng, bounds.getSouthWest().lat],
                        [bounds.getNorthWest().lng, bounds.getNorthWest().lat],
                        [bounds.getNorthEast().lng, bounds.getNorthEast().lat],
                        [bounds.getSouthEast().lng, bounds.getSouthEast().lat],
                        [bounds.getSouthWest().lng, bounds.getSouthWest().lat] // Close the loop
                    ]]
                }
            };
        }


        if (newLayer instanceof L.Polyline && !(newLayer instanceof L.Polygon)) {
            const latlngs = newLayer.getLatLngs();
            const coordinates = latlngs.map(latlng => [latlng.lng, latlng.lat]);
            feature = {
                type: 'Feature',
                properties: {
                    isPolyline: true,
                    id: newLayer.options.id,
                    attributes: newLayer.options.attributes
                },
                geometry: {
                    type: 'LineString',
                    coordinates: coordinates
                }
            };
        }


        if (newLayer instanceof L.Marker) {
            const position = newLayer.getLatLng();
            newLayer.options.id = newLayer.options.id || uuidv4();
            feature = {
                type: 'Feature',
                properties: {
                    isMarker: true,
                    id: newLayer.options.id,
                    attributes: newLayer.options.attributes
                },
                geometry: {
                    type: 'Point',
                    coordinates: [position.lng, position.lat]
                }
            };
        }




        if (feature) {
            setGeoJsonData((prevData) => ({
                // Use a fallback for prevData in case it's null or undefined
                ...prevData || { type: 'FeatureCollection', features: [] },
                features: [
                    // Spread the existing features, if there are any
                    ...(prevData?.features || []),
                    // Add the new feature
                    feature,
                ],
            }));
        } else {
            updateGeoJsonCreate();
        }

        console.log('create layer: ', newLayer);
    };


    const onEdited = (e) => {


        updateGeoJsonEditDel(); // Update GeoJSON when shapes are edited
    };

    const onDeleted = (e) => {

        // Check if a rectangle has been deleted
        const { layers } = e;
        layers.eachLayer((layer) => {
            if (layer.feature && layer.feature.properties.shape === "rectangleCrop") {
                // Show the RectangleDrawButton if the deleted layer is a rectangle
                setShowRectangleButton(true);
            }
        });

        updateGeoJsonEditDel(); // Update GeoJSON data if necessary
    };


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
                    updateGeoJsonCreate();
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

        // Update GeoJSON state
        setGeoJsonData({ ...geoJsonData, features: updatedFeatures });
        setSelectedId(null); // Deselect the current feature
    };

    // useEffect hook to synchronize layer options with geoJsonData changes
    useEffect(() => {
        syncLayerAttributes();
    }, [geoJsonData]); // Dependency array ensures this runs only when geoJsonData changes



    const syncLayerAttributes = () => {
        if (featureGroupRef.current) {
            featureGroupRef.current.eachLayer((layer) => {
                const correspondingFeature = geoJsonData.features.find(feature => feature.properties.id === layer.options.id);
                if (correspondingFeature && correspondingFeature.properties.attributes) {
                    // Ensure layer.options.attributes exists before trying to assign to it
                    if (!layer.options.attributes) {
                        layer.options.attributes = {};
                    }

                    // Update layer.options.attributes
                    Object.assign(layer.options.attributes, correspondingFeature.properties.attributes);
                }
                //console.log('sync full layer: ', layer);
                //console.log('options layer: ', layer.options);
            });
        }
    };



    // Function to handle row clicks and feature highlighting
    const handleRowClick = (featureId, attributes, event) => {
        setHighlightedIds(prevHighlightedIds => {
            const newHighlightedIds = new Set(prevHighlightedIds);
            setSelectedId(featureId);
            setAttributesObject(attributes || {});
            setShowAttributeTable(true); // Show the attribute table

            if (event.ctrlKey) {
                if (newHighlightedIds.has(featureId)) {
                    newHighlightedIds.delete(featureId);
                } else {
                    newHighlightedIds.add(featureId);
                }
            } else {
                newHighlightedIds.clear();
                newHighlightedIds.add(featureId);
            }

            return newHighlightedIds;
        });

        // Update the map to reflect the new highlighted features
        updateMapHighlights();
    };

    const updateMapHighlights = () => {
        if (featureGroupRef.current) {
            featureGroupRef.current.eachLayer(layer => {
                // Check if the layer has a feature with a properties object and an id property
                if (layer.feature && layer.feature.properties && 'id' in layer.feature.properties) {
                    // Check if the layer supports the setStyle method
                    if (typeof layer.setStyle === 'function') {
                        if (highlightedIds.has(layer.feature.properties.id)) {
                            // Highlight the layer
                            layer.setStyle({
                                color: 'red', // Example highlight color
                                weight: 5, // Example weight
                            });
                        } else {
                            // Reset the layer style to default
                            layer.setStyle({
                                color: '#3388ff', // Default color
                                weight: 2, // Default weight
                            });
                        }
                    }
                }
            });
        }
    };




    // Call updateMapHighlights in useEffect to ensure highlights are updated when highlightedIds changes
    useEffect(() => {
        updateMapHighlights();
    }, [highlightedIds]);


    // Mapping of attribute property keys to custom display names
    const attributeDisplayNameMap = {
        area: "Area",
        date: "Datum",
        executer: "Utförare",
        habitat: "Biotop",
        habitatQualities: "Biotopkvaliteter",
        inventoryLevel: "Inventeringsnivå",
        natureType: "Naturtyp",
        natureValueClass: "Naturvärdesklass",
        objectNumber: "Objektnummer",
        organsation: "Organisation",
        preliminaryAssesment: "Preliminär bedömning",
        projectName: "Projektnamn",
        reason: "Motivering",
        species: "Arter",
        valueElements: "Värdeelement",
        // Add more mappings as needed
    };

    const renderAttributeSectionList = () => {
        // Initialize attributesObject with default values if no object is selected
        const editableAttributesObject = attributesObject || Object.keys(attributeDisplayNameMap).reduce((acc, key) => {
            acc[key] = ''; // Initialize all attributes with empty strings or default values
            return acc;
        }, {});

        return (
            <div className="attributes-container">
                <h3>Ändra markerad objekt</h3>
                {Object.entries(editableAttributesObject).map(([key, value], index) => (
                    <div key={index} className="attribute-field">
                        <label htmlFor={`attribute-${key}`}>{attributeDisplayNameMap[key] || key}:</label>
                        <input
                            id={`attribute-${key}`}
                            type="text"
                            value={value}
                            onChange={(e) => {
                                // Update attributesObject with new values only if an object is selected
                                if (selectedId) {
                                    setAttributesObject({
                                        ...editableAttributesObject,
                                        [key]: e.target.value,
                                    });
                                }
                            }}
                        />
                    </div>

                ))}
                <button onClick={() => saveAttributes()}>Spara</button>
            </div>
        );
    };



    const renderAttributeList = () => {

        return (
            <div>
                {!shouldHide &&
                    <div className='map-container elementToHide'>
                        <h3>Projektkarta</h3>
                        <button className="toggle-form-button" onClick={saveDataToServer}>Spara ritning!</button>
                        <span className="save-status">{saveStatus}</span>
                        <p>Tryck på kartobjekt för att se attribut.</p>
                        {selectedId && attributesObject && showAttributeTable && (
                            <div className="attributes-container">
                                <h3>Objektattribut</h3>
                                <label>
                                    Objektnummer:
                                    <input
                                        type="text"
                                        value={attributesObject.objectNumber || ''}
                                        onChange={(e) => setAttributesObject({ ...attributesObject, objectNumber: e.target.value })}
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


                                <button
                                    className="toggle-additional-fields"
                                    onClick={() => setShowAdditionalFields(!showAdditionalFields)}
                                >
                                    Tillägg
                                </button>

                                {showAdditionalFields && (
                                    <>
                                        <label>
                                            Arter:
                                            <input
                                                type="text"
                                                value={attributesObject.species || ''}
                                                onChange={(e) => setAttributesObject({ ...attributesObject, species: e.target.value })}
                                            />
                                        </label>
                                        <label>
                                            Habitatkvaliteter:
                                            <input
                                                type="text"
                                                value={attributesObject.habitatQualities || ''}
                                                onChange={(e) => setAttributesObject({ ...attributesObject, habitatQualities: e.target.value })}
                                            />
                                        </label>
                                        <label>
                                            Värdeelement:
                                            <input
                                                type="text"
                                                value={attributesObject.valueElements || ''}
                                                onChange={(e) => setAttributesObject({ ...attributesObject, valueElements: e.target.value })}
                                            />
                                        </label>
                                    </>
                                )}

                                {/* Additional attributes like Species, Habitat Qualities, Value Elements can be added similarly */}
                                <button className="save-attributes-btn" onClick={saveAttributes}>Spara</button>
                                <button className="cancel-btn" onClick={() => setSelectedId(null)}>Avbryt</button>
                            </div>
                        )}



                        <label htmlFor="file-upload" className="custom-file-upload">
                            Importera shapefil
                        </label>
                        <input id="file-upload" className="project-import-input" type="file" onChange={handleFileUploadShape} style={{ display: 'none' }} />

                    </div>
                }
            </div>
        )
    }

    const renderAttributeTable = () => {
        // Ensure geoJsonData is not null and has features before proceeding
        if (!geoJsonData || !geoJsonData.features) {
            return <div>Loading data...</div>; // Or any other placeholder content
        }


        // Collect all unique attribute names across all features
        const allAttributeNames = new Set();
        geoJsonData.features.forEach(feature => {
            if (feature.properties && feature.properties.attributes) {
                Object.keys(feature.properties.attributes).forEach(attrName => {
                    allAttributeNames.add(attrName);
                });
            }
        });

        // Convert the Set to an array for mapping
        const attributeNames = Array.from(allAttributeNames);

        const filteredFeatures = geoJsonData.features.filter(feature => {
            if (feature.properties.shape === "rectangleCrop") {
                return false;
            }
            if (activeTab === 'Punkter') {
                // Only include point features for the "Points" tab
                return feature.properties.isMarker || feature.properties.isPoint;
            } else if (activeTab === 'Linjer') {
                // Only include line features for the "Lines" tab
                return feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString';
            } else if (activeTab === 'Polygoner') {
                // Only include polygon features for the "Polygons" tab
                return feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon' || feature.properties.isCircleMarker || feature.properties.isCircle;
            }
            // Default case to include all features if no tab matches
            return true;
        });




        const highlightFeature = (featureId) => {
            if (featureGroupRef.current) {
                setHighlightedId(featureId); // Set the highlighted feature's ID
                featureGroupRef.current.eachLayer(layer => {

                    // Check if the layer has associated feature properties
                    const properties = layer.feature ? layer.feature.properties : null;

                    // Debugging logs
                    console.log("highlight: layer type:", properties);
                    console.log("highlight: layer:", layer);
                    console.log("highlight: feature id:", featureId, "Layer ID:", layer.options.id);


                    // Reset the style for non-highlighted layers
                    if (layer instanceof L.Path && (!properties || properties.shape !== "rectangleCrop")) {
                        layer.setStyle({
                            color: '#3388ff', // Default color
                            fillColor: '#3388ff', // Default fill color
                            fillOpacity: 0.2, // Default fill opacity
                            weight: 3  // Default weight
                        });
                    }



                    // Reset to default marker icon for non-highlighted markers

                    if (layer instanceof L.Marker && !(highlightedIds.size > 1)) {
                        layer.setIcon(dotIconBlue);
                        console.log("highlightedIds", highlightedIds);
                        console.log("selectedRowIds", selectedRowIds);
                    }




                    // Apply the highlight style to the target feature
                    if (layer.options.id === featureId || layer.feature && layer.feature.properties.id === featureId) {


                        if (layer instanceof L.Marker) {
                            // Use the custom diamond icon for the highlighted marker
                            layer.setIcon(dotIconRed);
                        } else if (properties && properties.shape === "rectangleCrop") {
                            // Special handling for "rectangleCrop" shapes
                            layer.setStyle({
                                color: 'red', // Highlight color for rectangleCrop
                                fillColor: 'green',
                                weight: 5 // Highlight weight for rectangleCrop
                            });
                        } else if (layer instanceof L.Circle) {
                            // Apply a different style for circles
                            layer.setStyle({
                                color: 'red', // Highlight color
                                fillOpacity: 0.2,
                                weight: 5
                            });
                        }
                    }
                });
            }
        };


        const handleAttributeValueChange = (featureId, attributeName, newValue) => {
            setHighlightedIds(prev => new Set(prev).add(featureId));
            // Create a deep copy of the geoJsonData to avoid direct state mutation
            const updatedGeoJsonData = JSON.parse(JSON.stringify(geoJsonData));

            //highlightFeature(featureId); // Highlight the feature when its attribute is being edited

            // Find the feature by its ID and update the attribute value
            const featureToUpdate = updatedGeoJsonData.features.find(feature => feature.properties.id === featureId);
            if (featureToUpdate && featureToUpdate.properties.attributes) {
                featureToUpdate.properties.attributes[attributeName] = newValue;
            }

            // Update the state with the modified geoJsonData
            setGeoJsonData(updatedGeoJsonData);
        };


        //console.log(selectedProject);


        return (
            <div>
                {shouldHide && <div className="elementToHide">
                    <button className="toggle-form-button-2" onClick={saveDataToServer}>Spara ritning! {saveStatus}</button>
                </div>}

                <div className="attributes-container">
                    <h3>{activeTab}</h3>

                    <div className="tabs">
                        <button className={activeTab === 'Punkter' ? 'active' : ''} onClick={() => setActiveTab('Punkter')}>Punkter</button>
                        <button className={activeTab === 'Linjer' ? 'active' : ''} onClick={() => setActiveTab('Linjer')}>Linjer</button>
                        <button className={activeTab === 'Polygoner' ? 'active' : ''} onClick={() => setActiveTab('Polygoner')}>Polygoner</button>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th className='th-index'>#</th>
                                <th className='th-karta'>Karta</th> {/* Additional column for highlight button */}
                                {/* Assuming attributeNames is defined and accessible */}
                                {attributeNames.map((name, index) => (
                                    <th key={index}>{attributeDisplayNameMap[name] || name}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {/* Mapping through your geoJsonData */}
                            {
                                filteredFeatures.map((feature, featureIndex) => (
                                    feature.properties.attributes ? (
                                        <tr key={featureIndex} className={highlightedIds.has(feature.properties.id) ? 'highlighted-row' : ''}
                                            onClick={(event) => handleRowClick(feature.properties.id, feature.properties.attributes, event)}>
                                            <td>
                                                <span style={{ marginLeft: '0px' }}>{featureIndex + 1}</span>
                                            </td>

                                            <td className='td-markera'>
                                                <button
                                                    className={highlightedId === feature.properties.id ? 'highlighted' : ''}
                                                    onClick={() => highlightFeature(feature.properties.id)}
                                                >
                                                    O
                                                </button>

                                            </td>
                                            {attributeNames.map((name, index) => (
                                                <td key={`${featureIndex}-${index}`}>
                                                    <input
                                                        type="text"
                                                        value={feature.properties.attributes[name] || ''}
                                                        onChange={(e) => handleAttributeValueChange(feature.properties.id, name, e.target.value)}
                                                    />


                                                </td>
                                            ))}
                                        </tr>
                                    ) : null
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };


    const renderMap = () => {
        return (
            <div>
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
                        />
                        {shapeLayers && shapeLayers.map((feature, index) => (
                            <GeoJSON key={index} data={feature} />
                        ))}
                    </FeatureGroup>
                    <RectangleDrawButton isRectangleDrawn={isRectangleDrawn} setIsRectangleDrawn={setIsRectangleDrawn} />
                </MapContainer>
                {renderAttributeTable()}
            </div>
        )
    }

    // Top Bar JSX
    const renderTopBar = () => {
        /*
                return (
                    <div className="top-bar">
                        <div className="top-bar-left"><h2>Projekt: {selectedProject.project_name}</h2></div>
                        <div className="top-bar-center">
                            <button className="top-bar-button">Filter</button>
                            <button className="top-bar-button">Rapport</button>
                            <button className="top-bar-button">Export</button>
                        </div>
                        <div className="top-bar-right">
                            
                            <div className="user-dropdown">
                                <span className="user-icon">👤</span>
                                <select>
                                    <option>User Info</option>
                                    <option>Logout</option>
                                </select>
                            </div>
                            
                        </div>
                    </div>
                );
                */
    };

    // Left Section JSX
    const renderLeftSection = () => {
        return (
            <div className="left-section">
                <div className="top-left">
                    <h2>{selectedProject.project_name}</h2>
                    <button>Kartläggning biologisk mångfald</button>
                    <button>Naturvärdesbiologi</button>
                    <button>Landskapsområden</button>
                    <div className="additional-section">
                        <h3>Tillägg:</h3>
                        <button>Example Button 1</button>
                        <button>Example Button 2</button>
                    </div>
                </div>
            </div>
        )
    };



    // Right Section JSX
    const renderRightSection = () => {
        const selectedMapObjectId = selectedId; // Dynamically set based on user interaction

        console.log("List 1", imageList[0]);

        // Use .reduce() to filter and match IDs more defensively
        const filteredImages = imageList.reduce((acc, image) => {
            // Check if image.mapObjectId exists and matches selectedMapObjectId
            if (image.mapObjectId && image.mapObjectId === selectedMapObjectId) {
                acc.push(image); // If a match is found, add the image to the accumulator array
            }
            return acc; // Return the accumulator for the next iteration
        }, []); // Initialize the accumulator as an empty array

        console.log('imageList:', imageList);
        console.log('Filtered Images:', filteredImages);
        //console.log('Filtered Images 2:', filteredImages2);


        // Function to handle image click: set the selected image for fullscreen view
        const handleImageClick = (image) => {
            setFullscreenImage(image);
        };
    
        // Function to close fullscreen view
        const closeFullscreen = () => {
            setFullscreenImage(null);
        };

// Display filtered images in a grid, three in a row
const miniatureView = (
    <div className="image-display-section">
        {filteredImages.map((image, index) => (
            <div key={index} className="image-wrapper" onClick={() => handleImageClick(image)}>
                <img src={image.url} alt={`Uploaded ${index}`} className="miniature-image" />
            </div>
        ))}
    </div>
);

// Fullscreen view for the selected image
const fullscreenView = fullscreenImage && (
    <div className="fullscreen-view">
        <img src={fullscreenImage.url} alt="Fullscreen" className="fullscreen-image" />
        <div className="image-info">
            <p>{fullscreenImage.caption}</p>
            <button onClick={closeFullscreen} className="close-fullscreen-btn">Stäng</button>
        </div>
    </div>
);


        return (
            <div className="right-section">
                <div className="top-right">
                    <button className="top-bar-button">Filter</button>
                    <button className="top-bar-button">Rapport</button>
                    <button className="top-bar-button">Export</button>
                </div>

                {renderAttributeSectionList()}
                
                <h3>Bilder</h3>
                {fullscreenImage ? fullscreenView : miniatureView}



            </div>
        );
    };




    // Main Render Function (within MapTest component)
    return (
        <div className="data-analysis-page">
            {renderTopBar()}
            <div className="content-area">
                {renderLeftSection()}
                <div className="map-container">{renderMap()}</div>
                {renderRightSection()}
            </div>
        </div>
    );

};
// Export the Map component
export default MapTest;