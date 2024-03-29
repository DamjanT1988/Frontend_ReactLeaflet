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

//-- LEAFLET COMPONENT
const { BaseLayer } = LayersControl;

//-- ICONS
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

//-- TRANSLATION OF LEAFLET TO SWEDISH
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

//-- COMPONENT
window.toggleAttributeContainer = (id, attributes) => {
    // Function implementation will be set in the component
};

//-- ADJUST THE MAP/TABLE HEIGHT
const DraggableLine = ({ onDrag }) => {
    // Create a ref for the draggable line element
    const lineRef = useRef(null);
    const lastDragTime = useRef(Date.now());
    const dragUpdateScheduled = useRef(false);

    // Function to handle the drag event
    const handleDrag = (movementY) => {
        // Use requestAnimationFrame for smoother updates
        if (!dragUpdateScheduled.current) {
            dragUpdateScheduled.current = true;
            requestAnimationFrame(() => {
                // Ensure at least a small delay between updates to smooth out the dragging
                const now = Date.now();
                if (now - lastDragTime.current > 50) { // Adjust the delay as needed for smoother dragging
                    onDrag(movementY);
                    lastDragTime.current = now;
                }
                dragUpdateScheduled.current = false;
            });
        }
    };

    // Add event listeners when the component mounts
    useEffect(() => {
        const line = lineRef.current;

        // Event listener for mouse down on the draggable line
        const startDrag = (e) => {
            e.preventDefault(); // Prevent default to avoid text selection
            const initialY = e.clientY;

            // Event listener for mouse move and mouse up on the window
            const doDrag = (e) => {
                const movementY = e.clientY - initialY;
                handleDrag(movementY);
            };

            // Event listener for mouse up on the window
            const stopDrag = () => {
                window.removeEventListener('mousemove', doDrag);
                window.removeEventListener('mouseup', stopDrag);
            };

            window.addEventListener('mousemove', doDrag);
            window.addEventListener('mouseup', stopDrag);
        };

        line.addEventListener('mousedown', startDrag);

        // Cleanup
        return () => {
            line.removeEventListener('mousedown', startDrag);
        };
    }, [onDrag]);

    // Return the draggable line element
    return <div ref={lineRef} className="draggable-line"></div>;
};


