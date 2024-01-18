import React, { useState, useEffect } from 'react';
import { API_URLS } from '../../constants/APIURLS';
import '../../views/ProjectView.css'; // Import the CSS for this component

const UserSpecies = () => {
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
    
    const handleSearch = async () => {
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
            } else  {
                console.error('Failed to fetch search results');
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
                response = await fetch(`${API_URLS.SPECIES_LIST}/${taxonId}`);
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
                fetchUserSpecies(); // Fetch the updated species list
                // Handle successful addition (e.g., clearing the form)
            } else {
                console.error('Failed to add species');
                // Handle errors
            }
        } catch (error) {
            console.error('Error submitting species:', error);
        }
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
                <button type="submit">Lägg till art i egna databank</button>
            </form>
            <div className="species-search">
                <input
                    type="text"
                    placeholder="Sök på vetenskapligt namn, latinsk namn eller taxon-ID.. Tryck på sökresultatobjekt för autofill."
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
        </div>
    );
};

export default UserSpecies;
