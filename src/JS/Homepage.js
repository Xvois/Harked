import {authURI} from './Authentication';
import {fillDatabase, retrieveAllUserIDs} from './PDM';
import {useEffect, useState} from 'react';
import './../CSS/Homepage.css';
import {useNavigate} from "react-router-dom";

function Homepage() {
  const [token, setToken] = useState("")
    const navigate = useNavigate();
  useEffect(() => {
    setToken(window.localStorage.getItem("token"))
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
            let index = Math.round(Math.random() * IDs.length - 1);
            userID = IDs[index];
            navigate(`/compare#${currUserID}&${userID}`)
        } while (userID === currUserID)
    }

  let exploreMessage = "Begin by exploring your own profile from a new perspective, or maybe discovering how you compare to others? It's your choice.";
  let welcomeMessage = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
  return (
      <div className='homepage-container'>
        <div className='top-container'>
          {token && token !== "denied-scopes" ?
              <h1 className="main-text">Welcome to Photon.</h1>
              :
              <h1 className="main-text">Get true insights on your Spotify profile.</h1>
          }
          <p className='under-text'>{token ? exploreMessage : welcomeMessage}</p>
          {!token || token === "denied-scopes" ?
              <>
                <a className="auth-button" href={authURI}>Log-in</a>
              </>
              :
              <div>
                <a className="auth-button" href='/profile#me'>Explore your profile</a>
                <a className="auth-button" onClick={handleCompare}>Compare to others</a>
                <a className="auth-button" onClick={handleLogOut}>Log out.</a>
                  <button onClick={fillDatabase}>PH: Fill database</button>
              </div>
          }
          {token === "denied-scopes" ?
              <p className="error-message">You need to accept the Spotify scopes to use Photon.</p>
              :
              <></>
          }
        </div>
        <div className='container' style={{textAlign: 'right'}}>
          <h2>Look at some music.</h2>
          <p>Maybe even listen to some?</p>
        </div>
        <div className='container' style={{textAlign: 'left'}}>
          <p>And here!</p>
        </div>
        <div className='container'>
          <ol>
            <li>Use the website.</li>
            <li>Please.</li>
            <li>Use the website.</li>
          </ol>
        </div>
      </div>
  );
}

export default Homepage;
