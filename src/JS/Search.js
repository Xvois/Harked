import { styled, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { isLoggedIn, retrieveAllPublicUsers, retrieveFollowing } from "./HDM";
import { FormControl } from "@mui/base";
import Fuse from 'fuse.js';
import {StyledField} from "./SharedComponents.tsx";

const Search = (props) => {
    const { showResults } = props;
    const [searchResults, setSearchResults] = useState(null);
    const [cachedUsersMap, setCachedUsersMap] = useState({});
    const [loggedFollowing, setLoggedFollowing] = useState([]);

// Function to handle the search logic
    const handleSearch = (searchParam) => {
        const options = {
            keys: ['username'],
            threshold: 0.3, // Adjust the threshold as needed
        };

        const fuse = new Fuse(Object.values(cachedUsersMap), options);
        const results = fuse.search(searchParam).map((result) => result.item).sort((a, b) => a.refIndex - b.refIndex);

        setSearchResults(results);
    };


    // Fetch initial data on component mount
    useEffect(() => {
        const fetchData = async () => {
            // Retrieve all public users
            const users = await retrieveAllPublicUsers();

            // Get the current user's ID
            const currentUserID = window.localStorage.getItem('user_id');

            // Filter the users based on the current user's ID
            const filteredUsers = isLoggedIn()
                ? users.filter(user => user.user_id !== currentUserID)
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
        if (isLoggedIn()) {
            retrieveFollowing(window.localStorage.getItem('user_id')).then(following => {
                setLoggedFollowing(following);
            });
        }
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
                <div className='results'>
                    {/* Render search results */}
                    {searchResults.map(result => {
                        const following = isLoggedIn() && loggedFollowing.some(followedUser => followedUser.user_id === result.user_id);
                        return (
                            <a className='result' href={`/profile#${result.user_id}`} key={result.user_id}>
                                <div className='result-title'>
                                    <h2>{result.username}</h2>
                                    {following && <p>(Following)</p>}
                                </div>
                            </a>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Search;
