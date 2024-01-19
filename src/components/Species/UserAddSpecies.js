import React, { useState, useEffect, useRef } from 'react';
import { API_URLS } from '../../constants/APIURLS';
import '../../views/ProjectView.css'; // Import the CSS for this component
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

const UserAddSpecies = (props) => {
    const [speciesData, setSpeciesData] = useState({
        taxon_id: '' || null,
        species_name_common: '',
        latin_name: '',
        species_data: '',
        source: ''
    });
    const accessToken = localStorage.getItem('accessToken');
    const [userSpeciesList, setUserSpeciesList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isFetchingSpecies, setIsFetchingSpecies] = useState(false);
    const fileInputRef = useRef(null);
    const exampleCsvFileUrl = process.env.PUBLIC_URL + '/media/accepteratformatuppladdning.csv';
    const [statusMessage, setStatusMessage] = useState('');
    const [showPopup, setShowPopup] = useState(false);

    const displayStatusPopup = (message) => {
        setStatusMessage(message);
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 3500); 
    };

    const handleSearch = async () => {
        displayStatusPopup('Hämtar sökresultat..');
        try {
            const response = await fetch(`https://api.artdatabanken.se/information/v1/speciesdataservice/v1/speciesdata/search?searchString=${searchQuery}`, {
                method: 'GET',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Ocp-Apim-Subscription-Key': 'd0e4154247e34467a94d8a97183354ec'
                }
            });
            if (response.ok) {
                const data = await response.json();
                setSearchResults(data);
            } else {
                console.error('Failed to fetch search results');
                displayStatusPopup('Kunde inte hämnta sökresultat!');
            }
        } catch (error) {
            console.error('Error during search:', error);
        }
    };


    const selectSpecies = async (taxonId) => {
        setIsFetchingSpecies(true);
        try {
            let response = await fetch(`https://api.artdatabanken.se/information/v1/speciesdataservice/v1/speciesdata?taxa=${taxonId}`, {
                method: 'GET',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Ocp-Apim-Subscription-Key': 'd0e4154247e34467a94d8a97183354ec'
                }
            });
            if (!response.ok) {
                // Fallback to local API if external API fails
                //response = await fetch(`${API_URLS.SPECIES_LIST}/${taxonId}`);
                displayStatusPopup('Kunde inte hämta data!');
            }

            const rawData = await response.json();
            const data = rawData[0]; // Access the first element of the array

            // Now, set the form data using this extracted data
            setSpeciesData({
                taxon_id: data.taxonId.toString(), // Convert to string if it's a number
                species_name_common: data.swedishName,
                latin_name: data.scientificName,
                species_data: data.speciesData.speciesFactText.characteristic,
                source: 'ArtDatabanken' // Adjust source as needed
            });
        } catch (error) {
            console.error('Error fetching species details:', error);
        } finally {
            setIsFetchingSpecies(false);
        }
    };



    // Function to fetch user species list
    const fetchUserSpecies = async () => {
        try {
            const response = await fetch(API_URLS.USER_SPECIES_LIST, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setUserSpeciesList(data); // Store the species list in state
            } else {
                console.error('Failed to fetch species list');
            }
        } catch (error) {
            console.error('Error fetching species list:', error);
        }
    };

    useEffect(() => {
        fetchUserSpecies();
    }, [accessToken]);  // Dependency array


    const handleChange = (e) => {
        setSpeciesData({ ...speciesData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch(API_URLS.USER_SPECIES_CREATE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify(speciesData),
            });

            if (response.ok) {
                console.log('Species added successfully');
                displayStatusPopup('Lagt till art!');
                fetchUserSpecies(); // Fetch the updated species list
                // Clearing the form fields
                setSpeciesData({
                    taxon_id: '',
                    species_name_common: '',
                    latin_name: '',
                    species_data: '',
                    source: ''
                });
                props.onUserSpeciesAdded(); 
            } else {
                console.error('Failed to add species');
                displayStatusPopup('Kunde inte lägga till art!');
                // Handle errors
            }
        } catch (error) {
            console.error('Error submitting species:', error);
        }
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Read and parse the file
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
                processFileContent(content);
            };
            if (file.type.includes("csv")) {
                reader.readAsText(file);
            } else { // Assuming Excel file
                reader.readAsArrayBuffer(file);
            }
        }
    };
    
    const processAndSubmitData = (data) => {
        // Example: Format data for your API's requirements
        const formattedData = data.map(item => ({
            taxon_id: item['Taxon ID'] || '',
            species_name_common: item['Common Name'] || '',
            latin_name: item['Latin Name'] || '',
            species_data: item['Species Information'] || '',
            source: item['Source'] || ''
        }));

        // Submit each formatted data item to your API
        formattedData.forEach(async (speciesItem) => {
            try {
                const response = await fetch(API_URLS.USER_SPECIES_CREATE, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`
                    },
                    body: JSON.stringify(speciesItem)
                });

                if (response.ok) {
                    console.log('Species item added successfully');
                    displayStatusPopup('Lagt till arter från fil!');
                } else {
                    console.error('Failed to add species item');
                    displayStatusPopup('Kunde innte lägga till arter från fil!');
                }
            } catch (error) {
                console.error('Error submitting species item:', error);
            }
        });

        // Optionally, update the UI or state after submission
    };

    const processFileContent = (content) => {
    
        if (typeof content === 'string') { // CSV content
            Papa.parse(content, {
                complete: (results) => {
                    processAndSubmitData(results.data);
                },
                header: true // Assuming first row contains column headers
            });
        } else { // Excel content
            const workbook = XLSX.read(content, { type: 'buffer' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const data = XLSX.utils.sheet_to_json(worksheet);
            processAndSubmitData(data);
        }
    };
    
    
    const handleFileUploadClick = () => {
        fileInputRef.current.click();
    };



    return (
        <div className="user-species-container">
            
            <h1>Lägg till din egen art</h1>
            
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    name="taxon_id"
                    placeholder="Taxon ID (annars blankt)"
                    value={speciesData.taxon_id}
                    onChange={handleChange}
                />
                <input
                    type="text"
                    name="species_name_common"
                    placeholder="Vetenskapliga namnet"
                    value={speciesData.species_name_common}
                    onChange={handleChange}
                />
                <input
                    type="text"
                    name="latin_name"
                    placeholder="Latinska namnet"
                    value={speciesData.latin_name}
                    onChange={handleChange}
                />
                <textarea
                    name="species_data"
                    rows="3"
                    placeholder="Artinformation"
                    value={speciesData.species_data}
                    onChange={handleChange}
                />
                <input
                    type="text"
                    name="source"
                    placeholder="Källa till information"
                    value={speciesData.source}
                    onChange={handleChange}
                />
                <button type="submit">Lägg till art ovan i egna databank</button>
            </form>

            <input
                type="file"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={handleFileChange}
                ref={fileInputRef}
                style={{ display: 'none' }}
            />
            <button onClick={handleFileUploadClick}>Lägg till arter från fil i egna databank</button>
            
                <a href={exampleCsvFileUrl} download>Accepterad fil och format</a>
        
            <div className="species-search">
                <input
                    type="text"
                    placeholder="Sök vetenskapligt & latinskt namn; taxon-ID.. Tryck på sökresultatobjekt för autofill."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button onClick={handleSearch}>Sök i artdatabanken</button>
            </div>

            {/* Display search results */}
            <div className="search-results">
                {searchResults.map((result, index) => (
                    <div key={index} onClick={() => selectSpecies(result.taxonId)}>
                        <p>{result.swedishName} ({result.scientificName}) - taxon-ID: {result.taxonId}</p>
                    </div>
                ))}
            </div>

            <div className={`status-popup ${showPopup ? 'show' : ''}`}>
                {statusMessage}
            </div>
        </div>
    );
};

export default UserAddSpecies;
