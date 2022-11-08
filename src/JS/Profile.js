import React from 'react';
import { useEffect, useState } from 'react';
import './../CSS/Profile.css';
import './../CSS/Graph.css'
import { retrieveDatapoint, retrieveUser } from './PDM';

const Profile = () => {
    const userID = window.location.hash.split("#")[1];
    const [loaded, setLoaded] = useState(false);
    let [currentUser, setCurrentUser] = useState("");
    let [datapoint, setDatapoint] = useState("initVal");
    let [term , setTerm] = useState("long_term");
    let [graph, setGraph] = useState("")

    const getQualities = (val1, type1, val2 , type2) => {
        let message = "";
        if(val1 > 75){
            message += `High ${type1}`;
        }else if(val1 > 25){
            message += `Medium ${type1}`;
        }else{
            message += `Low ${type1}`;
        }
        if(val2){
            message += ", ";
            message += getQualities(val2, type2);
        }
        return message;
    }
    const constructGraph = (title, object, x, xLimits, y, yLimits, key, parent) => {
        const maxX = xLimits[1];
        const maxY = yLimits[1];
        const minX = xLimits[0];
        const minY = yLimits[0];
        const points = [];
        object.forEach( (element,i)=> {
            //coords as a percentage
            let pointX = ((element[x] - minX) * 100 )/ (maxX - minX); 
            let pointY = ((element[y] - minY) * 100 )/ (maxY - minY);
            let message = getQualities(pointX, x, pointY, y);
            points.push(<img alt="" src={parent[i].image} key={element[key]} className='point' style={{left: `${pointX}%`, bottom: `${pointY}%`}} onClick={() => updateFocus(parent[i], message)}></img>)
        });

    return (
        <>
        <div className='graph-container'>
            <h1 className='graph-title'>{title}</h1>
            <div className='top'>
                <div className='point-container'>{points}</div>
                <p className='y-title'>{y}</p>
            </div>
            <div className='bottom'>
                <p className='x-title'>{x}</p>
            </div>
        </div>
        </>

    )
    }
    const loadPage = async() => {
        if(!loaded){ await retrieveUser(userID).then(function(result){
            setCurrentUser(result);
            document.title = `Photon | ${result.username}`;
        })}
        await retrieveDatapoint(userID, term).then(function(result){
            setDatapoint(result)
            const analyticsList = [];
            result.topSongs.forEach(song => analyticsList.push(song.analytics))
            setGraph(constructGraph("Top 50 Songs - Tempo vs. Energy", analyticsList, "tempo", [50,200], "energy", [0,1], "song_id", result.topSongs))
        })
        setLoaded(true);
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
    async function updateFocus(item, tertiaryText){
        if((focus.tertiary === tertiaryText && (focus.title === item.title || focus.title === item.name))&& showArt === "stick"){
            let localState = focus;
            localState.link = null;
            setFocus(localState);
            setShowArt(false);
        }else{
            setShowArt(false)
            await delay(500);
            let localState = focus;
            localState.image = item.image;
            localState.link = item.link;
            if(item.song){
                localState.title = item.title;
                localState.secondary = `by ${item.artist}`;
                localState.tertiary = tertiaryText;
            }else if(item.artist){
                localState.title = item.name;
                localState.secondary = item.genre;
                localState.tertiary = tertiaryText;
            }
            setFocus(localState);
            setShowArt("stick")
        }
    }

    useEffect(() => {      
        console.warn("useEffect called.")  
        loadPage();
    },[term])

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
                                <div style={{display: "flex", flexDirection: "row", marginLeft: "10px"}}>
                                    {currentUser.media ? 
                                    <>
                                    <div className='music-animatic'>
                                            <div></div>
                                            <div></div>
                                            <div></div>
                                        </div>
                                        <p className='listening-media'>{currentUser.media}</p>
                                    </>
                                    :
                                    <button>COMPARE BUTTON HERE</button>
                                    }
                                </div>
                            </div>
                            <div className='user-details'>
                                <a href = {`https://open.spotify.com/user/${currentUser.userID}`} className='spotify-link'>
                                    <svg xmlns="http://www.w3.org/2000/svg" height="20px" width="20px" version="1.1" viewBox="0 0 168 168">
                                        <path fill="black" d="m83.996 0.277c-46.249 0-83.743 37.493-83.743 83.742 0 46.251 37.494 83.741 83.743 83.741 46.254 0 83.744-37.49 83.744-83.741 0-46.246-37.49-83.738-83.745-83.738l0.001-0.004zm38.404 120.78c-1.5 2.46-4.72 3.24-7.18 1.73-19.662-12.01-44.414-14.73-73.564-8.07-2.809 0.64-5.609-1.12-6.249-3.93-0.643-2.81 1.11-5.61 3.926-6.25 31.9-7.291 59.263-4.15 81.337 9.34 2.46 1.51 3.24 4.72 1.73 7.18zm10.25-22.805c-1.89 3.075-5.91 4.045-8.98 2.155-22.51-13.839-56.823-17.846-83.448-9.764-3.453 1.043-7.1-0.903-8.148-4.35-1.04-3.453 0.907-7.093 4.354-8.143 30.413-9.228 68.222-4.758 94.072 11.127 3.07 1.89 4.04 5.91 2.15 8.976v-0.001zm0.88-23.744c-26.99-16.031-71.52-17.505-97.289-9.684-4.138 1.255-8.514-1.081-9.768-5.219-1.254-4.14 1.08-8.513 5.221-9.771 29.581-8.98 78.756-7.245 109.83 11.202 3.73 2.209 4.95 7.016 2.74 10.733-2.2 3.722-7.02 4.949-10.73 2.739z"/>
                                    </svg>
                                    <p>Open profile in Spotify.</p>
                                </a>
                                <p>Followers: PH</p>
                                <p>Playlists: PH</p>
                            </div>
                    </div>
                    <h2 className='datapoint-title'>Top artists</h2>
                    <div className='simple-container'>
                        <div id='left-click'></div>
                        <div className='datapoint'>
                            <ol>
                                <li className='list-item' onClick={() => updateFocus(datapoint.topArtists[0], `${userID === "me" ? `Your top artist.` : `${currentUser.username}'s top artist.`}`)}>{datapoint.topArtists[0].name}</li>
                                <li className='list-item' onClick={() => updateFocus(datapoint.topArtists[1], `${userID === "me" ? `Your 2ⁿᵈ to top artist.` : `${currentUser.username}'s second to top artist.`}`)}>{datapoint.topArtists[1].name}</li>
                                <li className='list-item' onClick={() => updateFocus(datapoint.topArtists[2], `${userID === "me" ? `Your 3ʳᵈ to top artist.` : `${currentUser.username}'s third to top artist.`}`)}>{datapoint.topArtists[2].name}</li>
                                <li className='list-item' onClick={() => updateFocus(datapoint.topArtists[3], ``)}>{datapoint.topArtists[3].name}</li>
                                <li className='list-item' onClick={() => updateFocus(datapoint.topArtists[4], ``)}>{datapoint.topArtists[4].name}</li>
                                <li className='list-item' onClick={() => updateFocus(datapoint.topArtists[5], ``)}>{datapoint.topArtists[5].name}</li>
                                <li className='list-item' onClick={() => updateFocus(datapoint.topArtists[6], ``)}>{datapoint.topArtists[6].name}</li>
                                <li className='list-item' onClick={() => updateFocus(datapoint.topArtists[7], ``)}>{datapoint.topArtists[7].name}</li>
                                <li className='list-item' onClick={() => updateFocus(datapoint.topArtists[8], ``)}>{datapoint.topArtists[8].name}</li>
                                <li className='list-item' onClick={() => updateFocus(datapoint.topArtists[9], ``)}>{datapoint.topArtists[9].name}</li>
                            </ol>
                            <div className='art-container'>
                                <a className={showArt ? 'play-wrapper' : 'play-wrapper-hidden' } href={focus.link} rel="noopener noreferrer" target="_blank">
                                    <img className={showArt ? 'art-shown' : 'art-hidden' } src={focus.image} alt='Cover art'></img>
                                    <div className='art-text-container'>
                                    <h1 className={showArt === "stick" ? "art-name-shown" : "art-name-hidden"}>{focus.title}</h1>
                                    <p className={showArt === "stick" ? "art-desc-shown" : "art-desc-hidden"} style={{fontSize: '40px'}}>{focus.secondary}</p>
                                    <p className={showArt === "stick" ? "art-desc-shown" : "art-desc-hidden"}>{focus.tertiary}</p>
                                    </div>
                                </a>
                            </div>
                        </div>
                            <div id='right-click'></div>
                        </div>
                    {graph}
                </div>
        }
        </>
  )
}

export default Profile