import React from 'react';
import { useEffect, useState } from 'react';
import './../CSS/Profile.css';
import './../CSS/Graph.css'
import { retrieveDatapoint, retrieveUser } from './PDM';
import arrow from './Arrow.png'

const Profile = () => {
    const userID = window.location.hash.split("#")[1];
    const [loaded, setLoaded] = useState(false);
    let [currentUser, setCurrentUser] = useState();
    let [datapoint, setDatapoint] = useState("Datapoint not updated!");
    let [term , setTerm] = useState("long_term");
    let [graph, setGraph] = useState("");
    const [showArt, setShowArt] = useState("empty")
    const [focus, setFocus] = useState({
        item: null,
        title: '', //main text
        secondary: '', //sub-title
        tertiary: '', //desc
        image: '',
        link: '',
    })
    const [artistQualities, setArtistQualities] = useState();
    const [focusMessage, setFocusMessage] = useState("And see what it says.");
    // The datapoint we are currently on
    const [simpleSelection, setSimpleSelection] = useState("Artists")
    const simpleDatapoints = ["Artists", "Songs", "Genres"]
    // Take it to be "X music"
    const translateAnalytics = {
        acousticness: 'acoustic',
        danceability: 'danceable',
        energy: 'energetic',
        instrumentalness: 'instrumental',
        liveness: 'live',
        loudness: 'loud',
        valence: 'positive'
    }
    // Change the simple datapoint +1
    const incrementSimple = function(){
        setShowArt("empty")
        setFocusMessage("And see what it says")
        const index = simpleDatapoints.indexOf(simpleSelection);
        index === 2 ? setSimpleSelection(simpleDatapoints[0]) : setSimpleSelection(simpleDatapoints[index+1]);
        console.log(simpleSelection)
    }
    // Change the simple datapoint -1
    const decrementSimple = function(){
        setShowArt("empty")
        setFocusMessage("And see what it says.")
        const index = simpleDatapoints.indexOf(simpleSelection);
        index === 0 ? setSimpleSelection(simpleDatapoints[2]) : setSimpleSelection(simpleDatapoints[index-1]);
        console.log(simpleSelection)
    }
    // Update the artist attributes that are used to make the foucs
    // message.
    const updateArtistQualities = async function(data){
        const songs = data.topSongs;
        const artists = data.topArtists;
        const genres = data.topGenres;
        let result = {};
        // The analytics from the datapoint that we will compare
        const analyticsMetrics = ['acousticness', 'danceability', 'energy', 'instrumentalness', 'valence'];
        // Get the artist that has the max value in each
        // metric
        analyticsMetrics.forEach(metric => {
            let max = {artist: '', value: 0};
            for(let i = 0; i < 50; i++){
                if(songs[i].analytics[metric] > max.value){
                    max.artist = songs[i].artist;
                    max.value = songs[i].analytics[metric];
                }
            }
            // Append the result to the existing result object
            result = {
                ...result,
                [max.artist]: { theme: metric }
            }
        })
        // For every artist [in order of listen time]
        await artists.forEach(async artist=> {
            // Add the genre quality to them
            // equal to their genre
            if(genres.includes(artist.genre)){
                genres.pop(artist.genre);
                result[artist.name] = {
                    ...result[artist.name],
                    genre: artist.genre
                }
            }
        })
        setArtistQualities(result);
    }
    // Update the focus message to be
    // relevant to the current focus
    const updateFocusMessage = async function(){
        // What do we use as our possessive? 
        let possessive;
        userID === 'me' ? possessive = 'your' : possessive = `${userID}'s`
        const item = focus.item;
        let message = '';
        if(item.type === "artist"){
            message += ``;
            if(artistQualities[`${item.name}`] === undefined){
                // If the artist doesn't have a genre analysis then we assume
                // that they are not wildly popular.
                message += `${item.name} is a rare to see artist. They make ${possessive} profile quite unique.`
            }else{
                Object.keys(artistQualities[item.name]).length > 1 ? 
                message += `${item.name} not only represents ${possessive} love for ${artistQualities[item.name]["genre"]} music, but also for ${translateAnalytics[artistQualities[item.name]["theme"]]} music.`
                :
                message += `${item.name} is the artist that defines ${possessive} love for ${artistQualities[item.name][Object.keys(artistQualities[item.name])[0]]} music.`
            }

        // ITEM IS A SONG IN FOCUS
        }else{

        }
        setFocusMessage(message);
    }
    // Construct the description for an item in a graph.
    const getGraphQualities = (val1, type1, val2 , type2) => {
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
            message += getGraphQualities(val2, type2);
        }
        return message;
    }
    // Construct the graph
    const constructGraph = (title, object, x, xLimits, y, yLimits, key, parent) => {
        // Initialise limits
        const maxX = xLimits[1];
        const maxY = yLimits[1];
        const minX = xLimits[0];
        const minY = yLimits[0];
        const points = [];
        object.forEach( (element,i)=> {
            // Coords as a percentage
            let pointX = ((element[x] - minX) * 100 )/ (maxX - minX); 
            let pointY = ((element[y] - minY) * 100 )/ (maxY - minY);
            let message = getGraphQualities(pointX, x, pointY, y);
            //              No alt text                 Key is assigned as param                        Style defines where the point is                    Update the focus when they are clicked
            points.push(<img alt="" src={parent[i].image} key={element[key]} className='point' style={{left: `${pointX}%`, bottom: `${pointY}%`}} onClick={() => updateFocus(parent[i], message)}></img>)
        });
        // Return the whole structure so it can simply
        // be dropped in
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
    // Function that loads the page when necessary
    const loadPage = async() => {
        // If the page hasn't loaded then grab the user data
        if(!loaded){ await retrieveUser(userID).then(function(result){
            setCurrentUser(result);
            document.title = `Photon | ${result.username}`;
        })}
        // Update the datapoint
        await retrieveDatapoint(userID, term).then(function(result){
            setDatapoint(result)
            const analyticsList = [];
            result.topSongs.forEach(song => analyticsList.push(song.analytics))
            setGraph(constructGraph("Top 50 Songs - Tempo vs. Energy", analyticsList, "tempo", [50,200], "energy", [0,1], "song_id", result.topSongs));
            updateArtistQualities(result);
        })
        // Refresh the focus
        setShowArt("empty")
        setFocusMessage("And see what is has to say.")
        // Indicate that the loading is over
        setLoaded(true);
    }
    // Delay function mainly used for animations
    const delay = ms => new Promise(res => setTimeout(res, ms));
    // The function that updates the focus.
    async function updateFocus(item, tertiaryText){
        focus.item = item;
        if( !((focus.tertiary === tertiaryText && (focus.title === item.title || focus.title === item.name)) && showArt === true)){
            setShowArt(false);
            let localState = focus;
            await delay(300);
            localState.image = item.image;
            localState.link = item.link;
            if(item.type === "song"){
                localState.title = item.title;
                localState.secondary = `by ${item.artist}`;
                localState.tertiary = tertiaryText;
            }else if(item.type === "artist"){
                localState.title = item.name;
                localState.secondary = item.genre;
                localState.tertiary = tertiaryText;
            }
            setFocus(localState);
            setShowArt(true)
            updateFocusMessage(datapoint);
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
                    <div style={{display: `flex`, flexDirection: `row`, justifyContent: `space-evenly`}}>
                            <img src={arrow} style={{transform: `rotate(180deg) scale(20%)`, cursor: `pointer`}} onClick={() => decrementSimple()}></img>
                            <h2 className='datapoint-title'>Top {simpleSelection}</h2>
                            <img src={arrow} style={{transform: `scale(20%)`, cursor: `pointer`}} onClick={() => incrementSimple()} ></img>
                    </div>
                    <div className='term-container'>
                        <button onClick={() => setTerm("short_term")} style={term === "short_term" ? {backgroundColor: `#22C55E`} : {backgroundColor: `black`, cursor: `pointer`}}></button>
                        <div></div>
                        <div></div>
                        <button onClick={() => setTerm("medium_term")} style={term === "medium_term" ? {backgroundColor: `#22C55E`} : {backgroundColor: `black`, cursor: `pointer`}}></button>
                        <div></div>
                        <div></div>
                        <button onClick={() => setTerm("long_term")} style={term === "long_term" ? {backgroundColor: `#22C55E`} : {backgroundColor: `black`, cursor: `pointer`}}></button>
                    </div>
                    <p>{term}</p>
                    <div className='simple-container'>
                            <ol>
                                <li className='list-item' onClick={() => updateFocus(datapoint[`top${simpleSelection}`][0], `${userID === "me" ? `Your top artist` : `${currentUser.username}'s top artist`}`)}>{datapoint[`top${simpleSelection}`][0].name}</li>
                                <li className='list-item' onClick={() => updateFocus(datapoint[`top${simpleSelection}`][1], `${userID === "me" ? `Your 2ⁿᵈ to top artist` : `${currentUser.username}'s second to top artist`}`)}>{datapoint[`top${simpleSelection}`][1].name}</li>
                                <li className='list-item' onClick={() => updateFocus(datapoint[`top${simpleSelection}`][2], `${userID === "me" ? `Your 3ʳᵈ to top artist` : `${currentUser.username}'s third to top artist`}`)}>{datapoint[`top${simpleSelection}`][2].name}</li>
                                <li className='list-item' onClick={() => updateFocus(datapoint[`top${simpleSelection}`][3], ``)}>{datapoint[`top${simpleSelection}`][3].name}</li>
                                <li className='list-item' onClick={() => updateFocus(datapoint[`top${simpleSelection}`][4], ``)}>{datapoint[`top${simpleSelection}`][4].name}</li>
                                <li className='list-item' onClick={() => updateFocus(datapoint[`top${simpleSelection}`][5], ``)}>{datapoint[`top${simpleSelection}`][5].name}</li>
                                <li className='list-item' onClick={() => updateFocus(datapoint[`top${simpleSelection}`][6], ``)}>{datapoint[`top${simpleSelection}`][6].name}</li>
                                <li className='list-item' onClick={() => updateFocus(datapoint[`top${simpleSelection}`][7], ``)}>{datapoint[`top${simpleSelection}`][7].name}</li>
                                <li className='list-item' onClick={() => updateFocus(datapoint[`top${simpleSelection}`][8], ``)}>{datapoint[`top${simpleSelection}`][8].name}</li>
                                <li className='list-item' onClick={() => updateFocus(datapoint[`top${simpleSelection}`][9], ``)}>{datapoint[`top${simpleSelection}`][9].name}</li>
                            </ol>
                            <div className='art-container'>
                                {showArt === "empty" ? 
                                <div className='play-wrapper-empty'>Select an item to view in focus.</div>
                                :
                                <a className={showArt ? 'play-wrapper' : 'play-wrapper-hidden' } href={focus.link} rel="noopener noreferrer" target="_blank">
                                    <img className='art' src={focus.image} alt='Cover art'></img>
                                    <div className='art-text-container'>
                                        <h1 className={showArt === true ? "art-name-shown" : "art-name-hidden"}>{focus.title}</h1>
                                        <p className={showArt === true ? "art-desc-shown" : "art-desc-hidden"} style={{fontSize: '40px'}}>{focus.secondary}</p>
                                        <p className={showArt === true ? "art-desc-shown" : "art-desc-hidden"}>{focus.tertiary}</p>
                                    </div>
                                </a>
                                }
                            </div>
                        <p className={showArt === true ? "focus-message-shown" : "focus-message-hidden"}>{focusMessage}</p>
                        </div>
                    {graph}
                </div>
        }
        </>
  )
}

export default Profile