// noinspection SpellCheckingInspection,JSValidateTypes

/**
 * The home component. This deals with logging in, out and
 * handelling a user declining the Spotify scopes.
 */

import {isLoggedIn, validateUser} from './HDM.ts';
import React, {useEffect, useState} from 'react';
import './../CSS/Homepage.css';
import {handleAlternateLogin} from "./Authentication";

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
            <div className='top-container'>
                {loggedIn ?
                    <h1 className="main-text">Welcome.</h1>
                    :
                    <h1 className="main-text">Harked</h1>
                }
                <div className={'button-wrapper'}>
                    {!loggedIn ?
                        <>
                            <button className="std-button" onClick={handleAlternateLogin}>Login with Spotify</button>
                            <a className="std-button" href={'/profile/sonn-gb'}>View a sample profile</a>
                        </>
                        :
                        <>
                            <a className={'std-button'} href={"/profile/me"}>Explore your profile</a>
                            <a className={'std-button'} href={"/reviews/me"}>[Beta] Reviews</a>
                            <button className={"std-button"} onClick={handleLogOut}>Log-out</button>
                        </>
                    }
                </div>
                <p style={{fontFamily: 'Inter Tight', marginTop: '20px', fontSize: '10px'}}>
                    UPDATE <span style={{fontWeight: 'bold'}}>1.4.4</span></p>
            </div>
        </div>
    );
}

export default Homepage;
