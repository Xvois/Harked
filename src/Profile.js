import React from 'react';
import { useEffect, useState } from 'react';
import './Profile.css';
import { fetchData } from './API'
import { parseSong } from './PDM';

const Profile = () => {
    const userID = window.location.hash.split("#")[1];
    const [username, setUsername] = useState("");
    const [profilePicture, setProfilePicture] = useState("");
    const [media, setMedia] = useState("")
    useEffect(() => {
        document.title = `Photon | ${username}`;
        if(userID === "me"){ //if we are on the logged in user's page
            fetchData("me").then(function(result){ //get profile details
                setUsername(result.display_name)
                setProfilePicture(result.images[0].url)
            })
            fetchData("me/player").then(function(result){ //get media details
                setMedia(parseSong(result))
            })
        }else{
            fetchData(`users/${userID}`).then(function(result){ //if we are not, get their details
                setProfilePicture(result.images[0].url)
                setUsername(result.display_name);
            });
        }
    }, [profilePicture, username, userID, media])
  return (
      <>
        <div className='user-container'>
                <img className='profile-picture' alt='Profile' src={profilePicture}></img>
                <div className='text-container'>
                    <div className='username'>{username}</div>
                    {media ? 
                    <div className='currently-listening-media'>Currently listening to: <br></br>{media}</div>
                    :
                    <></>
                    }
                </div>
        </div>
        <div className='simple-container'>
            <div>
                <h1 style={{paddingLeft: '22px'}}>Top artists</h1>
                <ul>
                    <li className='list-item'>Song - Artists, Artists</li>
                    <li className='list-item'>This is a random piece of text.</li>
                    <li className='list-item'>Song - Artists, Artists</li>
                </ul>
            </div>
            <div style={{marginBottom: "30px"}}>
                <h1 style={{paddingLeft: '22px'}}>Top songs</h1>
                <ul>
                    <li className='list-item'>Song - Artists, Artists</li>
                    <li className='list-item'>This is a random piece of text.</li>
                    <li className='list-item'>Song - Artists, Artists</li>
                </ul>
            </div>
            <div>
                <h1 style={{paddingLeft: '22px'}}>Top genres</h1>
                <ul>
                    <li className='list-item'>Song - Artists, Artists</li>
                    <li className='list-item'>This is a random piece of text.</li>
                    <li className='list-item'>Song - Artists, Artists</li>
                </ul>
            </div> 
        </div>
      </>
  )
}

export default Profile