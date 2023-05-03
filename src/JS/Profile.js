// noinspection JSValidateTypes

/**
 * The main component of the site. This combines many elements to show the user
 * information about their datapoints. It gives them the ability to focus each element,
 * view profiles, compare stats and change the term of their datapoints.
 */

import React, {useEffect, useState} from 'react';
import './../CSS/Profile.css';
import './../CSS/Graph.css'
import {
    followsUser,
    followUser,
    retrievePlaylists,
    isLoggedIn,
    retrieveDatapoint,
    retrieveMedia,
    retrieveUser,
    unfollowUser,
    retrievePreviousDatapoint,
    getAlbumsWithLikedSongs,
    getSimilarArtists,
    formatArtist,
    getTrackRecommendations, formatSong, retrieveFollowers
} from './PDM';
import ArrowCircleDownIcon from '@mui/icons-material/ArrowCircleDown';
import ArrowCircleUpIcon from '@mui/icons-material/ArrowCircleUp';
import ClearAllOutlinedIcon from '@mui/icons-material/ClearAllOutlined';
import {handleLogin} from "./Authentication";
import {getItemAnalysis, getItemIndexChange, translateAnalytics} from "./Analysis";


const Profile = () => {
    const [possessive, setPossessive] = useState('')
    const [focusedPlaylist, setFocusedPlaylist] = useState();
    const translateTerm = {short_term : '4 weeks', medium_term : '6 months', long_term: 'all time'}
    const [user_id, setUser_id] = useState(window.location.hash.split("#")[1]);
    const [loaded, setLoaded] = useState(false);
    const [currentUser, setCurrentUser] = useState({
        user_id: '',
        username: '',
        profile_picture: '',
        media: {name: '', image: ''},
    });
    const [datapoint, setDatapoint] = useState({
        user_id: '',
        term: '',
        top_songs: [],
        top_artists: [],
        top_genres: [],
    });
    const [prevDatapoint, setPrevDatapoint] = useState(null);
    const [term, setTerm] = useState("long_term");
    const terms = ["short_term", "medium_term", "long_term"];
    // The datapoint we are currently on
    const [playlists, setPlaylists] = useState([])
    const simpleDatapoints = ["artists", "songs", "genres"]
    const analyticsMetrics = ['acousticness', 'danceability', 'energy', 'instrumentalness', 'valence', `tempo`];
    const [following, setFollowing] = useState(null);
    const [followers, setFollowers] = useState([]);
    const [selectionAnalysis, setSelectionAnalysis] = useState();
    const [chipData, setChipData] = useState();
    // Get the display name of the list item
    const getLIName = function (data) {
        let result;
        if(data.hasOwnProperty('artist_id')){
            result = data.name;
        }else if(data.hasOwnProperty('song_id')){
            result = data.title;
        }else{
            result = data;
        }
        if (result.length > 30) {
            result = result.substring(0, 30) + "..."
        }
        return result;
    }

    const getLIDescription = function (data) {
        let result;
        if(data.hasOwnProperty('artist_id')){
            if(data.genres && data.genres.length > 0) {
                result = data.genres[0];
            }else{
                result = '';
            }
        }else if(data.hasOwnProperty('song_id')){
            result = data.artists[0].name;
        }else{
            result = '';
        }
        if (result.length > 40) {
            result = result.substring(0, 40) + "..."
        }
        return result;
    }

    /**
     * Stores the average song characteristics of all songs in the array.
     * @param songs
     */
    const analyseSongs = function (songs) {
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
        songs.forEach(function (song) {
            analyticsMetrics.forEach((analyticKey) => {
                if (analyticKey === 'tempo') {
                    res[analyticKey] += (song.analytics[analyticKey] - 50) / (songs.length * 150);
                } else {
                    res[analyticKey] += (song.analytics[analyticKey]) / songs.length;
                }
            })
        })
        setSelectionAnalysis(res);
    }

    const ArtistAnalysis = (props) => {
        const {artist, user} = props;

        const [artistsAlbumsWithLikedSongs, setArtistsAlbumsWithLikedSongs] = useState([]);

        useEffect(() => {
            getAlbumsWithLikedSongs(user.user_id, artist.artist_id).then(
                result => setArtistsAlbumsWithLikedSongs(result)
            );
        }, [])

        if(artist.hasOwnProperty("artist_id")) {
            const orderedAlbums = artistsAlbumsWithLikedSongs.sort((a, b) => b.saved_songs.length - a.saved_songs.length).slice(0, 4);
            return (
                <div className={'analysis'}>
                    {orderedAlbums.length > 0 ?
                        orderedAlbums.map(function (album) {
                            return <StatBlock name={album.name.length > 35 ? album.name.slice(0,35) + '...' : album.name} description={`${album.saved_songs.length} saved songs.`} value={(album.saved_songs.length / orderedAlbums[0].saved_songs.length) * 100}/>
                        })
                        :
                        <p style={{fontFamily: 'Inter Tight', textAlign: 'right'}}>There are no saved songs from this artist on {possessive} public profile.</p>
                    }
                </div>
            )
        }
    }

    const SongAnalysis = (props) => {
        const song = props.song;
        const excludedKeys = ['loudness', 'liveness', 'instrumentalness', 'tempo']
        if(song.hasOwnProperty("song_id")){
            const analytics = song.analytics;
            return (
                <div className={'analysis'}>
                    {
                        Object.keys(translateAnalytics).map(function (key) {
                            if (excludedKeys.findIndex(e => e === key) === -1) {
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
                    opacity: '0.5',
                    marginBottom: '-5px',
                    animation: 'none'
                }}></div>
                <div className={'stat-bar'}
                     style={{'--val': `${value}%`}}></div>
                <p>{description}</p>
            </div>
        )
    }

    const ShowcaseList = (props) => {
        const {type, start, end} = props;

        const [hoverItem, setHoverItem] = useState(-1);
        const [selectedItem, setSelectedItem] = useState(-1);

        return (
            <div className={'showcase-list-wrapper'}>
                {datapoint[`top_${type}`].map(function(element, index){
                    if(index >= start && index <= end){
                        return (
                            <div
                                onMouseEnter={() => setHoverItem(index)}
                                onMouseLeave={() => setHoverItem(-1)}
                                tabIndex={0}
                                style={
                                    hoverItem !== -1 ?
                                        hoverItem === index ? {cursor: 'pointer'} : {filter: 'brightness(60%)'}
                                        :
                                        {}
                                }>
                                <ShowcaseListItem element={element} index={index} type={type} />
                            </div>
                        )
                    }
                })}
            </div>
        )
    }


    const ShowcaseListItem = (props) => {
        const {element, index, type} = props;

        const [expanded, setExpanded] = useState(index === 0);
        const [recommendations, setRecommendations] = useState(null);
        const [seeRecommendations, setSeeRecommendations] = useState(false);
        const indexChange = prevDatapoint ? getItemIndexChange(element, index, type, prevDatapoint) : null;

        const handleRecommendations = () => {
            if(recommendations === null){
                switch (type){
                    case 'artists':
                        getSimilarArtists(element).then(function(result) {
                            setRecommendations(result.map(a => formatArtist(a)));
                            setSeeRecommendations(!seeRecommendations);
                        });
                        break;
                    case 'songs':
                        const seed_artists = element.artists.map(a => a.artist_id);
                        let seed_genres = [];
                        element.artists.forEach(artist => {
                            if(artist.genres){
                                seed_genres.push(artist.genres)
                            }
                        })
                        const seed_track = element.song_id;
                        getTrackRecommendations(seed_artists, seed_genres, seed_track).then(function(result) {
                            setRecommendations(result.map(t => formatSong(t)));
                            setSeeRecommendations(!seeRecommendations);
                        });
                }
            }else{
                setSeeRecommendations(!seeRecommendations);
            }
        }

        let changeMessage;
        if (indexChange < 0) {
            changeMessage = <><span style={{
                color: 'grey',
                fontSize: '10px',
            }}>{indexChange}</span><ArrowCircleDownIcon style={{
                color: 'grey',
                animation: 'down-change-animation 0.5s ease-out'
            }}
                                                        fontSize={"small"}></ArrowCircleDownIcon></>
        } else if (indexChange > 0) {
            changeMessage = <><span style={{
                color: '#22C55E',
                fontSize: '10px'
            }}>{indexChange}</span><ArrowCircleUpIcon style={{
                color: '#22C55E',
                animation: 'up-change-animation 0.5s ease-out'
            }}
                                                      fontSize={"small"}></ArrowCircleUpIcon></>
        } else if (indexChange === 0) {
            changeMessage = <ClearAllOutlinedIcon
                style={{color: 'white', animation: 'equals-animation 0.5s ease-out'}}
                fontSize={"small"}></ClearAllOutlinedIcon>
        }
        const description = getItemAnalysis(element, type, currentUser, datapoint);
        return (
            <div className={"showcase-list-item"}
                 tabIndex={1}
                 style={expanded ? {height: '300px'} : {}}
                 onClick={() => {if(!expanded){setExpanded(true)}}}>
                {type !== 'genres' ?
                    <img src={element.image} style={expanded ? {filter: 'blur(10px) brightness(75%)'} : {}} />
                    :
                    <></>
                }
                <h3>{index + 1} {changeMessage}</h3>
                {expanded ?
                    <>
                        <div className={"showcase-list-item-expanded"}>
                            <div style={{fontFamily: 'Inter Tight'}}>
                                <h2 style={{margin: '0'}}>{getLIName(element)}</h2>
                                <p style={{margin: '0', textTransform: 'uppercase'}}>{getLIDescription(element)}</p>
                                <p style={{marginTop: '0 auto'}}>{description.header}</p>
                                <p style={{marginTop: '0 auto'}}>{description.subtitle}</p>
                                {type !== 'genres' && isLoggedIn() ?
                                    <button className={'showcase-rec-button'}
                                            onClick={handleRecommendations}>
                                        {seeRecommendations ?
                                            "See analysis"
                                            :
                                            "See recommendations"
                                        }
                                    </button>
                                    :
                                    <></>
                                }
                            </div>
                            {seeRecommendations ?
                                <div style={{textAlign: 'right', fontFamily: 'Inter Tight'}}>
                                    <h2 style={{margin: '0'}}>Recommendations</h2>
                                    <p style={{margin: '0', textTransform: 'uppercase'}}>for {getLIName(element)}</p>
                                    <div className={'recommendations-wrapper'}>
                                        {recommendations.map(function(item, index){
                                            if(index < 3){
                                                return (
                                                    <a href={item.link} className={'recommendation'}>
                                                        <p style={{margin: '0', fontWeight: 'bold'}}>{getLIName(item)}</p>
                                                        <p style={{margin: '0'}}>{getLIDescription(item)}</p>
                                                    </a>
                                                )
                                            }
                                        })}
                                    </div>

                                </div>
                                :
                                type === 'songs' ?
                                    <SongAnalysis song={element}/>
                                    :
                                    type === 'artists' ?
                                        <ArtistAnalysis artist={element} user={currentUser} />
                                        :
                                        <></>
                            }
                        </div>
                        <button className={'showcase-exit-button'} onClick={() => setExpanded(false)} >x</button>
                    </>
                    :
                    <div className={"showcase-list-item-text"}>
                        <h2>{getLIName(element)}</h2>
                        <p>{getLIDescription(element)}</p>
                    </div>
                }
            </div>
        )
    }



    String.prototype.hashCode = function () {
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
        if (user_id === window.localStorage.getItem("user_id") || user_id === "me") {
            window.location.hash = "me";
            setUser_id("me")
        } else {
            setUser_id(window.location.hash.split("#")[1])
            if (isLoggedIn()) {
                followsUser(window.localStorage.getItem('user_id'), currentUser.user_id).then(following => setFollowing(following));
            }
        }

        if (!loaded) {
            // Get the user information
            retrieveUser(user_id).then(function (result) {
                console.log(result)
                setCurrentUser(result);
                retrieveFollowers(result.user_id).then((f) => setFollowers(f));
                if (user_id === window.localStorage.getItem("user_id") || user_id === "me") {
                    retrieveMedia().then(function (media) {
                        setCurrentUser({
                            ...result,
                            media: media
                        })
                    })
                    setPossessive('your')
                }else{
                    setPossessive(result.username + `'s`)
                }
                document.title = `Harked | ${result.username}`;
            })
        }
        // Update the datapoint
        retrieveDatapoint(user_id, term).then(function (dpResult) {
            if(!dpResult){alert(`There is no datapoint found for ${currentUser.username} in this term. This is likely because they do not use Spotify enough.`);}
            else{
                console.log(dpResult)
                setDatapoint(dpResult)
                analyseSongs(dpResult.top_songs);
                if (!chipData) {
                    setChipData([dpResult.top_artists[0], dpResult.top_genres[0]])
                }
                retrievePreviousDatapoint(user_id, term).then(function (prevDpResult){
                    setPrevDatapoint(prevDpResult);
                })
            }
            setLoaded(true);
        })
        retrievePlaylists(user_id).then(function(p){
            setPlaylists(p);
            if(p.length > 0){
                setFocusedPlaylist(p[0]);
            }
        });
    }
    useEffect(() => {
        if (!isLoggedIn() && user_id === "me") {
            handleLogin();
        }
        loadPage();
    }, [term, user_id])

    return (
        <>
            {!loaded ?
                <div style={{top: '40%', left: '0', right: '0', position: 'absolute'}}>
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
                    <p style={{
                        position: 'relative',
                        width: 'max-content',
                        top: '50%',
                        margin: 'auto',
                        left: '0',
                        right: '0',
                        textAlign: 'center',
                        fontFamily: 'Inter Tight',
                        textTransform: 'uppercase'
                    }}>Getting the profile ready...</p>
                </div>
                :
                <div className='wrapper'>
                    <div className='user-container'>
                        <div className={'user-details'}>
                            <p>Profile for</p>
                            <h2>{currentUser.username}</h2>
                            <p><span
                                style={{color: '#22C55E'}}>{chipData[0].name}</span> fan · <span
                                style={{color: '#22C55E'}}>{chipData[1]}</span> fan</p>
                        </div>
                        <div className={'user-followers'}>
                            <div>
                                <p style={{margin: '0', fontWeight: 'normal', textAlign: 'right'}}>{followers.length}</p>
                                <p style={{margin: '0', textAlign: 'right'}}>Followers</p>
                            </div>
                            {isLoggedIn() && user_id !== 'me' ?
                                following ?
                                    <button
                                        className={'std-button'}
                                        onClick={() => {
                                            unfollowUser(window.localStorage.getItem('user_id'), currentUser.user_id).then(() => setFollowing(false));
                                        }}>
                                        Unfollow
                                    </button>
                                    :
                                    <button
                                        className={'std-button'}
                                        onClick={() => {
                                            followUser(window.localStorage.getItem('user_id'), currentUser.user_id).then(() => setFollowing(true));
                                        }}>
                                        Follow
                                    </button>
                                :
                                <></>
                            }
                        </div>
                    </div>
                    <div className={'settings-container'}>
                        <div>
                            <h3>Time frame</h3>
                            <p>of information capture</p>
                            <div style={{display: 'flex', flexDirection: 'row', gap: '5px'}}>
                                {terms.map(function(term){
                                    return (<button className={'std-button'} style={{textTransform: 'capitalize'}} onClick={() => setTerm(term)}>{translateTerm[term]}</button>)
                                })}
                            </div>
                        </div>
                        {isLoggedIn() && user_id !== 'me' ?
                            <div style={{textAlign: 'right'}}>
                                <h3>Compare?</h3>
                                <p>Why no!?!?</p>
                                <button className={'std-button'}>Do it!</button>
                            </div>
                            :
                            <></>
                        }
                    </div>

                    {simpleDatapoints.map(function(type){
                        let description = '';
                        switch (term){
                            case 'long_term':
                                description = 'These are your staple artists, those that define your overarching taste in music.'
                                break;
                            case 'medium_term':
                                description = 'TODO: SOME DELTA ANALYSIS';
                                break;
                            case 'short_term':
                                description = 'TODO: SOME DELTA ANALYSIS';
                                break;
                        }
                        return (
                            <>
                                <div className='simple-container'>
                                    <div className={'datapoint-header'}>
                                        <div style={{maxWidth: '400px'}}>
                                            <p style={{margin: '16px 0 0 0', textTransform: 'uppercase'}}>{possessive}</p>
                                            <h2 style={{margin: '0', textTransform: 'uppercase'}}>Top {type}</h2>
                                            <p style={{margin: '0', textTransform: 'uppercase'}}>Of {term !== 'long_term' ? 'the last' : ''} {translateTerm[term]}</p>
                                            <p>{description}</p>
                                        </div>
                                        <div style={{maxWidth: '400px', textAlign: 'right'}}>
                                            <p>Some friend / follower related stuff could be put here?</p>
                                            <p>Relating artists / songs to those that you follow.</p>
                                            <p>X person else also listens to your top artist / song!</p>
                                        </div>
                                    </div>
                                    <ShowcaseList type={type} start={0} end={9}/>
                                    <div className={'datapoint-footer'}>
                                        <div style={{maxWidth: '400px'}}>
                                            <p>Some friend / follower related stuff could be put here?</p>
                                            <p>Relating artists / songs to those that you follow.</p>
                                            <p>X person else also listens to your top artist / song!</p>
                                        </div>
                                        <div style={{maxWidth: '400px', textAlign: 'right'}}>
                                            <p style={{margin: '16px 0 0 0', textTransform: 'uppercase'}}>{possessive}</p>
                                            <h2 style={{margin: '0', textTransform: 'uppercase'}}>Top {type}</h2>
                                            <p style={{margin: '0', textTransform: 'uppercase'}}>Of {term !== 'long_term' ? 'the last' : ''} {translateTerm[term]}</p>
                                            <p>This is where the description of this datapoint in this time frame will go. It will talk about some stuff.</p>
                                            <p>Little bit here too</p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )
                    })}
                    <h2 style={{
                        textTransform: `uppercase`,
                        fontFamily: 'Inter Tight, sans-serif',
                        fontSize: `30px`,
                        margin: '50px auto auto auto',
                        textAlign: 'center',
                        textDecoration: 'underline 1px #343434'
                    }}>{currentUser.username}'s playlists</h2>
                    <div className={"playlist-wrapper"}>
                        {playlists.length === 0 ?
                            <p>There's nothing here...</p>
                            :
                            <>
                                <ol className={"list-item-ol"}>
                                    {
                                        playlists.map(function (playlist) {
                                            return <li onClick={() => setFocusedPlaylist(playlist)}
                                                       className={"list-item"} style={{
                                                fontSize: '20px',
                                                fontFamily: 'Inter Tight'
                                            }}>{playlist.name.length > 25 ? playlist.name.slice(0, 25) + '...' : playlist.name}</li>
                                        })
                                    }
                                </ol>
                                <div className={"focused-playlist"}>
                                    <div className={"focused-playlist-text"}>
                                        <h2>{focusedPlaylist.name}</h2>
                                        <h3>{focusedPlaylist.description}</h3>
                                        <hr/>
                                        <div style={{display: 'flex', flexDirection: 'row'}}>
                                            <a target="_blank" href={`https://open.spotify.com/playlist/${focusedPlaylist.playlist_id}`}
                                               style={{display: 'flex', gap: '10px', fontFamily: 'Inter Tight'}}
                                               className={"spotify-link"}>
                                                <svg xmlns="http://www.w3.org/2000/svg" height="25px"
                                                     width="25px" version="1.1"
                                                     viewBox="0 0 168 168">
                                                    <path fill="#22C55E"
                                                          d="m83.996 0.277c-46.249 0-83.743 37.493-83.743 83.742 0 46.251 37.494 83.741 83.743 83.741 46.254 0 83.744-37.49 83.744-83.741 0-46.246-37.49-83.738-83.745-83.738l0.001-0.004zm38.404 120.78c-1.5 2.46-4.72 3.24-7.18 1.73-19.662-12.01-44.414-14.73-73.564-8.07-2.809 0.64-5.609-1.12-6.249-3.93-0.643-2.81 1.11-5.61 3.926-6.25 31.9-7.291 59.263-4.15 81.337 9.34 2.46 1.51 3.24 4.72 1.73 7.18zm10.25-22.805c-1.89 3.075-5.91 4.045-8.98 2.155-22.51-13.839-56.823-17.846-83.448-9.764-3.453 1.043-7.1-0.903-8.148-4.35-1.04-3.453 0.907-7.093 4.354-8.143 30.413-9.228 68.222-4.758 94.072 11.127 3.07 1.89 4.04 5.91 2.15 8.976v-0.001zm0.88-23.744c-26.99-16.031-71.52-17.505-97.289-9.684-4.138 1.255-8.514-1.081-9.768-5.219-1.254-4.14 1.08-8.513 5.221-9.771 29.581-8.98 78.756-7.245 109.83 11.202 3.73 2.209 4.95 7.016 2.74 10.733-2.2 3.722-7.02 4.949-10.73 2.739z"/>
                                                </svg>
                                                Open in Spotify
                                            </a>
                                            <p>{focusedPlaylist.tracks.length} songs</p>
                                        </div>
                                    </div>
                                    <img alt={''} className={'playlist-art'}
                                         src={focusedPlaylist.image}></img>
                                </div>
                            </>
                        }
                    </div>

                </div>
            }
        </>
    )
}

export default Profile