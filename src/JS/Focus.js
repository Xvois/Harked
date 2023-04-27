/**
 * The focus component displays an image with a title and description, as well
 * as an accompanying message. It is used to display artist and song art and give
 * context about them for a specific user.
 */

import React, {useEffect, useState} from "react";
import './../CSS/Focus.css'
import {
    formatArtist, formatSong,
    getAlbumsWithLikedSongs,
    getSimilarArtists,
    getTrackRecommendations,
    isLoggedIn
} from "./PDM";


const Focus = React.memo((props) => {
    const {user, item, datapoint, type, interactive} = props;
    let artistQualities;
    useEffect(() => {
        console.log(item);
        updateArtistQualities(datapoint);
        updateFocus();
    }, [item])
    const possessive = window.location.hash.slice(1, window.location.hash.length) === 'me' ?  'your' : `${user.username}'s`
    const [focus, setFocus] = useState({
        item: null,
        title: '', //main text
        secondary: '', //sub-title
        image: '',
        link: '',
    })
    const [focusMessage, setFocusMessage] = useState(<p></p>);
    const [artistsAlbumsWithLikedSongs, setArtistsAlbumsWithLikedSongs] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const analyticsMetrics = ['acousticness', 'danceability', 'energy', 'instrumentalness', 'valence', `tempo`];
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
    const [showWrapperArt, setShowWrapperArt] = useState(true);
    const [hover, setHover] = useState(false);

    function flip() {
        setShowWrapperArt(!showWrapperArt);
    }

    // The function that updates the focus.
    function updateFocus() {
        console.info("updateFocus called!")
        focus.item = item;
        let localState = focus;
        localState.image = item.image;
        localState.link = item.link;
        if (type === "songs") {
            localState.title = item.title;
            localState.secondary = `by${item.artists.map(e => ' ' + e.name)}`;
        } else if (type === "artists") {
            localState.title = item.name;
            getAlbumsWithLikedSongs(user.user_id, item.artist_id).then(
                result => setArtistsAlbumsWithLikedSongs(result)
            );
            if(item.genres){
                localState.secondary = item.genres[0];
            }
            else{
                localState.secondary = null;
            }
        } else if (type === "genres") {
            localState.title = '';
            localState.secondary = item;
        }
        setFocus(localState);
        updateFocusMessage();
    }


    // Update the focus message to be
    // relevant to the current focus
    const updateFocusMessage = function () {
        // What do we use as our possessive?
        const item = focus.item;
        let topMessage = '';
        let secondMessage = '';
        switch (type) {
            case "artists":
                if (artistQualities[`${item.name}`] === undefined) {
                    // If the artist doesn't have a genre analysis then we assume
                    // that they are not wildly popular.
                    topMessage += `${item.name} is a rare to see artist. They make ${possessive} profile quite unique.`
                } else {
                    Object.keys(artistQualities[item.name]).length > 1 ?
                        topMessage += `${item.name} represents ${possessive} love for ${artistQualities[item.name]["genre"]} and ${translateAnalytics[artistQualities[item.name]["theme"]].name} music.`
                        :
                        topMessage += `${item.name} is the artist that defines ${possessive} love for ${artistQualities[item.name][Object.keys(artistQualities[item.name])[0]]} music.`
                }
                // The index of the song in the user's top songs list made by this artist.
                const songIndex = datapoint.top_songs.findIndex((element) => element.artists[0].name === item.name);
                if (songIndex !== -1) {
                    secondMessage += `${datapoint.top_songs[songIndex].title} by ${item.name} is Nº ${songIndex + 1} on ${possessive} top 50 songs list for this time frame.`
                }
                break;
            case "songs":
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
                topMessage += `${item.title} is a very ${maxAnalytic === 'tempo' ? 'high' : ''} ${translateAnalytics[maxAnalytic].name} song by${item.artists.map(e => ' ' + e.name)}.`
                if (datapoint.top_artists.some((element) => element && element.name === item.artists[0].name)) {
                    const index = datapoint.top_artists.findIndex((element) => element.name === item.artists[0].name);
                    secondMessage += `${item.artists[0].name} is Nº ${index + 1} on ${possessive} top artists list in this time frame.`
                }
                break;
            case "genres":
                let relevantArtists = [];
                for (let artist in datapoint.top_artists) {
                    if (!!artist.genres && artist.genres[0] === item) {
                        relevantArtists.push(artist);
                    }
                }
                datapoint.top_artists.forEach(artist => {
                    if (!!artist.genres) {
                        if (artist.genres.includes(item) && !relevantArtists.includes(artist.name)) {
                            relevantArtists.push(artist.name)
                        }
                    }
                });
                if (relevantArtists.length > 1) {
                    topMessage = <h2>{possessive[0].toUpperCase() + possessive.substring(1)} love for {item} is not only defined
                        by {possessive} love for <a href="https://google.com" style={{color: '#22C55E', textDecoration: '0.5px underline'}}>{relevantArtists[0]}</a> but
                        also {relevantArtists.length - 1} other artist{relevantArtists.length - 1 === 1 ? `` : "s"}...</h2>
                    let secondMessageText = '';
                    for (let i = 1; i < relevantArtists.length; i++) {
                        secondMessageText += relevantArtists[i];
                        if (i === relevantArtists.length - 2) {
                            secondMessageText += ' and '
                        } else if (i !== relevantArtists.length - 1) {
                            secondMessageText += ', ';
                        }
                    }
                    secondMessage = <h3>{secondMessageText}</h3>
                } else {
                    if (relevantArtists.length === 1) {
                        topMessage =
                            <h2>{possessive[0].toUpperCase() + possessive.substring(1)} love for {item} is very well marked
                                by {possessive} time listening to <a href="https://google.com"
                                                                     style={{color: '#22C55E', textDecoration: '0.5px underline'}}>{relevantArtists[0]}</a>.</h2>
                    } else {
                        topMessage =
                            <h2>{possessive[0].toUpperCase() + possessive.substring(1)} taste in {item} music isn't well defined
                                by one artist, it's the product of many songs over many artists.</h2>
                    }
                }
                break;
            default:
                console.warn("updateFocusMessage error: No focus type found.")
        }
        setFocusMessage(
            <>
                <h2>{topMessage}</h2>
                <p style={{
                    color: '#22C55E',
                    fontFamily: 'Inter Tight',
                    fontWeight: '600',
                    fontSize: '20px'
                }}>{secondMessage}</p>
            </>
        );
    }

    // Update the artist attributes that are used to make the focus
    // message.
    const updateArtistQualities = function (data) {
        const songs = data.top_songs;
        const artists = data.top_artists;
        const genres = data.top_genres;
        let result = {};
        // The analytics from the datapoint that we will compare
        // Get the artist that has the max value in each
        // metric
        analyticsMetrics.forEach(metric => {
            let max = {artist: '', value: 0};
            for (let i = 0; i < 50; i++) {
                if (songs[i].analytics[metric] > max.value) {
                    max.artist = songs[i].artists[0].name;
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
            if (!!artist.genres && genres.includes(artist.genres[0])) {
                result[artist.name] = {
                    ...result[artist.name],
                    genre: artist.genres[0]
                }
            }
        })
        artistQualities = result;
    }

    const SongAnalysis = (props) => {
        const song = props.song;
        if(song.hasOwnProperty("song_id")){
            const analytics = song.analytics;
            return (
                <div style={{width: '100%', height: '100%', justifyContent: 'center', alignContent: 'center'}}>
                    {
                        Object.keys(translateAnalytics).map(function (key) {
                            if (key !== 'loudness' && key !== 'liveness') {
                                return (
                                    <div className={'stat-block'}>
                                        <h3>{translateAnalytics[key].name}</h3>
                                        <div className={'stat-bar'} style={{
                                            '--val': `100%`,
                                            backgroundColor: 'black',
                                            marginBottom: '-5px'
                                        }}></div>
                                        <div className={'stat-bar'}
                                             style={{'--val': `${analytics ? (key === 'tempo' ? 100 * (analytics[key] - 50) / 150 : analytics[key] * 100) : analytics[key] * 100}%`}}></div>
                                        <p>{translateAnalytics[key].description}</p>
                                    </div>)

                            }
                        })
                    }
                </div>
            )
        }
    }

    const ArtistAnalysis = (props) => {
        const artist = props.artist;
        if(artist.hasOwnProperty("artist_id")) {
            const orderedAlbums = artistsAlbumsWithLikedSongs.sort((a, b) => b.saved_songs.length - a.saved_songs.length).slice(0, 5);
            return (
                <div style={{width: '100%', height: '100%', justifyContent: 'center', alignContent: 'center'}}>
                    <h2 className={'artist-analysis-title'}>{possessive.charAt(0).toUpperCase() + possessive.slice(1)} top
                        albums for {artist.name} [PH]</h2>
                    <ol className={'top-albums'}>
                        {
                            orderedAlbums.map(function (album) {
                                return (
                                    <li className={'album-li'}>
                                        <h3 style={{margin: 0}}>{album.name.length > 25 ? album.name.slice(0, 25) + '...' : album.name}</h3>
                                        <p>{album.saved_songs.length} saved
                                            song{album.saved_songs.length > 1 ? 's' : ''}.</p>
                                    </li>
                                )
                            })
                        }
                    </ol>
                </div>
            )
        }
    }

    const handleRecommendations = () => {
        switch (type){
            case 'artists':
                getSimilarArtists(item).then(function(result) {
                    setRecommendations(result.map(a => formatArtist(a)));
                });
                break;
            case 'songs':
                const seed_artists = item.artists.map(a => a.artist_id);
                let seed_genres = [];
                item.artists.forEach(artist => seed_genres = seed_genres.concat(artist.genres))
                const seed_track = item.song_id;
                getTrackRecommendations(seed_artists, seed_genres, seed_track, 5).then(function(result) {
                    setRecommendations(result.map(t => formatSong(t)));
                });
        }
    }

    const Recommendations = () => {

        const [hoverItem, setHoverItem] = useState(-1);

        return (
            <div className={'rec-items'}>
                {
                    recommendations.slice(0,5).map(function(rec, index){
                        return (
                        <div className={'rec-tile-wrapper'}
                             onMouseEnter={() => setHoverItem(index)}
                             onMouseLeave={() => setHoverItem(-1)}
                             style={
                                 hoverItem !== -1 ?
                                     hoverItem === index ? {cursor: 'pointer'} : {filter: 'brightness(60%)'}
                                     :
                                     {}
                            }>
                            <RecommendationTile item={rec}/>
                        </div>
                        )
                    })
                }
            </div>
        )
    }

    const RecommendationTile = (props) => {
        const {item} = props;
        return (
            <a href={item.link} target={"_blank"}>
                <img alt={`${type.slice(0, type.length-1)} art`} src={item.image}></img>
                <div className={'tile-text'}>
                    <h2>
                        {type === 'songs' ?
                            item.title
                            :
                            item.name
                        }
                    </h2>
                    {type === 'songs' ?
                        <p>{item.artists[0].name}</p>
                        :
                        <p>{item.genres[0]}</p>
                    }
                </div>
            </a>
        )
    }


    return (
        <>
            <div className='focus-container'>
                <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                    <div className={'play-wrapper'} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onClick={function(){if(interactive){flip()}}}
                         style={hover && interactive? {cursor: 'pointer'} : {}}
                        rel="noopener noreferrer">
                        {showWrapperArt ?
                            <>
                                <img style={hover && interactive ? {overflow: 'hidden', filter: 'brightness(60%) blur(5px)'} : {}} alt={''} className='art' src={focus.image} loading="lazy"></img>
                                <img alt={''} className='art' id={'art-backdrop'} src={focus.image}></img>
                            </>
                            :
                            <div className={'item-analysis'} style={hover && interactive ? {overflow: 'hidden', filter: 'brightness(60%) blur(5px)'} : {}}>
                                {type === "songs" ?
                                    <SongAnalysis song={focus.item}/>
                                    :
                                    <ArtistAnalysis artist={focus.item}/>
                                }
                            </div>
                        }
                        <p style={hover && interactive ? {transform: 'none', opacity: '1'} : {}}>
                            View <span style={{color: '#22C55E'}}>{showWrapperArt ? "analysis" : "art"}</span>
                        </p>
                    </div>
                </div>
                <div className={'focus-message'}>
                    {focusMessage}
                    {isLoggedIn() && type !== 'genres' ?
                        <button className={'auth-button'} onClick={handleRecommendations}>Recommend me similar {type}</button>
                        :
                        <></>
                    }
                </div>
            </div>
            {recommendations.length > 0 ?
                <div className={'recommendations'}>
                    <Recommendations/>
                </div>
                :
                <></>
            }
        </>
    )
})

export default Focus