// Define the Map component
const MapTest = ({ selectedProjectId, selectedProject, userID, shouldHideDataView }) => {
    //-- STATES
    // For map
    const featureGroupRef = useRef(null);
    const position = [51.505, -0.09];
    const zoom = 11;
    // For functions
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
    //const [highlightedFeatureId, setHighlightedFeatureId] = useState(null);
    const [selectedRowIds, setSelectedRowIds] = useState(new Set());
    const [highlightedIds, setHighlightedIds] = useState(new Set());
    const [activeTab, setActiveTab] = useState('Punkter');
    //const [selectedMarkerId, setSelectedMarkerId] = useState(null);
    const [lastClickedMarker, setLastClickedMarker] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imageList, setImageList] = useState([]);
    const [fullscreenImage, setFullscreenImage] = useState(null); // State to track the selected image for fullscreen view
    const [captionText, setCaptionText] = useState(''); // New state for caption text
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [imageToDelete, setImageToDelete] = useState(null);
    const [selectedFeatureIds, setSelectedFeatureIds] = useState(new Set());
    const [savedObjectIds, setSavedObjectIds] = useState(new Set());
    const [isDrawingMode, setIsDrawingMode] = useState(false);
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 }); // State for the image size
    const [imageBase64, setImageBase64] = useState(null); // State for the image size
    const [showReplacePrompt, setShowReplacePrompt] = useState(false);
    const [pendingDrawing, setPendingDrawing] = useState(null);
    //const [showSavePrompt, setSavePrompt] = useState(false);
    //const [mapHeight, setMapHeight] = useState("59vh"); // Default height
    const mapRef = useRef(null);
    const [mapInstance, setMapInstance] = useState(null);
    const [mapHeight, setMapHeight] = useState(550); // Initial map height
    const [attributesContainerHeight, setAttributesContainerHeight] = useState(300); // Initial height for the attributes container
    const [allItems, setAllItems] = useState([]); // State to store all items
    const [selectedItems, setSelectedItems] = useState(new Set()); // State to track selected item IDs
    const [viewMode, setViewMode] = useState('all'); // 'all' or 'selected'
    const [addStatus, setAddStatus] = useState(''); // State for the add status message
    const [addStatusObject, setAddStatusObject] = useState(''); // State for the add status message
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [selectedKartlaggningstyp, setSelectedKartlaggningstyp] = useState(''); //MUST BE BLANK
    const mapObjectClickedRef = useRef(false);
    const [showList, setShowKartlaggningList] = useState(false);
    const [selectedKartlaggningOptions, setSelectedKartlaggningOptions] = useState([]);
    //const [selectedKartlaggningValue, setSelectedKartlaggningValue] = useState(null);
    const [showLagerhanteringPopup, setShowLagerhanteringPopup] = useState(false);
    const [kartlaggningstypOptions, setKartlaggningstypOptions] = useState({
        KartlaggningBiologiskMangfald: "Kartläggning biologisk mångfald",
        Artforekomst_punkt: "Artförekomst P",
        Artforekomst_yta: "Artförekomst Y",
        Bottenmiljo_punkt: "Bottenmiljö P",
        Bottenmiljo_yta: "Bottenmiljö Y",
        GenSkBiotopskyddsomr_punkt: "Generellt skyddat biotopskyddsomr. P",
        GenSkBiotopskyddsomr_yta: "Generellt skyddat biotopskyddsomr. Y",
        LivsmiljO_punkt: "Livsmiljö P",
        LivsmiljO_yta: "Livsmiljö Y",
        Natura2000Naturtyp: "Natura 2000-naturtyp",
        Naturvardestrad_punkt: "Naturvärdesträd P",
        Naturvardestrad_yta: "Naturvärdesträd Y",
        NVILandskapsomrade: "NVI Landskapsområde",
        NVINaturvardesbiotop: "NVI Naturvärdesbiotop",
        OvrigBiotop: "Övrig biotop",
        SarskSkyddsvTrad_punkt: "Särskilt skyddsvärda träd P",
        SarskSkyddsvTrad_yta: "Särskilt skyddsvärda träd Y",
        Smavatten_punkt: "Småvatten P",
        Smavatten_yta: "Småvatten Y",
        Vardeelement_punkt: "Värdeelement P",
        Vardeelement_yta: "Värdeelement Y",
        VattendragDelstracka: "Vattendrag delsträcka",
    });
    //const [showValueElementOptions, setShowValueElementOptions] = useState(false);
    const [geometryFilterPoint, setGeometryFilterPoint] = useState(false);
    const [geometryFilterPolygon, setGeometryFilterPolygon] = useState(false);
    const [showNewKartering, setShowNewKartering] = useState(false);

    //-- MAP CLICK RESET
    const MapEventsComponent = () => {
        const map = useMapEvents({
            // Event listener for map click
            click: () => {
                if (!mapObjectClickedRef.current) {
                    console.log("Map clicked, resetting selection and styles");

                    if (highlightedId === null && selectedId === null && selectedFeatureIds.size === 0 && savedObjectIds.size === 0) {
                        setImageList([]);
                    } // BEFORE THE RESET - MUST BE AT TOP

                    // Reset selection states
                    setSelectedId(null);
                    setHighlightedId(null);
                    setAttributesObject(null);

                    // Reset styles for all layers in the feature group
                    featureGroupRef.current.eachLayer(layer => {
                        // Check the type of layer and reset to default styles accordingly
                        if (layer instanceof L.Marker) {
                            // Reset marker icon to default
                            layer.setIcon(dotIconBlue); // Assuming dotIconBlue is your default marker icon
                        } else if (layer instanceof L.CircleMarker) {
                            // Reset circle or circle marker style
                            layer.setStyle({
                                color: '#3388ff', // Default stroke color
                                fillColor: '#3388ff', // Default fill color
                                fillOpacity: 0.2, // Default fill opacity
                                weight: 2, // Default stroke weight
                            });
                        } else if (layer instanceof L.Polygon || layer instanceof L.Polyline) {
                            // Reset polygon or polyline style
                            layer.setStyle({
                                color: '#3388ff', // Default stroke color
                                fillColor: '#3388ff', // Default fill color
                                fillOpacity: 0.2, // Default fill opacity
                                weight: 2, // Default stroke weight
                            });
                        }

                    });
                }
                mapObjectClickedRef.current = false;


            },
        });

        return null;
    };

    //-- DRAG MAP RESIZE
    const handleDrag = (movementY) => {
        // Function to handle the drag event and update the map height
        setMapHeight((prevHeight) => Math.max(prevHeight + movementY, 0), mapHeight); // Ensure map height doesn't go below a minimum (e.g., 100px)
        setAttributesContainerHeight((prevHeight) => Math.max(prevHeight - movementY, 0)); // Increase attributes container height as map height decreases
    };

    //-- DRAWING
    const Canvas = ({ width, height, onClose, onSave }) => {
        // Create a ref for the canvas element
        const canvasRef = useRef(null);

        useEffect(() => {
            // Set the width and height of the canvas element
            const canvas = canvasRef.current;
            if (canvas) {
                canvas.width = width;
                canvas.height = height;
            }
        }, [width, height]);

        // Function to capture the drawing as a base64 image
        const captureDrawing = () => {
            if (canvasRef.current) {
                // Get the base64 image data from the canvas
                const dataURL = canvasRef.current.toDataURL('image/png');
                onSave(dataURL); // Pass the base64 image data to the onSave callback
                console.log('dataURL: ', dataURL);
            }
        };

        // Function to handle mouse down event
        const handleMouseDown = (e) => {
            // Set the drawing mode to true
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            ctx.beginPath();
            ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        };

        // Function to handle mouse move event
        const handleMouseMove = (e) => {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            ctx.lineTo(e.offsetX, e.offsetY);
            ctx.stroke();
        };

        // Function to handle mouse up event
        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        return (
            <div>
                {isDrawingMode && (
                    <>
                        <div className="canvas-container" style={{
                            position: 'absolute',
                            top: 0,
                            bottom: 0,
                            left: 0,
                            right: 0,
                            width: '100%',
                            height: '100%',
                            justifyContent: 'center',
                            alignItems: 'center',
                            display: 'flex',
                            zIndex: 100
                        }}>
                            <canvas ref={canvasRef} width={width} height={height} onMouseDown={handleMouseDown} />
                            <button className='confirmation-dialog-draw-close' onClick={onClose}>Stäng</button>
                            <button className='confirmation-dialog-draw-save' onClick={captureDrawing}>Spara</button>
                        </div>
                    </>
                )}
            </div>
        );

    };

    //-- CTRL MULTIOBJECT SELECTION
    // Function to handle feature click with CTRL key support for multi-selection
    const handleFeatureClick = (featureId, layer, event) => {
        // If CTRL key is not pressed, clear selections and revert styles
        if (!event.originalEvent.ctrlKey) {
            // Clear the selectedFeatureIds set
            return;

        }

        // If CTRL key is pressed, add or remove the feature ID from the selectedFeatureIds set
        setSavedObjectIds(prevSelectedIds => {
            // Create a new set from the previous selected IDs
            const newSelectedIds = new Set(prevSelectedIds);

            if (newSelectedIds.has(featureId)) {
                newSelectedIds.delete(featureId);
                // Revert to original style when deselected
                //revertToOriginalStyle(layer);
            } else {
                newSelectedIds.add(featureId);
                // Apply the selected feature style

            }
            return newSelectedIds;
        });
    };

    //-- IMAGE TOGGLE
    const toggleDeleteConfirm = (image) => {
        setImageToDelete(image); // Set the image to delete with the full image object
        setShowDeleteConfirm(!showDeleteConfirm);
    };

    //-- DELETE IMAGE
    const handleDeleteImage = async () => {
        if (!imageToDelete) return; // Ensure imageToDelete is not null or undefined

        try {
            // Send the DELETE request to delete the image
            const response = await fetch(`${API_URLS.PROJECT_IMAGE_DELETE.replace('<int:image_id>', imageToDelete.id)}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            if (response.ok) {
                // Successfully deleted the image
                setImageList(imageList.filter(image => image.id !== imageToDelete.id)); // Remove the deleted image from the imageList state
                setShowDeleteConfirm(false); // Close the confirmation dialog
                setFullscreenImage(null); // Close the fullscreen view if the deleted image was being displayed
            } else {
                // Handle the error, e.g., show an error message to the user
                console.error('Failed to delete image');
            }
        } catch (error) {
            console.error('Error deleting image:', error);
        }
    };

    //-- UPLOAD IMAGE
    const uploadImage = async () => {
        // Ensure there is either an image file or a base64 string, and an ID is selected
        if (!selectedId || (!selectedImage && !imageBase64)) return;

        try {
            let base64Image;

            // If there's a selected image file, convert it to base64
            if (selectedImage) {
                // Function to convert a file to base64
                const toBase64 = file => new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = error => reject(error);
                });

                base64Image = await toBase64(selectedImage);
            } else {
                // If there's no selected image file, use the provided base64 string
                base64Image = imageBase64;
            }

            // Construct the payload with the base64 image data
            const payload = {
                projectId: selectedProjectId, // Include the selected project ID
                imageData: base64Image, // Include the base64 image data
                mapObjectId: selectedId, // Include the selected ID
                caption: captionText // Include the caption text
            };

            // Send the POST request to upload the image
            const response = await fetch(`${API_URLS.PROJECT_IMAGE_POST}`, {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
            });

            if (response.ok) {
                // Logic after successful upload
                setSelectedImage(null); // Reset the selected image file after successful upload
                setCaptionText(''); // Reset caption text after successful upload
                fetchImages(); // Fetch the updated image list after successful upload
                // Optionally reset the base64 image data here if needed
                setImageBase64(null);
                console.log('UPLOAD DONE');
            } else {
                console.error('Failed to upload image');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
        }
    };

    //-- FETCH IMAGES
    const fetchImages = async () => {
        try {
            // Fetch images for the selected project
            const response = await fetch(`${API_URLS.PROJECT_IMAGE_GET.replace('<int:project_id>', selectedProjectId)}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            if (response.ok) {
                // Logic after successful fetch
                const data = await response.json();
                console.log('image data: ', data);
                const images = data.images; // Use the 'images' key from the response
                setImageList(images.map(image => ({
                    id: image.id, // Include the image ID
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

    //-- HOOKS IMAGES
    useEffect(() => {
        if (imageBase64) {
            uploadImage(); // Call uploadImage here
        }
    }, [imageBase64]);

    useEffect(() => {
        fetchImages();
    }, [selectedProjectId]); // Re-fetch images when selectedProjectId changes

    //-- RESET STYLES OF ICON AND CIRCLE
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

    //-- CREATE CROP RECTANGLE
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
                // Extract the rectangle layer from the event
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

        if (!shouldHideDataView) {
            // Conditionally render the button based on showRectangleButton state
            return showRectangleButton ? (
                <button onClick={startRectangleDraw} className='draw-rectangle-btn'>
                    Beskär karta
                </button>
            ) : null;
        }
    };

    //-- REMOVE DUPLICATE RECTANGLES
    const removeDuplicateRectangles = () => {
        // Get all layers from the feature group
        const layers = featureGroupRef.current.getLayers();
        const rectangles = layers.filter(layer => layer instanceof L.Rectangle);
        let uniqueRectangles = [];

        rectangles.forEach(currentRect => {
            // Check if the current rectangle is already in the uniqueRectangles array
            const duplicateIndex = uniqueRectangles.findIndex(uniqueRect =>
                uniqueRect.getBounds().equals(currentRect.getBounds())
            );

            if (duplicateIndex === -1) {
                uniqueRectangles.push(currentRect);
            } else {
                // If a duplicate is found, remove the current rectangle if it has the "rectangleCrop" property
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

    //-- HOOK
    useEffect(() => {
        // Define a global function 'toggleAttributeContainer' on the window object
        window.toggleAttributeContainer = (id, attributes) => {
            // Always show the attribute table when the button is clicked
            setShowAttributeTable(true);
            // Set the selected ID
            setSelectedId(id);
            // Set the attributes object
            setAttributesObject(attributes);
        };

        // This function will be called when the component unmounts
        return () => {
            // Clean up the global function from the window object
            window.toggleAttributeContainer = undefined;
        };
        // The empty array [] means this effect will only run once, when the component mounts
    }, []);

    //-- HOOK RENDER
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

                    },

                    onEachFeature: (feature, layer) => {

                        layer.on('click', (event) => {
                            handleFeatureClick(feature.properties.id, layer, event);
                            // Additional logic for displaying attributes, etc.

                        });

                        layer.on('click', () => {
                            // Set the selected feature ID and its attributes for editing
                            mapObjectClickedRef.current = true;
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

                        if (feature.properties.shape === "rectangleCrop") {
                            foundCropRectangle = true; // Set the flag if a crop rectangle is found
                        }

                        if (!shouldHideDataView) {
                            // Generate popup content based on feature properties
                            const popupContent = generatePopupContent(feature.properties);

                            // Bind the popup to the layer
                            layer.bindPopup(popupContent);
                        }

                        if (feature.properties && feature.properties.isCircle) {
                            // If the feature is a circle, recreate it
                            const center = L.latLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]);
                            // Create a circle with the center and radius from the feature properties
                            const circle = L.circle(center, {
                                radius: feature.properties.radius,
                                id: feature.properties.id,
                                color: '#3388ff', // Default color
                                fillColor: '#3388ff', // Default fill color
                                fillOpacity: 0.2,
                                weight: 3,
                                radius: feature.properties.radius

                            });

                            if (!shouldHideDataView) {
                                // Generate popup content based on feature properties
                                const popupContent = generatePopupContent(feature.properties);
                                circle.bindPopup(popupContent); // Bind popup to circle
                            }

                            circle.options.id = feature.properties.id; // Assign the unique ID to the circle options for later reference

                            // Add the circle to the feature group
                            circle.addTo(featureGroupRef.current);

                            circle.on('click', (event) => {
                                handleFeatureClick(feature.properties.id, layer, event);
                                resetAllLayerStyles();
                                setHighlightedIds(new Set([feature.properties.id]));
                                //setHighlightedId(null); // Set the highlighted feature's ID
                                mapObjectClickedRef.current = true;
                                console.log('circle clicked: ', feature.properties.id);
                                setHighlightedId(feature.properties.id); // Set the highlighted feature's ID
                                circle.setStyle({
                                    color: 'red', // Change color to green upon click
                                    fillColor: '#3388ff', // Change fill color to green upon click
                                    fillOpacity: 0.2,
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

    //-- GENERATE POPUP CONTENT
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
            kartlaggningsTyp: 'Kartläggningstyp',
            kartlaggningsGeometry: 'Kartläggningsgeometri'
        };

        if (!shouldHideDataView) {
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

            const id = properties.id;
            const attributesJson = JSON.stringify(properties.attributes);
            content += `<button className='primary-btn' onclick='window.toggleAttributeContainer("${id}", ${attributesJson})'>Redigera objektattribut</button>`;

            content += '</div>';
            return content;
        }
    };

    //-- CREATE GREY AREA AROUND THE CROP AREA
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

    /*
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
    */

    //-- SAVE PROJECT DATA FILE
    const saveDataToServer = async () => {
        try {
            setSaveStatus('Sparar...');
            // Create a new object with the GeoJSON data and the saved object IDs
            const dataToSave = {
                ...geoJsonData, // Your existing GeoJSON data
                savedObjectIds: Array.from(savedObjectIds) // Convert Set to Array for serialization
            };
            // Send the data to the server
            const response = await fetch(`${API_URLS.PROJECT_FILES_POST}/${userID}/${selectedProjectId}/file`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify(dataToSave),
            });
            console.log('Server response: ', response);
            if (response.ok) {
                setSaveStatus('... kartdata sparad!');
                console.log('Data saved successfully', dataToSave);
                setTimeout(() => {
                    setSaveStatus('');
                }, 2500);
            } else {
                setSaveStatus('... fel i sparande av kartdata');
                console.error('Failed to save data');
                setTimeout(() => {
                    setSaveStatus('');
                }, 2000);
            }
        } catch (error) {
            setSaveStatus('No data to save');
            console.error('Error:', error);
            setTimeout(() => {
                setSaveStatus('');
            }, 2000);
        }
    };

    //-- GET PROJECT DATA FILE
    const loadDataFromServer = async () => {
        try {
            // Fetch the GeoJSON data from the server
            const response = await fetch(`${API_URLS.PROJECT_FILES_GET}/${userID}/${selectedProjectId}/file`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            if (response.ok) {
                // Assuming the response is a GeoJSON object
                const data = await response.json();
                if (data.features) {
                    setGeoJsonData(data); // Assuming the GeoJSON data is directly at the top level

                }
                if (data.savedObjectIds) {
                    // Map over the array and trim whitespace from each string
                    const trimmedObjectIds = data.savedObjectIds.map(id => id.trim());

                    setSavedObjectIds(new Set(trimmedObjectIds)); // Convert array back to Set
                    console.log('Saved object IDs:', trimmedObjectIds);
                }
                console.log('Loaded data:', data);
                setSelectedImage(null); // Reset the selected image after successful upload
            } else {
                console.error('Failed to load data');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    //-- HOOK LOAD DATA
    useEffect(() => {
        loadDataFromServer();
    }, []);

    //-- UPDATE GEOJSON AFTER EDIT AND DELETE
    const updateGeoJsonEditDel = () => {
        if (featureGroupRef.current) {
            const features = [];

            featureGroupRef.current.eachLayer(layer => {
                let layerFeature = layer.toGeoJSON();

                if (layer.isMask) {
                    // Skip mask layers
                    return;
                }

                // Use existing ID if present, otherwise assign a new unique ID
                layerFeature.properties.id = layerFeature.properties.id;

                //console.log('layerFeature ID: ', layerFeature.properties.id);

                // Handle circle and circle marker radius and type correctly
                if (layer instanceof L.Circle) {
                    // Preserve existing properties and add or update radius and type
                    layerFeature.properties = {
                        ...layerFeature.properties,
                        radius: layer.getRadius(),
                        isCircle: layer instanceof L.Circle,
                    };
                    console.log('layerFeature ID: ', layerFeature.properties.id);
                }

                if (layer instanceof L.CircleMarker) {
                    // Preserve existing properties and add or update radius and type
                    layerFeature.properties = {
                        ...layerFeature.properties,
                        radius: layer.getRadius(),
                        isCircleMarker: layer instanceof L.CircleMarker,
                    };
                    console.log('layerFeature ID: ', layerFeature.properties.id);
                }

                // Ensure attributes are updated or preserved
                layerFeature.properties.attributes = {
                    ...layerFeature.properties.attributes,
                    ...layer.options.attributes
                };

                features.push(layerFeature);
            });

            // Create a new GeoJSON object with the updated features
            const newGeoJsonData = {
                type: 'FeatureCollection',
                features: features
            };

            setGeoJsonData(newGeoJsonData);
        }
    };

    //-- UPDATE GEOJSON AFTER CREATE
    const updateGeoJsonCreate = () => {
        if (featureGroupRef.current) {
            const features = [];

            featureGroupRef.current.eachLayer(layer => {
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
                                    objectNumber: '',
                                    inventoryLevel: '',
                                    natureValueClass: '',
                                    preliminaryAssesment: '',
                                    reason: '',
                                    natureType: '',
                                    habitat: '',
                                    date: '',
                                    executer: '',
                                    organsation: '',
                                    projectName: '',
                                    area: '',
                                    species: '',
                                    habitatQualities: '',
                                    valueElements: '',
                                    kartlaggningsTyp: '',
                                    kartlaggningsGeometry: ''
                                }
                            }
                        };
                        features.push(circleFeature);
                        //console.log('Layer after 1: ', layer);
                        //console.log('Circlefeature after 2: ', circleFeature);
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
                                    kartlaggningsTyp: layer.options.attributes.kartlaggningsTyp,
                                    kartlaggningsGeometry: layer.options.attributes.kartlaggningsGeometry

                                }
                            }
                        };
                        features.push(circleFeature);
                        //console.log('Layer after 2: ', layer);
                        //console.log('Circlefeature after 2: ', circleFeature);
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
                                    objectNumber: '',
                                    inventoryLevel: '',
                                    natureValueClass: '',
                                    preliminaryAssesment: '',
                                    reason: '',
                                    natureType: '',
                                    habitat: '',
                                    date: '',
                                    executer: '',
                                    organsation: '',
                                    projectName: '',
                                    area: '',
                                    species: ' ',
                                    habitatQualities: '',
                                    valueElements: '',
                                    kartlaggningsTyp: '',
                                    kartlaggningsGeometry: ''
                                }
                            },

                        }
                        features.push(rectangleFeature);
                        //console.log('layer 1 rectangle: ', layer);
                        //console.log('rectangleFeature 1: ', rectangleFeature);
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
                        //console.log('layer 2 rectangle: ', layer);
                        //console.log('rectangleFeature 2: ', rectangleFeature);

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
                                    objectNumber: '',
                                    inventoryLevel: '',
                                    natureValueClass: '',
                                    preliminaryAssesment: '',
                                    reason: '',
                                    natureType: '',
                                    habitat: '',
                                    date: '',
                                    executer: '',
                                    organsation: '',
                                    projectName: '',
                                    area: '',
                                    species: '',
                                    habitatQualities: '',
                                    valueElements: '',
                                    kartlaggningsTyp: '',
                                    kartlaggningsGeometry: ''
                                }
                            },

                        }
                        features.push(polygonFeature);
                        //console.log('layer 1 polygon: ', layer);
                        //console.log('polygonFeature 1: ', polygonFeature);
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
                                    objectNumber: '',
                                    inventoryLevel: '',
                                    natureValueClass: '',
                                    preliminaryAssesment: '',
                                    reason: '',
                                    natureType: '',
                                    habitat: '',
                                    date: '',
                                    executer: '',
                                    organsation: '',
                                    projectName: '',
                                    area: '',
                                    species: '',
                                    habitatQualities: '',
                                    valueElements: '',
                                    kartlaggningsTyp: '',
                                    kartlaggningsGeometry: ''
                                }
                            },
                        }
                        features.push(polylineFeature);
                        //console.log('layer 1 polyline: ', layer);
                        //console.log('polylineFeature 1: ', polylineFeature);
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
                                    objectNumber: '',
                                    inventoryLevel: '',
                                    natureValueClass: '',
                                    preliminaryAssesment: '',
                                    reason: '',
                                    natureType: '',
                                    habitat: '',
                                    date: '',
                                    executer: '',
                                    organsation: '',
                                    projectName: '',
                                    area: '',
                                    species: '',
                                    habitatQualities: '',
                                    valueElements: '',
                                    kartlaggningsTyp: '',
                                    kartlaggningsGeometry: ''
                                }
                            },
                        }
                        features.push(circleMarkerFeature);
                        //console.log('layer 1 marker: ', layer);
                        //console.log('circleMarker 1: ', circleMarkerFeature);
                    }
                }
                else if (layer instanceof L.Marker) {
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
                                objectNumber: '',
                                inventoryLevel: '',
                                natureValueClass: '',
                                preliminaryAssesment: '',
                                reason: '',
                                natureType: '',
                                habitat: '',
                                date: '',
                                executer: '',
                                organsation: '',
                                projectName: '',
                                area: '',
                                species: '',
                                habitatQualities: '',
                                valueElements: '',
                                kartlaggningsTyp: '',
                                kartlaggningsGeometry: ''
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
                        objectNumber: '',
                        inventoryLevel: '',
                        natureValueClass: '',
                        preliminaryAssesment: '',
                        reason: '',
                        natureType: '',
                        habitat: '',
                        date: '',
                        executer: '',
                        organsation: '',
                        projectName: '',
                        area: '',
                        species: '',
                        habitatQualities: '',
                        valueElements: '',
                        kartlaggningsTyp: '',
                        kartlaggningsGeometry: ''
                    };

                    features.push(layerFeature);
                    //setIsRectangleDrawn(false);
                }

            });

            if (features == 0 || features == null || features == undefined || features == '') {
                //setIsRectangleDrawn(false);
            }

            // Create a GeoJSON object from the features
            const geoJson = {
                type: 'FeatureCollection',
                features: features
            };

            setGeoJsonData(geoJson);
            //console.log('updateGeojson: ', geoJson);
        }
    };

    //-- CREATE A MAP OBJECT
    const onCreate = (e) => {
        const newLayer = e.layer;
        newLayer.options.id = uuidv4(); // Ensure each layer has a unique ID

        // Default attributes for all shapes
        newLayer.options.attributes = {
            objectNumber: '',
            inventoryLevel: '',
            natureValueClass: '',
            preliminaryAssesment: '',
            reason: '',
            natureType: '',
            habitat: '',
            date: '',
            executer: '',
            organsation: '',
            projectName: '',
            area: '',
            species: '',
            habitatQualities: '',
            valueElements: '',
            kartlaggningsTyp: '',
            kartlaggningsGeometry: ''
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

        }
        else if (newLayer instanceof L.CircleMarker) {
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

        //console.log('create layer: ', newLayer);
    };

    //-- EDIT A MAP OBJECT
    const onEdited = (e) => {
        updateGeoJsonEditDel(); // Update GeoJSON when shapes are edited
    };

    //-- DELETE A MAP OBJECT
    const onDeleted = (e) => {
        const { layers } = e;

        // Check if a rectangle has been deleted
        layers.eachLayer((layer) => {
            if (layer.feature && layer.feature.properties.shape === "rectangleCrop") {
                // Show the RectangleDrawButton if the deleted layer is a rectangle
                setShowRectangleButton(true);
            }
        });

        updateGeoJsonEditDel(); // Update GeoJSON data if necessary
    };

    //-- HANDLE FILE UPLOAD
    const handleFileUploadShape = async (e) => {
        const file = e.target.files[0];
        if (file) {
            // Create a new FileReader
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    // Parse the shapefile
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

                    // Add unique IDs to each feature
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
                    //console.log('Parsed Features:', featuresArray);
                    //console.log('New GeoJSON Data:', newGeoJsonData);
                } catch (error) {
                    console.error('Error parsing shapefile:', error);
                }
            };
            reader.readAsArrayBuffer(file);
        }
    };

    //-- SAVE OBJECT ATTRIBUTES
    const saveAttributes = () => {
        // Find the feature with the selected ID
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
        setAddStatusObject('Objektattribut uppdaterat');
        setTimeout(() => {
            setAddStatusObject('');
        }, 2000);
    };

    //-- HOOK SYNC LAYER ATTRIBUTES
    useEffect(() => {
        syncLayerAttributes();
    }, [geoJsonData]); // Dependency array ensures this runs only when geoJsonData changes

    //-- SYNC LAYER ATTRIBUTES
    const syncLayerAttributes = () => {
        if (featureGroupRef.current) {
            featureGroupRef.current.eachLayer((layer) => {
                // Find the corresponding feature in the GeoJSON data
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

    //-- ROW FUNCTION IN TABLE
    // Function to handle row clicks and feature highlighting
    const handleRowClick = (featureId, attributes, event) => {
        setHighlightedIds(prevHighlightedIds => {
            // Create a new Set to avoid mutating state directly
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
        if (event.ctrlKey) {
            // If CTRL key is pressed, add or remove the feature from the selection
            setSelectedRowIds(prevSelectedRowIds => {
                const newSelectedRowIds = new Set(prevSelectedRowIds);

                if (newSelectedRowIds.has(featureId)) {
                    // If the feature is already selected, remove it from the selection
                    newSelectedRowIds.delete(featureId);
                } else {
                    // If the feature is not yet selected, add it to the selection
                    newSelectedRowIds.add(featureId);
                }
                return newSelectedRowIds;
            });
        }
        // Update the map to reflect the new highlighted features
        updateMapHighlights();
    };

    //-- UPDATE MAP HIGHLIGHTS
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
                    // Special handling for markers
                    if (layer instanceof L.Marker) {
                        if (highlightedIds.has(layer.feature.properties.id)) {
                            layer.setIcon(dotIconRed);
                        } else {
                            layer.setIcon(dotIconBlue);
                        }
                    }
                }
            });
        }
    };

    //-- HOOK UPDATE MAP HIGHLIGHTS
    useEffect(() => {
        updateMapHighlights();
    }, [highlightedIds]);

    //-- RENDER ATTRIBUTE SECTION LIST
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
        kartlaggningsTyp: "Kartläggningstyp",
        kartlaggningsKategori: "Kartläggningskategori"
        // Add more mappings as needed
    };

    //-- RENDER ATTRIBUTE SECTION LIST
    const renderAttributeSectionList = () => {
        // Initialize attributesObject with default values if no object is selected
        const editableAttributesObject = attributesObject || Object.keys(attributeDisplayNameMap).reduce((acc, key) => {
            acc[key] = ''; // Initialize all attributes with empty strings or default values
            return acc;
        }, {});

        // Function to handle changes to attribute values
        const handleAttributeChange = (attributeName, newValue) => {
            setAttributesObject({
                ...editableAttributesObject,
                [attributeName]: newValue,
            });
        };

        // Check if the current attributesObject has a kartlaggningsTyp that matches one of the options
        const headline = kartlaggningstypOptions[editableAttributesObject.kartlaggningsTyp] || "Objektattribut";

        return (
            <div className="attributes-container-object">
                <h3>{headline}</h3>
                {Object.entries(editableAttributesObject).map(([key, value], index) => (
                    <div key={index} className="attribute-field">
                        <label htmlFor={`attribute-${key}`}>{attributeDisplayNameMap[key] || key}:</label>
                        <input
                            id={`attribute-${key}`}
                            type="text"
                            value={value}
                            onChange={(e) => handleAttributeChange(key, e.target.value)}
                        />
                    </div>
                ))}
                <button onClick={() => saveAttributes()}>Spara</button><span className='addStatus'>{addStatusObject}</span>
                <label htmlFor="file-upload" className="file-upload-label">Lägg till en bild</label>
                <input id="file-upload" type="file" onChange={(e) => setSelectedImage(e.target.files[0])} accept="image/*" style={{ display: 'none' }} />
                {selectedImage && (
                    <>
                        <br />
                        <input type="text" value={captionText} onChange={(e) => setCaptionText(e.target.value)} placeholder="Lägg till text om bilden.." />
                        <br />
                        <button onClick={uploadImage}>Ladda upp</button>
                    </>
                )}
            </div>
        );
    };

    //-- RENDER ATTRIBUTE TABLE
    const renderAttributeTable = () => {
        // Ensure geoJsonData is not null and has features before proceeding
        if (!geoJsonData || !geoJsonData.features) {
            return <div>Loading data...</div>; // Or any other placeholder content
        }

        // Extract all attribute names from the GeoJSON data
        const allAttributeNames = new Set();
        geoJsonData.features.forEach(feature => {
            if (feature.properties && feature.properties.attributes) {
                Object.keys(feature.properties.attributes).forEach(attrName => {
                    allAttributeNames.add(attrName);
                });
            }
        });

        const attributeNames = Array.from(allAttributeNames);

        // Function to handle attribute value changes
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

        // Function to handle attribute value changes
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

        /*
        const toggleSelection = (itemId) => {
            setSelectedItems((prevSelectedItems) => {
                const newSelectedItems = new Set(prevSelectedItems);
                if (newSelectedItems.has(itemId)) {
                    newSelectedItems.delete(itemId);
                } else {
                    newSelectedItems.add(itemId);
                }
                return newSelectedItems;
            });
        };
        */

        // Function to handle row clicks and feature highlighting
        const showSelectedItems = () => {
            const filteredItems = allItems.filter(item => selectedItems.has(item.id));
            // Update your state or variable that controls the displayed items in the attribute table

            setViewMode('selected');
        };

        // Function to handle row clicks and feature highlighting
        const showAllItems = () => {
            setViewMode('all');
        };

        // Function to handle row clicks and feature highlighting
        const addSelectedToSavedObjects = () => {
            if (!selectedId && selectedRowIds.size === 0) {
                console.log('No selected objects to add');
                setAddStatus('Selektera objekt');
                setTimeout(() => setAddStatus(''), 2000);
                return;
            }

            setSavedObjectIds(prevSavedObjectIds => {
                const newSavedObjectIds = new Set(prevSavedObjectIds);
                if (selectedId) {
                    newSavedObjectIds.add(selectedId);
                }
                for (let id of selectedRowIds) {
                    newSavedObjectIds.add(id);
                }
                console.log('Updated savedObjectIds:', newSavedObjectIds);
                return newSavedObjectIds;
            });

            setAddStatus('Selekterade objekt lades till');
            setTimeout(() => setAddStatus(''), 2000);
        };

        // Function to clear savedObjectIds
        const clearSavedObjectIds = () => {
            setSavedObjectIds(new Set()); // Clears the set
            setAddStatus('Alla selekterade objekt rensades'); // Set the status message
            setTimeout(() => setAddStatus(''), 2000); // Clear the message after 3 seconds
        };

        // Function to delete selected objects
        const deleteSelectedObjects = () => {
            // Update savedObjectIds by removing highlightedIds or selectedRowIds
            setSavedObjectIds(prevSavedObjectIds => {
                // Create a new Set based on previous savedObjectIds to ensure immutability
                const updatedSavedObjectIds = new Set(prevSavedObjectIds);

                // Remove each highlightedId from the updatedSavedObjectIds
                highlightedIds.forEach(id => updatedSavedObjectIds.delete(id));

                // Alternatively, if you want to remove selectedRowIds, use:
                // selectedRowIds.forEach(id => updatedSavedObjectIds.delete(id));

                return updatedSavedObjectIds;
            });

            // Optionally, clear highlightedIds or selectedRowIds if needed
            setHighlightedIds(new Set());
            // setSelectedRowIds(new Set()); // Uncomment this line if you use selectedRowIds

            setAddStatus('Selekterade objekt borttagna'); // Set the status message
            setTimeout(() => setAddStatus(''), 2000); // Clear the message after 3 seconds
        };

        // Function to handle row clicks and feature highlighting
        const handleSort = (key) => {
            let direction = 'ascending';
            if (sortConfig.key === key && sortConfig.direction === 'ascending') {
                direction = 'descending';
            }
            setSortConfig({ key, direction });
        };

        // Function to compare values for sorting
        const compare = (a, b) => {
            if (a < b) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (a > b) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        };

        /*
        // Apply sorting to the data before rendering the table
        const sortedData = geoJsonData.features.sort((a, b) => {
            const aValue = a.properties.attributes[sortConfig.key];
            const bValue = b.properties.attributes[sortConfig.key];
            return compare(aValue, bValue);
        });
        */

        /*
        // Function to determine if there are features for a given geometry type and kartlaggningstyp
        const hasFeaturesForGeometry = (geometryType) => {
            return geoJsonData.features.some(feature => {
                const matchesGeometry = feature.geometry.type === geometryType;
                const matchesKartlaggningstyp = selectedKartlaggningstyp === '' || (feature.properties.attributes && feature.properties.attributes.kartlaggningsTyp === selectedKartlaggningstyp);
                return matchesGeometry && matchesKartlaggningstyp;
            });
        };
        */

        /*
        // Determine available geometries for the selected kartlaggningstyp
        const availableGeometries = {
            'Punkter': hasFeaturesForGeometry('Point') || hasFeaturesForGeometry('MultiPoint'),
            'Linjer': hasFeaturesForGeometry('LineString') || hasFeaturesForGeometry('MultiLineString'),
            'Polygoner': hasFeaturesForGeometry('Polygon') || hasFeaturesForGeometry('MultiPolygon')
        };
        */

        // Filter features based on selected criteria
        const filteredFeatures = geoJsonData.features.filter(feature => {
            if (feature.properties.shape === "rectangleCrop") {
                return false;
            }

            const matchesKartlaggningstyp = selectedKartlaggningOptions.length === 0 || selectedKartlaggningOptions.includes(feature.properties.attributes?.kartlaggningsTyp);

            //console.log(selectedKartlaggningOptions + ' ' + feature.properties.attributes?.kartlaggningsTyp);

            // Apply geometry filters
            if (geometryFilterPoint && feature.geometry.type !== 'Point' && feature.geometry.type !== 'MultiPoint') {

                return false; // Exclude features that are not points when point filter is active
            }
            // Apply geometry filter for polygons, including circles
            if (geometryFilterPolygon) {
                const isPolygonType = feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon';
                const isCircle = feature.properties.isCircleMarker || feature.properties.isCircle;
                if (!isPolygonType && !isCircle) {
                    return false; // Exclude features that are neither polygons nor circles when polygon filter is active
                }
            }

            // When in 'selected' view mode, apply additional filtering based on the active tab
            if (viewMode === 'selected') {
                const isSelected = savedObjectIds.has(feature.properties.id);
                if (!isSelected) return false; // Exclude unselected features

                // Filter by geometric type according to the active tab
                switch (activeTab) {
                    case 'Punkter':
                        return feature.properties.isMarker || feature.properties.isPoint;
                    case 'Linjer':
                        return feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString';
                    case 'Polygoner':
                        return feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon' || feature.properties.isCircleMarker || feature.properties.isCircle;
                    default:
                        return true; // Include all selected features for 'Alla' or unrecognized tabs
                }
            } else {
                // Normal filtering logic for non-selected view mode
                switch (activeTab) {
                    case 'Punkter':
                        return matchesKartlaggningstyp && (feature.properties.isMarker || feature.properties.isPoint);
                    case 'Linjer':
                        return matchesKartlaggningstyp && (feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString');
                    case 'Polygoner':
                        return matchesKartlaggningstyp && (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon' || feature.properties.isCircleMarker || feature.properties.isCircle);
                    case 'Alla':
                        return matchesKartlaggningstyp;
                    default:
                        return matchesKartlaggningstyp;
                }
            }
        });

        // Function to filter features by geometry type
        const filterByGeometryType = (type) => {
            return geoJsonData.features.filter(feature => {
                const geometryType = feature.geometry.type;
                const isMatchingType = geometryType === type || (type === 'Point' && (geometryType === 'Point' || geometryType === 'MultiPoint'));
                const matchesKartlaggningstyp = selectedKartlaggningOptions.length === 0 || selectedKartlaggningOptions.includes(feature.properties.attributes?.kartlaggningsTyp);

                const isMatch = isMatchingType && matchesKartlaggningstyp;
                console.log(`Feature ID: ${feature.properties.id}, Geometry Type: ${geometryType}, Matching Type: ${isMatchingType}, Matching Kartlaggningstyp: ${matchesKartlaggningstyp}, Is Match: ${isMatch}`);

                return isMatch;
            });
        };

        // Check if there are any objects for each category
        const hasPunkter = filterByGeometryType('Point').length > 0;
        const hasLinjer = filterByGeometryType('LineString').length > 0;
        const hasPolygoner = filterByGeometryType('Polygon').length > 0;

        //console.log('hasPunktr: ', hasPunkter);

        return (
            <div>
                {shouldHideDataView && <div className="elementToHide">
                    <button className="toggle-form-button-2" onClick={saveDataToServer}>Spara projekt! {saveStatus}</button>
                </div>}
                <DraggableLine onDrag={handleDrag} />
                <div className="attributes-container" style={{ maxHeight: `${attributesContainerHeight}px` }}>

                    <div className="tabs">
                        {hasPunkter && !geometryFilterPolygon && (
                            <button className={activeTab === 'Punkter' ? 'active' : ''} onClick={() => setActiveTab('Punkter')}>Punkter</button>
                        )}
                        {hasLinjer && !geometryFilterPoint && !geometryFilterPolygon && (
                            <button className={activeTab === 'Linjer' ? 'active' : ''} onClick={() => setActiveTab('Linjer')}>Linjer</button>
                        )}
                        {hasPolygoner && !geometryFilterPoint && (
                            <button className={activeTab === 'Polygoner' ? 'active' : ''} onClick={() => setActiveTab('Polygoner')}>Polygoner</button>
                        )}
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Karta</th>
                                {attributeNames.map((name, index) => (
                                    <th key={index} onClick={() => handleSort(name)}>
                                        {attributeDisplayNameMap[name] || name}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFeatures.map((feature, index) => renderTableRow(feature, index))}
                        </tbody>
                    </table>
                    <div className="marked-rows-info">
                        {`${highlightedIds.size} av ${filteredFeatures.length} markerade`}
                        <button onClick={showAllItems}>Visa alla objekt</button>
                        <button onClick={showSelectedItems}>Visa selekterade</button>
                        <button onClick={addSelectedToSavedObjects}>Lägg till</button>
                        <button onClick={deleteSelectedObjects}>Ta bort</button>
                        <button onClick={clearSavedObjectIds}>Rensa selektlistan</button>
                        <span className='addStatus'>{addStatus}</span>
                    </div>
                </div>
            </div>
        );

        // Helper function to render table row
        function renderTableRow(feature, index) {
            // Row rendering logic
            return (
                <tr key={index} className={highlightedIds.has(feature.properties.id) ? 'highlighted-row' : ''}
                    onClick={(event) => handleRowClick(feature.properties.id, feature.properties.attributes, event)}>
                    <td><span style={{ marginLeft: '0px' }}>{index + 1}</span></td>
                    <td className='td-markera'>
                        <button
                            className={highlightedId === feature.properties.id ? 'highlighted' : ''}
                            onClick={() => highlightFeature(feature.properties.id)}
                        >
                            O
                        </button>
                    </td>
                    {attributeNames.map((name, attrIndex) => (
                        <td key={`${index}-${attrIndex}`}>
                            <input
                                type="text"
                                value={feature.properties.attributes[name] || ''}
                                onChange={(e) => handleAttributeValueChange(feature.properties.id, name, e.target.value)}
                            />
                        </td>
                    ))}
                </tr>
            );
        }
    };

    //-- RENDER ATTRIBUTE LIST FOR PROJECT VIEW
    const renderAttributeList = () => {
        return (
            <div>
                {!shouldHideDataView &&
                    <div className='map-container elementToHide'>
                        <h3>Projektkarta</h3>
                        <button className="toggle-form-button" onClick={saveDataToServer}>Spara projekt!</button>
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

    //-- RENDER MAP
    const renderMap = () => {
        return (
            <div ref={mapRef} style={{ height: mapHeight, width: '100%' }}>

                <MapContainer whenCreated={setMapInstance} center={position} zoom={zoom} style={{ height: '100%', width: '100%' }} className="full-width-map">

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
                    <MapEventsComponent />
                </MapContainer>

                {renderAttributeTable()}


            </div>
        )
    }

    //-- RENDER TOP BAR
    const renderTopBar = () => {
    };

    //-- RENDER LEFT SECTION
    const renderLeftSection = () => {
        if (!selectedProject) {
            return <div>Laddar..</div>; // Provide a loading message or any other fallback content
        }

        // Convert kartlaggningstypOptions to an array and add the "Alla" option
        const kartlaggningstypOptionsArray = [/*{ key: '', value: 'Visa alla' },*/ ...Object.entries(kartlaggningstypOptions).map(([key, value]) => ({ key, value }))];

        // State for showing/hiding the kartlaggning list
        const toggleKartlaggningList = () => {
            setShowKartlaggningList(!showList);
        };

        // State for showing/hiding the kartlaggning list
        const toggleLagerhanteringPopup = () => {
            setShowLagerhanteringPopup(!showLagerhanteringPopup);
        };

        // State for showing/hiding the kartlaggning list
        const handleSelectKartlaggningOption = (optionKey) => {
            console.log('Selected kartlaggning option:', optionKey);
            console.log('Selected kartlaggning value:', kartlaggningstypOptions[optionKey]);
            console.log('Selected kartlaggning options:', selectedKartlaggningOptions);
            if (optionKey === '') {
                setSelectedKartlaggningOptions([]); // Clear the selection
                // Optionally, clear other selections related to mapping objects here
                // For example, clear highlighted features, selected rows, etc.
                setHighlightedIds(new Set());
                setSelectedRowIds(new Set());
                // Any other state resets related to the selection of mapping objects can go here
            } else {
                // Handle selection for other options as before
                setSelectedKartlaggningOptions(prevOptions => {
                    const isSelected = prevOptions.includes(optionKey);
                    if (isSelected) {
                        // If already selected, remove it from the selection
                        return prevOptions.filter(key => key !== optionKey);
                    } else {
                        // If not selected, add it to the selection
                        return [...prevOptions, optionKey];
                    }
                });
            }
        };

        /*
        const handleDeselectKartlaggningOption = (optionKey) => {
            setSelectedKartlaggningOptions(prevOptions => prevOptions.filter(key => key !== optionKey));
        };
        */

        // State for showing/hiding the kartlaggning list
        const onValueElementOptionClick = (optionType) => {
            if (optionType === 'Dot') {
                // If already selected, reset both filters and default to 'Punkter' tab
                if (geometryFilterPoint) {
                    setGeometryFilterPoint(false);
                    setGeometryFilterPolygon(false);
                    setActiveTab('Punkter'); // Default to 'Punkter' tab
                } else {
                    setGeometryFilterPoint(true); // Enable point filter
                    setGeometryFilterPolygon(false); // Disable polygon filter
                    setActiveTab('Punkter'); // Switch to 'Punkter' tab
                }
            } else if (optionType === 'Triangle') {
                // If already selected, reset both filters and default to 'Punkter' tab
                if (geometryFilterPolygon) {
                    setGeometryFilterPoint(false);
                    setGeometryFilterPolygon(false);
                    setActiveTab('Punkter'); // Default to 'Punkter' tab
                } else {
                    setGeometryFilterPoint(false); // Disable point filter
                    setGeometryFilterPolygon(true); // Enable polygon filter
                    setActiveTab('Polygoner'); // Switch to 'Polygoner' tab
                }
            }
        };

        // Assuming karteringar is already an array of objects with used_karteringar property
        const karteringList = selectedProject.karteringar || [];

        /*
                // Combine karteringList with kartlaggningstypOptionsArray, ensuring karteringList is at the top
                const combinedOptions = [...karteringList.map(kartering => ({
                    key: kartering.used_karteringar, // Assuming 'used_karteringar' is the key you want to use
                    value: kartering.used_karteringar, // Adjust if you have a specific value field
                    isKartering: true // Custom property to identify karteringList items
                })), ...kartlaggningstypOptionsArray];
        */

        // State for showing/hiding the kartlaggning list
        const toggleNewKarteringList = () => {
            setShowNewKartering(!showNewKartering);
        };

        return (
            <div className="left-section">
                <button className="addKartering" onClick={toggleKartlaggningList}>
                    {showList ? '-' : '+'}
                </button>

                <div className="top-left">
                    <h2>{selectedProject.project_name}</h2>

                    {showList && (
                        <div className="list-popup">
                            <h3>Gjorda karteringar</h3>
                            {karteringList.map((kartering, index) => {
                                // Find the display value for each kartering's used_karteringar in kartlaggningstypOptions
                                const displayValue = kartlaggningstypOptions[kartering.used_karteringar] || kartering.used_karteringar; // Fallback to used_karteringar if no match found
                                return (
                                    <div
                                        key={index}
                                        onClick={() => handleSelectKartlaggningOption(kartering.used_karteringar)}
                                        style={{
                                            padding: '10px',
                                            cursor: 'pointer',
                                            backgroundColor: selectedKartlaggningOptions.includes(kartering.used_karteringar) ? 'grey' : 'transparent',
                                            color: selectedKartlaggningOptions.includes(kartering.used_karteringar) ? '#ffffff' : '#000000',
                                            display: 'flex',
                                            alignItems: 'center',
                                        }}
                                    >
                                        {!selectedKartlaggningOptions.includes(kartering.used_karteringar) && (
                                            <span style={{
                                                marginRight: '5px',
                                                display: 'inline-block',
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '50%',
                                                backgroundColor: 'green',
                                                color: 'white',
                                                textAlign: 'center',
                                                lineHeight: '20px',
                                                fontSize: '15px',
                                            }}>
                                                +
                                            </span>
                                        )}
                                        {displayValue}
                                        <span style={{ marginLeft: 'auto' }}>➡</span>
                                    </div>
                                );
                            })}

                            {/* Separator Line */}
                            <hr style={{ margin: '10px 0' }} />

                            {/* Button to toggle "Lägg till ny kartering" section */}
                            <button className="top-bar-button" onClick={toggleNewKarteringList}>
                                Lägg till ny kartering
                            </button>

                            {/* Conditional rendering of "Lägg till ny kartering" section */}
                            {showNewKartering && (
                                <>
                                    {/* Render new kartering options */}
                                    {kartlaggningstypOptionsArray.map(({ key, value }, index) => (
                                        <div
                                            key={key}
                                            onClick={() => handleSelectKartlaggningOption(key)}
                                            style={{
                                                padding: '10px',
                                                cursor: 'pointer',
                                                backgroundColor: selectedKartlaggningOptions.includes(key) ? 'grey' : 'transparent',
                                                color: selectedKartlaggningOptions.includes(key) ? '#ffffff' : '#000000',
                                                display: 'flex',
                                                alignItems: 'center',
                                            }}
                                        >
                                            {!selectedKartlaggningOptions.includes(key) && (
                                                <span style={{
                                                    marginRight: '5px',
                                                    display: 'inline-block',
                                                    width: '20px',
                                                    height: '20px',
                                                    borderRadius: '50%',
                                                    backgroundColor: 'green',
                                                    color: 'white',
                                                    textAlign: 'center',
                                                    lineHeight: '20px',
                                                    fontSize: '15px',
                                                }}>
                                                    +
                                                </span>
                                            )}
                                            {value}
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    )}

                    <button style={{ backgroundColor: selectedKartlaggningOptions.length > 0 ? 'green' : 'red', color: 'white' }}>
                        {selectedKartlaggningOptions.length > 0 ? 'Kartering vald' : 'Ingen karteringstyp vald'}
                    </button>

                    <div className="selected-karteringstyp-buttons">
                        {selectedKartlaggningOptions.map((optionKey, index) => (
                            <button
                                key={index}

                            >
                                {kartlaggningstypOptions[optionKey] || optionKey}
                            </button>
                        ))}
                    </div>

                    <div className="value-element-options">
                        <div className={`value-element-option ${geometryFilterPoint ? 'selected' : ''}`} onClick={() => onValueElementOptionClick('Dot')}>
                            <img src={`${process.env.PUBLIC_URL}/media/point-100.png`} alt="Dot in Box" /> {/* Replace with actual path */}
                        </div>
                        <div className={`value-element-option ${geometryFilterPolygon ? 'selected' : ''}`} onClick={() => onValueElementOptionClick('Triangle')}>
                            <img src={`${process.env.PUBLIC_URL}/media/polygon-100.png`} alt="Triangle in Box" /> {/* Replace with actual path */}
                        </div>
                    </div>
                </div >

                <button className="layers-btn" onClick={toggleLagerhanteringPopup}>
                    <img src={`${process.env.PUBLIC_URL}/media/layers-100.png`} alt="Layers" />
                </button>
                {
                    showLagerhanteringPopup && (
                        <div className="lagerhantering-popup">
                            {/* Pop-up content goes here */}
                            <p>Pop-up content for Lagerhantering</p>
                            {/* Close button */}
                            <button onClick={() => setShowLagerhanteringPopup(false)}>Stäng</button>
                        </div>
                    )
                }
            </div >
        );
    };

    //-- RENDER RIGHT SECTION
    const renderRightSection = () => {
        const selectedMapObjectId = selectedId; // Dynamically set based on user interaction

        // Use .reduce() to filter and match IDs more defensively
        const filteredImages = imageList.reduce((acc, image) => {
            // Check if image.mapObjectId exists and matches selectedMapObjectId
            if (image.mapObjectId && image.mapObjectId === selectedMapObjectId) {
                acc.push(image); // If a match is found, add the image to the accumulator array
            }
            return acc; // Return the accumulator for the next iteration
        }, []); // Initialize the accumulator as an empty array

        // Function to close fullscreen view
        const closeFullscreen = () => {
            setFullscreenImage(null);
        };

        // Function to delete the selected image
        const handlePreviousImage = () => {
            const currentIndex = filteredImages.findIndex(img => img.url === fullscreenImage.url);
            if (currentIndex > 0) {
                setFullscreenImage(filteredImages[currentIndex - 1]);
            }
        };

        // Function to go to the next image
        const handleNextImage = () => {
            const currentIndex = filteredImages.findIndex(img => img.url === fullscreenImage.url);
            if (currentIndex < filteredImages.length - 1) {
                setFullscreenImage(filteredImages[currentIndex + 1]);
            }
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

        // When setting the fullscreen image, calculate its dimensions
        const handleImageClick = (image) => {
            const img = new Image();
            img.onload = () => {
                setImageSize({ width: img.width, height: img.height });
                setFullscreenImage(image);
                setCaptionText(image.caption); // Set the caption text
            };
            img.src = image.url;
        };

        // Function to delete the selected image
        const handleSaveDrawing = (drawingBase64) => {
            // Store the drawing data temporarily
            setPendingDrawing(drawingBase64);
            //setImageBase64(drawingBase64);
            // Show the custom prompt
            setShowReplacePrompt(true);
        };

        // Function to delete the selected image
        const handleReplaceDecision = async (replace) => {
            console.log('Replace decision:', replace);
            //setSelectedId(fullscreenImage.mapObjectId); // Set the selected ID for the image
            if (replace) {
                const img = new Image();
                img.crossOrigin = "anonymous"; // Request CORS
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);

                    const drawingImg = new Image();
                    drawingImg.onload = () => {
                        ctx.drawImage(drawingImg, 0, 0);
                        const combinedImageBase64 = canvas.toDataURL('image/png');
                        setImageBase64(combinedImageBase64); // Update the base64 image state
                    };
                    drawingImg.src = pendingDrawing;
                };
                img.src = fullscreenImage.url;
                // Proceed with replacing the existing image
                toggleDeleteConfirm(fullscreenImage); // Use the existing function to handle deletion

            } else {
                // Proceed with the image saving process
                const img = new Image();
                img.crossOrigin = "anonymous"; // Request CORS
                img.onload = () => {
                    // Create a canvas to combine the image and the drawing
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;

                    const ctx = canvas.getContext('2d');
                    // Draw the original image first
                    ctx.drawImage(img, 0, 0);
                    // Then draw the drawing on top of the image
                    const drawingImg = new Image();
                    drawingImg.onload = () => {
                        ctx.drawImage(drawingImg, 0, 0);

                        // Convert the canvas to a base64 image string
                        const combinedImageBase64 = canvas.toDataURL('image/png');
                        console.log('Combined image base64:', combinedImageBase64);
                        setImageBase64(combinedImageBase64);
                        uploadImage(); // Assuming this function uploads the base64 image
                    };
                    drawingImg.src = pendingDrawing;
                };
                img.src = fullscreenImage.url; // Use the URL of the fullscreen image

            }

            // Clear the drawing data and close the prompt
            fetchImages()
            setIsDrawingMode(false);
            setShowReplacePrompt(false);
            setPendingDrawing(null);
        };

        // Function to delete the selected image
        const ReplacePrompt = () => (
            <div className="overlay">
                <div className="confirmation-dialog">
                    <p>Vill du ersätta befintlig bild eller lägga till den nya som en extra bild?</p>
                    <button onClick={() => handleReplaceDecision(true)}>Ersätt</button>
                    <button onClick={() => handleReplaceDecision(false)}>Lägg till som ny</button>
                </div>
            </div>
        );

        // Function to delete the selected image
        const fullscreenView = fullscreenImage && (
            <div className="fullscreen-view">
                <button onClick={handlePreviousImage} className="nav-btn left-nav">&lt;</button>
                <img src={fullscreenImage.url} alt="Fullscreen" className="fullscreen-image" />
                <div className="image-info">
                    <p className="image-caption">{fullscreenImage.caption}</p>
                </div>
                {isDrawingMode ? (
                    <Canvas
                        width={imageSize.width}
                        height={imageSize.height}
                        onClose={() => setIsDrawingMode(false)}
                        onSave={(handleSaveDrawing)}
                    />
                ) : (
                    <button className="draw-btn" onClick={() => setIsDrawingMode(true)}>Rita</button>
                )}
                {showDeleteConfirm && (
                    <>
                        <div className="overlay"></div>
                        <div className="confirmation-dialog">
                            <p>Är du säker att du vill ta bort bilden?</p>
                            <button onClick={handleDeleteImage}>Radera</button>
                            <button onClick={() => toggleDeleteConfirm(null)}>Avbryt</button>
                        </div>
                    </>
                )}

                {showReplacePrompt && <ReplacePrompt />}

                <button onClick={handleNextImage} className="nav-btn right-nav">&gt;</button>
                <button onClick={closeFullscreen} className="close-fullscreen-btn">Stäng</button>
                <button onClick={() => toggleDeleteConfirm(fullscreenImage)} className="remove-btn">Ta bort</button>
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

                <h3>Objektbilder</h3>
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