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
import {
    getAllArtistAssociations,
    getItemDescription,
    memoizedGetAllArtistAssociations,
    MemoizedGetAllArtistAssociations
} from "./Analysis";


const Focus = React.memo((props) => {
    const {user, item, datapoint, type, interactive} = props;
    let artistAssociations;
    useEffect(() => {
        artistAssociations = getAllArtistAssociations(datapoint);
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
            let artistName;
            for (const key of Object.keys(artistAssociations)){
                if(artistAssociations[key].hasOwnProperty('genre')){
                    if(artistAssociations[key].genre === item){
                        artistName = key;
                        break;
                    }
                }
            }
            const artists = datapoint.top_artists.filter(a => a.name === artistName);
            if(artists.length > 0){
                localState.image = artists[0].image;
            }
        }
        setFocus(localState);
        setFocusMessage(getItemDescription(item, type, user, datapoint));
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
                                return <StatBlock name={translateAnalytics[key].name} description={translateAnalytics[key].description} value={analytics ? (key === 'tempo' ? 100 * (analytics[key] - 50) / 150 : analytics[key] * 100) : analytics[key] * 100}/>
                            }
                        })
                    }
                </div>
            )
        }
    }

    const StatBlock = (props) => {
        const {name, description, value} = props;
        return (
            <div className={'stat-block'}>
                <h3>{name}</h3>
                <div className={'stat-bar'} style={{
                    '--val': `100%`,
                    backgroundColor: 'black',
                    marginBottom: '-5px'
                }}></div>
                <div className={'stat-bar'}
                     style={{'--val': `${value}%`}}></div>
                <p>{description}</p>
            </div>
        )
    }

    const ArtistAnalysis = (props) => {
        const artist = props.artist;
        if(artist.hasOwnProperty("artist_id")) {
            const orderedAlbums = artistsAlbumsWithLikedSongs.sort((a, b) => b.saved_songs.length - a.saved_songs.length).slice(0, 6);
            return (
                <div style={{width: '100%', justifyContent: 'center', alignContent: 'center'}}>
                        {orderedAlbums.length > 0 ?
                            orderedAlbums.map(function (album) {
                                console.log(album)
                                return <StatBlock name={album.name.length > 35 ? album.name.slice(0,35) + '...' : album.name} description={`${album.saved_songs.length} saved songs.`} value={(album.saved_songs.length / orderedAlbums[0].saved_songs.length) * 100}/>
                            })
                            :
                            <p>There are no saved songs from this artist on {possessive} public profile.</p>
                        }
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
                getTrackRecommendations(seed_artists, seed_genres, seed_track, 4).then(function(result) {
                    setRecommendations(result.map(t => formatSong(t)));
                });
        }
    }

    const Recommendations = () => {

        const [hoverItem, setHoverItem] = useState(-1);

        return (
            <div className={'rec-items'}>
                {
                    recommendations.slice(0,4).map(function(rec, index){
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
        const title = type === 'songs' ? item.title : item.name
        const subtitle = type === 'songs' ? item.artists[0].name : item.genres[0]
        return (
            <a href={item.link} target={"_blank"}>
                <img alt={`${type.slice(0, type.length-1)} art`} src={item.image}></img>
                <div className={'tile-text'}>
                    <h2 style={{fontSize: `${30 - ( 2 * Math.sqrt(title.length) )}px`}}>{title}</h2>
                    <p style={{fontSize: `${20 - ( 2 * Math.sqrt(subtitle.length) )}px`}}>{subtitle}</p>
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
                    <h2>{focusMessage.header}</h2>
                    <p>{focusMessage.subtitle}</p>
                    {isLoggedIn() && type !== 'genres' ?
                        <button className={'auth-button'} onClick={handleRecommendations}>Recommend similar {type}</button>
                        :
                        <></>
                    }
                </div>
            </div>
            {recommendations.length > 0 ?
                <div className={'recommendations'}>
                    <div style={{display: 'flex', position: 'relative', alignItems: 'center', width: '100%', marginBottom: '30px'}}>
                        <h2 className={'recommendations-title'}><span style={{color: '#22C55E'}}>Recommendations</span> for {focus.title}</h2>
                        <button className={'recommendations-exit'} onClick={() => setRecommendations([])}>X</button>
                    </div>
                    <Recommendations/>
                </div>
                :
                <></>
            }
        </>
    )
})

export default Focus
