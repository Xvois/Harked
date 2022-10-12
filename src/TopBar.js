import React from 'react';
import './TopBar.css';


const TopBar = () => {
  return (
    <header className="header">
        <a href='/'><img className="photon-logo" src={require('./PhotonLogo.png')} alt="Photon logo"></img></a>
        <div className = "element-container">
          <a style={{marginRight: "50px", fontWeight: "bold", fontSize: "20px", color: 'black', textDecoration: 'none'}} href=''>Search</a>
          <a style={{marginRight: "50px", fontWeight: "bold", fontSize: "20px", color: 'black', textDecoration: 'none'}} href='profile#me'>Profile</a>
          <a style={{marginRight: "50px", fontWeight: "bold", fontSize: "20px", color: 'black', textDecoration: 'none'}} href='settings'>Settings</a>
        </div>
    </header>
  )
}

export default TopBar