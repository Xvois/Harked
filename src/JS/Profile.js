// noinspection JSValidateTypes

import React, {useEffect, useState} from 'react';
import './../CSS/Profile.css';
import './../CSS/Graph.css'
import {
    followsUser,
    followUser,
    formatArtist,
    formatSong,
    getAlbumsWithTracks,
    getSimilarArtists,
    getTrackRecommendations,
    isLoggedIn,
    retrieveAllDatapoints,
    retrieveFollowers,
    retrievePlaylists,
    retrievePrevAllDatapoints,
    retrieveUser,
    unfollowUser
} from './PDM';
import ArrowCircleDownIcon from '@mui/icons-material/ArrowCircleDown';
import ArrowCircleUpIcon from '@mui/icons-material/ArrowCircleUp';
import ClearAllOutlinedIcon from '@mui/icons-material/ClearAllOutlined';
import {
    getAllItemIndexChanges,
    getAverageAnalytics,
    getGenresRelatedArtists,
    getItemAnalysis,
    getItemIndexChange,
    translateAnalytics
} from "./Analysis";
import {handleLogin} from "./Authentication";


const Profile = () => {

    const simpleDatapoints = ["artists", "songs", "genres"]
    const terms = ["short_term", "medium_term", "long_term"];
    const translateTerm = {short_term: '4 weeks', medium_term: '6 months', long_term: 'all time'}
    const pageHash = window.location.hash.split("#")[1];
    const isOwnPage = isLoggedIn() ? (pageHash === window.localStorage.getItem('user_id') || pageHash === 'me') : false

    // The datapoint that is selected for viewing
    const [selectedDatapoint, setSelectedDatapoint] = useState(null);
    // The datapoint prior to the current that is selected for comparison
    const [selectedPrevDatapoint, setSelectedPrevDatapoint] = useState(null);
    // The currently selected playlist
    const [selectedPlaylist, setSelectedPlaylist] = useState(null);
    // The currently selected term
    const [termIndex, setTermIndex] = useState(2);
    const [loaded, setLoaded] = useState(false);
    const [isLoggedUserFollowing, setIsLoggedUserFollowing] = useState(null);

    // Uninitialised variables
    const [pageUser, setPageUser] = useState(null);
    const [chipData, setChipData] = useState([]);
    const [followers, setFollowers] = useState([]);
    const [allDatapoints, setAllDatapoints] = useState([]);
    const [allPreviousDatapoints, setAllPreviousDatapoints] = useState([]);
    const [playlists, setPlaylists] = useState(null);
    const [possessive, setPossessive] = useState('');

    // Reload when attempting to load a new page
    window.addEventListener("hashchange", () => {window.location.reload()});


    // Function that loads the page when necessary
    const loadPage = () => {
        // Promises that need to be made before the page can be loaded
        let loadPromises = [
            retrieveUser(pageHash).then(function (user) {
                setPageUser(user);
                retrieveFollowers(user.user_id).then(f => setFollowers(f));
                if (!isOwnPage) {
                    setPossessive(user.username + "'s")
                } else {
                    setPossessive("your")
                }
                console.info("User retrieved!");
            }),
            retrieveAllDatapoints(pageHash).then(function (datapoints) {
                setAllDatapoints(datapoints);
                // Set it to the long term datapoint
                setSelectedDatapoint(datapoints[2]);
                setChipData([datapoints[2].top_artists[0], datapoints[2].top_genres[0]]);
                console.info("Datapoints retrieved!");
            }),
            retrievePrevAllDatapoints(pageHash, 1).then(function (datapoints) {
                setAllPreviousDatapoints(datapoints);
                setSelectedPrevDatapoint(datapoints[termIndex]);
                console.info("Previous datapoints retrieved!");
            }),
        ]

        // Behaviour for if the user is logged in
        if (isLoggedIn()) {
            const loggedUserID = window.localStorage.getItem('user_id');
            if (!isOwnPage) {
                 console.info('Is not own page.');
                followsUser(loggedUserID, pageHash).then(f => setIsLoggedUserFollowing(f));
            }
            loadPromises.push(
                retrievePlaylists(pageHash).then(function (p) {
                    setPlaylists(p);
                    if (p.length > 0) {
                        setSelectedPlaylist(p[0]);
                    }
                    console.info("Playlists retrieved!");
                })
            )
        }


        Promise.all(loadPromises).then(() => setLoaded(true));
    }

    useEffect(() => {
        // Redirect if attempting to load own page & not identified as such initially
        if(window.localStorage.getItem('user_id') === pageHash){window.location = 'profile#me'}
        // Load the page
        loadPage();
    }, []);

    useEffect(() => {
        setSelectedDatapoint(allDatapoints[termIndex]);
        setSelectedPrevDatapoint(allPreviousDatapoints[termIndex]);
    }, [termIndex])

    // Get the display name of the list item
    const getLIName = function (data) {
        let result;
        if (data.hasOwnProperty('artist_id')) {
            result = data.name;
        } else if (data.hasOwnProperty('song_id')) {
            result = data.title;
        } else {
            result = data;
        }
        if (result.length > 30) {
            result = result.substring(0, 30) + "..."
        }
        return result;
    }

    const getLIDescription = function (data, maxLength = 40) {
        let result;
        if (data.hasOwnProperty('artist_id')) {
            if (data.genres && data.genres.length > 0) {
                result = data.genres[0];
            } else {
                result = '';
            }
        } else if (data.hasOwnProperty('song_id')) {
            result = data.artists.map((e, i) => i !== data.artists.length - 1 ? e.name + ', ' : e.name);
        } else {
            result = '';
        }
        if (result.length > maxLength) {
            result = result.substring(0, maxLength) + "..."
        }
        return result;
    }

    const ArtistAnalysis = (props) => {
        const {artist} = props;

        const [artistsAlbumsWithLikedSongs, setArtistsAlbumsWithLikedSongs] = useState([]);

        useEffect(() => {
            const [tracks] = playlists.map(e => e.tracks);
            getAlbumsWithTracks(artist.artist_id, tracks).then(
                result => setArtistsAlbumsWithLikedSongs(result)
            );
        }, [])

        if (artist.hasOwnProperty("artist_id")) {
            const orderedAlbums = artistsAlbumsWithLikedSongs.sort((a, b) => b.saved_songs.length - a.saved_songs.length).slice(0, 4);
            return (
                <div className={'analysis'}>

                    {orderedAlbums.length > 0 ?
                        <>
                            <h2 style={{margin: '0'}}>Artist analysis</h2>
                            <p style={{margin: '0', textTransform: 'uppercase'}}>for {getLIName(artist)}</p>
                            {
                                orderedAlbums.map(function (album) {
                                    return <StatBlock key={album.id}
                                                      name={album.name.length > 35 ? album.name.slice(0, 35) + '...' : album.name}
                                                      description={`${album.saved_songs.length} saved songs.`}
                                                      value={(album.saved_songs.length / orderedAlbums[0].saved_songs.length) * 100}/>
                                })
                            }
                        </>

                        :
                        <p style={{marginBottom: 'auto'}}>There are no saved songs from this
                            artist on {possessive} public profile, so an analysis is not available.</p>
                    }
                </div>
            )
        }
    }

    const SongAnalysis = (props) => {
        const song = props.song;
        const excludedKeys = ['loudness', 'liveness', 'instrumentalness', 'tempo']
        if (song.hasOwnProperty("song_id")) {
            const analytics = song.analytics;
            return (
                <div className={'analysis'}>
                    {
                        Object.keys(translateAnalytics).map(function (key) {
                            if (excludedKeys.findIndex(e => e === key) === -1) {
                                return <StatBlock key={key} name={translateAnalytics[key].name}
                                                  description={translateAnalytics[key].description}
                                                  value={analytics[key] * 100}/>
                            }
                        })
                    }
                </div>
            )
        }
    }

    const SongAnalysisAverage = () => {
        const average = getAverageAnalytics(selectedDatapoint.top_songs);
        return (
            <div className={'block-wrapper'}>
                {Object.keys(translateAnalytics).map(function (key) {
                    if (key !== "loudness") {
                        return <StatBlock key={key} name={translateAnalytics[key].name}
                                          description={translateAnalytics[key].description}
                                          value={average ? (key === 'tempo' ? 100 * (average[key] - 50) / 150 : average[key] * 100) : average[key] * 100}/>
                    }
                })}
            </div>
        )
    }

    const GenreBreakdown = (props) => {
        const {number} = props;
        return (
            <div className={'block-wrapper'} style={{flexWrap: 'wrap-reverse'}}>
                {selectedDatapoint.top_genres.slice(0,number).map((genre, genreIndex) => {
                    const artists = selectedDatapoint.top_artists.filter(a => a.genres ? a.genres.some(g => g === genre) : false);
                    const artistWeights = artists.map(e => selectedDatapoint.top_artists.length - selectedDatapoint.top_artists.findIndex(a => a.artist_id === e.artist_id));
                    const totalWeights = artistWeights.reduce((partialSum, a) => partialSum + a, 0);
                    return (
                        <div key={genre} id={'genre-breakdown-instance'}>
                            <h3 style={{margin: '0'}}>{genre}</h3>
                            {artists.map((a, artistIndex) => {
                                const percentage = (artistWeights[artistIndex] / totalWeights) * 100;
                                return <StatBlock key={a.artist_id} key={a.artist_id} name={a.name} description={`${Math.round(percentage)}%`} value={percentage} />
                            })}
                        </div>
                    )
                })}
            </div>
        )
    }

    const TopSongsOfArtists = (props) => {
        const {number} = props;
        return (
            <div className={'block-wrapper'}>
                {selectedDatapoint.top_artists.slice(0,number).map((artist, i) => {
                    const topSongIndex = selectedDatapoint.top_songs.findIndex(s => s.artists.some(a => a.artist_id === artist.artist_id));
                    if(topSongIndex > -1){
                        return (
                            <div key={artist.artist_id} className={'stat-block'} style={{padding: '15px', border: '1px solid #343434'}}>
                                <h3 style={{margin: '0'}}>{selectedDatapoint.top_songs[topSongIndex].title}</h3>
                                <p style={{margin: '0'}}>{artist.name}</p>
                            </div>
                        )
                    }
                })}
            </div>
        )
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

        return (
            <div className={'showcase-list-wrapper'}>
                {selectedDatapoint[`top_${type}`].map(function (element, index) {
                    if (index >= start && index <= end) {
                        return (
                            <div
                                key={type === 'genres' ? element : element[`${type.slice(0, type.length - 1)}_id`]}
                                onMouseEnter={() => setHoverItem(index)}
                                onMouseLeave={() => setHoverItem(-1)}
                                tabIndex={0}
                                style={
                                    hoverItem !== -1 ?
                                        hoverItem === index ? {cursor: 'pointer'} : {filter: 'brightness(60%)'}
                                        :
                                        {}
                                }>
                                <ShowcaseListItem element={element} index={index} type={type}/>
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
        const indexChange = selectedPrevDatapoint ? getItemIndexChange(element, index, type, selectedPrevDatapoint) : null;

        const handleRecommendations = () => {
            if (recommendations === null) {
                switch (type) {
                    case 'artists':
                        getSimilarArtists(element).then(function (result) {
                            setRecommendations(result.map(a => formatArtist(a)));
                            setSeeRecommendations(!seeRecommendations);
                        });
                        break;
                    case 'songs':
                        const seed_artists = element.artists.map(a => a.artist_id).slice(0, 2);
                        let seed_genres = [];
                        element.artists.forEach(artist => {
                            if (artist.genres) {
                                artist.genres.forEach(genre => {
                                    if (!seed_genres.some(e => e === genre)) {
                                        seed_genres.push(genre);
                                    }
                                })
                            }
                        })
                        seed_genres = seed_genres.slice(0, 2);
                        const seed_track = element.song_id;
                        getTrackRecommendations(seed_artists, seed_genres, seed_track).then(function (result) {
                            setRecommendations(result.map(t => formatSong(t)));
                            setSeeRecommendations(!seeRecommendations);
                        });
                }
            } else {
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
        const description = getItemAnalysis(element, type, pageUser, selectedDatapoint);

        return (
            <div className={"showcase-list-item"}
                 tabIndex={1}
                 style={expanded ? (window.innerWidth > 800 ? {height: '300px'} : {height: '350px'}) : {}}
                 onClick={() => {
                     if (!expanded) {
                         setExpanded(true)
                     }
                 }}>
                {type !== 'genres' ?
                    <img alt={getLIName(element)} src={element.image} style={expanded ? {filter: 'blur(10px) brightness(75%)'} : {}}/>
                    :
                    <img alt={element} src={getGenresRelatedArtists(element, selectedDatapoint.top_artists)[0].image}
                         style={expanded ? {filter: 'blur(10px) brightness(75%)'} : {}}/>
                }
                <h3>{index + 1} {changeMessage}</h3>
                {expanded ?
                    <>
                        <div className={"showcase-list-item-expanded"}>
                            <div style={{fontFamily: 'Inter Tight', margin: 'auto', height: 'max-content'}}>
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
                                <div className={'recommendations'}
                                     style={{textAlign: 'right', fontFamily: 'Inter Tight'}}>
                                    <h2 style={{margin: '0'}}>Recommendations</h2>
                                    <p style={{margin: '0', textTransform: 'uppercase'}}>for {getLIName(element)}</p>
                                    <div className={'recommendations-wrapper'}>
                                        {recommendations.map(function (item, index) {
                                            if (index < 3) {
                                                return (
                                                    <a key={getLIName(item)} href={item.link} target="_blank"
                                                       className={'recommendation'}>
                                                        <p style={{
                                                            margin: '0',
                                                            fontWeight: 'bold'
                                                        }}>{getLIName(item)}</p>
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
                                        isLoggedIn() ?
                                            <ArtistAnalysis artist={element} user={pageUser}/>
                                            :
                                            <div className={'analysis'} style={{textAlign: 'right', padding: '0px'}}>
                                                <p>Log in to see {possessive} analysis for {getLIName(element)}</p>
                                                <button style={{width: 'max-content', marginLeft: 'auto'}} className={'std-button'} onClick={handleLogin}>Log-in</button>
                                            </div>
                                        :
                                        <></>
                            }
                        </div>
                        <button className={'showcase-exit-button'} onClick={() => setExpanded(false)}>x</button>
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
                    }}>Getting the profile ready... (This may take longer than usual)</p>
                </div>
                :
                <div className='wrapper'>
                    <div className='user-container'>
                        <div className={'user-details'}>
                            <p>Profile for</p>
                            <h2>{pageUser.username}</h2>
                            <p><span
                                style={{color: '#22C55E'}}>{chipData[0].name}</span> fan · <span
                                style={{color: '#22C55E'}}>{chipData[1]}</span> fan</p>
                        </div>
                        <div className={'user-followers'}>
                            <div>
                                <p style={{
                                    margin: '0',
                                }}>{followers.length} follower{followers.length > 1 ? 's' : ''}</p>
                            </div>
                            {isLoggedIn() && pageHash !== 'me' ?
                                isLoggedUserFollowing ?
                                    <button
                                        className={'std-button'}
                                        onClick={() => {
                                            unfollowUser(window.localStorage.getItem('user_id'), pageUser.user_id).then(() => setIsLoggedUserFollowing(false));
                                        }}>
                                        Unfollow
                                    </button>
                                    :
                                    <button
                                        className={'std-button'}
                                        onClick={() => {
                                            followUser(window.localStorage.getItem('user_id'), pageUser.user_id).then(() => setIsLoggedUserFollowing(true));
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
                                {terms.map(function (term, i) {
                                    return (<button key={term}
                                                    className={'term-buttons'}
                                                    style={termIndex === i ? {textDecoration: 'underline #22C55E'} : {}}
                                                    onClick={() => setTermIndex(i)}>{translateTerm[term]}</button>)
                                })}
                            </div>
                        </div>
                        {!isOwnPage && isLoggedIn() ?
                            <div style={{textAlign: 'right'}}>
                                <h3>Compare</h3>
                                <p>See how your stats stack up against {pageUser.username}</p>
                                <a className={'std-button'} style={{marginLeft: 'auto'}} href={`/compare#${pageHash}&${window.localStorage.getItem('user_id')}`}>Compare</a>
                            </div>
                            :
                            <></>
                        }
                    </div>
                    <div className={'simple-wrapper'}>
                        {simpleDatapoints.map(function (type) {
                            let description = '';
                            const dpDeltas = selectedPrevDatapoint ? getAllItemIndexChanges(type, selectedDatapoint, selectedPrevDatapoint) : null;
                            switch (termIndex) {
                                // Long term
                                case 2:
                                    description = `These are your staple ${type}, those that define your overarching taste in music.`;
                                    break;
                                // Medium term
                                case 1:
                                    description = `These are your most popular ${type} in the last 6 months.`;
                                    break;
                                // Short term
                                case 0:
                                    description = `These are your most popular ${type} in the last 4 weeks.`;
                                    break;
                            }
                            return (
                                <div key={type} className='simple-instance'>
                                    <div className={'datapoint-header'}>
                                        <div style={{maxWidth: '400px'}}>
                                            <p style={{
                                                margin: '16px 0 0 0',
                                                textTransform: 'uppercase'
                                            }}>{possessive}</p>
                                            <h2 style={{margin: '0', textTransform: 'uppercase'}}>Top {type}</h2>
                                            <p style={{
                                                margin: '0',
                                                textTransform: 'uppercase'
                                            }}>Of {termIndex !== 2 ? 'the last' : ''} {translateTerm[terms[termIndex]]}</p>
                                            <p>{description}</p>
                                        </div>
                                        <div style={{maxWidth: '400px', textAlign: 'right'}}>
                                        </div>
                                    </div>
                                    <ShowcaseList type={type} start={0} end={9}/>
                                    <div className={'datapoint-footer'}>
                                        {type === 'songs' ?
                                            <div style={{textAlign: 'left'}}>
                                                <p style={{
                                                    margin: '16px 0 0 0',
                                                    textTransform: 'uppercase'
                                                }}>{possessive}</p>
                                                <h2 style={{margin: '0', textTransform: 'uppercase'}}>average song
                                                    stats</h2>
                                                <p style={{
                                                    margin: '0 0 16px 0',
                                                    textTransform: 'uppercase'
                                                }}>Of {termIndex !== 2 ? 'the last' : ''} {translateTerm[terms[termIndex]]}</p>
                                                <p>All of your taste in music
                                                    of {termIndex !== 2 ? 'the last' : ''} {translateTerm[terms[termIndex]]} described
                                                    in one place.</p>
                                                <SongAnalysisAverage />
                                            </div>
                                            :
                                            type === 'artists' ?
                                                <div style={{textAlign: 'left'}}>
                                                    <p style={{
                                                        margin: '16px 0 0 0',
                                                        textTransform: 'uppercase'
                                                    }}>{possessive}</p>
                                                    <h2 style={{margin: '0', textTransform: 'uppercase'}}>top song for each artist</h2>
                                                    <p>{possessive.slice(0,1).toUpperCase() + possessive.slice(1, possessive.length)} most listened to track
                                                        by each of your top artists.</p>
                                                    <TopSongsOfArtists number={10} />
                                                </div>

                                                :
                                                <div style={{textAlign: 'left'}}>
                                                    <p style={{
                                                        margin: '16px 0 0 0',
                                                        textTransform: 'uppercase'
                                                    }}>{possessive}</p>
                                                    <h2 style={{margin: '0', textTransform: 'uppercase'}}>top artists</h2>
                                                    <p style={{
                                                        margin: '0 0 16px 0',
                                                        textTransform: 'uppercase'
                                                    }}>for each genre</p>
                                                    <p>The artists that contribute most to {possessive} listening time in each of {possessive} top 5 genres.</p>
                                                    <GenreBreakdown number={5} />
                                                </div>
                                        }
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <h2 style={{
                        textTransform: `uppercase`,
                        fontFamily: 'Inter Tight, sans-serif',
                        fontSize: `30px`,
                        margin: '50px auto auto auto',
                        textAlign: 'center',
                        textDecoration: 'underline 1px #343434'
                    }}>{pageUser.username}'s playlists</h2>
                    <div className={"playlist-wrapper"}>
                        {playlists === null ?
                            <>
                                <p>Log-in please!</p>
                                <button className={'std-button'} onClick={handleLogin}>Log-in</button>
                            </>
                            :
                            playlists.length === 0 ?
                                <p>There's nothing here...</p>
                                :
                                <>
                                    <ol className={"list-item-ol"}>
                                        {
                                            playlists.map(function (playlist) {
                                                return <li key={playlist.playlist_id}
                                                           onClick={() => setSelectedPlaylist(playlist)}
                                                           className={"list-item"} style={{
                                                    fontSize: '20px',
                                                    fontFamily: 'Inter Tight'
                                                }}>{playlist.name.length > 25 ? playlist.name.slice(0, 25) + '...' : playlist.name}</li>
                                            })
                                        }
                                    </ol>
                                    <div className={"focused-playlist"}>
                                        <div className={"focused-playlist-text"}>
                                            <h2>{selectedPlaylist.name}</h2>
                                            <h3>{selectedPlaylist.description}</h3>
                                            <hr/>
                                            <div style={{display: 'flex', flexDirection: 'row'}}>
                                                <a target="_blank"
                                                   href={`https://open.spotify.com/playlist/${selectedPlaylist.playlist_id}`}
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
                                                <p>{selectedPlaylist.tracks.length} songs</p>
                                            </div>
                                        </div>
                                        <img alt={''} className={'playlist-art'}
                                             src={selectedPlaylist.images[0].url}></img>
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