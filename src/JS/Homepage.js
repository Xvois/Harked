// noinspection SpellCheckingInspection,JSValidateTypes

/**
 * The home component. This deals with logging in, out and
 * handelling a user declining the Spotify scopes.
 */

import {isLoggedIn, validateUser} from './HDM.ts';
import React, {useEffect, useState} from 'react';
import './../CSS/Homepage.css';

function Homepage() {

    const [loggedIn, setLoggedIn] = useState(isLoggedIn());

    useEffect(() => {
        document.title = "Harked"
        validateUser();
    }, [])


    const handleLogOut = () => {
        window.localStorage.clear();
        setLoggedIn(false);
    }

    return (
        <div className='homepage-container'>
        </div>
    );
}

export default Homepage;
