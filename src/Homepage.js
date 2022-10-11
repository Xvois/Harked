import { authURI } from './Authentication';
import { useEffect, useState } from 'react';
import './Homepage.css';
import { fetchData } from './APIFuncs'

function Homepage() {
  const [token, setToken] = useState("")
  useEffect(() => {
    setToken(window.localStorage.getItem("token"))
    if(token && token !== "denied-scopes"){
      fetchData("me").then(function(result){
        console.log(result.display_name)
        setUsername(result.display_name)
      })
    }
  }, [token])
  const [username, setUsername] = useState("")
  let mainText;
  if(token && token !== "denied-scopes"){
    mainText = `Welcome ${username}`
  }else{
    mainText = `Get true insights on your Spotify profile.`
  }
  
  return (
    <div className="Homepage">
      <div className="Homepage-body">
        <h1 className="main-text">{mainText}</h1>
        {!token || token === "denied-scopes" ?
          <a className="auth-button" href={authURI}>Log-in</a>
          :
          <></>
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
