import { authURI } from './Authentication';
import { fillDatabase } from './PDM';
import { useEffect, useState } from 'react';
import './../CSS/Homepage.css';
function Homepage() {
  const [token, setToken] = useState("")
  const [username, setUsername] = useState(false)
  useEffect(() => {
    setToken(window.localStorage.getItem("token"))
    document.title = "Photon"
  }, [token])


  let exploreMessage = "Begin by exploring your own profile from a new perspective, or maybe discovering how you compare to others? It's your choice.";
  let welcomeMessage = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
  return (
    <div className='homepage-container'>
      <div style={{position: 'absolute', top: '300px', marginLeft: '50px'}}>
        {token && token !== "denied-scopes" ?
        <h1 className="main-text">Welcome to Photon.</h1>
        :
        <h1 className="main-text">Get true insights on your Spotify profile.</h1>
        }
        <p className='under-text'>{token ? exploreMessage : welcomeMessage}</p>
        {!token || token === "denied-scopes" ?
          <a className="auth-button" href={authURI}>Log-in</a>
          :
          <div>
            <a className="auth-button" href='/profile#me'>Explore your profile</a>
            <a className="auth-button" href=''>Compare to others</a>
          </div>
        }
        {token === "denied-scopes" ?
          <p className="error-message">You need to accept the Spotify scopes to use Photon.</p>
          :
          <></>
        }
        </div>
        <button onClick={() => fillDatabase()}>PH: FILL DATABASE</button>
    </div>
  );
}

export default Homepage;
