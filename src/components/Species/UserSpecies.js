import React, { useState } from 'react';
import { API_URLS } from '../../constants/APIURLS';

const UserSpecies = () => {
    const [speciesData, setSpeciesData] = useState({
        taxon_id: '',
        species_name_common: '',
        latin_name: '',
        species_data: '',
        source: ''
    });
    const accessToken = localStorage.getItem('accessToken');

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
            <h1>Add Species to Your Databank</h1>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    name="taxon_id"
                    placeholder="Taxon ID"
                    value={speciesData.taxon_id}
                    onChange={handleChange}
                />
                <input
                    type="text"
                    name="species_name_common"
                    placeholder="Common Name"
                    value={speciesData.species_name_common}
                    onChange={handleChange}
                />
                <input
                    type="text"
                    name="latin_name"
                    placeholder="Latin Name"
                    value={speciesData.latin_name}
                    onChange={handleChange}
                />
                <textarea
                    name="species_data"
                    placeholder="Species Information"
                    value={speciesData.species_data}
                    onChange={handleChange}
                />
                <input
                    type="text"
                    name="source"
                    placeholder="Source"
                    value={speciesData.source}
                    onChange={handleChange}
                />
                <button type="submit">Add Species</button>
            </form>
        </div>
    );
};

export default UserSpecies;
