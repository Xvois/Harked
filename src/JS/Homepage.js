// noinspection SpellCheckingInspection,JSValidateTypes

/**
 * The home component. This deals with loggin in, out, checking the server status and
 * handelling a user declining the Spotify scopes.
 */

import {authURI} from './Authentication';
import {hydrateDatapoints, retrieveAllUserIDs, retrieveDatapoint, retrievePlaylists} from './PDM';
import {useEffect, useState} from 'react';
import './../CSS/Homepage.css';
import {useNavigate} from "react-router-dom";
import {getAllUsers, getUser, postPlaylist, getPlaylists, fetchData, postMultiplePlaylists} from "./API";

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
                {token && token !== "denied-scopes" ?
                    <h1 className="main-text">Welcome.</h1>
                    :
                    <h1 className="main-text">Get true insights on your <span
                        style={{color: '#22C55E'}}>Spotify</span> profile.</h1>
                }
                <p className='under-text'>{token ? exploreMessage : welcomeMessage}</p>
                <div className={'button-wrapper'}>
                    {!token || token === "denied-scopes" ?
                        <>
                            <a className="auth-button" href={authURI}>Log-in</a>
                        </>
                        :
                        <>
                            <a className="auth-button" href='/profile#me'>Explore your profile</a>
                            <a className="auth-button" onClick={handleCompare}>Compare to others</a>
                        </>
                    }
                    <button onClick={() => getUser(window.localStorage.getItem('user_id')).then(res => console.log(res))}>Get user.</button>
                    <button onClick={() => getAllUsers().then(res => console.log(res))}>Get all.</button>
                    <button onClick={() => retrieveDatapoint('me', 'long_term').then(res => console.log(res))}>Get datapoint.</button>
                    <button onClick={() => hydrateDatapoints()}>Force hydration.</button>
                    <button onClick={() => fetchData('users/sonn-gb/playlists').then(res => postMultiplePlaylists(res.items))}>Post playlists.</button>
                    <button onClick={() => getPlaylists('sonn-gb').then(res => console.log(res))}>Get playlists.</button>
                </div>
                <p style={{fontFamily: 'Inter Tight', marginTop: '20px', fontSize: '10px'}}>V
                    1.2.0</p>
                {token === "denied-scopes" ?
                    <p className="error-message">You need to accept the Spotify scopes to log in.</p>
                    :
                    <></>
                }
            </div>
        </div>
    );
}

export default Homepage;
