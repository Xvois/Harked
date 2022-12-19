// noinspection SpellCheckingInspection

import {authURI} from './Authentication';
import {retrieveAllUserIDs} from './PDM';
import {useEffect, useState} from 'react';
import './../CSS/Homepage.css';
import {useNavigate} from "react-router-dom";
import FocusShowcase from "./FocusShowcase.png"
import UserShowcase from "./UserShowcase.png"
import CompareShowcase from "./CompareShowcase.png"
import Arrow from "./Arrow.png"
import {optionsCall} from "./API";

function Homepage() {
  const [token, setToken] = useState("")
    const navigate = useNavigate();
  useEffect(() => {
      optionsCall()
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
              </div>
          }
          {token === "denied-scopes" ?
              <p className="error-message">You need to accept the Spotify scopes to use Photon.</p>
              :
              <></>
          }
          <div className={"down-arrow-container"}>
              <img alt={'down arrow'} className={"down-arrow"} src={Arrow}></img>
          </div>
        </div>
        <div className='container' style={{display: 'flex', flexDirection: 'row', justifyContent: 'center',alignItems: 'center' , textAlign: 'right'}}>
          <h2 className={"showcase-text"}>Look at your profile in more detail.</h2>
            <img alt={"image showing someone's top artist with a description"} style={{height: '500px'}} src = {FocusShowcase} />
        </div>
          <div className='container' style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-around',alignItems: 'center' , textAlign: 'left'}}>
              <img alt={"a graph showing some songs as dots on a scatter plot"} style={{height: '200px'}} src = {UserShowcase} />
              <h2 className={"showcase-text"}>Glance at people's likes and compare.</h2>
          </div>
          <div className='container' style={{display: 'flex', flexDirection: 'row', justifyContent: 'center',alignItems: 'center' , textAlign: 'left'}}>
              <h2 className={"showcase-text"}>Or get a detailed rundown of your tastes and compare them to others'.</h2>
              <img alt={"coloured numbers showing someone's average song characteristics"} style={{height: '300px'}} src = {CompareShowcase} />
          </div>
      </div>
  );
}

export default Homepage;
