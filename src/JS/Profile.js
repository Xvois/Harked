// noinspection JSValidateTypes

import React, {useCallback, useEffect, useRef, useState} from 'react';
import './../CSS/Profile.css';
import './../CSS/Graph.css'
import {
    changeSettings,
    deleteComment, deleteRecommendation,
    followsUser,
    followUser,
    getAlbumsWithTracks, getAllIndexes,
    getSimilarArtists,
    getTrackRecommendations,
    isLoggedIn,
    retrieveAllDatapoints,
    retrieveFollowers,
    retrievePlaylists,
    retrievePrevAllDatapoints,
    retrieveProfileData,
    retrieveProfileRecommendations,
    retrieveSearchResults,
    retrieveSettings, retrieveSongAnalytics,
    retrieveUser,
    submitRecommendation,
    unfollowUser, hashString, retrieveDatapoint, retrieveUserID, retrieveLoggedUserID
} from './HDM.ts';
import ArrowCircleDownIcon from '@mui/icons-material/ArrowCircleDown';
import ArrowCircleUpIcon from '@mui/icons-material/ArrowCircleUp';
import ClearAllOutlinedIcon from '@mui/icons-material/ClearAllOutlined';
import ReportGmailerrorredIcon from '@mui/icons-material/ReportGmailerrorred';
import {
    calculateSimilarity,
    getAverageAnalytics,
    getItemAnalysis,
    getItemIndexChange, getItemType,
    getLIDescription,
    getLIName,
    translateAnalytics
} from "./Analysis";
import {handleLogin} from "./Authentication";
import LockIcon from '@mui/icons-material/Lock';
import DeleteIcon from '@mui/icons-material/Delete';
import Fuse from "fuse.js";
import {
    SpotifyLink,
    StatBlock,
    PageError,
    StyledField,
    CommentSection,
    LoadingIndicator,
    ValueIndicator
} from "./SharedComponents.tsx";

const ShowcaseList = (props) => {
    const {pageUser, possessive, playlists,  selectedDatapoint, selectedPrevDatapoint = null, type, start, end} = props;

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
                                    hoverItem === index ? {cursor: 'pointer'} : {opacity: '0.5'}
                                    :
                                    {}
                            }>
                            <ShowcaseListItem pageUser={pageUser} possesive={possessive} playlists={playlists} element={element} index={index} selectedDatapoint={selectedDatapoint} selectedPrevDatapoint={selectedPrevDatapoint} type={type}/>
                        </div>
                    )
                }
            })}
        </div>
    )
}

