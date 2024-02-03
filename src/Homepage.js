// noinspection SpellCheckingInspection,JSValidateTypes

/**
 * The home component. This deals with logging in, out and
 * handelling a user declining the Spotify scopes.
 */

import React, {useEffect} from 'react';
import './CSS/Homepage.css';
import {isLoggedIn, retrieveLoggedUserID} from "@/Tools/users";
import {handleLogin} from "./Authentication/login";
import {validateUser} from "./Authentication/validateUser";
import {reAuthorise} from "@/Authentication/reAuth";

function Homepage() {

    const [loggedUserID, setLoggedUserID] = React.useState(null);

    useEffect(() => {
        document.title = "Harked"
        validateUser();
        if (isLoggedIn()) {
            retrieveLoggedUserID().then((id) => {
                setLoggedUserID(id);
            })
        }
    }, [])


    const handleLogOut = () => {
        window.localStorage.clear();
        window.location.reload();
    }

    let exploreMessage = "Begin by exploring your own profile from a new perspective, or maybe discovering how you compare to others? It's your choice.";
    let welcomeMessage = "Just click log-in to get started exploring your Spotify profile in a new light. None of your log-in information is shared with us.";

    return (
        <div className='homepage-container'>
            <div className='top-container'>
                {isLoggedIn() ?
                    <h1 className="main-text">Welcome.</h1>
                    :
                    <h1 className="main-text">Harked</h1>
                }
                <p className='under-text'>{isLoggedIn() ? exploreMessage : welcomeMessage}</p>
                <div className={'button-wrapper'}>
                    {!isLoggedIn() ?
                        <>
                            <button className="subtle-button" onClick={handleLogin}>Login with Spotify</button>
                            <a className="subtle-button" href={'/profile/sonn-gb'}>View a sample profile</a>
                            <a className={'subtle-button'}
                               href={"https://gist.github.com/Xvois/06c27a5b9ec33d1ea13b23ea6e5a67dd"}>Read the
                                technical blog</a>
                        </>
                        :
                        <>
                            <a className="subtle-button" href={`profile/${loggedUserID}`}>Explore your profile</a>
                        </>
                    }
                    {isLoggedIn() ?
                        <>
                            <button className={"subtle-button"} onClick={handleLogOut}>Log-out</button>
                            <a className={'subtle-button'}
                               href={"https://gist.github.com/Xvois/06c27a5b9ec33d1ea13b23ea6e5a67dd"}>Read the
                                technical blog</a>
                        </>

                        :
                        <></>
                    }
                    <button onClick={reAuthorise}>Attempt reauth</button>
                </div>
                <p style={{fontFamily: 'Inter Tight', marginTop: '20px', fontSize: '10px', fontWeight: 'bold'}}>1.5.0
                    [Branch]</p>
            </div>
        </div>
    );
}

export default Homepage;
