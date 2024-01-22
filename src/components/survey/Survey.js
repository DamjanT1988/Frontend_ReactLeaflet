import React, { useState, useEffect } from 'react';
import { API_URLS } from '../../constants/APIURLS';
import UserAddSpecies from '../Species/UserAddSpecies';

const Survey = () => {
    const accessToken = localStorage.getItem('accessToken');
    //const navigate = useNavigate();
    const [speciesList, setSpeciesList] = useState([]);
    const [surveyData, setSurveyData] = useState({
        species: '',
        observationDate: '',
        notes: '',
    });
    const [showUserSpecies, setShowUserSpecies] = useState(false);
    const [userSpeciesData, setUserSpeciesData] = useState([]);


    useEffect(() => {
        // Fetch species list when the component mounts
        fetch(API_URLS.SPECIES_LIST, {
            headers: new Headers({
                'Authorization': `Bearer ${accessToken}`,
            }),
        })
            .then(response => response.json())
            .then(data => setSpeciesList(data))
            .catch(error => console.error('Error fetching species:', error));
    }, [accessToken]);

    useEffect(() => {
        const fetchUserSpeciesData = async () => {
            try {
                const response = await fetch(API_URLS.USER_SPECIES_LIST, {
                    headers: new Headers({
                        'Authorization': `Bearer ${accessToken}`,
                    }),
                });
                if (response.ok) {
                    const data = await response.json();
                    setUserSpeciesData(data);
                } else {
                    console.error('Failed to fetch user species data');
                }
            } catch (error) {
                console.error('Error fetching user species data:', error);
            }
        };

        fetchUserSpeciesData();
    }, [accessToken]);

    const handleSurveyChange = (event) => {
        setSurveyData({ ...surveyData, [event.target.name]: event.target.value });
    };

    const handleSurveySubmit = (event) => {
        event.preventDefault();
    };

    const updateUserSpeciesList = async () => {
        try {
            const response = await fetch(API_URLS.USER_SPECIES_LIST, {
                headers: new Headers({
                    'Authorization': `Bearer ${accessToken}`,
                }),
            });
            if (response.ok) {
                const data = await response.json();
                setUserSpeciesData(data);
            } else {
                console.error('Failed to fetch user species data');
            }
        } catch (error) {
            console.error('Error fetching user species data:', error);
        }
    };


    return (
        <div className="survey-container">


            <form onSubmit={handleSurveySubmit}>
                <h3>Projektformulär</h3>

                <button className="toggle-form-button" type="submit">Spara formulär</button>
                <br />
                <label htmlFor="species">Centrala artdatabanken:</label>
                <select
                    name="species"
                    value={surveyData.species}
                    onChange={handleSurveyChange}
                >
                    {speciesList.map(species => (
                        <option key={`central-${species.taxon_id}`} value={species.taxon_id}>
                            {species.species_name_common}
                        </option>
                    ))}
                </select>

                <label htmlFor="userSpecies">Egna databanken:</label>
                <select
                    name="userSpecies"
                    value={surveyData.species}
                    onChange={handleSurveyChange}
                >
                    {/* Render species from the user species list */}
                    {userSpeciesData.map((species, index) => (
                        <option key={`user-${index}-${species.taxon_id}`} value={species.taxon_id}>
                            {species.species_name_common} (Your Species)
                        </option>
                    ))}
                </select>


                <label htmlFor="observationDate">Observationsdatum:</label>
                <input
                    type="date"
                    name="observationDate"
                    value={surveyData.observationDate}
                    onChange={handleSurveyChange}
                />

                <label htmlFor="notes">Anteckningar:</label>
                <textarea
                    name="notes"
                    value={surveyData.notes}
                    onChange={handleSurveyChange}
                ></textarea>
            </form>

            <button
                className="toggle-form-button"
                type="button"  // Change type to "button" so it doesn't submit the form
                onClick={() => setShowUserSpecies(!showUserSpecies)}
            >
                {showUserSpecies ? 'Dölj artformlär' : 'Lägg till en art'}
            </button>

            {showUserSpecies && <UserAddSpecies onUserSpeciesAdded={updateUserSpeciesList} />}

        </div>
    );
}

export default Survey;