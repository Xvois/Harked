// noinspection JSValidateTypes

import React, {useEffect, useRef, useState} from 'react';
import './../CSS/Profile.css';
import './../CSS/Graph.css'
import {
    changeSettings,
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
    retrievePrevAllDatapoints, retrieveProfileData,
    retrieveSettings,
    retrieveUser, submitComment,
    unfollowUser
} from './PDM';
import ArrowCircleDownIcon from '@mui/icons-material/ArrowCircleDown';
import ArrowCircleUpIcon from '@mui/icons-material/ArrowCircleUp';
import ClearAllOutlinedIcon from '@mui/icons-material/ClearAllOutlined';
import {
    getAverageAnalytics,
    getItemAnalysis,
    getItemIndexChange,
    getLIDescription,
    getLIName, SpotifyLink,
    StatBlock,
    translateAnalytics
} from "./Analysis";
import {handleLogin} from "./Authentication";
import LockIcon from '@mui/icons-material/Lock';
import {FormControl} from "@mui/base";
import {styled, TextField} from "@mui/material";

const Profile = () => {

    const simpleDatapoints = ["artists", "songs", "genres"]
    const terms = ["short_term", "medium_term", "long_term"];
    const translateTerm = {short_term: '4 weeks', medium_term: '6 months', long_term: 'All time'}
    const pageHash = window.location.hash.split("#")[1];
    const isOwnPage = isLoggedIn() ? (pageHash === window.localStorage.getItem('user_id') || pageHash === 'me') : false

    // The datapoint that is selected for viewing
    const [selectedDatapoint, setSelectedDatapoint] = useState(null);
    // The datapoint prior to the current that is selected for comparison
    const [selectedPrevDatapoint, setSelectedPrevDatapoint] = useState(null);
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
    const [settings, setSettings] = useState({});
    const [profileData, setProfileData] = useState({});
    const [locked, setLocked] = useState(false);

    // Reload when attempting to load a new page
    window.addEventListener("hashchange", () => {
        window.location.reload()
    });

    function CommentSection() {
        const CommentField = styled(TextField)({
            "& .MuiInputBase-root": {
                color: 'var(--primary-colour)'
            },
            '& .MuiInput-underline': {
                color: `var(--secondary-colour)`,
            },
            '& .MuiFormLabel-root.Mui-disabled': {
                color: `var(--secondary-colour)`,
            },
            '& .MuiInput-underline:after': {
                borderBottomColor: 'var(--accent-colour)',
            },
            '& .MuiOutlinedInput-root': {
                '& fieldset': {
                    borderColor: 'var(--secondary-colour)',
                    borderRadius: `0px`,
                    borderWidth: '1px',
                    transition: `all 0.1s ease-in`
                },
                '&:hover fieldset': {
                    borderColor: 'var(--secondary-colour)',
                },
                '&.Mui-focused fieldset': {
                    borderColor: 'var(--secondary-colour)',
                    borderWidth: '1px',
                    transition: `all 0.1s ease-in`
                },
            },
            '& label.Mui-focused': {
                color: 'var(--primary-colour)',
                fontFamily: 'Inter Tight, sans-serif',
            },
            '& .MuiFormLabel-root': {
                color: 'var(--primary-colour)',
                marginLeft: `5px`,
                fontFamily: 'Inter Tight, sans-serif',
            },
        });

        const valueRef = useRef('') //creating a reference for TextField Component
        const [comments, setComments] = useState(profileData.comments);


        const sendValue = () => {
            submitComment(window.localStorage.getItem("user_id"), pageHash, valueRef.current.value)
                .then((c) => {
                    const newComments = comments.concat([c]);
                    setComments(newComments);
            })
                .catch((err) => {
                    alert(err);
                });
        }


        return (
            <>
                <div className={'comment-submit-field'}>
                    <form noValidate autoComplete='off'>
                        <div>
                            <CommentField
                                id='outlined-textarea'
                                label='Comment'
                                placeholder='Write your thoughts'
                                multiline
                                variant='outlined'
                                rows={2}
                                inputRef={valueRef}   //connecting inputRef property of TextField to the valueRef
                            />
                        </div>
                    </form>
                    <div style={{margin: '16px 0 0 auto', width: 'max-content'}}>
                        <button className={'std-button'} onClick={sendValue}>Submit</button>
                    </div>
                </div>
                <div className={'comments-wrapper'}>
                    {comments.map(c => {
                       return <Comment item={c} />
                    })}
                </div>
            </>
        );
    }

    function Comment(props) {
        const {item} = props;
        const user = item.user;
        return (
            <div className={'comment'}>
                <a href={`/profile#${user.user_id}`} style={{color: 'var(--primary-colour)', textDecoration: 'none', fontWeight: 'bold'}}>{user.username}</a>
                <p>{item.contents}</p>
            </div>
        )
    }


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
            retrieveSettings(pageHash).then(function (s) {
                setSettings(s);
                if (!s.public && !isOwnPage) {
                    console.info("LOCKED PAGE", settings)
                    setLocked(true);
                }
            }),
            retrieveProfileData(pageHash).then(function (d) {
                setProfileData(d);
            })
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
                    p.sort((a, b) => b.tracks.length - a.tracks.length)
                    setPlaylists(p);
                    console.info("Playlists retrieved!");
                    console.log('Playlists: ', p);
                })
            )
        }


        Promise.all(loadPromises).then(() => setLoaded(true));
    }

    useEffect(() => {
        // Redirect if attempting to load own page & not identified as such initially
        if (window.localStorage.getItem('user_id') === pageHash) {
            window.location = 'profile#me'
        }
        // Load the page
        loadPage();
    }, []);

    useEffect(() => {
        setSelectedDatapoint(allDatapoints[termIndex]);
        setSelectedPrevDatapoint(allPreviousDatapoints[termIndex]);
    }, [termIndex])


    const ArtistAnalysis = (props) => {
        const {artist} = props;

        const [artistsAlbumsWithLikedSongs, setArtistsAlbumsWithLikedSongs] = useState([]);

        useEffect(() => {
            const tracks = playlists.map(e => e.tracks).flat(1);
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
                                                  value={analytics[key] * 100} alignment={'right'}/>
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
        const {number} = props;
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
                                        hoverItem === index ? {cursor: 'pointer'} : {opacity: '0.5'}
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
                                            <ArtistAnalysis artist={element} user={pageUser}/>
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
                <img style={{width: '100px', height: '100px', marginRight: '10px', objectFit: 'cover'}} alt={'playlist'}
                     src={playlist.images[0].url}></img>
                <div style={{display: 'flex', flexDirection: 'column', color: 'var(--primary-colour)', flexGrow: '1'}}>
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
            {!loaded || locked ? // Locked and loaded B)
                !loaded ?
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
                    </div>
                    :
                    <div style={{top: '50%', left: '0', right: '0', position: 'absolute'}}>
                        <div className="centre" style={{textAlign: 'center'}}>
                            <LockIcon fontSize={'large'}/>
                            <h1>This page is private.</h1>
                        </div>
                    </div>
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
                                        unfollowUser(window.localStorage.getItem('user_id'), pageHash).then(() => {
                                            setIsLoggedUserFollowing(false);
                                        });
                                    }}>
                                    Unfollow
                                </button>
                                :
                                <button
                                    className={'std-button'}
                                    onClick={() => {
                                        followUser(window.localStorage.getItem('user_id'), pageHash).then(() => {
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
                                    return (<button key={term}
                                                    className={'std-button'}
                                                    style={termIndex === i ? {} : {color: 'var(--secondary-colour)', borderColor: 'var(--secondary-colour)'}}
                                                    onClick={() => setTermIndex(i)}>{translateTerm[term]}</button>)
                                })}
                            </div>
                        </div>
                        {!isOwnPage && isLoggedIn() ?
                            <div style={{textAlign: 'right', marginLeft: 'auto'}}>
                                <h3>Compare</h3>
                                <p>See how {possessive} stats stack up against {pageUser.username}</p>
                                <a className={'std-button'} style={{marginLeft: 'auto'}}
                                   href={`/compare#${window.localStorage.getItem('user_id')}&${pageHash}`}>Compare</a>
                            </div>
                            :
                            isOwnPage && isLoggedIn() ?
                                <div style={{textAlign: 'right', marginLeft: 'auto'}}>
                                    <h3>Profile visibility</h3>
                                    <p>Change whether or not your profile is publicly displayed.</p>
                                    <button className={'std-button'} style={{marginLeft: 'auto'}}
                                            onClick={() => {
                                                const new_settings = {...settings, public: !settings.public};
                                                setSettings(new_settings);
                                                changeSettings(pageHash, new_settings);
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
                                    <ShowcaseList type={type} start={0} end={9}/>
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
                                                <SongAnalysisAverage/>
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
                                                    <TopSongsOfArtists number={10}/>
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
                                                    <GenreBreakdown number={5}/>
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
                                    alignItems: 'center',
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
                                        alignItems: 'center',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        fontFamily: 'Inter Tight',
                                        maxWidth: '1000px',
                                        width: '80%'
                                    }}>
                                        <p>It looks like there are no public playlists on {possessive} profile.</p>
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
                                                <PlaylistItem playlist={p}/>
                                            )
                                        })}
                                    </div>
                            }
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
                                <CommentSection />
                            </div>
                        </div>
                    </div>

                </div>
            }
        </>
    )
}

export default Profile