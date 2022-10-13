import React from 'react';
import { useEffect, useState } from 'react';
import './Profile.css';
import { getDatapoint, updateCachedUser } from './PDM';

const Profile = () => {
    const userID = window.location.hash.split("#")[1];
    const [loaded, setLoaded] = useState(false);
    let [currentUser, setCurrentUser] = useState("")
    let [datapoint, setDatapoint] = useState("Initial value")

    const loadPage = async() => {
        setCurrentUser(await updateCachedUser(userID));
        setDatapoint(await getDatapoint(userID, "long_term"));
        document.title = `Photon | ${currentUser.username}`;
        setLoaded(true)
    }

    useEffect(() => {
        loadPage();
    }, [])

  return (
        <>
        {!loaded ? 
            <div className="lds-grid"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
        :
            <div className='wrapper'>
                <div className='user-container'>
                        <img className='profile-picture' alt='Profile' src={currentUser.profilePicture}></img>
                        <div className='text-container'>
                            <div className='username'>{currentUser.username}</div>
                            {true ? 
                            <div className='currently-listening-media'>Currently listening to: <br></br>{currentUser.media}</div>
                            :
                            <></>
                            }
                        </div>
                </div>
                <div className='simple-container'>
                    <div className='datapoint-container'>
                        <p className='datapoint-title'>Top artists</p>
                        <ul>
                            <li className='list-item'>{datapoint.topArtists[0]}</li>
                            <li className='list-item'>{datapoint.topArtists[1]}</li>
                            <li className='list-item'>{datapoint.topArtists[2]}</li>
                        </ul>
                    </div>
                    <div className='datapoint-container'>
                        <p className='datapoint-title'>Top songs</p>
                        <ul>
                            <li className='list-item'>{datapoint.topSongs[0]}</li>
                            <li className='list-item'>{datapoint.topSongs[1]}</li>
                            <li className='list-item'>{datapoint.topSongs[2]}</li>
                        </ul>
                    </div>
                    <div className='datapoint-container'>
                        <p className='datapoint-title'>Top genres</p>
                        <ul>
                            <li className='list-item'>Song - Artists, Artists</li>
                            <li className='list-item'>This is a random piece of text.</li>
                            <li className='list-item'>Song - Artists, Artists</li>
                        </ul>
                    </div> 
                </div>
            </div>
        }
        </>
  )
}

export default Profile