const ShowcaseListItem = (props) => {
    const {pageUser, possessive, element, index, selectedDatapoint, selectedPrevDatapoint, playlists, type} = props;

    const [expanded, setExpanded] = useState(index===0);
    const [recommendations, setRecommendations] = useState(null);
    const [seeRecommendations, setSeeRecommendations] = useState(false);
    const indexChange = selectedPrevDatapoint ? getItemIndexChange(element, index, type, selectedPrevDatapoint) : null;

    useEffect(() => {
        setExpanded(index===0);
    }, [index])

    const handleRecommendations = () => {
        if (recommendations === null) {
            switch (type) {
                case 'artists':
                    getSimilarArtists(element.artist_id).then(function (result) {
                        setRecommendations(result);
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
                        setRecommendations(result);
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
            color: 'var(--primary-colour)',
            fontSize: '10px',
        }}>{indexChange}</span><ArrowCircleDownIcon style={{
            color: 'var(--primary-colour)',
            animation: 'down-change-animation 0.5s ease-out'
        }}
                                                    fontSize={"small"}></ArrowCircleDownIcon></>
    } else if (indexChange > 0) {
        changeMessage = <><span style={{
            color: 'var(--primary-colour)',
            fontSize: '10px'
        }}>{indexChange}</span><ArrowCircleUpIcon style={{
            color: 'var(--primary-colour)',
            animation: 'up-change-animation 0.5s ease-out'
        }}
                                                  fontSize={"small"}></ArrowCircleUpIcon></>
    } else if (indexChange === 0) {
        changeMessage = <ClearAllOutlinedIcon
            style={{color: 'var(--primary-colour)', animation: 'equals-animation 0.5s ease-out'}}
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
            <h3>{index + 1} <span
                style={{transition: 'all 0.5s', opacity: `${expanded ? '0' : '1'}`}}>{changeMessage}</span></h3>
            {expanded ?
                <>
                    <div className={"showcase-list-item-expanded"}>
                        <div className={'item-description'}
                             style={{fontFamily: 'Inter Tight', margin: 'auto', height: 'max-content'}}>
                            <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: '15px'}}>
                                <div>
                                    <h2 style={{margin: '0'}}>{getLIName(element)}</h2>
                                    <p style={{margin: '0', textTransform: 'uppercase'}}>{getLIDescription(element)}</p>
                                </div>
                                {type !== 'genres' ?
                                    <SpotifyLink link={element.link} simple/>
                                    :
                                    <></>
                                }
                            </div>
                            <p style={{marginTop: '0 auto'}}>{description.header}</p>
                            <p style={{marginTop: '0 auto'}}>{description.subtitle}</p>
                            {type !== 'genres' && isLoggedIn() ?
                                <button className={'std-button'} id={'showcase-rec-button'}
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
                            <div
                                style={{textAlign: 'right', fontFamily: 'Inter Tight', height: 'max-content'}}>
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
                                        <ArtistAnalysis artist={element} possessive={possessive} playlists={playlists}/>
                                        :
                                        <div className={'analysis'} style={{textAlign: 'right', padding: '0px'}}>
                                            <p>Log in to see {possessive} analysis for {getLIName(element)}</p>
                                            <button style={{width: 'max-content', marginLeft: 'auto'}}
                                                    className={'std-button'} onClick={handleLogin}>Log-in
                                            </button>
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

function ComparisonLink(props) {
    const {pageUser, pageHash, loggedUserID, longTermDP} = props;
    const [loggedDP, setLoggedDP] = useState(null);

    useEffect(() => {
        retrieveDatapoint(loggedUserID, "long_term").then(res => setLoggedDP(res));
    }, [])

    return (
        <div style={{display: 'flex', flexDirection: 'row', gap: '15px', marginLeft: 'auto'}}>
            <div style={{textAlign: 'right', marginLeft: 'auto'}}>
                <h3 style={{margin: 0}}>Compare</h3>
                <p style={{margin: '0 0 5px 0'}}>See how your stats stack up against {pageUser.username}</p>
                <a className={'std-button'} style={{marginLeft: 'auto'}}
                   href={`/compare#${loggedUserID}&${pageHash}`}>Compare</a>
            </div>
            <ValueIndicator value={loggedDP === null ? (0) : (calculateSimilarity(loggedDP, longTermDP).overall)} diameter={50} />
        </div>
    )
}

const ProfileRecommendations = (props) => {
    const {pageGlobalUserID, isOwnPage} = props;
    // Only songs and artists at the moment
    const [recs, setRecs] = useState([]);
    const [showSelection, setShowSelection] = useState(false);


    useEffect(() => {
        retrieveProfileRecommendations(pageGlobalUserID).then(res => setRecs(res));
    }, [])

    const handleDelete = (id) => {
        deleteRecommendation(id).then(() => {
            retrieveProfileRecommendations(pageGlobalUserID).then(res => setRecs(res));
        });
    }

    const Selection = () => {

        const [searchResults, setSearchResults] = useState(null);
        const [selectedItem, setSelectedItem] = useState(null);
        const searchRef = useRef('') //creating a reference for TextField Component
        const descriptionRef = useRef('');
        const [type, setType] = useState('songs');
        const typeChoices = ['songs', 'artists']

        const handleSearch = () => {
            console.log('handleSearch called', searchRef.current)
            if(searchRef.current !== null && searchRef.current !== undefined && searchRef.current.value !== ''){
                console.log('ran with', searchRef.current.value)
                retrieveSearchResults(searchRef.current.value, type).then(res => setSearchResults(formatSearchResults(res)));
            }
        }

        const handleSubmit = async () => {
            let type = getItemType(selectedItem);
            let submissionItem = selectedItem;
            if(type === 'songs'){
                submissionItem.analytics = await retrieveSongAnalytics(submissionItem.song_id);
            }
            console.log(submissionItem)
            await submitRecommendation(pageGlobalUserID, submissionItem, type, descriptionRef.current.value).then(() => {
                setSelectedItem(null);
                setShowSelection(false);
                retrieveProfileRecommendations(pageGlobalUserID).then(res => setRecs(res));
            });
        }

        const formatSearchResults = (results) => {
            const query = searchRef.current.value;

            switch (type){
                case 'artists':
                    const artistOptions = {
                        keys: ['name'],
                        threshold: 0.3, // Adjust the threshold as needed
                    };
                    const artistFuse = new Fuse(results.artists, artistOptions);
                    const artistRes = artistFuse.search(query);
                    return artistRes.sort((a, b) => a.refIndex - b.refIndex).map(e => e.item);
                case 'songs':
                    const songOptions = {
                        keys: ['title'],
                        threshold: 0.3, // Adjust the threshold as needed
                    };
                    const songFuse = new Fuse(results.tracks, songOptions);
                    const songRes = songFuse.search(query);
                    return songRes.sort((a, b) => a.refIndex - b.refIndex).map(e => e.item);
                default:
                    return null;
            }
        }

        return showSelection && (
            <div>
                {selectedItem === null && (
                    <div style={{marginBottom: '16px'}}>
                        <StyledField
                            label='Search'
                            placeholder={`Search for ${type}`}
                            multiline
                            variant='outlined'
                            rows={1}
                            inputRef={searchRef}
                            inputProps={{ maxLength: 100 }}
                        />
                        <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between'}}>
                            <div>
                                {typeChoices.map(e => {
                                    return <button key={e} className={'std-button'} style={type !== e ? {color: 'var(--secondary-colour)', borderColor: 'var(--secondary-colour)', textTransform: 'capitalize'} : {textTransform: 'capitalize'}} onClick={() => setType(e)}>{e}</button>
                                })}
                            </div>
                            <button className={'std-button'} onClick={handleSearch}>Search</button>
                        </div>
                    </div>
                )
                }

                <div style={{display: 'flex', flexDirection: 'column'}}>
                    {searchResults !== null && selectedItem === null ?
                        (
                            searchResults.slice(0,5).map((e,i) => {
                                return (
                                    <button className={'std-button'} style={i === searchResults.slice(0,5).length - 1 ? {border: 'none', width: '100%'} : {borderTop: 'none', borderLeft: 'none', borderRight: 'none', width: '100%'}} key={e.link} onClick={() => setSelectedItem(e)}>
                                        <h3>{getLIName(e)}</h3>
                                        <p>{getLIDescription(e)}</p>
                                    </button>
                                )
                            })
                        )
                        :
                        <></>
                    }
                </div>
                <div>
                    {selectedItem !== null && (
                        <div style={{display: 'flex', flexDirection: 'row', gap: '15px'}}>
                            <img alt={`${getLIName(selectedItem)}`} className={'supplemental-image'} style={{aspectRatio: '1', objectFit: 'cover', width: '300px', height: '300px'}} src={selectedItem.image}  />
                            <div style={{display: 'flex', flexDirection: 'column', flexGrow: '1'}}>
                                <h2 style={{margin: '0'}}>{getLIName(selectedItem)}</h2>
                                <p>{getLIDescription(selectedItem)}</p>
                                <StyledField
                                    id='outlined-textarea'
                                    label='Description'
                                    placeholder='Why are you recommending this?'
                                    multiline
                                    variant='outlined'
                                    rows={6}
                                    inputRef={descriptionRef}
                                    inputProps={{ maxLength: 400 }}
                                />
                                <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginTop: 'auto'}}>
                                    <button className={'std-button'} onClick={() => setSelectedItem(null)}>Back</button>
                                    <button className={'std-button'} onClick={handleSubmit}>Submit</button>
                                </div>
                            </div>
                        </div>
                    )
                    }
                </div>
            </div>
        )
    }

    return (
        <div style={{width: '100%'}}>
            <div style={{display: 'flex', flexDirection: 'row', gap: '15px', flexWrap: 'wrap', margin: '16px 0', position: 'relative'}}>
                {recs.length > 0 ?
                    recs.map(e => {
                        const type = getItemType(e.item);
                        return (
                            <div key={e.id} style={{display: 'flex', flexDirection: 'row', flexGrow: '1', gap: '15px', border: '1px solid var(--secondary-colour)', padding: '15px', width: 'max-content', overflow: 'hidden', wordBreak: 'break-all'}}>
                                <img alt={`${getLIName(e.item)}`} className={'supplemental-image'} src={e.item.image} style={{aspectRatio: '1', objectFit: 'cover', width: '150px'}} />
                                <div style={{display: 'flex', flexDirection: 'column', flexGrow: '1', minWidth: '200px'}}>
                                    <p style={{margin: '0', textTransform: 'capitalize', color: 'var(--accent-colour)'}}>{type.slice(0, type.length - 1)}</p>
                                    <h2 style={{margin: '0'}}>
                                        {getLIName(e.item)}
                                        <span style={{margin: '5px 0 0 10px'}}>
                                            <SpotifyLink simple link={e.item.link} />
                                        </span>
                                    </h2>
                                    <p style={{margin: '0'}}>{getLIDescription(e.item)}</p>
                                    {e.description.length > 0 && (
                                        <p>
                                            <em>
                                                <span style={{color: 'var(--accent-colour)', margin: '0 2px'}}>"</span>
                                                {e.description}
                                                <span style={{color: 'var(--accent-colour)', margin: '0 2px'}}>"</span>
                                            </em>
                                        </p>
                                    )}
                                    {isOwnPage && (
                                        <div style={{margin: 'auto 0 0 auto'}}>
                                            <button style={{background: 'none', border: 'none', color: 'var(--accent-colour)', width: 'max-content', cursor: 'pointer', marginLeft: 'auto'}}
                                                    onClick={() => handleDelete(e.id)}>
                                                <DeleteIcon />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })
                    :
                    <p style={{color: 'var(--secondary-colour)'}}>Looks like there aren't any recommendations yet.</p>
                }
            </div>
            {isOwnPage && !showSelection && (
                <div style={{margin: '0 auto', width: 'max-content'}}>
                    <button className={'std-button'} onClick={() => setShowSelection(true)}>+</button>
                </div>
            )}
            {isOwnPage && showSelection && (
                <div style={{margin: '0 auto 16px auto', width: 'max-content'}}>
                    <button className={'std-button'} onClick={() => setShowSelection(false)}>-</button>
                </div>
            )}
            <Selection show={showSelection} />
        </div>
    )
}

const ArtistAnalysis = (props) => {
    const {artist, playlists, possessive} = props;

    const [artistsAlbumsWithLikedSongs, setArtistsAlbumsWithLikedSongs] = useState(null);

    useEffect(() => {
        const tracks = playlists.map(e => e.tracks).flat(1);
        getAlbumsWithTracks(artist.artist_id, tracks).then(
            result => setArtistsAlbumsWithLikedSongs(result)
        );
    }, [])

    if (artist.hasOwnProperty("artist_id")) {
        const orderedAlbums = artistsAlbumsWithLikedSongs?.sort((a, b) => b.saved_songs.length - a.saved_songs.length).slice(0, 4);
        return (
            <div className={'analysis'}>

                {artistsAlbumsWithLikedSongs === null ?
                    <LoadingIndicator />
                    :
                    (
                        orderedAlbums.length > 0 ?
                            <>
                                {
                                    orderedAlbums.map(function (album) {
                                        return <StatBlock key={album.id}
                                                          name={album.name.length > 35 ? album.name.slice(0, 35) + '...' : album.name}
                                                          description={`${album.saved_songs.length} saved songs.`}
                                                          value={(album.saved_songs.length / orderedAlbums[0].saved_songs.length) * 100}
                                                          alignment={'right'}/>
                                    })
                                }
                            </>

                            :
                            <p>There are no saved songs from this
                                artist on {possessive} public profile, so an analysis is not available.</p>
                    )
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
        if(analytics !== undefined && analytics !== null){
            return (
                <div className={'analysis'}>
                    {
                        Object.keys(translateAnalytics).map(function (key) {
                            if (excludedKeys.findIndex(e => e === key) === -1) {
                                return <StatBlock key={key} name={translateAnalytics[key].name}
                                                  description={translateAnalytics[key].description}
                                                  value={analytics[key] * 100} alignment={'right'}/>
                            }
                        })
                    }
                </div>
            )
        }
    }
}

const SongAnalysisAverage = (props) => {
    const {selectedDatapoint} = props;
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
    const {selectedDatapoint, number} = props;
    return (
        <div className={'block-wrapper'} style={{flexWrap: 'wrap'}}>
            {selectedDatapoint.top_genres.slice(0, number).map((genre) => {
                const artists = selectedDatapoint.top_artists.filter(a => a.genres ? a.genres.some(g => g === genre) : false);
                const artistWeights = artists.map(e => selectedDatapoint.top_artists.length - selectedDatapoint.top_artists.findIndex(a => a.artist_id === e.artist_id));
                const totalWeights = artistWeights.reduce((partialSum, a) => partialSum + a, 0);
                return (
                    <div key={genre} id={'genre-breakdown-instance'}>
                        <h3 style={{margin: '0'}}>{genre}</h3>
                        {artists.slice(0, 5).map((a, artistIndex) => {
                            const percentage = (artistWeights[artistIndex] / totalWeights) * 100;
                            return <StatBlock key={a.artist_id} name={a.name}
                                              description={`${Math.round(percentage)}%`} value={percentage}/>
                        })}
                    </div>
                )
            })}
        </div>
    )
}

const TopSongsOfArtists = (props) => {
    const {selectedDatapoint, number} = props;
    return (
        <div className={'block-wrapper'}>
            {selectedDatapoint.top_artists.slice(0, number).map((artist) => {
                const topSongIndex = selectedDatapoint.top_songs.findIndex(s => s.artists.some(a => a.artist_id === artist.artist_id));
                if (topSongIndex > -1) {
                    return (
                        <div key={artist.artist_id} className={'stat-block'}
                             style={{padding: '15px', border: '1px solid var(--secondary-colour)'}}>
                            <h3 style={{margin: '0'}}>{selectedDatapoint.top_songs[topSongIndex].title}</h3>
                            <p style={{margin: '0'}}>{artist.name}</p>
                        </div>
                    )
                }
            })}
        </div>
    )
}

const PlaylistItem = function (props) {
    const {playlist} = props;
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'row',
            flexGrow: '1',
            border: '1px solid var(--secondary-colour)',
            padding: '10px',
            fontFamily: 'Inter Tight',
            width: 'max-content'
        }}>
            {playlist.images.length > 0 && (
                <img style={{width: '100px', height: '100px', marginRight: '10px', objectFit: 'cover'}} alt={'playlist'}
                     src={playlist.images[0].url}></img>
            )}
            <div style={{display: 'flex', flexDirection: 'column', color: 'var(--primary-colour)', flexGrow: '1', wordBreak: 'break-all'}}>
                <p style={{margin: '0 0 5px 0'}}>{playlist.name}</p>
                <p style={{margin: '0 0 5px 0', borderBottom: '1px solid var(--secondary-colour)'}}>{playlist.description}</p>
                <p style={{margin: '0', opacity: '0.5'}}>{playlist.tracks.length} songs</p>
                <div style={{marginTop: 'auto', marginLeft: 'auto'}}>
                    <SpotifyLink link={playlist.external_urls.spotify} simple />
                </div>
            </div>
        </div>
    )
}


const Profile = () => {

    const simpleDatapoints = ["artists", "songs", "genres"]
    const translateTerm = {short_term: '4 weeks', medium_term: '6 months', long_term: 'All time'}
    const pageHash = window.location.hash.split("#")[1];

    const [terms, setTerms] = useState(["short_term", "medium_term", "long_term"]);
    // The datapoint that is selected for viewing
    const [selectedDatapoint, setSelectedDatapoint] = useState(null);
    // The datapoint prior to the current that is selected for comparison
    const [selectedPrevDatapoint, setSelectedPrevDatapoint] = useState(null);
    // The currently selected term
    const [termIndex, setTermIndex] = useState(2);
    const [loaded, setLoaded] = useState(false);
    const [isLoggedUserFollowing, setIsLoggedUserFollowing] = useState(null);
    const [loggedUserID, setLoggedUserID] = useState(null);

    // Uninitialised variables
    const [pageUser, setPageUser] = useState(null);
    const [isOwnPage, setIsOwnPage] = useState(false);
    const [pageGlobalUserID, setPageGlobalUserID] = useState(null);
    const [chipData, setChipData] = useState([]);
    const [followers, setFollowers] = useState([]);
    const [allDatapoints, setAllDatapoints] = useState([]);
    const [allPreviousDatapoints, setAllPreviousDatapoints] = useState([]);
    const [playlists, setPlaylists] = useState([]);
    const [possessive, setPossessive] = useState('');
    const [settings, setSettings] = useState({});
    const [profileData, setProfileData] = useState({});

    // If something happens that doesn't allow a user to load the page
    // then an error is passed. These states are passed in to the PageError object
    // and then shown on the page.
    // The icon should be a MUI icon component.
    const [isError, setIsError] = useState(false);
    const [errorDetails, setErrorDetails] = useState({icon: null, description: null, errCode: null});

    // Reload when attempting to load a new page
    window.addEventListener("hashchange", () => {
        window.location.reload()
    });


    const loadPage = useCallback(() => {

        // Resolve logged user's information
        // and context of page
        const resolveContext = async () => {
            // The ID we will use for loading references
            let loadID;
            if(isLoggedIn()){
                console.log('Context is of logged in user.')
                await retrieveLoggedUserID().then(id => {
                    // Are we on our page and don't know it?
                    if(id === pageHash){
                        window.location = 'profile#me';
                        // Are we on our own page and know it?
                    }else if(pageHash === 'me'){
                        setIsOwnPage(true);
                        loadID = id;
                        setPageGlobalUserID(id);
                        // Are we on someone else's page?
                    }else{
                        followsUser(id, pageHash).then(f => setIsLoggedUserFollowing(f));
                        loadID = pageHash;
                        setPageGlobalUserID(pageHash);
                        setLoggedUserID(id);
                    }
                })
            }else{
                setPageGlobalUserID(pageHash)
                loadID = pageHash;
            }
            return loadID;
        }

        resolveContext().then((loadID) => {

            const loadPromises = [
                retrieveUser(loadID).then(function (user) {
                    setPageUser(user);
                    retrieveFollowers(user.user_id).then(f => setFollowers(f));
                    if (pageHash !== 'me') {
                        setPossessive(user.username + "'s");
                    } else {
                        setPossessive("your");
                    }
                    console.info("User retrieved!");
                }),
                retrieveAllDatapoints(loadID).then(function (datapoints) {
                    if (datapoints.some(d => d === null)) {
                        const indexes = getAllIndexes(datapoints, null);
                        if (indexes.length === 3) {
                            console.warn("ALL TERMS ELIMINATED. NOT ENOUGH DATA.");
                            setIsError(true);
                            setErrorDetails({ icon: <ReportGmailerrorredIcon fontSize={'large'} />, description: 'We do not have enough information about this user to generate a profile for them.', errCode: 'COMP TERM ELIMINATION'});
                        }
                        let termsCopy = terms;
                        indexes.forEach(i => termsCopy[i] = null);
                        setTerms(termsCopy);
                    }
                    setAllDatapoints(datapoints);
                    setSelectedDatapoint(datapoints[termIndex]);
                    setChipData([datapoints[2].top_artists[0], datapoints[2].top_genres[0]]);
                    console.info("Datapoints retrieved!");
                }),
                retrievePrevAllDatapoints(loadID, 1).then(function (datapoints) {
                    setAllPreviousDatapoints(datapoints);
                    setSelectedPrevDatapoint(datapoints[2]);
                    console.info("Previous datapoints retrieved!");
                }),
                retrieveSettings(loadID).then(function (s) {
                    setSettings(s);
                    if (!s.public && !isOwnPage) {
                        console.info("LOCKED PAGE", settings);
                        setIsError(true);
                        setErrorDetails({ icon: <LockIcon fontSize={'large'} />, description: 'This profile is private.' });
                    }
                }),
                retrieveProfileData(loadID).then(function (d) {
                    setProfileData(d);
                }),
            ];

            Promise.all(loadPromises)
                .then(() =>
                    {
                        setLoaded(true);
                        if(isLoggedIn()){
                            retrievePlaylists(loadID).then(function (p) {
                                p.sort((a, b) => b.tracks.length - a.tracks.length);
                                setPlaylists(p);
                                console.info("Playlists retrieved!");
                                console.log('Playlists: ', p);
                            })
                        }
                    }
                )
                .catch((error) => {
                    console.error("Error loading page:", error);
                    // Handle errors appropriately
                });

        })

    }, []);

    useEffect(() => {
        // Load the page
        loadPage();
    }, [loadPage]);

    useEffect(() => {
        setSelectedDatapoint(allDatapoints[termIndex]);
        setSelectedPrevDatapoint(allPreviousDatapoints[termIndex]);
    }, [termIndex])

    return (
        <>
            {!loaded || isError ? // Locked and loaded B)
                isError ?
                    <PageError icon={errorDetails.icon} description={errorDetails.description} errCode={errorDetails.errCode} />
                    :
                    <LoadingIndicator />
                :
                <div className='wrapper'>
                    <meta
                        name="description"
                        content={`Explore ${pageUser.username}'s profile on Harked.`}
                    />
                    <div className='user-container'>
                        <div className={'user-details'}>
                            <p>Profile for</p>
                            <h2>{pageUser.username}</h2>
                            <p><span
                                style={{color: 'var(--accent-colour)'}}>{chipData[0].name}</span> fan · <span
                                style={{color: 'var(--accent-colour)'}}>{chipData[1]}</span> fan</p>
                        </div>
                    </div>
                    <div className={'user-followers'}>
                        <a href={`/followers#${pageHash}`} style={{
                            margin: '0',
                            textDecoration: 'none',
                            color: 'var(--primary-colour)',
                            fontWeight: '800'
                        }}>{followers.length} follower{followers.length !== 1 ? 's' : ''}</a>
                        {isLoggedIn() && pageHash !== 'me' ?
                            isLoggedUserFollowing ?
                                <button
                                    className={'std-button'}
                                    onClick={() => {
                                        unfollowUser(loggedUserID, pageGlobalUserID).then(() => {
                                            setIsLoggedUserFollowing(false);
                                        });
                                    }}>
                                    Unfollow
                                </button>
                                :
                                <button
                                    className={'std-button'}
                                    onClick={() => {
                                        followUser(loggedUserID, pageGlobalUserID).then(() => {
                                            setIsLoggedUserFollowing(true);
                                        });
                                    }}>
                                    Follow
                                </button>
                            :
                            <></>
                        }
                    </div>
                    <div className={'settings-container'}>
                        <div>
                            <h3>Time frame</h3>
                            <p>of information capture</p>
                            <div style={{display: 'flex', flexDirection: 'row', gap: '15px'}}>
                                {terms.map(function (term, i) {
                                    if(term !== null){
                                        return (<button key={term}
                                                        className={'std-button'}
                                                        style={termIndex === i ? {} : {color: 'var(--secondary-colour)', borderColor: 'var(--secondary-colour)'}}
                                                        onClick={() => setTermIndex(i)}>{translateTerm[term]}</button>)
                                    }
                                })}
                            </div>
                        </div>
                        {!isOwnPage && isLoggedIn() ?
                            <ComparisonLink pageHash={pageHash} pageUser={pageUser} loggedUserID={loggedUserID} longTermDP={allDatapoints[2]} />
                            :
                            isOwnPage && isLoggedIn() ?
                                <div style={{textAlign: 'right', marginLeft: 'auto'}}>
                                    <h3>Profile visibility</h3>
                                    <p>Change whether or not your profile is publicly displayed.</p>
                                    <button className={'std-button'} style={{marginLeft: 'auto'}}
                                            onClick={() => {
                                                const new_settings = {...settings, public: !settings.public};
                                                setSettings(new_settings);
                                                changeSettings(pageGlobalUserID, new_settings);
                                            }}>{settings.public ? 'Public' : 'Private'}</button>
                                </div>
                                :
                                <></>
                        }
                    </div>
                    <div className={'simple-wrapper'}>
                        {simpleDatapoints.map(function (type) {
                            let description = '';
                            switch (termIndex) {
                                // Long term
                                case 2:
                                    description = `These are ${possessive} staple ${type}, those that define ${possessive} overarching taste in music.`;
                                    break;
                                // Medium term
                                case 1:
                                    description = `These are ${possessive} most popular ${type} in the last 6 months.`;
                                    break;
                                // Short term
                                case 0:
                                    description = `These are ${possessive} most popular ${type} in the last 4 weeks.`;
                                    break;
                            }
                            return (
                                <div key={type} className='simple-instance' style={{minWidth: '0px'}}>
                                    <div className={'section-header'}>
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
                                    <ShowcaseList selectedDatapoint={selectedDatapoint} selectedPrevDatapoint={selectedPrevDatapoint} pageUser={pageUser} playlists={playlists} possessive={possessive} datapoint={selectedDatapoint} type={type} start={0} end={9}/>
                                    <div className={'section-footer'}>
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
                                                <p>All of {possessive} taste in music
                                                    of {termIndex !== 2 ? 'the last' : ''} {translateTerm[terms[termIndex]]} described
                                                    in one place.</p>
                                                <SongAnalysisAverage selectedDatapoint={selectedDatapoint}/>
                                            </div>
                                            :
                                            type === 'artists' ?
                                                <div style={{textAlign: 'left'}}>
                                                    <p style={{
                                                        margin: '16px 0 0 0',
                                                        textTransform: 'uppercase'
                                                    }}>{possessive}</p>
                                                    <h2 style={{margin: '0', textTransform: 'uppercase'}}>top song for
                                                        each artist</h2>
                                                    <p>{possessive.slice(0, 1).toUpperCase() + possessive.slice(1, possessive.length)} most
                                                        listened to track
                                                        by some of {possessive} top artists.</p>
                                                    <TopSongsOfArtists selectedDatapoint={selectedDatapoint} number={10}/>
                                                </div>

                                                :
                                                <div style={{textAlign: 'left'}}>
                                                    <p style={{
                                                        margin: '16px 0 0 0',
                                                        textTransform: 'uppercase'
                                                    }}>{possessive}</p>
                                                    <h2 style={{margin: '0', textTransform: 'uppercase'}}>top
                                                        artists</h2>
                                                    <p style={{
                                                        margin: '0 0 16px 0',
                                                        textTransform: 'uppercase'
                                                    }}>for each genre</p>
                                                    <p>The artists that contribute most to {possessive} listening time
                                                        in each of {possessive} top 5 genres.</p>
                                                    <GenreBreakdown selectedDatapoint={selectedDatapoint} number={5}/>
                                                </div>
                                        }
                                    </div>
                                </div>
                            )
                        })}
                        <div className={'simple-instance'} style={{alignItems: 'center'}}>
                            <div className={'section-header'}>
                                <div style={{maxWidth: '400px'}}>
                                    <p style={{
                                        margin: '16px 0 0 0',
                                        textTransform: 'uppercase'
                                    }}>{possessive}</p>
                                    <h2 style={{margin: '0', textTransform: 'uppercase'}}>Playlists</h2>
                                    <p>A look at {possessive} public playlists, sorted by their number of songs.</p>
                                </div>
                            </div>
                            {!isLoggedIn() ?
                                <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        fontFamily: 'Inter Tight',
                                        maxWidth: '1000px',
                                        width: '80%'
                                    }}>
                                    <p>Viewing someone's playlists requires being logged in.</p>
                                    <button className={'std-button'} onClick={handleLogin}>Log-in</button>
                                </div>
                                :
                                playlists.length < 1 ?
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        flexWrap: 'wrap',
                                        gap: '10px',
                                        maxWidth: '1000px',
                                        width: '80%'
                                    }}>
                                        <p style={{ color: "var(--secondary-colour)", marginRight: 'auto' }}>Looks like there aren't any public playlists.</p>
                                    </div>
                                    :
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        flexWrap: 'wrap',
                                        gap: '10px',
                                        maxWidth: '1000px',
                                        width: '80%'
                                    }}>
                                        {playlists.map(p => {
                                            return (
                                                <PlaylistItem key={p.id} playlist={p}/>
                                            )
                                        })}
                                    </div>
                            }
                        </div>
                        <div className={'simple-instance'}>
                            <div className={'section-header'}>
                                <div style={{maxWidth: '400px'}}>
                                    <p style={{
                                        margin: '16px 0 0 0',
                                        textTransform: 'uppercase'
                                    }}>{possessive}</p>
                                    <h2 style={{margin: '0', textTransform: 'uppercase'}}>Recommendations</h2>
                                    <p><span style={{textTransform: 'capitalize'}}>{possessive}</span> artists and songs that are recommended to others.</p>
                                </div>
                            </div>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'row',
                                flexWrap: 'wrap',
                                gap: '10px',
                                maxWidth: '1000px',
                                width: '80%'
                            }}>
                                <ProfileRecommendations pageGlobalUserID={pageGlobalUserID} isOwnPage={isOwnPage} />
                            </div>
                        </div>
                        <div className={'simple-instance'}>
                            <div className={'section-header'}>
                                <div style={{maxWidth: '400px'}}>
                                    <p style={{
                                        margin: '16px 0 0 0',
                                        textTransform: 'uppercase'
                                    }}>{possessive}</p>
                                    <h2 style={{margin: '0', textTransform: 'uppercase'}}>Profile comments</h2>
                                    <p>See what other users have to say about {possessive} profile.</p>
                                </div>
                            </div>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'row',
                                flexWrap: 'wrap',
                                gap: '10px',
                                maxWidth: '1000px',
                                width: '80%'
                            }}>
                                <CommentSection sectionID={hashString(pageGlobalUserID)} isAdmin={isOwnPage} />
                            </div>
                        </div>
                    </div>

                </div>
            }
        </>
    )
}

export default Profile