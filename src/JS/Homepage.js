// noinspection SpellCheckingInspection,JSValidateTypes

import {authURI} from './Authentication';
import {retrieveAllUserIDs} from './PDM';
import {useEffect, useState} from 'react';
import './../CSS/Homepage.css';
import {useNavigate} from "react-router-dom";
import {isServerAlive} from "./API";

function Homepage() {
    const [token, setToken] = useState("")
    const [serverStatus, setServerStatus] = useState(true);
    const navigate = useNavigate();
    useEffect(() => {
        setToken(window.localStorage.getItem("token"))
        isServerAlive().then(isAlive => setServerStatus(isAlive));
        document.title = "Photon"
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
            } while (userID === undefined || userID.length === 20)
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
                    <h1 className="main-text">Get true insights on your <span style={{color: '#22C55E'}}>Spotify</span> profile.</h1>
                }
                <p className='under-text'>{token ? exploreMessage : welcomeMessage}</p>
                <div style={{display: 'flex',gap: '10px'}}>
                    {!token || token === "denied-scopes" ?
                        <a className="auth-button" href={authURI}>Log-in</a>
                        :
                        <>
                            <a className="auth-button" href='/profile#me'>Explore your profile</a>
                            <a className="auth-button" onClick={handleCompare}>Compare to others</a>
                            <a className="auth-button" onClick={handleLogOut}>Log out</a>
                        </>
                    }
                </div>
                <div className={"server-status"}>
                    {serverStatus ?
                        <>
                            <div style={{'--colour': '#22C55E'}} className={"server-status-indicator"}></div>
                            <p className={"server-status-text"}>Server is responding.</p>
                        </>
                        :
                        <>
                            <div style={{'--colour': 'red'}} className={"server-status-indicator"}></div>
                            <p className={"server-status-text"}>Server is not responding.</p>
                        </>
                    }
                </div>
                <p style={{marginLeft: '20px', fontFamily: 'Inter Tight', marginTop: '0', fontSize: '10px'}}>V
                    1.1.2</p>
                {token === "denied-scopes" ?
                    <p className="error-message">You need to accept the Spotify scopes to log in..</p>
                    :
                    <></>
                }
            </div>
        </div>
    );
}

export default Homepage;
