import { styled, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import {isLoggedIn, retrieveAllPublicUsers, retrieveFollowing, retrieveLoggedUserID} from "./HDM.ts";
import { FormControl } from "@mui/base";
import Fuse from 'fuse.js';
import {StyledField} from "./SharedComponents.tsx";

const Results = (props) => {
    const {searchResults} = props;
    return (
        <div className='results'>
            {/* Render search results */}
            {searchResults.slice(0,5).map(result => {
                return (
                    <a className='result' href={`/profile#${result.user_id}`} key={result.user_id}>
                        <div className='result-title'>
                            <h2>{result.username}</h2>
                        </div>
                    </a>
                );
            })}
        </div>
    )
}

const Search = (props) => {
    const { showResults } = props;
    const [searchResults, setSearchResults] = useState(null);
    const [cachedUsersMap, setCachedUsersMap] = useState({});

// Function to handle the search logic
    const handleSearch = (searchParam) => {
        const options = {
            keys: ['username'],
            threshold: 0.5, // Adjust the threshold as needed
        };

        const fuse = new Fuse(Object.values(cachedUsersMap), options);
        const results = fuse.search(searchParam).map((result) => result.item).sort((a, b) => a.refIndex - b.refIndex);

        setSearchResults(results);
    };


    useEffect(() => {
        const fetchData = async () => {
            // Retrieve all public users
            const users = await retrieveAllPublicUsers();

            // Get the current user's ID
            let loggedUserID = null;

            if (isLoggedIn()) {
                loggedUserID = await retrieveLoggedUserID();
            }

            // Filter the users based on the current user's ID
            const filteredUsers = loggedUserID !== null
                ? users.filter(user => user.user_id !== loggedUserID)
                : users;

            // Create a map of usernames to user objects for efficient lookup
            const usersMap = {};
            filteredUsers.forEach(user => {
                usersMap[user.username] = user;
            });

            // Set the cachedUsersMap state with the created map
            setCachedUsersMap(usersMap);
        };

        fetchData();
    }, []);


    // Reset search results when showResults prop changes
    useEffect(() => {
        if (!showResults) {
            setSearchResults(null);
        }
    }, [showResults]);

    return (
        <div className='search-bar-container'>
            {/* SearchBar component */}
            <FormControl variant="outlined">
                <StyledField
                    className='search-bar'
                    inputProps={{ className: `search-label` }}
                    onChange={(event) => handleSearch(event.target.value)}
                    label="Search"
                />
            </FormControl>
            {!!searchResults && (
                <Results searchResults={searchResults} />
            )}
        </div>
    );
};

export default Search;
