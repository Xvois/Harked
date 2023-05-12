import {ClickAwayListener, styled, TextField, ThemeProvider} from "@mui/material";
import {useEffect, useState} from "react";
import {createTheme} from "@mui/material/styles";
import {isLoggedIn, retrieveAllUsers, retrieveFollowing} from "./PDM";
import {FormControl} from "@mui/base";

const SearchBar = styled(TextField)({
    "& .MuiInputBase-root": {
        color: 'white'
    },
    '& .MuiInput-underline': {
        color: `white`,
    },
    '& .MuiFormLabel-root.Mui-disabled': {
        color: `white`,
    },
    '& .MuiInput-underline:after': {
        borderBottomColor: '#22C55E',
    },
    '& .MuiOutlinedInput-root': {
        '& fieldset': {
            borderColor: 'white',
            borderRadius: `0px`,
            borderWidth: '1px',
            transition: `all 0.1s ease-in`
        },
        '&:hover fieldset': {
            borderColor: 'white',
        },
        '&.Mui-focused fieldset': {
            borderColor: '#22C55E',
            borderWidth: '1px',
            transition: `all 0.1s ease-in`
        },
    },
    '& label.Mui-focused': {
        color: 'white',
        fontFamily: 'Inter Tight, sans-serif',
    },
    '& .MuiFormLabel-root': {
        color: 'white',
        marginLeft: `5px`,
        fontFamily: 'Inter Tight, sans-serif',
    },
});
const Search = (props) => {
    const {showResults} = props;
    const [searchResults, setSearchResults] = useState(null);
    const [cachedUsers, setCachedUsers] = useState(null);
    // If the user is logged in, this is an array of who they follow
    const [loggedFollowing, setLoggedFollowing] = useState(null);
    const Levenshtein = (a, b) => {
        // First two conditions
        if (!a.length) return b.length;
        if (!b.length) return a.length;
        const arr = [];
        // Populate array with b
        for (let i = 0; i <= b.length; i++) {
            arr[i] = [i];
            // Populate array with a and compare
            for (let j = 1; j <= a.length; j++) {
                arr[i][j] =
                    i === 0 ?
                        j
                        :
                        Math.min(
                            arr[i - 1][j] + 1,
                            arr[i][j - 1] + 1,
                            arr[i - 1][j - 1] + (a[j - 1] === b[i - 1] ? 0 : 1)
                        );
            }
        }
        // Return the result
        return arr[b.length][a.length];
    }
    const handleChange = (event) => {
        // What the user has typed in so far.
        let searchParam = event.target.value;
        const usernames = cachedUsers.map(user => user.username);
        let results = [];
        usernames.forEach((username) => {
            let weight = Levenshtein(searchParam, username);
            if (username.length > searchParam.length) {
                weight -= username.length - searchParam.length
            }
            if (weight < 10) {
                results.push({username: username, weight: weight})
            }
        })
        // Order results by their relevance.
        results.sort((a, b) => a.weight - b.weight)
        // Match each username to their user record in the DB
        results.forEach((user, i) => {
            results[i] = cachedUsers[cachedUsers.findIndex(object => {
                return object.username === user.username
            })]
        })
        results.splice(5, results.length - 5);
        setSearchResults(results);
    }

    const handleClickAway = () => {
        setSearchResults(null);
    }
    useEffect(() => {
        retrieveAllUsers().then(res => setCachedUsers(res));
        if (isLoggedIn()) {
            retrieveFollowing(window.localStorage.getItem('user_id')).then(following => {
                setLoggedFollowing(following);
            })
        }
    }, [])

    useEffect(() => {
        if(!showResults){
            setSearchResults(null);
        }
    }, [showResults])

    return (
        <div className='search-bar-container'>
                <FormControl variant="outlined">
                    <SearchBar className='search-bar' inputProps={{className: `search-label`}}
                               onClick={handleChange}
                               onChange={handleChange} label="Search"></SearchBar>
                </FormControl>
            {!!searchResults ?
                <div className={'results'}>
                    {searchResults.map(result => {
                        let following = false;
                        if (isLoggedIn() && (loggedFollowing && loggedFollowing.length > 0)) {
                            following = loggedFollowing.some(e => e.user_id === result.user_id);
                        }
                        return (
                            <a className={'result'} href={`/profile#${result.user_id}`}>
                                <img alt='' src={result.profile_picture}></img>
                                <div className={'result-title'}>
                                    <h2>{result.username}</h2>
                                    {following ?
                                        <p>Following</p>
                                        :
                                        <></>
                                    }
                                </div>
                            </a>
                        )
                    })}
                </div>
                :
                <></>
            }


        </div>
    )
}

export default Search;