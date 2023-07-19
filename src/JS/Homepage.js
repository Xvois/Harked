// noinspection SpellCheckingInspection,JSValidateTypes

/**
 * The home component. This deals with logging in, out and
 * handelling a user declining the Spotify scopes.
 */

import {isLoggedIn, validateUser} from './HDM.ts';
import {useEffect, useState} from 'react';
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

    let exploreMessage = "Begin by exploring your own profile from a new perspective, or maybe discovering how you compare to others? It's your choice.";
    let welcomeMessage = "Just click log-in to get started exploring your Spotify profile in a new light. None of your log-in information is shared with us.";

    return (
        <div className='homepage-container'>
            <div className='top-container'>
                {loggedIn ?
                    <h1 className="main-text">Welcome.</h1>
                    :
                    <h1 className="main-text">Harked</h1>
                }
                <p className='under-text'>{isLoggedIn() ? exploreMessage : welcomeMessage}</p>
                <div className={'button-wrapper'}>
                    {!loggedIn ?
                        <>
                            <button className="std-button" onClick={handleAlternateLogin}>Login with Spotify</button>
                            <a className="std-button" href={'/profile#sonn-gb'}>View a sample profile</a>
                        </>
                        :
                        <>
                            <a className="std-button" href={`profile#me`}>Explore your profile</a>
                        </>
                    }
                    {loggedIn ?
                        <button className={"std-button"} onClick={handleLogOut}>Log-out</button>
                        :
                        <></>
                    }
                </div>
                <p style={{fontFamily: 'Inter Tight', marginTop: '20px', fontSize: '10px'}}>
                    UPDATE <span style={{fontWeight: 'bold'}}>1.4.3</span></p>
            </div>
        </div>
    );
}

export default Homepage;
