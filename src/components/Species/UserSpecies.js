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

/*
            <div className="species-list">
                <h2>Your Species List</h2>
                {userSpeciesList.length > 0 ? (
                    <ul>
                        {userSpeciesList.map((species, index) => (
                            <li key={index}>
                                <p>Taxon ID: {species.taxon_id}</p>
                                <p>Common Name: {species.species_name_common}</p>
                                <p>Latin Name: {species.latin_name}</p>
                                <p>Information: {species.species_data}</p>
                                <p>Source: {species.source}</p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No species added yet.</p>
                )}
            </div>

*/
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
                    placeholder="Normala namnet"
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
                <button type="submit">Lägg till art</button>
            </form>
        </div>
    );
};

export default UserSpecies;
