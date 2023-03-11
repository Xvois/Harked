// noinspection HtmlUnknownAnchorTarget

import React, {useEffect, useState} from 'react';
import './../CSS/TopBar.css';
import {ClickAwayListener, FormControl, TextField, Switch} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';
import {styled} from '@mui/material/styles';
import {getAllUsers} from './API';
import QuizIcon from '@mui/icons-material/Quiz';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';

const SearchBar = styled(TextField)({
    "& .MuiInputBase-input": {
        background: '#343434',
        border: 'none',
    },
    "& .MuiInputBase-root": {
        color: 'white'
    },
    '& .MuiInput-underline': {
        color: `white`,
    },
    '& .MuiFormLabel-root.Mui-disabled': {
        color: `white`,
    },
    '& .MuiOutlinedInput-root': {
        '& fieldset': {
            border: '1px solid grey',
            transition: `all 0.1s ease-in`
        },
        '&:hover fieldset': {
            border: '1px solid grey',
        },
        '&.Mui-focused fieldset': {
            border: '1px solid grey',
        },
    },
    '& label.Mui-focused': {
        color: 'white',
        border: 'none',
        fontFamily: 'Inter Tight, sans-serif',
    },
    '& .MuiFormLabel-root': {
        color: 'white',
        marginLeft: `5px`,
        border: 'none',
        fontFamily: 'Inter Tight, sans-serif',
    },
});


const TopBar = () => {
    const [searchResults, setSearchResults] = useState(null)
    const [cachedUsers, setCachedUsers] = useState(null)
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [menuExpanded, setMenuExpanded] = useState(false);

    const updateSize = () => {
        setWindowWidth(window.innerWidth);
        if (window.innerWidth > 1000) {
            setMenuExpanded(false);
        }
    }


    window.addEventListener("resize", updateSize);

    const Levenshtein = (a, b) => {
        // First two conditions
        console.log(b);
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

    const handleClickAway = () => {
        setSearchResults(null);
    }

    const handleChange = (event) => {
        // What the user has typed in so far.
        let searchParam = event.target.value;
        const usernames = cachedUsers.map(user => user.username);
        let results = [];
        usernames.forEach( (username, i) => {
            //TODO: REMOVE ALL FAUX USERS IN THE DATABASE
            // To weed out faux users coming up in the search
            if (!(/[A-Z]/.test(cachedUsers[i].userID))) {
                let weight = Levenshtein(searchParam, username);
                if (username.length > searchParam.length) {
                    weight -= username.length - searchParam.length
                }
                if (weight < 10) {
                    results.push({username: username, weight: weight})
                }
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
        results.length = 5;
        setSearchResults(results);
    }


    const updateCachedUsers = () => {
        getAllUsers().then(function (result) {
            setCachedUsers(result);
        })
    }
    useEffect(() => {
        if (window.location.pathname !== '/search') {
            updateCachedUsers();

        } else {
            console.info("On the search page!")
        }
    }, [])


    // noinspection HtmlUnknownAnchorTarget
    return (
        <header className="header">
            {windowWidth > 1000 ?
                <div className="element-container">
                    <a className='element' href='/'><HomeIcon fontSize='large'/><p>Home</p></a>
                    <a className='element' href='feedback'><QuizIcon fontSize='large'/><p>Feedback</p></a>
                    <a className='element' href='profile#me'><PersonIcon fontSize='large'/><p>Your profile</p></a>
                    <div className='element' style={{display: 'flex', position: 'relative'}}>
                        <ClickAwayListener onClickAway={handleClickAway}>
                            <FormControl variant="standard">
                                <SearchBar className='search-bar' inputProps={{className: `search-label`}}
                                           onChange={handleChange} onClick={handleChange} label="Search"></SearchBar>
                            </FormControl>
                        </ClickAwayListener>
                        {searchResults !== null ?
                            <div id="result">
                                {searchResults.map(function (user) {
                                    return <>
                                        <a href={`profile#${user.user_id}`}>
                                            <img alt={"profile"} src={user.picture_url}></img>
                                            {user.username.length > 12 ? user.username.slice(0, 12) + "..." : user.username}
                                        </a>
                                    </>
                                })
                                }</div>
                            :
                            <></>
                        }

                    </div>
                </div>
                :
                <div className={"element"} id={"menu"} onClick={() => setMenuExpanded(true)}>
                    <MenuIcon fontSize="large"/>
                    <p>Menu</p>
                </div>
            }
            <div id="expanded-menu" style={menuExpanded ? {} : {opacity: '0', pointerEvents: 'none'}}>
                <a className='element' href='/'><HomeIcon fontSize='large'/><p>Home</p></a>
                <a className='element' href='feedback'><QuizIcon fontSize='large'/><p>Feedback</p></a>
                <a className='element' href='profile#me'><PersonIcon fontSize='large'/><p>Your profile</p></a>
                <a className='element' href='search'><SearchIcon fontSize='large'/><p>Search</p></a>
                <div className='element' id={"close-button"} onClick={() => setMenuExpanded(false)}><CloseIcon
                    fontSize="large"/><p>Close</p></div>
            </div>
        </header>
    )
}

export default TopBar