import {ClickAwayListener, FormControl, Input, InputAdornment, TextField, ThemeProvider} from "@mui/material";
import {useEffect, useState} from "react";
import {createTheme} from "@mui/material/styles";
import {retrieveAllUsers} from "./PDM";

const searchTheme = createTheme({
    palette: {
        primary: {
            main: '#22C55E',
        },
        neutral: {
            main: 'white'
        }
    },
})
const Search = () => {
    const [searchResults, setSearchResults] = useState(null);
    const [cachedUsers, setCachedUsers] = useState(null);
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
    useEffect(() => {
        retrieveAllUsers().then(res => setCachedUsers(res));
    }, [])
    return (
        <ClickAwayListener onClickAway={() => setSearchResults(null)}>
            <div className={'search-bar'}>
                <ThemeProvider theme={searchTheme}>
                        <TextField
                            id="standard-textarea"
                            label="Search"
                            placeholder="Placeholder"
                            multiline
                            variant="standard"
                        />
                    {!!searchResults ?
                        <div className={'results'}>
                            {searchResults.map(result => {
                                return (
                                    <a className={'result'} href={`/profile#${result.user_id}`}>
                                        <img alt='' src={result.profile_picture}></img>
                                        <div className={'result-title'}>
                                            <h2>{result.username}</h2>
                                            <p>Some information..</p>
                                        </div>
                                    </a>
                                )
                            })}
                        </div>
                        :
                        <></>
                    }
                </ThemeProvider>
            </div>
        </ClickAwayListener>
    )
}

export default Search;