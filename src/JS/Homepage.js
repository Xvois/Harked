// noinspection SpellCheckingInspection,JSValidateTypes

/**
 * The home component. This deals with logging in, out and
 * handelling a user declining the Spotify scopes.
 */

import {isLoggedIn, validateUser} from './HDM.ts';
import {useEffect} from 'react';
import './../CSS/Homepage.css';
import {handleAlternateLogin} from "./Authentication";
import {WarningRounded} from "@mui/icons-material";

function Homepage() {


    useEffect(() => {
        document.title = "Harked"
        validateUser();
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
                <p className={'subtle-button'} style={{background: 'red', cursor: 'auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'space-around', gap: '10px'}}>
                    <WarningRounded fontSize={'small'}/>
                    Currently experiencing extended downtime due to a backend issue, data is loss expected and you may
                    struggle to log in. We are working to resolve this as soon as possible.
                </p>
                {isLoggedIn() ?
                    <h1 className="main-text">Welcome.</h1>
                    :
                    <h1 className="main-text">Harked</h1>
                }
                <p className='under-text'>{isLoggedIn() ? exploreMessage : welcomeMessage}</p>
                <div className={'button-wrapper'}>
                    {!isLoggedIn() ?
                        <>
                            <button className="subtle-button" onClick={handleAlternateLogin}>Login with Spotify</button>
                            <a className="subtle-button" href={'/profile/sonn-gb'}>View a sample profile</a>
                            <a className={'subtle-button'}
                               href={"https://gist.github.com/Xvois/06c27a5b9ec33d1ea13b23ea6e5a67dd"}>Read the
                                technical blog</a>
                        </>
                        :
                        <>
                            <a className="subtle-button" href={`profile/me`}>Explore your profile</a>
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
                </div>
                <p style={{fontFamily: 'Inter Tight', marginTop: '20px', fontSize: '10px'}}>
                    UPDATE <span style={{fontWeight: 'bold'}}>1.4.7a</span></p>
            </div>
        </div>
    );
}

export default Homepage;
