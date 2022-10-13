import React from 'react';
import { useEffect, useState } from 'react';
import './Profile.css';
import { cachedUser, updateCachedUser } from './PDM';

const Profile = () => {
    const userID = window.location.hash.split("#")[1];
    let finished = false;
    useEffect(() => {
        finished = updateCachedUser(userID)
        document.title = `Photon | ${cachedUser.username}`;
        console.log(cachedUser)
    }, [userID, cachedUser, finished])
  return (
      <>
        <div className='user-container'>
                <img className='profile-picture' alt='Profile' src={cachedUser.profilePicture}></img>
                <div className='text-container'>
                    <div className='username'>{cachedUser.username}</div>
                    {cachedUser.media ? 
                    <div className='currently-listening-media'>Currently listening to: <br></br>{cachedUser.media}</div>
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