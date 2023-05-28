// noinspection SpellCheckingInspection,JSValidateTypes

/**
 * The home component. This deals with loggin in, out, checking the server status and
 * handelling a user declining the Spotify scopes.
 */

import {isLoggedIn, retrieveAllPublicUsers} from './PDM';
import {useEffect, useState} from 'react';
import './../CSS/Homepage.css';
import {useNavigate} from "react-router-dom";
import {handleLogin} from "./Authentication";

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
        const currUserID = window.localStorage.getItem('user_id')
        const IDs = (await retrieveAllPublicUsers()).map(e => e.user_id);
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
                            <button className="std-button" onClick={handleLogin}>Login with Spotify</button>
                            <a className="std-button" href={'/profile#sonn-gb'}>View a sample profile</a>
                        </>
                        :
                        <>
                            <button className="std-button" onClick={() => window.location = '/profile#me'}>Explore your
                                profile
                            </button>
                            <button className="std-button" onClick={handleCompare}>Compare to others</button>
                        </>
                    }
                    {isLoggedIn() ?
                        <button className={"std-button"} onClick={handleLogOut}>Log-out</button>
                        :
                        <></>
                    }
                </div>
                <p style={{fontFamily: 'Inter Tight', marginTop: '20px', fontSize: '10px'}}>
                    v1.3.2c</p>
            </div>
        </div>
    );
}

export default Homepage;
