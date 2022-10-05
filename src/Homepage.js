import { authURI } from './Authentication';
import { useEffect, useState } from 'react';
import './Homepage.css';
import { callAPI } from './APIFuncs'

function Homepage() {
  useEffect(() => {
    if(window.localStorage.getItem("token")){
      callAPI("me").then(function(result){
        console.log(result.display_name)
        setUsername(result.display_name)
      })
    }
  }, [])
  const [username, setUsername] = useState("")
  let mainText;
  if(window.localStorage.getItem("token") && window.localStorage.getItem("token") !== "denied-scopes"){
    mainText = `Welcome to Photon ${username}`
  }else{
    mainText = `Get true insights on your Spotify profile`
  }
  
  return (
    <div className="Homepage">
      <header className="Homepage-header">
        <a href='/'><img className="photon-logo" src={require('./PhotonLogo.png')} alt="Photon logo"></img></a>
        <div className = "element-container">
          <p style={{marginRight: "50px", fontWeight: "bold", fontSize: "20px"}}>Search</p>
          <p style={{marginRight: "50px", fontWeight: "bold", fontSize: "20px"}}>Profile</p>
          <p style={{marginRight: "50px", fontWeight: "bold", fontSize: "20px"}}>Settings</p>
        </div>
      </header>
      <div className="Homepage-body">
        <h1 className="main-text">{mainText}</h1>
        {!window.localStorage.getItem("token") || window.localStorage.getItem("token") === "denied-scopes" ?
          <a className="auth-button" href={authURI}>Log-in with Spotify</a>
          :
          <></>
        }
        {window.localStorage.getItem("token") === "denied-scopes" ?
          <p className="error-message">You need to accept the Spotify scopes to use Photon.</p>
          :
          <></>
        }
      </div>
    </div>
  );
}

export default Homepage;
