import React from 'react';
import { useEffect, useState, useRef } from 'react';
import './Profile.css';
import { getDatapoint, updateCachedUser } from './PDM';

const Profile = () => {
    const userID = window.location.hash.split("#")[1];
    const [loaded, setLoaded] = useState(false);
    let [currentUser, setCurrentUser] = useState("")
    let [datapoint, setDatapoint] = useState("")
    let [term , setTerm] = useState("long_term")

    const loadPage = async() => {
        setCurrentUser(await updateCachedUser(userID));
        setDatapoint(await getDatapoint(userID, term));
        setLoaded(true)
    }
    const [showArt, setShowArt] = useState(false)
    const [focus, setFocus] = useState({
        title: '', //main text
        secondary: '', //sub-title
        tertiary: '', //desc
        image: '',
        link: '',
    })
    const delay = ms => new Promise(res => setTimeout(res, ms));
    async function updateFocus(item, tertairyText){
        if(item.title === focus.title && showArt === "stick"){
            let localState = focus;
            localState.link = null;
            setFocus(localState);
            setShowArt(false)
        }else{
            setShowArt(false)
            await delay(500);
            let localState = focus;
            if(item.song){
                localState.title = item.title;
                localState.secondary = `by ${item.artist}`;
                localState.tertiary = tertairyText;
            }else if(item.artist){
                localState.title = item.name;
                localState.secondary = item.genre;
                localState.tertiary = tertairyText;
            }
            localState.image = item.image;
            localState.link = item.link;
            setFocus(localState);
            setShowArt("stick")
        }
    }

    useEffect(() => {
        loadPage();
        document.title = `Photon | ${currentUser.username}`;
    }, [userID, currentUser, term])

  return (
        <>
        {!loaded ? 
            <div className="lds-grid"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
        :
            <div className='wrapper'>
                <div className='left'>
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
                            <div className='term-button-container'>
                                <div style={{display: 'flex', flexDirection: 'column', height: 'min-content'}}>
                                    <div style={{display: 'flex', flexDirection: 'row', height: 'min-content'}}>
                                        <button onClick={() => setTerm("short_term")} className={term === "short_term" ? 'term-button-selected' : 'term-button'}></button>
                                        <p className='term-button-desc'>4 weeks</p>
                                    </div>
                                    <div style={{display: 'flex', flexDirection: 'row', height: 'min-content'}}>
                                        <button onClick={() => setTerm("medium_term")} className={term === "medium_term" ? 'term-button-selected' : 'term-button'}></button>
                                        <p className='term-button-desc'>6 months</p>
                                    </div>
                                    <div style={{display: 'flex', flexDirection: 'row', height: 'min-content'}}>
                                        <button onClick={() => setTerm("long_term")} className={term === "long_term" ? 'term-button-selected' : 'term-button'}></button>
                                        <p className='term-button-desc'>All time</p>
                                    </div>

                                </div>
                            </div>
                    </div>
                    <div className='simple-container'>
                        <div className='datapoint-container'>
                            <p className='datapoint-title'>Top artists</p>
                            <ul>
                                <li className='list-item' onClick={() => updateFocus(datapoint.topArtists[0], `${userID === "me" ? `Your top artist.` : `${currentUser.username}'s top artist.`}`)}>{datapoint.topArtists[0].name}</li>
                                <li className='list-item' onClick={() => updateFocus(datapoint.topArtists[1], `${userID === "me" ? `Your second to top artist.` : `${currentUser.username}'s second to top artist.`}`)}>{datapoint.topArtists[1].name}</li>
                                <li className='list-item' onClick={() => updateFocus(datapoint.topArtists[2], `${userID === "me" ? `Your third to top artist.` : `${currentUser.username}'s third to top artist.`}`)}>{datapoint.topArtists[2].name}</li>
                            </ul>
                        </div>
                        <div className='datapoint-container'>
                            <p className='datapoint-title'>Top songs</p>
                            <ul>
                                <li className='list-item' onClick={() => updateFocus(datapoint.topSongs[0], `${userID === "me" ? `Your top song.` : `${currentUser.username}'s top song.`}`)}>{datapoint.topSongs[0].name}</li>
                                <li className='list-item' onClick={() => updateFocus(datapoint.topSongs[1], `${userID === "me" ? `Your second to top song.` : `${currentUser.username}'s second to top song.`}`)}>{datapoint.topSongs[1].name}</li>
                                <li className='list-item' onClick={() => updateFocus(datapoint.topSongs[2], `${userID === "me" ? `Your third to top song.` : `${currentUser.username}'s third to top song.`}`)}>{datapoint.topSongs[2].name}</li>
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
                        <a className={showArt ? 'play-wrapper' : '' } href={focus.link} target="_blank">
                            <img className={showArt ? 'art-shown' : 'art-hidden' } src={focus.image} alt='Cover art'></img>
                        </a>
                        <div className='art-text-container'>
                            <h1 className={showArt === "stick" ? "art-name-shown" : "art-name-hidden"}>{focus.title}</h1>
                            <p className={showArt === "stick" ? "art-desc-shown" : "art-desc-hidden"} style={{fontSize: '40px'}}>{focus.secondary}</p>
                            <p className={showArt === "stick" ? "art-desc-shown" : "art-desc-hidden"}>{focus.tertiary}</p>
                        </div>
                        {showArt?
                        <button className='art-container-button' onClick={() => setShowArt(false)}>Hide</button>
                            :
                        <></>
                        }
                    </div>
                </div>
                <div className='right'>
                    <div className='complex-container'>
                        <h1></h1>
                    </div>
                </div>
            </div>
        }
        </>
  )
}

export default Profile