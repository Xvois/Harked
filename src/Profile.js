import React from 'react';
import { useEffect, useState } from 'react';
import './Profile.css';
import './Graph.css'
import { getDatapoint, updateCachedUser } from './PDM';

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
        if(!loaded){ updateCachedUser(userID).then(function(result){
            setCurrentUser(result);  
            document.title = `Photon | ${result.username}`;
        })}
        await getDatapoint(userID, term).then(function(result){
            setDatapoint(result)
            const analyticsList = [];
            result.topSongs.forEach(song => analyticsList.push(song.analytics))
            setGraph(constructGraph("Top 50 Songs - Tempo vs. Energy", analyticsList, "tempo", [50,200], "energy", [0,1], "id", result.topSongs))
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
    async function updateFocus(item, tertairyText){
        if((focus.tertiary === tertairyText && (focus.title === item.title || focus.title === item.name))&& showArt === "stick"){
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
                localState.tertiary = tertairyText;
            }else if(item.artist){
                localState.title = item.name;
                localState.secondary = item.genre;
                localState.tertiary = tertairyText;
            }
            setFocus(localState);
            setShowArt("stick")
        }
    }

    useEffect(() => {        
        loadPage();
    },[term])

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
                        <a className={showArt ? 'play-wrapper' : '' } href={focus.link} rel="noopener noreferrer" target="_blank">
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
                    {graph}
                </div>
            </div>
        }
        </>
  )
}

export default Profile