import { authURI } from './Authentication';
import { useEffect, useState } from 'react';
import './Homepage.css';
import { fetchData } from './API'

function Homepage() {
  const [token, setToken] = useState("")
  useEffect(() => {
    setToken(window.localStorage.getItem("token"))
    if(token && token !== "denied-scopes"){
      fetchData("me").then(function(result){
        setUsername(result.display_name)
      })
    }
    document.title = "Photon"
  }, [token])
  const [username, setUsername] = useState("")
  let mainText;
  if(token && token !== "denied-scopes"){
    mainText = `Welcome ${username}`
  }else{
    mainText = `Get true insights on your Spotify profile.`
  }


  let exploreMessage = "Begin by exploring your own profile from a new perspective, or maybe discovering how you compare to others? It's your choice.";
  let welcomeMessage = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
  return (
    <div className='homepage-container'>
      <div style={{position: 'absolute', top: '300px', marginLeft: '50px'}}>
        <h1 className="main-text">{mainText}</h1>
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
    </div>
  );
}

export default Homepage;
