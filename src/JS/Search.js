import {useEffect, useState} from "react";
import {retrieveAllPublicUsers} from "./HDM.ts";
import Fuse from 'fuse.js';
import {StyledField} from "./SharedComponents.tsx";

const Results = (props) => {
    const {searchResults, width} = props;
    return (
        <div className='results'>
            {/* Render search results */}
            {searchResults.slice(0, 5).map(result => {
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
    const {showResults, width = 250} = props;
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

            // Create a map of usernames to user objects for efficient lookup
            const usersMap = {};
            users.forEach(user => {
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
        <div className='search-bar-container' style={{width: width}}>
            {/* SearchBar component */}
            <form autoComplete={"off"}>
                <StyledField
                    className='search-bar'
                    inputProps={{className: `search-label`}}
                    onChange={(event) => handleSearch(event.target.value)}
                    label="Search"
                />
            </form>
            {!!searchResults && (
                <Results searchResults={searchResults}/>
            )}
        </div>
    );
};

export default Search;
