// noinspection SpellCheckingInspection,JSValidateTypes

/**
 * The home component. This deals with loggin in, out, checking the server status and
 * handelling a user declining the Spotify scopes.
 */

import {isLoggedIn, retrieveAllUserIDs} from './PDM';
import {useEffect, useState} from 'react';
import './../CSS/Homepage.css';
import {useNavigate} from "react-router-dom";
import {handleLogin} from "./Authentication";
import {hashString} from "./API";

function Homepage() {
    const [token, setToken] = useState("")
    const navigate = useNavigate();
    useEffect(() => {
        setToken(window.localStorage.getItem("token"))
        document.title = "Harked"
    }, [token])


    const handleLogOut = () => {
        window.localStorage.clear();
        setToken("");
    }

    const handleCompare = async () => {
        const currUserID = window.localStorage.getItem('userID')
        let IDs = await retrieveAllUserIDs();
        let userID;
        do {
            do {
                let index = Math.round(Math.random() * (IDs.length - 1));
                userID = IDs[index];
            } while (userID === undefined)
            navigate(`/compare#${currUserID}&${userID}`)
        } while (userID === currUserID)
    }

    let exploreMessage = "Begin by exploring your own profile from a new perspective, or maybe discovering how you compare to others? It's your choice.";
    let welcomeMessage = "Just click log-in to get started exploring your profile. None of your log-in information is shared with us.";
    return (
        <div className='homepage-container'>
            <div className='top-container'>
                {isLoggedIn() ?
                    <h1 className="main-text">Welcome.</h1>
                    :
                    <h1 className="main-text">Get true insights on your <span
                        style={{color: '#22C55E'}}>Spotify</span> profile.</h1>
                }
                <p className='under-text'>{isLoggedIn() ? exploreMessage : welcomeMessage}</p>
                <div className={'button-wrapper'}>
                    {!isLoggedIn() ?
                        <>
                            <button className="auth-button" onClick={handleLogin}>Login with Spotify</button>
                        </>
                        :
                        <>
                            <button className="auth-button" onClick={() => window.location = '/profile#me'}>Explore your profile</button>
                            <button className="auth-button" onClick={handleCompare}>Compare to others</button>
                        </>
                    }
                    <button className={"auth-button"} onClick={handleLogOut}>Log-out.</button>
                </div>
                <p style={{fontFamily: 'Inter Tight', marginTop: '20px', fontSize: '10px'}}>V
                    1.2.6pb</p>
            </div>
        </div>
    );
}

export default Homepage;
