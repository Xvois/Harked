// noinspection JSValidateTypes

import React, {useEffect, useState} from 'react';
import './../CSS/Profile.css';
import './../CSS/Graph.css'
import {
    followsUser,
    followUser,
    getPlaylists,
    isLoggedIn,
    retrieveDatapoint,
    retrieveMedia,
    retrievePreviousDatapoint,
    retrieveUser,
    unfollowUser, getLikedSongsFromArtist
} from './PDM';
import arrow from './Arrow.png'
import {createTheme} from '@mui/material/styles';
import {ThemeProvider} from '@emotion/react';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ArrowCircleDownIcon from '@mui/icons-material/ArrowCircleDown';
import ArrowCircleUpIcon from '@mui/icons-material/ArrowCircleUp';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ClearIcon from '@mui/icons-material/Clear';
import {authURI} from "./Authentication";


const Profile = () => {

    const chipletTheme = createTheme({
        palette: {
            primary: {
                main: '#22C55E',
            },

        },
    });
    const [focusedPlaylist, setFocusedPlaylist] = useState();
    const [userID, setUserID] = useState(window.location.hash.split("#")[1]);
    const [loaded, setLoaded] = useState(false);
    let [currentUser, setCurrentUser] = useState({
        userID: '',
        username: '',
        profilePicture: '',
        media: {name: '', image: ''},
    });
    let [likedSongsFromArtist, setLikedSongsFromArtist] = useState([]);
    let [datapoint, setDatapoint] = useState({
        userID: '',
        collectionDate: '',
        term: '',
        topSongs: [],
        topArtists: [],
        topGenres: [],
    });
    let [prevDatapoint, setPrevDatapoint] = useState({
        userID: '',
        collectionDate: '',
        term: '',
        topSongs: [],
        topArtists: [],
        topGenres: [],
    });
    let [term, setTerm] = useState("long_term");
    const terms = ["short_term", "medium_term", "long_term"];
    let [chipletData, setChipletData] = useState(false)
    const [showArt, setShowArt] = useState(true)
    const [focus, setFocus] = useState({
        item: null,
        title: '', //main text
        secondary: '', //sub-title
        tertiary: '', //desc
        image: '',
        link: '',
    })
    const [statsSelection, setStatsSelection] = useState();
    const [artistQualities, setArtistQualities] = useState();
    const [focusMessage, setFocusMessage] = useState(<p>See what is says.</p>);
    // The datapoint we are currently on
    const [simpleSelection, setSimpleSelection] = useState("Artists")
    const [playlists, setPlaylists] = useState(null)
    const simpleDatapoints = ["Artists", "Songs", "Genres"]
    const analyticsMetrics = ['acousticness', 'danceability', 'energy', 'instrumentalness', 'valence', `tempo`];
    // Take it to be "X music"
    const translateAnalytics = {
        acousticness: {name: 'acoustic', description: 'Music with no electric instruments.'},
        danceability: {name: 'danceable', description: 'Music that makes you want to move it.'},
        energy: {name: 'energetic', description: 'Music that feels fast and loud.'},
        instrumentalness: {name: 'instrumental', description: 'Music that contains no vocals.'},
        liveness: {name: 'live', description: 'Music that is performed live.'},
        loudness: {name: 'loud', description: 'Music that is noisy.'},
        valence: {name: 'positive', description: 'Music that feels upbeat.'},
        tempo: {name: 'tempo', description: 'Music that moves and flows quickly.'}
    }
    const [following, setFollowing] = useState(null);
    const [selectionAnalysis, setSelectionAnalysis] = useState();
    // Update page when new user is chosen
    window.addEventListener("hashchange", function () {
        window.location.reload(false);
    })

    // Get the display name of the list item
    const getLIName = function (data) {
        let result;
        switch (data.type) {
            case "artist":
                result = data.name;
                break;
            case "song":
                result = data.title;
                break;
            case undefined:
                result = data;
                break;
            default:
                console.warn("getLIName error: No name returned.");
                break;
        }
        if (result.length > 30) {
            result = result.substring(0, 30) + "..."
        }
        return result;
    }
    // Change the simple datapoint +1
    const incrementSimple = function () {
        const index = simpleDatapoints.indexOf(simpleSelection);
        let newIndex;
        index === 2 ? newIndex = simpleDatapoints[0] : newIndex = simpleDatapoints[index + 1];
        setSimpleSelection(newIndex);
        updateFocus(datapoint[`top${newIndex}`][0]);
    }
    // Change the simple datapoint -1
    const decrementSimple = function () {
        const index = simpleDatapoints.indexOf(simpleSelection);
        let newIndex;
        index === 0 ? newIndex = simpleDatapoints[2] : newIndex = simpleDatapoints[index - 1];
        setSimpleSelection(newIndex);
        updateFocus(datapoint[`top${newIndex}`][0]);
    }
    const getIndexChange = function (item, index, parentArray) {
        if (!prevDatapoint || prevDatapoint.term !== datapoint.term) {
            return null
        }
        const lastIndex = item.name ? prevDatapoint[parentArray].findIndex((element) => element.name === item.name) : prevDatapoint[parentArray].indexOf(item);
        if (lastIndex < 0) {
            return null
        }
       //console.log(`----${item.name || item}----`);
        //console.log(`Prev: ${lastIndex}, New: ${index}, Diff: ${lastIndex - index}`);
        return lastIndex - index;
    }
    // Update the artist attributes that are used to make the focus
    // message.
    const updateArtistQualities = async function (data) {
        const songs = data.topSongs;
        const artists = data.topArtists;
        const genres = data.topGenres;
        let result = {};
        // The analytics from the datapoint that we will compare
        // Get the artist that has the max value in each
        // metric
        analyticsMetrics.forEach(metric => {
            let max = {artist: '', value: 0};
            for (let i = 0; i < 50; i++) {
                if (songs[i].analytics[metric] > max.value) {
                    max.artist = songs[i].artist;
                    max.value = songs[i].analytics[metric];
                }
            }
            // Append the result to the existing result object
            result = {
                ...result,
                [max.artist]: {theme: metric}
            }
        })
        // For every artist [in order of listen time]
        artists.forEach(artist => {
            // Add the genre quality to them
            // equal to their genre
            if (artist && genres.includes(artist.genre)) {
                result[artist.name] = {
                    ...result[artist.name],
                    genre: artist.genre
                }
            }
        })
        await setArtistQualities(result);
    }
    // Update the focus message to be
    // relevant to the current focus
    const updateFocusMessage = async function () {
        // What do we use as our possessive? 
        let possessive;
        userID === 'me' ? possessive = 'your' : possessive = `${currentUser.username}'s`
        const item = focus.item;
        let topMessage = '';
        let secondMessage = '';
        switch (item.type) {
            case "artist":
                if (artistQualities[`${item.name}`] === undefined) {
                    // If the artist doesn't have a genre analysis then we assume
                    // that they are not wildly popular.
                    // TODO: FIX THIS, IT ACTIVATES FOR BEYONCE?!?
                    topMessage += `${item.name} is a rare to see artist. They make ${possessive} profile quite unique.`
                } else {
                    Object.keys(artistQualities[item.name]).length > 1 ?
                        topMessage += `${item.name} represents ${possessive} love for ${artistQualities[item.name]["genre"]} and ${translateAnalytics[artistQualities[item.name]["theme"]].name} music.`
                        :
                        topMessage += `${item.name} is the artist that defines ${possessive} love for ${artistQualities[item.name][Object.keys(artistQualities[item.name])[0]]} music.`
                }
                // The index of the song in the user's top songs list made by this artist.
                const songIndex = datapoint.topSongs.findIndex((element) => element.artist === item.name);
                if(songIndex !== - 1){secondMessage += `${datapoint.topSongs[songIndex].title} by ${item.name} is Nº ${songIndex+1} on ${possessive} top 50 songs list for this time frame.`}
                break;
            case "song":
                // TODO: MAKE THIS A MORE ACCURATE
                let maxAnalytic = "acousticness";
                analyticsMetrics.forEach(analytic => {
                    let comparisonValue;
                    if (analytic === "tempo") {
                        comparisonValue = (item.analytics[analytic] - 50) / 150
                    } else {
                        comparisonValue = item.analytics[analytic]
                    }
                    if (comparisonValue > item.analytics[maxAnalytic]) {
                        maxAnalytic = analytic;
                    }
                })
                topMessage += `${item.title} is a very ${maxAnalytic === 'tempo' ? 'high' : ''} ${translateAnalytics[maxAnalytic].name} song by ${item.artist}.`
                if(datapoint.topArtists.some((element) => element && element.name === item.artist)){
                    const index = datapoint.topArtists.findIndex((element) => element.name === item.artist);
                    secondMessage += `${item.artist} is Nº ${index+1} on ${possessive} top artists list in this time frame.`
                }
                break;
            case undefined:
                let relevantArtists = [];
                for (let artist in artistQualities) {
                    if (artistQualities[artist].genre === item) {
                        relevantArtists.push(artist);
                    }
                }
                datapoint.topArtists.forEach(artist => {
                    if(!!artist){
                        if (artist.genre === item && !relevantArtists.includes(artist.name)) {
                            relevantArtists.push(artist.name)
                        }
                    }
                });
                if (relevantArtists.length > 1) {
                    topMessage += `${possessive[0].toUpperCase() + possessive.substring(1)} love for ${item} is not only defined by ${possessive} love for ${relevantArtists[0]} but also ${relevantArtists.length - 1} other artist${relevantArtists.length - 1 === 1 ? `` : "s"}...`
                    for(let i = 1; i < relevantArtists.length; i++){
                        secondMessage += relevantArtists[i];
                        if(i !== relevantArtists.length - 1){
                            secondMessage += ', '
                        }
                    }
                } else {
                    if (relevantArtists.length === 1) {
                        topMessage += `${possessive[0].toUpperCase() + possessive.substring(1)} love for ${item} is very well marked by ${possessive} time listening to ${relevantArtists[0]}.`
                    } else {
                        topMessage += `${possessive[0].toUpperCase() + possessive.substring(1)} taste in ${item} music isn't well defined by one artist, it's the product of many songs over many artists.`
                    }
                }
                break;
            default:
                console.warn("updateFocusMessage error: No focus type found.")
        }
        setFocusMessage(
            <>
                <h2>{topMessage}</h2>
                <p style={{color: '#22C55E', fontFamily: 'Inter Tight', fontWeight: '600', fontSize: '20px'}}>{secondMessage}</p>
            </>
        );
    }
    /**
     * Stores the average song characteristics of all songs in the array.
     * @param songs
     */
    const analyseSongs = function(songs) {
        // Result
        let res = {
            acousticness: 0,
            danceability: 0,
            energy: 0,
            instrumentalness: 0,
            liveness: 0,
            valence: 0,
            tempo: 0
        };
        songs.forEach(function(song){
            analyticsMetrics.forEach((analyticKey) => {
                if(analyticKey === 'tempo'){
                    res[analyticKey] += (song.analytics[analyticKey] - 50) / (songs.length * 150);
                } else{
                    res[analyticKey] += (song.analytics[analyticKey]) / songs.length;
                }
            })
        })
        setSelectionAnalysis(res);
    }

    // Construct the description for an item in a graph.
    const getGraphQualities = (val1, type1, val2, type2) => {
        let message = "";
        if (val1 > 75) {
            message += `high ${type1}`;
        } else if (val1 > 25) {
            message += `medium ${type1}`;
        } else {
            message += `low ${type1}`;
        }
        if (val2) {
            message += ", ";
            message += getGraphQualities(val2, type2);
        }
        return message;
    }
    const [graphAxis, setGraphAxis] = useState({
        x: "danceability",
        y: "energy"
    })
    /**
     * The Graph is a dynamic component that creates a scatter plot
     * from an array of objects. Its title is the in the format "{title} X vs Y".
     * The keys can be changed using a drop-down menu and the array of
     * these keys can be passed in as selections.
     * @param props title, key, list, parentObject and selections.
     * @returns {JSX.Element} HTML for a graph.
     * @constructor
     */
    const Graph = (props) => {
        const key = props.keyEntry;
        const list = props.data;
        const parentObj = props.parent;
        const selections = props.selections;
        const title = props.title;
        let maxX;
        let minX;
        let [mousePos, setMousePos] = useState({x: 0, y: 0});
        let [showPeak, setShowPeak] = useState(false);
        let [peakContent, setPeakContent] = useState();
        if (graphAxis.x === "tempo") {
            minX = 50;
            maxX = 200
        } else {
            minX = 0;
            maxX = 1
        }
        let maxY;
        let minY;
        if (graphAxis.y === "tempo") {
            minY = 50;
            maxY = 200
        } else {
            minY = 0;
            maxY = 1
        }
        const points = [];

        const handleMouseEnter = (param) => (e) => {
            setMousePos({x: e.clientX, y: e.clientY})
            setShowPeak(true);
            setPeakContent(param);
        }

        const handleMouseExit = () => {
            setShowPeak(false);
        }

        list.forEach((element, i) => {
            // Coords as a percentage
            let pointX = ((element[graphAxis.x] - minX) * 100) / (maxX - minX);
            let pointY = ((element[graphAxis.y] - minY) * 100) / (maxY - minY);
            let message = getGraphQualities(pointX, graphAxis.x, pointY, graphAxis.y);
            //              No alt text                 Key is assigned as param                        Style defines where the point is                    Update the focus when they are clicked
            points.push(<div key={element[key]} className='point'
                             style={{left: `${pointX}%`, bottom: `${pointY}%`}}
                             onClick={() => updateFocus(parentObj[i], message)} onMouseEnter={handleMouseEnter(parentObj[i])} onMouseLeave={handleMouseExit}></div>)
        });
        // Return the whole structure, so it can simply
        // be dropped in
        return (
            <>
                <div className='graph-container'>
                    {showPeak ?
                        <div className={'selection-peek'} style={{'--mouse-x': `${mousePos.x + 10}px`, '--mouse-y': `${mousePos.y - 110}px`, backgroundImage: `url(${ (peakContent ? peakContent.image : '')})`}}>
                        </div>
                        :
                        <></>
                    }
                    <h1 className='graph-title'>
                        {title}
                        <select className='graph-dropdown' defaultValue={graphAxis.x}
                                onChange={(event) => setGraphAxis({...graphAxis, x: event.target.value})}>
                            {selections.map(function (option) {
                                if (option !== graphAxis.y) {
                                    return <option value={option}>{option}</option>
                                } else {
                                    return <></>
                                }
                            })}
                        </select>
                        vs.
                        <select className='graph-dropdown' defaultValue={graphAxis.y}
                                onChange={(event) => setGraphAxis({...graphAxis, y: event.target.value})}>
                            {selections.map(function (option) {
                                if (option !== graphAxis.x) {
                                    return <option value={option}>{option}</option>
                                } else {
                                    return <></>
                                }
                            })}}
                        </select>
                    </h1>
                    <div className='top'>
                        <div className='point-container'>{points}</div>
                        <p className='y-title'>{graphAxis.y}</p>
                    </div>
                    <div className='bottom'>
                        <p className='x-title'>{graphAxis.x}</p>
                    </div>
                </div>
            </>

        )
    }

    const Focus = () => {
        return (
            <div className='focus-container'>
                {simpleSelection !== "Genres" ?
                    <div className='art-container'>
                            <a className={showArt ? 'play-wrapper' : 'play-wrapper-hidden'}
                               href={focus.link} rel="noopener noreferrer" target="_blank">
                                <img alt={'item artwork'} className='art' src={focus.image}></img>
                                <img alt={''} className='art' id={'art-backdrop'} src={focus.image}></img>
                                <div className='art-text-container'>
                                    <h1 className={showArt === true ? "art-name-shown" : "art-name-hidden"}>{focus.title}</h1>
                                    <p className={showArt === true ? "art-desc-shown" : "art-desc-hidden"}
                                       style={{fontSize: '25px'}}>{focus.secondary}</p>
                                    <p className={showArt === true ? "art-desc-shown" : "art-desc-hidden"}>{focus.tertiary}</p>
                                </div>
                            </a>
                    </div>
                    :
                    <div style={{width: `20%`}}></div>
                }
                <div className={'focus-message'}>
                    {focusMessage}
                </div>
            </div>
        )
    }

    const ArtistConstellation = () => {
        const [showPeak, setShowPeak] = useState(false);
        const [peakObject, setPeakObject] = useState(null);
        const handleMouseEnter = (param) => (e) => {
            setShowPeak(true);
            setPeakObject(param);
        }
        const handleMouseLeave = (e) => {
            setShowPeak(false);
        }
        let points = !likedSongsFromArtist ? null : likedSongsFromArtist.map((album, i) => {
            return <div className={'album-instance'} style={{
                animationDelay: `${i / 5}s`,
                '--bottom-val': `${album.id.hashCode() / 20000000 + 150}px`,
                '--left-val': `${album.name.hashCode() / 5000000 + 200}px`
            }} onMouseEnter={handleMouseEnter(album)} onMouseLeave={handleMouseLeave}>
                <div className={'circle'}  style={{'--scale-factor': `${(Math.pow(album.saved_songs.length, 1 / 4) / 2)}`, animationDelay: `${i}s`,}}></div>
                <div style={(showPeak && peakObject === album) ? {position: 'absolute'} :  {display: 'none'}}>
                    <img alt={''} className={'album-image-backdrop'} src={album.images[2].url}></img>
                    <img alt={'item artwork'} className={'album-image'} onMouseLeave={handleMouseLeave} src={album.images[0].url}></img>
                    <div className={'album-text'}>
                        <h2>{(album.name.length > 25 ? album.name.slice(0, 23) + '...' : album.name)}</h2>
                        <FavoriteIcon fontSize={'small'} style={{transform: 'scale(50%)'}}/>
                        <p>{album.saved_songs.length} song(s) saved from this album.</p>
                    </div>
                </div>
            </div>
        })
        return (<div className={'album-showcase'}>
                    <h3 style={{top: '0', fontFamily: 'Inter Tight', position: 'absolute'}}>{userID === 'me' ? 'your' : `${currentUser.username}'s`} <span style={{color: '#22C55E'}}>album constellation</span> for {focus.title}</h3>
                    {points ?
                        (points.length > 0 ?
                                points
                                :
                                <div style={{display: 'flex', flexDirection: 'column', fontFamily: 'Inter Tight', fontWeight: '600'}}>
                                    <p>There doesn't seem to be anything here.</p>
                                    <p>Add some songs by <span style={{color: '#22C55E', fontWeight: 'bold'}}>{focus.title}</span> to public playlists to uncover your constellation.</p>
                                </div>
                        )
                        :
                        <></>
                    }
                </div>)
    }

    String.prototype.hashCode = function() {
        let hash = 0,
            i, chr;
        if (this.length === 0) return hash;
        for (i = 0; i < this.length; i++) {
            chr = this.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    }

    // Function that loads the page when necessary
    const loadPage = () => {
        // If the page hasn't loaded then grab the user data
        if (userID === window.localStorage.getItem("userID") || userID === "me") {
            window.location.hash = "me";
            setUserID("me")
        } else {
            setUserID(window.location.hash.split("#")[1])
            if (isLoggedIn()) {
                followsUser(userID).then(following => setFollowing(following));
            }
        }
        if (!loaded) {
            retrieveUser(userID).then(function (result) {
                setCurrentUser(result);
                if (userID === window.localStorage.getItem("userID") || userID === "me") {
                    retrieveMedia().then(function (media) {
                        setCurrentUser({
                            ...result,
                            media: media
                        })
                    })
                }
                document.title = `Photon | ${result.username}`;
            })
        }
        // Update the datapoint
        retrieveDatapoint(userID, term).then(function (result) {
            console.log(result)
            setDatapoint(result)
            updateArtistQualities(result).then(() => {
                if (!chipletData) {
                    setChipletData([result.topArtists[0], result.topGenres[0]])
                }
            });
            analyseSongs(result.topSongs);
            if (isLoggedIn()) {
                getPlaylists(userID).then(results => {
                    setFocusedPlaylist(results[0]);
                    console.log(results);
                    setPlaylists(results);
                })
            }
            retrievePreviousDatapoint(userID, term).then(function (prevD) {
                setPrevDatapoint(prevD);
            })
            setLoaded(true);
        })
        // Refresh the focus
        // Indicate that the loading is over
    }
    // Delay function mainly used for animations
    const delay = ms => new Promise(res => setTimeout(res, ms));

    // The function that updates the focus.
    async function updateFocus(item, tertiaryText) {
        focus.item = item;
        if (!((focus.tertiary === tertiaryText && (focus.title === item.title || focus.title === item.name)) && showArt === true) && !!item) {
            setShowArt(false);
            let localState = focus;
            await delay(300);
            localState.image = item.image;
            localState.link = item.link;
            if (item.type === "song") {
                localState.title = item.title;
                localState.secondary = `by ${item.artist}`;
                localState.tertiary = tertiaryText;
                setStatsSelection(item.analytics);
            } else if (item.type === "artist") {
                setLikedSongsFromArtist(null);
                localState.title = item.name;
                localState.secondary = item.genre;
                localState.tertiary = tertiaryText;
                getLikedSongsFromArtist(item.artist_id, playlists).then(res => setLikedSongsFromArtist(res));
            } else {
                localState.title = '';
                localState.secondary = item;
                localState.tertiary = '';
            }
            setFocus(localState);
            await updateFocusMessage();
            setShowArt(true)
        }
    }

    useEffect(() => {
        if (!isLoggedIn() && userID === "me") {
            window.location.replace(authURI)
        }
        loadPage();
    }, [term, userID])

    // Get the top artist to show immediately.
    useEffect(() => {
        if(simpleSelection === 'Artists'){updateFocus(datapoint.topArtists[0])}
    }, [artistQualities])


    return (
        <>

            {!loaded ?
                <div className="lds-grid">
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
                :
                <div className='wrapper'>
                    <div className='user-container' style={{'--pfp': `url(${currentUser.profilePicture})`}}>
                        <img className='profile-picture' alt='Profile' src={currentUser.profilePicture}></img>
                        <div style={{display: `flex`, flexDirection: `column`, paddingLeft: `5px`}}>
                            <h3 style={{margin: '0 0 -2px 0' ,fontSize: '14px'}}>Profile for</h3>
                            <div className='username'>{currentUser.username}</div>
                            {userID !== "me" && isLoggedIn() ? <a className={"auth-button"}
                                                                  href={`/compare#${window.localStorage.getItem("userID")}&${currentUser.userID}`}>Compare</a> : <></>}
                                <p style={{fontWeight: 'bold', fontFamily: 'Inter Tight', margin: '10px 0 0 0'}}><span style={{color: '#22C55E'}}>{chipletData[0].name}</span> fan · <span style={{color: '#22C55E'}}>{chipletData[1]}</span> fan</p>
                            <a target="_blank" href={`https://open.spotify.com/user/${currentUser.userID}`} className='spotify-link' style={{fontFamily: 'Inter Tight', gap: '5px', marginTop: '7px'}}>
                                <svg xmlns="http://www.w3.org/2000/svg" height="25px" width="25px" version="1.1"
                                     viewBox="0 0 168 168">
                                    <path fill="#22C55E"
                                          d="m83.996 0.277c-46.249 0-83.743 37.493-83.743 83.742 0 46.251 37.494 83.741 83.743 83.741 46.254 0 83.744-37.49 83.744-83.741 0-46.246-37.49-83.738-83.745-83.738l0.001-0.004zm38.404 120.78c-1.5 2.46-4.72 3.24-7.18 1.73-19.662-12.01-44.414-14.73-73.564-8.07-2.809 0.64-5.609-1.12-6.249-3.93-0.643-2.81 1.11-5.61 3.926-6.25 31.9-7.291 59.263-4.15 81.337 9.34 2.46 1.51 3.24 4.72 1.73 7.18zm10.25-22.805c-1.89 3.075-5.91 4.045-8.98 2.155-22.51-13.839-56.823-17.846-83.448-9.764-3.453 1.043-7.1-0.903-8.148-4.35-1.04-3.453 0.907-7.093 4.354-8.143 30.413-9.228 68.222-4.758 94.072 11.127 3.07 1.89 4.04 5.91 2.15 8.976v-0.001zm0.88-23.744c-26.99-16.031-71.52-17.505-97.289-9.684-4.138 1.255-8.514-1.081-9.768-5.219-1.254-4.14 1.08-8.513 5.221-9.771 29.581-8.98 78.756-7.245 109.83 11.202 3.73 2.209 4.95 7.016 2.74 10.733-2.2 3.722-7.02 4.949-10.73 2.739z"/>
                                </svg>
                                View profile in Spotify
                            </a>
                        </div>
                        <div className='user-details'>
                            {following !== null ?
                                <ThemeProvider theme={chipletTheme}>
                                    {following ?
                                        <div className={"follow-button"} style={{
                                            display: 'flex',
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'right',
                                        }} onClick={function () {
                                            unfollowUser(userID);
                                            setFollowing(false)
                                        }}>
                                            <CheckCircleOutlineIcon className={"follow-button"} fontSize="medium"
                                                                    color="primary"/>
                                        </div>
                                        :
                                        <div className={"follow-button"} style={{
                                            display: 'flex',
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'right'
                                        }} onClick={function () {
                                            followUser(userID);
                                            setFollowing(true)
                                        }}>
                                            <AddCircleOutlineIcon fontSize="medium"/>
                                        </div>
                                    }
                                </ThemeProvider>
                                :
                                <></>
                            }
                        </div>
                    </div>
                    <div style={{marginTop: '20px'}}>
                        <div style={{
                            display: `flex`,
                            flexDirection: `row`,
                            marginLeft: 'auto',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '75px',
                        }}>
                            <img src={arrow} style={{transform: `rotate(180deg) scale(10%)`, cursor: `pointer`}}
                                 onClick={() => decrementSimple()} alt={"arrow"}></img>
                            <h2 className='datapoint-title' style={{height: 'max-content'}}>Top {simpleSelection}</h2>
                            <img src={arrow} style={{transform: `scale(10%)`, cursor: `pointer`}}
                                 onClick={() => incrementSimple()} alt={"arrow"}></img>
                        </div>
                        <div className='term-container'>
                            {terms.map(function (element) {
                                return <button key={element} onClick={() => setTerm(element)}
                                               style={term === element ? {
                                                   backgroundColor: `#22CC5E`,
                                                   transform: 'scale(95%)',
                                                   color: 'white',
                                                   "--fill-color": '#22C55E'
                                               } : {
                                                   backgroundColor: `#343434`,
                                                   cursor: `pointer`,
                                                   width: '100px',
                                                   color: 'white',
                                                   "--fill-color": 'white'
                                               }}>{element === "long_term" ? "all time" : (element === "medium_term" ? "6 months" : "4 Weeks")}</button>
                            })}
                        </div>
                        <div className='simple-container'>
                            <ol className={"list-item-ol"} style={{marginTop: '0', maxWidth: '500px'}}>
                                {datapoint[`top${simpleSelection}`].map(function (element, i) {
                                    if (i < 10 && element) {
                                        const message = i < 3 ? `${userID === "me" ? "Your" : `${currentUser.username}'s`} ${i > 0 ? (i === 1 ? `2ⁿᵈ to` : `3ʳᵈ to`) : ``} top ${element.type}` : ``;
                                        const indexChange = getIndexChange(element, i, `top${simpleSelection}`);
                                        let changeMessage;
                                        if (indexChange < 0) {
                                            changeMessage = <><span style={{
                                                color: 'red',
                                                fontSize: '10px',
                                            }}>{indexChange}</span><ArrowCircleDownIcon style={{color: 'red', animation: 'down-change-animation 0.5s ease-out'}}
                                                                                        fontSize={"small"}></ArrowCircleDownIcon></>
                                        } else if (indexChange > 0) {
                                            changeMessage = <><span style={{
                                                color: '#22C55E',
                                                fontSize: '10px'
                                            }}>{indexChange}</span><ArrowCircleUpIcon style={{color: '#22C55E', animation: 'up-change-animation 0.5s ease-out'}}
                                                                                      fontSize={"small"}></ArrowCircleUpIcon></>
                                        } else if (indexChange === 0) {
                                            changeMessage = <ClearAllIcon style={{color: 'orange', animation: 'equals-animation 0.5s ease-out'}} fontSize={"small"}></ClearAllIcon>
                                        }
                                        return <li key={element.type ? element[`${element.type}_id`] : element}
                                                   className='list-item'
                                                   onClick={() => updateFocus(element, message)}>{getLIName(element)} {changeMessage}</li>
                                    } else {
                                        return <></>
                                    }
                                })}
                            </ol>
                            {simpleSelection === 'Songs' ?
                                <div style={{display: 'flex', flexDirection: 'column', margin: 'auto'}}>
                                    {statsSelection ?
                                        <h2 className={'stats-title'} style={{color: '#22C55E', cursor: 'pointer', zIndex: '1'}} onClick={() => setStatsSelection(null)}>{focus.title}<ClearIcon fontSize={'small'}/></h2>
                                        :
                                        <h2 className={'stats-title'}>{userID === 'me' ? 'your' : `${currentUser.username}'s`} <span style={{color: '#22C55E'}}>average</span> song analytics.</h2>
                                    }
                                    <div className={'simple-stats'}>
                                        {
                                            Object.keys(translateAnalytics).map(function(key){
                                                if(key !== 'loudness' && key !== 'liveness'){
                                                    return <div className={'stat-block'} onClick={function(){
                                                        if(simpleSelection === 'Songs'){
                                                            window.scrollTo({ left: 0, top: 1350, behavior: "smooth" });
                                                            if(graphAxis.y !== key){setGraphAxis({...graphAxis ,x: key})
                                                            }
                                                        }
                                                    }}>
                                                        <h3>{translateAnalytics[key].name}</h3>
                                                        <div className={'stat-bar'} style={{'--val': `100%`, backgroundColor: 'black', marginBottom: '-10px'}}></div>
                                                        <div className={'stat-bar'} style={{'--val': `${statsSelection ? (key === 'tempo' ? 100 * (statsSelection[key] - 50) / 150 : statsSelection[key] * 100) : selectionAnalysis[key] * 100}%`}}></div>
                                                        {statsSelection ?
                                                            <div className={'stat-bar'} style={{'--val': `${selectionAnalysis[key] * 100}%`, opacity: '0.25', marginTop: '-10px'}}></div>
                                                            :
                                                            <></>
                                                        }
                                                        <p>{translateAnalytics[key].description}</p>
                                                    </div>
                                                }
                                            })
                                        }
                                    </div>
                                </div>
                                :
                                <></>
                            }
                            {simpleSelection === 'Artists' ?
                                (isLoggedIn() ?
                                    <ArtistConstellation/>
                                    :
                                        <div style={{margin: 'auto', justifyContent: "center", textAlign: 'center'}}>
                                            <h2 style={{fontFamily: 'Inter Tight'}}>Log-in to see this user's artist constellation.</h2>
                                            <a className="auth-button" href={authURI}>Log-in</a>
                                        </div>
                                )
                                :
                                <></>
                            }
                            {simpleSelection === 'Genres' ?
                                <div style={{textAlign: 'center', margin: 'auto', maxWidth: '800px'}}>
                                    {focusMessage}
                                </div>
                                :
                                <></>
                            }
                        </div>
                        {simpleSelection !== 'Genres' ?
                            <Focus/>
                            :
                            <></>
                        }
                    </div>
                    {simpleSelection === 'Songs' ?
                    <Graph title="Your top 50 songs" keyEntry="song_id" selections={analyticsMetrics}
                           data={datapoint.topSongs.map(song => song.analytics)} parent={datapoint.topSongs}/>
                        :
                        <></>
                    }
                    <h2 style={{
                        textTransform: `uppercase`,
                        fontFamily: 'Inter Tight, sans-serif',
                        fontSize: `30px`,
                        margin: '50px auto auto auto',
                        textAlign: 'center',
                        textDecoration: 'underline 1px #343434'
                    }}>{currentUser.username}'s playlists</h2>
                    <div className={"playlist-wrapper"}>
                        {playlists ?
                            <>
                                {playlists.length === 0 ?
                                    <p>There's nothing here...</p>
                                    :
                                    <>
                                    <ol className={"list-item-ol"} style={{width: "max-content"}}>
                                        {
                                            playlists.map(function (playlist) {
                                                return <li onClick={() => setFocusedPlaylist(playlist)} className={"list-item"} style={{fontSize: '20px', fontFamily: 'Inter Tight'}}>{playlist.name.length > 25 ? playlist.name.slice(0,25) + '...' : playlist.name}</li>
                                            })
                                        }
                                    </ol>
                                    <div className={"focused-playlist"}>
                                        <div className={"focused-playlist-text"}>
                                            <h2>{focusedPlaylist.name.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '')}</h2>
                                            <h3>{focusedPlaylist.description}</h3>
                                            <hr/>
                                            <div style={{display: 'flex', flexDirection: 'row'}}>
                                                <a target="_blank" href={focusedPlaylist.external_urls.spotify} style={{display: 'flex', gap: '10px', fontFamily: 'Inter Tight'}} className={"spotify-link"}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" height="25px" width="25px" version="1.1"
                                                         viewBox="0 0 168 168">
                                                        <path fill="#22C55E"
                                                              d="m83.996 0.277c-46.249 0-83.743 37.493-83.743 83.742 0 46.251 37.494 83.741 83.743 83.741 46.254 0 83.744-37.49 83.744-83.741 0-46.246-37.49-83.738-83.745-83.738l0.001-0.004zm38.404 120.78c-1.5 2.46-4.72 3.24-7.18 1.73-19.662-12.01-44.414-14.73-73.564-8.07-2.809 0.64-5.609-1.12-6.249-3.93-0.643-2.81 1.11-5.61 3.926-6.25 31.9-7.291 59.263-4.15 81.337 9.34 2.46 1.51 3.24 4.72 1.73 7.18zm10.25-22.805c-1.89 3.075-5.91 4.045-8.98 2.155-22.51-13.839-56.823-17.846-83.448-9.764-3.453 1.043-7.1-0.903-8.148-4.35-1.04-3.453 0.907-7.093 4.354-8.143 30.413-9.228 68.222-4.758 94.072 11.127 3.07 1.89 4.04 5.91 2.15 8.976v-0.001zm0.88-23.744c-26.99-16.031-71.52-17.505-97.289-9.684-4.138 1.255-8.514-1.081-9.768-5.219-1.254-4.14 1.08-8.513 5.221-9.771 29.581-8.98 78.756-7.245 109.83 11.202 3.73 2.209 4.95 7.016 2.74 10.733-2.2 3.722-7.02 4.949-10.73 2.739z"/>
                                                    </svg>
                                                    Open in Spotify
                                                </a>
                                                <p>{focusedPlaylist.tracks.total} songs</p>
                                            </div>

                                        </div>
                                        <img alt={''} className={'playlist-art'} src={focusedPlaylist.images[0].url}></img>
                                    </div>
                                    </>
                                }

                            </>
                            :
                            <div style={{display: 'flex', flexDirection: 'column', margin: 'auto', alignItems: 'center'}}>
                                <h2 style={{fontFamily: 'Inter Tight'}}>Want to see? </h2>
                                <a className="auth-button" href={authURI}>Log-in</a>
                            </div>
                        }
                    </div>

                </div>
            }
        </>
    )
}

export default Profile