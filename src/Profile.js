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
    const [coverArt, setCoverArt] = useState("")
    const [coverArtist, setCoverArtist] = useState("")
    const [showArt, setShowArt] = useState(false)
    const delay = ms => new Promise(res => setTimeout(res, ms));
    async function listItemClick(item){
        if(item.image === coverArt && showArt === "stick"){
            setShowArt(false)
        }else{
            setShowArt(false)
            await delay(500);
            setCoverArt(item.image);
            setCoverArtist(item.name)
            setShowArt("stick")
        }
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
                            {currentUser.media ? 
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
                            <li className='list-item'  onClick={() => listItemClick(datapoint.topArtists[0])}>{datapoint.topArtists[0].name}</li>
                            <li className='list-item'  onClick={() => listItemClick(datapoint.topArtists[1])}>{datapoint.topArtists[1].name}</li>
                            <li className='list-item'  onClick={() => listItemClick(datapoint.topArtists[2])}>{datapoint.topArtists[2].name}</li>
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
                            <li className='list-item'>{datapoint.topGenres[0].genre}</li>
                            <li className='list-item'>{datapoint.topGenres[1].genre}</li>
                            <li className='list-item'>{datapoint.topGenres[2].genre}</li>
                        </ul>
                    </div> 
                </div>
                <div className='art-container'>
                    <img className={showArt ? 'art-shown' : 'art-hidden' } src={coverArt} alt='Cover art'></img>
                    <h1 className={showArt === "stick" ? "art-name-shown" : "art-name-hidden"}>{coverArtist}</h1>
                </div>

            </div>
        }
        </>
  )
}

export default Profile