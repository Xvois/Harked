// noinspection HtmlUnknownAnchorTarget

import React, {useEffect, useState} from 'react';
import './../CSS/TopBar.css';
import {ClickAwayListener, FormControl, TextField} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';
import {styled} from '@mui/material/styles';
import {getAllUsers} from './API';
import QuizIcon from '@mui/icons-material/Quiz';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';

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
            borderRadius: `40px`,
            borderWidth: '2px',
            transition: `all 0.1s ease-in`
        },
        '&:hover fieldset': {
            borderColor: 'white',
        },
        '&.Mui-focused fieldset': {
            borderColor: '#22C55E',
            borderRadius: `5px`,
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


const TopBar = () => {
    const [searchResults, setSearchResults] = useState(null)
    const [cachedUsers, setCachedUsers] = useState(null)
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [menuExpanded, setMenuExpanded] = useState(false);

    const updateSize = () => {
        setWindowWidth(window.innerWidth);
        if(window.innerWidth > 1000){
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
        console.log(usernames);
        let results = [];
        // Don't check if the user has only typed in a couple of characters
        if (searchParam.length > 2) {
            usernames.forEach(username => {
                console.log(username);
                let weight = Levenshtein(searchParam, username)
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
            setSearchResults(results);
        } else {
            setSearchResults(null)
        }
    }


    const updateCachedUsers = () => {
        getAllUsers().then(function (result) {
            setCachedUsers(result);
        })
    }
    useEffect(() => {
        if(window.location.pathname !== '/search'){
            updateCachedUsers();

        }else{
            console.info("On the search page!")
        }
    }, [])

    // noinspection HtmlUnknownAnchorTarget
    return (
        <header className="header">
            {windowWidth > 1000 ?
                <div className="element-container">
                    <a className='element' href='/'><HomeIcon fontSize='large'/><p>Home</p></a>
                    <a className='element' href='feedback'><QuizIcon fontSize='large' /><p>Feedback</p></a>
                    <a className='element' href='profile#me'><PersonIcon fontSize='large'/><p>Your profile</p></a>
                    <div className='element'>
                        <ClickAwayListener onClickAway={handleClickAway}>
                            <FormControl variant="standard">
                                <SearchBar className='search-bar' inputProps={{className: `search-label`}}
                                           onChange={handleChange} label="Search"></SearchBar>
                            </FormControl>
                        </ClickAwayListener>
                        {searchResults !== null ?
                            <div id="result">
                                {searchResults.map(function (user) {
                                    return <a href={`profile#${user.user_id}`}><img
                                        alt={"profile picture"}
                                        src={user.picture_url}></img>{user.username.length > 14 ? user.username.slice(0, 14) + "..." : user.username}
                                    </a>
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
            <div id="expanded-menu" style={menuExpanded ? {} : {opacity: '0', pointerEvents: 'none'} }>
                <a className='element' href='/'><HomeIcon fontSize='large'/><p>Home</p></a>
                <a className='element' href='feedback'><QuizIcon fontSize='large' /><p>Feedback</p></a>
                <a className='element' href='profile#me'><PersonIcon fontSize='large'/><p>Your profile</p></a>
                <a className='element' href='search'><SearchIcon fontSize='large'/><p>Search</p></a>
                <div className='element' id={"close-button"} onClick={() => setMenuExpanded(false)}><CloseIcon fontSize="large"/><p>Close</p></div>
            </div>
        </header>
    )
}

export default TopBar