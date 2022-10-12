import React from 'react';
import { useEffect, useState } from 'react';
import './Profile.css';
import { fetchData } from './API'

const Profile = () => {
    const [username, setUsername] = useState(window.location.hash.split("#")[1]);
    const [profilePicture, setProfilePicture] = useState("");
    const [media, setMedia] = useState("")
    useEffect(() => {
        if(username === "me"){ //if we are on the logged in user's page
            fetchData("me").then(function(result){ //get profile details
                setUsername(result.display_name)
                setProfilePicture(result.images[0].url)
            })
            fetchData("me/player").then(function(result){ //get media details
                let tempMedia = result.item.name + " -";
                result.item.artists.forEach(function(element, i){ //add commas for songs with multiple artists
                    tempMedia +=  " " + element.name;
                    if(i !== (result.item.artists).length - 1){ tempMedia += ","; } //stop adding commas if we are one before the end
                })
                setMedia(tempMedia)
            })
        }else{
            fetchData(`users/${username}`).then(function(result){ //if we are not, get their details
                setProfilePicture(result.images[0].url)
                setUsername(result.display_name);
            });
        }
        document.title = `Photon | ${username}`;
    }, [profilePicture, username, media])
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
        <div className='simple-container'></div>
      </>
  )
}

export default Profile