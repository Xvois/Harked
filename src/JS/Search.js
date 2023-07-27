import {useEffect, useState} from "react";
import {isLoggedIn, retrieveAllPublicUsers, retrieveFollowing, retrieveLoggedUserID} from "./HDM.ts";
import Fuse from 'fuse.js';
import SearchIcon from '@mui/icons-material/Search';
import Input from "@mui/joy/Input";

const Results = (props) => {
    const {searchResults, following} = props;

    return (
        <div className='results'>
            {/* Render search results */}
            {searchResults.slice(0, 5).map((result, i) => {
                const isFollowing = following.some(u => u.user_id === result.user_id);
                return (
                    <a style={i < 5 && i < searchResults.length ? {borderBottom: '1px solid var(--transparent-colour)'} : {}}
                       className='result' href={`/profile/${result.user_id}`} key={result.user_id}>
                        <div className='result-title'>
                            <h2>{result.username}</h2>
                            {isFollowing &&
                                <p>Following</p>
                            }
                        </div>
                    </a>
                );
            })}
        </div>
    )
}

const Search = (props) => {
    const {showResults} = props;
    const [searchResults, setSearchResults] = useState(null);
    const [cachedUsersMap, setCachedUsersMap] = useState({});
    const [following, setFollowing] = useState([]);

    // Function to handle the search logic
    const handleSearch = (searchParam) => {
        const options = {
            keys: ['username'],
            threshold: 0.5, // Adjust the threshold as needed
        };

        const fuse = new Fuse(Object.values(cachedUsersMap), options);
        const results = fuse.search(searchParam).map((result) => result.item).sort((a, b) => a.refIndex - b.refIndex);
        console.log(results);
        setSearchResults(results);
    };


    useEffect(() => {
        const fetchData = async () => {
            // Retrieve all public users
            const users = await retrieveAllPublicUsers();

            if (isLoggedIn()) {
                const user_id = await retrieveLoggedUserID();
                const f = await retrieveFollowing(user_id);
                setFollowing(f);
            }

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
        <div style={{position: 'relative'}}>
            <Input
                placeholder={"Search"}
                startDecorator={<SearchIcon style={{color: 'var(--primary-colour)'}} fontSize={'small'}/>}
                size="sm"
                onChange={(e) => handleSearch(e.target.value)}
                sx={{
                    "--Input-placeholderOpacity": 0.5,
                    '&::before': {
                        display: 'none',
                    },
                    '&:focus-within': {
                        outline: '2px solid var(--transparent-border-colour)',
                        outlineOffset: '2px',
                    },
                    '&.MuiInput-root': {
                        width: '200px',
                        borderRadius: '20px',
                        flexGrow: '1',
                        color: 'var(--primary-colour)',
                        background: 'rgba(125, 125, 125, 0.25)',
                        border: 'none',
                        transition: 'all 0.25s ease'

                    },
                    '&.MuiInput-input': {
                        color: 'var(--primary-colour)',
                        background: 'none',
                    }
                }}
            />
            {!!searchResults && searchResults.length > 0 && (
                <Results searchResults={searchResults} following={following}/>
            )}
        </div>
    );
};

export default Search;
