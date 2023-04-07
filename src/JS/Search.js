import {ClickAwayListener, FormControl, Input, InputAdornment, ThemeProvider} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import {useEffect, useState} from "react";
import {getAllUsers} from "./API";
import {createTheme} from "@mui/material/styles";

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
    const handleNavigate = (user) => {
        console.log(`Click on ${user.username} identified!`);
    }
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
    }, [])
    return (
        <ClickAwayListener onClickAway={() => setSearchResults(null)}>
            <div style={{flexDirection: 'column', width: '100%'}}>
                <ThemeProvider theme={searchTheme}>
                    <FormControl sx={{ input: { color: 'white' } }} variant="standard" id={'input'} onChange={handleChange} onClick={handleChange}>
                        <Input
                            id="input-with-icon-adornment"
                            startAdornment={
                                <InputAdornment position="start">
                                    <SearchIcon style={{color: 'white'}} fontSize={'large'} />
                                </InputAdornment>
                            }
                        />
                    </FormControl>
                    {!!searchResults ?
                        <div className={'results'}>
                            {searchResults.map(result => {
                                return (
                                    <a className={'result'} href={`/profile#${result.user_id}`}>
                                        <img alt='' src={result.picture_url}></img>
                                        <div className={'result-title'}>
                                            <h2>{result.username}</h2>
                                            <p>Follows you.</p>
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