// noinspection JSValidateTypes
import {useCallback, useEffect, useState} from 'react';
import './../CSS/Profile.css';
import {
    createEvent,
    deleteRecommendation,
    followingContentsSearch,
    followsUser,
    followUser,
    getAlbumsWithTracks,
    getAllIndexes,
    getSimilarArtists,
    getTrackRecommendations,
    hashString,
    isLoggedIn,
    modifyRecommendation,
    onHydration,
    retrieveAllDatapoints,
    retrieveDatapoint,
    retrieveFollowers,
    retrieveLoggedUserID,
    retrievePlaylistMetadata,
    retrievePlaylists,
    retrievePrevAllDatapoints,
    retrieveProfileData,
    retrieveProfileRecommendations,
    retrieveSettings,
    retrieveSongAnalytics,
    retrieveUser,
    submitRecommendation,
    unfollowUser,
    userExists
} from './HDM.ts';
import ArrowCircleDownIcon from '@mui/icons-material/ArrowCircleDown';
import ArrowCircleUpIcon from '@mui/icons-material/ArrowCircleUp';
import ClearAllOutlinedIcon from '@mui/icons-material/ClearAllOutlined';
import FlareIcon from '@mui/icons-material/Flare';
import {
    calculateSimilarity,
    getAverageAnalytics,
    getGenresRelatedArtists,
    getItemAnalysis,
    getItemIndexChange,
    getItemType,
    getLIDescription,
    getLIName,
    getTopInterestingAnalytics,
    translateAnalytics,
    translateAnalyticsLow
} from "./Analysis";
import {handleAlternateLogin} from "./Authentication";
import {
    CommentSection,
    LoadingIndicator,
    PageError,
    SelectionModal,
    SpotifyLink,
    StatBlock,
    ValueIndicator,
} from "./SharedComponents.tsx";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import IosShareIcon from '@mui/icons-material/IosShare';
import {ArcElement, Chart as ChartJS, Legend, Tooltip} from "chart.js";
import {Doughnut} from "react-chartjs-2";
import {useParams} from "react-router-dom";

ChartJS.register(ArcElement, Tooltip, Legend);

const translateTerm = {short_term: '4 weeks', medium_term: '6 months', long_term: 'All time'}

const ShowcaseList = (props) => {
    const {
        pageUser,
        playlists,
        allDatapoints,
        selectedDatapoint,
        selectedPrevDatapoint = null,
        type,
        start,
        end,
        term,
        isOwnPage
    } = props;

    return (
        <div className={'showcase-list-wrapper'}>
            {selectedDatapoint[`top_${type}`].map(function (element, index) {
                if (index >= start && index <= end) {
                    return (
                        <ShowcaseListItem
                            key={type === 'genres' ? element : element[`${type.slice(0, type.length - 1)}_id`]}
                            allDatapoints={allDatapoints}
                            pageUser={pageUser} playlists={playlists} element={element}
                            index={index} selectedDatapoint={selectedDatapoint}
                            selectedPrevDatapoint={selectedPrevDatapoint} type={type} term={term}
                            isOwnPage={isOwnPage}/>
                    )
                }
            })}
        </div>
    )
}

const ShowcaseListItem = (props) => {
    const {
        pageUser,
        possessive,
        element,
        index,
        allDatapoints,
        selectedDatapoint,
        selectedPrevDatapoint,
        playlists,
        type,
        term,
        isOwnPage
    } = props;

    const maxExpansion = 660;
    const secondExpansion = 300;
    const minExpansion = 77;

    const [expansion, setExpansion] = useState(index === 0 ? (type === 'genres' ? secondExpansion : maxExpansion) : minExpansion);
    const [showAnalytics, setShowAnalytics] = useState(index === 0 ? (type !== 'genres' && isLoggedIn()) : false);
    const indexChange = selectedPrevDatapoint ? getItemIndexChange(element, index, type, selectedPrevDatapoint) : null;


    useEffect(() => {
        setExpansion(index === 0 ? (type === 'genres' || !isLoggedIn() ? secondExpansion : maxExpansion) : minExpansion)
        setShowAnalytics(index === 0 ? (type !== 'genres' && isLoggedIn()) : false);
    }, [index])

    const handleClick = () => {
        if (showAnalytics) {
            setExpansion(secondExpansion);
            setShowAnalytics(false);
        } else {
            setExpansion(maxExpansion);
            setShowAnalytics(true);
        }
    }

    const ItemRecommendations = (props) => {
        const {element, type} = props;
        const [recommendations, setRecommendations] = useState(null);
        useEffect(() => {
            if (recommendations === null) {
                generateRecommendations();
            }
        }, [])
        const generateRecommendations = () => {
            if (recommendations === null) {
                switch (type) {
                    case 'artists':
                        getSimilarArtists(element.artist_id).then(function (result) {
                            setRecommendations(result);
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
                        });
                }
            }
        }
        return (
            <div className={`list-widget-wrapper supplemental-content`}>
                {recommendations ?
                    <>
                        <div className={'widget-item'} style={{flexGrow: '0', height: '75px'}}>
                            <div className={'widget-button'}>
                                <p style={{margin: 0}}>Recommendations for</p>
                                <h3 style={{margin: 0}}>{getLIName(element)}</h3>
                            </div>
                        </div>
                        {
                            recommendations.slice(0, 3).map((r, i) => {
                                return (
                                    <div key={getLIName(r)} className={'widget-item'}
                                         style={{animationDelay: `${i / 10}s`}}>
                                        <a href={r.link} className={'widget-button'}>
                                            <h4 style={{margin: 0}}>{getLIName(r)}</h4>
                                            <p style={{margin: 0}}>{getLIDescription(r)}</p>
                                        </a>
                                    </div>
                                )
                            })
                        }
                    </>
                    :
                    <div className={'placeholder'} style={{width: '100%', height: '100%'}}/>
                }
            </div>
        )
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
    } else if (selectedPrevDatapoint !== null) {
        changeMessage =
            <FlareIcon style={{color: 'var(--primary-colour)', animation: 'fadeIn 0.5s ease-in'}} fontSize={"small"}/>
    }

    const analysis = getItemAnalysis(element, type, pageUser, selectedDatapoint, allDatapoints, term);
    const image = element.image ? element.image : (getGenresRelatedArtists(element, selectedDatapoint.top_artists)[0])?.image;

    return (
        <div className={"showcase-list-item"}
             tabIndex={0}
             style={{height: `${expansion}px`}}
             onClick={() => {
                 if (expansion < 100) {
                     setExpansion(secondExpansion)
                 }
             }}>
            {expansion > 100 ?
                <>
                    <div className={"showcase-list-item-expanded"}>
                        <div className={'item-top-element'}>
                            {window.innerWidth > 650 &&
                                <div className={'item-image supplemental-content'}>
                                    <img alt={'decorative blur'} src={image} className={'backdrop-image'} style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        animation: 'fadeIn 0.25s'
                                    }}/>
                                    <img alt={getLIName(element)} src={image} className={'levitating-image'} style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        animation: 'fadeIn 0.25s'
                                    }}/>
                                </div>
                            }
                            <div className={'item-description'}>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '15px'
                                }}>
                                    <div>
                                        <h2 style={{margin: '0'}}>{getLIName(element)}</h2>
                                        <p style={{
                                            margin: '0',
                                            textTransform: 'uppercase'
                                        }}>{getLIDescription(element)}</p>
                                    </div>
                                </div>
                                {analysis}
                                {type !== 'genres' && isLoggedIn() ?
                                    <div style={{width: 'max-content', alignContent: 'center'}}>
                                        <button className={'subtle-button'} onClick={handleClick}>
                                            {showAnalytics ? 'Less' : 'More'}
                                        </button>
                                    </div>
                                    :
                                    <></>
                                }
                            </div>
                        </div>
                        {showAnalytics ?
                            <>
                                <hr style={{width: '95%', margin: 0, border: '1px solid rgba(125, 125, 125, 0.2)'}}/>
                                <div className={'analysis-wrapper'}>
                                    {
                                        type === 'songs' ?
                                            <SongAnalysis song={element}
                                                          averageAnalytics={getAverageAnalytics(selectedDatapoint.top_songs)}/>
                                            :
                                            type === 'artists' ?
                                                <ArtistAnalysis user_id={pageUser.user_id} artist={element}
                                                                playlists={playlists} term={term}
                                                                isOwnPage={isOwnPage} possessive={possessive}/>
                                                :
                                                <></>
                                    }
                                    <ItemRecommendations element={element} type={type}/>
                                </div>
                            </>

                            :
                            <></>
                        }
                    </div>
                    <button className={'showcase-exit-button'} onClick={() => {
                        setExpansion(minExpansion);
                        setShowAnalytics(false)
                    }}>x
                    </button>
                </>
                :
                <div className={"showcase-list-item-text"}>
                    <h2>{getLIName(element)}</h2>
                    <div className={"showcase-list-item-text"} style={{display: 'flex', flexDirection: 'row'}}>
                        {changeMessage && (changeMessage)}
                        {changeMessage && getLIDescription(element) && (<p style={{padding: '0 5px'}}>·</p>)}
                        <p>{getLIDescription(element)}</p>
                    </div>
                </div>
            }
        </div>
    )
}

function ComparisonLink(props) {
    const {pageUser, loggedUserID, longTermDP, simple = false} = props;
    const [loggedDP, setLoggedDP] = useState(null);

    useEffect(() => {
        retrieveDatapoint(loggedUserID, "long_term").then(res => setLoggedDP(res));
    }, [])

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '15px',
            marginLeft: 'auto',
            height: 'max-content',
            flexGrow: '0',
            width: 'max-content'
        }}>
            {simple ?
                <a style={{height: 'max-content'}} href={`/compare#${loggedUserID}&${pageUser.user_id}`}>
                    <ValueIndicator
                        value={loggedDP === null ? (0) : (calculateSimilarity(loggedDP, longTermDP).overall)}
                        diameter={50}/>
                </a>
                :
                <>
                    <div style={{maxWidth: '500px', marginRight: 'auto', textAlign: 'right'}}>
                        <h3 style={{margin: 0}}>Compare</h3>
                        <p style={{marginTop: 0}}>See how your stats stack up against {pageUser.username}'s.</p>
                        <div className={'terms-container'} style={{justifyContent: 'right'}}>
                            <a href={`/compare#${loggedUserID}&${pageUser.user_id}`}
                               className={'subtle-button'}>Compare</a>
                        </div>
                    </div>
                    <ValueIndicator
                        value={loggedDP === null ? (0) : (calculateSimilarity(loggedDP, longTermDP).overall)}
                        diameter={64.5}/>
                </>
            }
        </div>
    )
}

const RecommendationSelectionModal = (props) => {
    const {showModal, setShowModal, recommendations, setRecommendations, pageGlobalUserID, initialItem = null} = props;

    const handleSubmit = async (selectedItem, type, description) => {

        let submissionItem = selectedItem;
        if (type === 'songs') {
            submissionItem.analytics = await retrieveSongAnalytics(submissionItem.song_id);
        }
        await submitRecommendation(pageGlobalUserID, submissionItem, type, description).then(() => {
            retrieveProfileRecommendations(pageGlobalUserID).then(res => setRecommendations(res));
        });
    }

    const handleModify = async (selectedItem, type, description) => {
        const existingRecIndex = recommendations.findIndex(r => r.item[`${type.slice(0, type.length - 1)}_id`] === selectedItem[`${type.slice(0, type.length - 1)}_id`]);
        const existingRec = recommendations[existingRecIndex];
        await modifyRecommendation(pageGlobalUserID, existingRec, type, description).then(() => {
            retrieveProfileRecommendations(pageGlobalUserID).then(res => setRecommendations(res));
        })
    }

    return (
        <SelectionModal
            showModal={showModal}
            setShowModal={setShowModal}
            onModify={handleModify}
            onSubmit={handleSubmit}
            modifyTarget={initialItem}
            description
        />
    )
}


const ProfileRecommendations = (props) => {
    const {pageGlobalUserID, isOwnPage} = props;
    // Only songs and artists at the moment
    const [recs, setRecs] = useState([]);
    const [showSelection, setShowSelection] = useState(false);
    const [initialItem, setInitialItem] = useState(null);


    useEffect(() => {
        retrieveProfileRecommendations(pageGlobalUserID).then(res => setRecs(res));
    }, [])

    const handleDelete = (e) => {
        console.log(e);
        deleteRecommendation(e.id).then(() => {
            createEvent(51, pageGlobalUserID, e.item, getItemType(e.item));
            retrieveProfileRecommendations(pageGlobalUserID).then(res => setRecs(res));
        });
    }

    const handleEdit = (e) => {
        setInitialItem(e.item);
        setShowSelection(true);
    }

    return (
        <div style={{width: '100%', position: 'relative'}}>
            {isOwnPage && (
                <button className={'subtle-button'}
                        onClick={() => {
                            setShowSelection(true);
                            setInitialItem(null);
                        }}>
                    New
                </button>
            )}
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                gap: '15px',
                flexWrap: 'wrap',
                margin: '16px 0',
            }}>
                {recs.length > 0 ?
                    recs.map(e => {
                        const type = getItemType(e.item);
                        return <Recommendation key={e.id} rec={e} type={type} isOwnPage={isOwnPage}
                                               handleDelete={handleDelete} handleEdit={handleEdit}/>
                    })
                    :
                    <p style={{color: 'var(--secondary-colour)'}}>Looks like there aren't any recommendations yet.</p>
                }
            </div>
            <RecommendationSelectionModal initialItem={initialItem} showModal={showSelection}
                                          setShowModal={setShowSelection}
                                          recommendations={recs} setRecommendations={setRecs}
                                          pageGlobalUserID={pageGlobalUserID}/>
        </div>
    )
}

const Recommendation = (props) => {
    const {rec, type, isOwnPage, handleDelete, handleEdit} = props;
    return (
        <div key={rec.id} style={{
            display: 'flex',
            flexDirection: 'row',
            flexGrow: '1',
            gap: '15px',
            background: 'rgba(125, 125, 125, 0.1)',
            border: '1px solid rgba(125, 125, 125, 0.75)',
            padding: '15px',
            width: 'max-content',
            overflow: 'hidden',
            wordBreak: 'break-word'
        }}>
            <div className={'supplemental-content'} style={{position: 'relative', height: '150px', width: '150px'}}>
                <img alt={`${getLIName(rec.item)}`} src={rec.item.image} className={'backdrop-image'}
                     style={{aspectRatio: '1', width: '125%', objectFit: 'cover'}}/>
                <img alt={`${getLIName(rec.item)}`} src={rec.item.image} className={'levitating-image'}
                     style={{aspectRatio: '1', width: '100%', objectFit: 'cover'}}/>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', flexGrow: '1', minWidth: '200px'}}>
                <p style={{
                    margin: '0',
                    textTransform: 'capitalize',
                    color: 'var(--accent-colour)'
                }}>{type.slice(0, type.length - 1)}</p>
                <h2 style={{margin: '0'}}>
                    {getLIName(rec.item)}
                    <span style={{margin: '5px 0 0 10px'}}>
                                            <SpotifyLink simple link={rec.item.link}/>
                                        </span>
                </h2>
                <p style={{margin: '0'}}>{getLIDescription(rec.item)}</p>
                {rec.description.length > 0 && (
                    <p style={{marginBottom: 0}}>
                        <em>
                            <span style={{color: 'var(--accent-colour)', margin: '0 2px'}}>"</span>
                            {rec.description}
                            <span style={{color: 'var(--accent-colour)', margin: '0 2px'}}>"</span>
                        </em>
                    </p>
                )}
                {isOwnPage && (
                    <div style={{display: 'flex', margin: 'auto 0 0 auto', gap: '15px'}}>
                        <button className={'subtle-button'} onClick={() => handleEdit(rec)}>Edit</button>
                        <button className={'subtle-button'}
                                onClick={() => handleDelete(rec)}>
                            Delete
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

const ArtistAnalysis = (props) => {
    const {user_id, artist, playlists, term, isOwnPage} = props;

    const [artistsAlbumsWithLikedSongs, setArtistsAlbumsWithLikedSongs] = useState(null);
    const [followingWithArtist, setFollowingWithArtist] = useState(null);
    const [orderedAlbums, setOrderedAlbums] = useState(null);
    const [isReady, setIsReady] = useState(false);
    const [showing, setShowing] = useState("albums");

    const switchShowing = () => {
        if (showing === "albums") {
            setShowing("following");
        } else if (showing === "following") {
            setShowing("albums");
        } else {
            console.warn("ArtistAnalysis 'showing' is invalid: ", showing);
        }
    }

    useEffect(() => {
        const tracks = playlists.map(e => e.tracks).flat(1);
        getAlbumsWithTracks(artist.artist_id, tracks).then(
            result => {
                setArtistsAlbumsWithLikedSongs(result);
                setOrderedAlbums(result.sort((a, b) => b.saved_songs.length - a.saved_songs.length).slice(0, 4));
                if (result.length === 0 && isOwnPage) {
                    setShowing("following")
                }
            }
        );
        if (isOwnPage) {
            followingContentsSearch(user_id, artist, "artists", term).then(
                result => {
                    setFollowingWithArtist(result);
                    if (result.length === 0) {
                        setShowing("albums")
                    }
                }
            )
        }
    }, [playlists])

    useEffect(() => {
        if (isOwnPage) {
            setIsReady(followingWithArtist && artistsAlbumsWithLikedSongs);
        } else {
            setIsReady(!!artistsAlbumsWithLikedSongs);
        }
    }, [followingWithArtist, artistsAlbumsWithLikedSongs])

    return (
        <div className={`list-widget-wrapper`}>
            {isReady ?
                showing === "albums" ?
                    <>
                        <div className={'widget-item'} style={{flexGrow: '0', height: '75px'}}>
                            <div className={'widget-button'} onClick={() => {
                                if (isOwnPage) {
                                    switchShowing()
                                }
                            }}>
                                <p style={{margin: 0}}>Most listened to albums by</p>
                                <h3 style={{margin: 0}}>{getLIName(artist)}</h3>
                            </div>
                        </div>
                        {orderedAlbums.length > 0 ?
                            orderedAlbums.map((a, i) => {
                                return (
                                    <div key={getLIName(a)} className={'widget-item'}
                                         style={{animationDelay: `${i / 10}s`}}>
                                        <a href={a.link} className={'widget-button'}>
                                            <h4 style={{margin: 0}}>{getLIName(a)}</h4>
                                            <p style={{margin: 0}}>{a.saved_songs.length} saved
                                                song{a.saved_songs.length === 1 ? '' : 's'}</p>
                                        </a>
                                    </div>
                                )
                            })
                            :
                            <div className={'widget-item'} style={{animationDelay: `0.1s`}}>
                                <div className={'widget-button'}>
                                    <h4 style={{margin: 0}}>An analysis is not available.</h4>
                                    <p style={{margin: 0}}>No public playlists with this artist found on this
                                        profile.</p>
                                </div>
                            </div>
                        }
                    </>
                    :
                    <>
                        <div className={'widget-item'} style={{flexGrow: '0', height: '75px'}}>
                            <div className={'widget-button'} onClick={switchShowing}>
                                <p style={{margin: 0}}>Following that listen to</p>
                                <h3 style={{margin: 0}}>{getLIName(artist)}</h3>
                            </div>
                        </div>
                        {followingWithArtist.length > 0 ?
                            followingWithArtist.map((u, i) => {
                                return (
                                    <div key={u.user_id} className={'widget-item'}
                                         style={{animationDelay: `${i / 10}s`}}>
                                        <a href={`/profile/${u.user_id}`} className={'widget-button'}>
                                            <h4 style={{margin: 0}}>{u.username}</h4>
                                        </a>
                                    </div>
                                )
                            })
                            :
                            <div className={'widget-item'} style={{animationDelay: `0.1s`}}>
                                <div className={'widget-button'}>
                                    <h4 style={{margin: 0}}>No following listen to ths artist.</h4>
                                    <p style={{margin: 0}}>Try following more people for them to come up here.</p>
                                </div>
                            </div>
                        }
                    </>
                :
                <div className={'placeholder'} style={{width: '100%', height: '100%'}}/>
            }
        </div>
    )
}

const SongAnalysis = (props) => {
    const {song, averageAnalytics} = props;
    const includedKeys = getTopInterestingAnalytics(averageAnalytics, 3);
    if (song.hasOwnProperty("song_id")) {
        const analytics = song.analytics;
        if (!!analytics) {
            return (
                <div className={'list-widget-wrapper'}>
                    <div className={'widget-item'} style={{flexGrow: '0', height: '75px'}}>
                        <div className={'widget-button'}>
                            <p style={{margin: 0}}>Analysis of</p>
                            <h3 style={{margin: 0}}>{getLIName(song)}</h3>
                        </div>
                    </div>
                    {
                        Object.keys(translateAnalytics).map(function (key) {
                            if (includedKeys.findIndex(e => e === key) !== -1) {
                                const rawAnalytic = analytics[key];
                                const translated = rawAnalytic < 0.3 ? translateAnalyticsLow[key] : translateAnalytics[key];
                                const val = rawAnalytic < 0.3 ? 1 - rawAnalytic : rawAnalytic;
                                const shadow = rawAnalytic < 0.3 ? 1 - averageAnalytics[key] : averageAnalytics[key];
                                return (
                                    <div key={key} className={'widget-item'}>
                                        <div style={{transform: `scale(${206 / 221})`, padding: '15px'}}>
                                            <StatBlock name={translated.name}
                                                       description={translated.description}
                                                       value={val * 100} alignment={'left'}
                                                       shadow={shadow * 100}/>
                                        </div>
                                    </div>
                                )
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
        <div className={'block-wrapper'} id={'song-analysis-average'}>
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
    const {selectedDatapoint, pageUser, allDatapoints, term} = props;
    const [selectedGenre, setSelectedGenre] = useState(selectedDatapoint.top_genres[0]);

    // Custom CSS variables don't work in the data attribute so this is my workaround.
    const darkModePreference = window.matchMedia("(prefers-color-scheme: dark)");
    const [bgColor, setBgColor] = useState(
        darkModePreference.matches ?
            [
                'rgba(255, 255, 255, 0.1)',
                'rgba(255, 255, 255, 0.2)',
                'rgba(255, 255, 255, 0.3)',
                'rgba(255, 255, 255, 0.4)',
                'rgba(255, 255, 255, 0.3)',
                'rgba(255, 255, 255, 0.2)',
            ]
            :
            [
                'rgba(0, 0, 0, 0.1)',
                'rgba(0, 0, 0, 0.2)',
                'rgba(0, 0, 0, 0.3)',
                'rgba(0, 0, 0, 0.4)',
                'rgba(0, 0, 0, 0.3)',
                'rgba(0, 0, 0, 0.2)',
            ]
    );
    darkModePreference.addEventListener("change", e => {
        if (e.matches) {
            setBgColor(
                [
                    'rgba(200, 200, 200, 0.1)',
                    'rgba(200, 200, 200, 0.2)',
                    'rgba(200, 200, 200, 0.3)',
                    'rgba(200, 200, 200, 0.4)',
                    'rgba(200, 200, 200, 0.3)',
                    'rgba(200, 200, 200, 0.2)',
                ]
            )
        } else {
            setBgColor(
                [
                    'rgba(125, 125, 125, 0.1)',
                    'rgba(125, 125, 125, 0.2)',
                    'rgba(125, 125, 125, 0.3)',
                    'rgba(125, 125, 125, 0.4)',
                    'rgba(125, 125, 125, 0.3)',
                    'rgba(125, 125, 125, 0.2)',
                ]
            )
        }
    })

    const artists = selectedDatapoint.top_artists.filter(a => a.genres ? a.genres.some(g => g === selectedGenre) : false);
    const artistWeights = artists.map(e => selectedDatapoint.top_artists.length - selectedDatapoint.top_artists.findIndex(a => a.artist_id === e.artist_id));
    const totalWeights = artistWeights.reduce((partialSum, a) => partialSum + a, 0);
    const percentages = [];
    for (let i = 0; i < artists.length; i++) {
        percentages.push((artistWeights[i] / totalWeights) * 100);
    }

    const handleSelect = (e) => {
        setSelectedGenre(e.target.value);
    }

    const data = {
        labels: artists.map(a => getLIName(a)),
        datasets: [{
            label: `Percentage contribution to ${selectedGenre}`,
            data: percentages,
            backgroundColor: bgColor,
            hoverOffset: 4
        }]
    };

    const options = {
        borderColor: 'rgba(125, 125, 125, 0.2)',
        plugins: {
            legend: {
                display: false
            }
        }
    }

    return (
        <div id={'genre-breakdown-wrapper'}>
            <div style={{display: 'flex', justifyContent: 'center'}}>
                <select style={{margin: 0}} id={'genre-select'} defaultValue={selectedDatapoint.top_genres[0]}
                        onChange={handleSelect}>
                    {selectedDatapoint.top_genres.slice(0, 9).map(g => {
                        return <option key={g} value={g}>{g}</option>
                    })}
                </select>
            </div>
            <div id={'genre-breakdown'}>
                <div id={'genre-chart-wrapper'}>
                    <Doughnut options={options} data={data} updateMode={"show"}/>
                </div>
                <div className={'item-description'} style={{
                    height: 'max-content',
                    padding: '15px',
                    background: 'var(--transparent-colour)',
                    border: '1px solid var(--transparent-border-colour)',
                    maxWidth: '400px'
                }}>
                    {getItemAnalysis(selectedGenre, "genres", pageUser, selectedDatapoint, allDatapoints, term)}
                </div>
            </div>
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
                             style={{
                                 padding: '15px',
                                 background: 'var(--transparent-colour)',
                                 border: '1px solid rgba(125, 125, 125, 0.5)'
                             }}>
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

    const [playlistMetadata, setPlaylistMetadata] = useState(null);

    useEffect(() => {
        if (playlist) {
            retrievePlaylistMetadata(playlist.playlist_id).then(res => setPlaylistMetadata(res));
        }
    }, [playlist])

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'row',
            flexGrow: '1',
            background: 'rgba(125, 125, 125, 0.1)',
            border: '1px solid rgba(125, 125, 125, 0.75)',
            padding: '10px',
            fontFamily: 'Inter Tight',
            width: 'max-content',
            gap: '15px'
        }}>
            {playlist.image && (
                <img style={{width: '100px', height: '100px', objectFit: 'cover'}} alt={'playlist'}
                     src={playlist.image}></img>
            )}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                color: 'var(--primary-colour)',
                flexGrow: '1',
                wordBreak: 'break-all'
            }}>
                <p style={{margin: '0 0 5px 0', fontWeight: '800'}}>{playlist.name}</p>
                <p style={{
                    margin: '0 0 5px 0',
                    borderBottom: '1px solid var(--secondary-colour)',
                }}>{playlist.description}</p>
                <p style={{
                    margin: '0',
                    opacity: '0.5'
                }}>{playlist.tracks.length} songs {playlistMetadata && `· ${Object.keys(playlistMetadata.meta).length} annotation${Object.keys(playlistMetadata.meta).length !== 1 ? 's' : ''}`}</p>
                <a href={`/playlist/${playlist.playlist_id}`} className={'subtle-button'}
                   style={{marginTop: 'auto', marginLeft: 'auto'}}>Explore</a>
            </div>
        </div>
    )
}

function TermSelection(props) {
    const {terms, termIndex, setTermIndex} = props;
    return (
        <div style={{maxWidth: '500px', marginRight: 'auto', flexGrow: '1'}}>
            <h3 style={{margin: 0}}>Time frame</h3>
            <p style={{marginTop: 0}}>Select the range of time to view information for.</p>
            <div className={'terms-container'}>
                {terms.map((t, i) => {
                    return <button type={'button'} onClick={() => setTermIndex(i)} key={t}
                                   className={'subtle-button'} style={terms[termIndex] === t ? {
                        background: 'var(--primary-colour)',
                        color: 'var(--bg-colour)',
                    } : {}}>{terms[i] === 'long_term' ? 'All time' : (terms[i] === 'medium_term' ? '6 months' : '4 weeks')}</button>
                })}
            </div>
        </div>

    );
}

function UserContainer(props) {
    const {windowWidth, user, followers, isLoggedUserFollowing, loggedUserID, isOwnPage, longTermDP} = props;

    const ShareProfileButton = (props) => {
        const {simple = false} = props;
        const origin = (new URL(window.location)).origin;
        const link = `${origin}/profile/{user.user_id}`;

        const [copied, setCopied] = useState(false);

        const handleShare = () => {
            const content = {
                title: "Harked",
                text: `View ${user.username}'s profile on Harked.`,
                url: link
            }
            try {
                if (navigator.canShare(content)) {
                    navigator.share(content).then(() => setCopied(true));
                } else {
                    navigator.clipboard.writeText(`${origin}/profile/${user.user_id}`).then(() => setCopied(true));
                }
            } catch (error) {
                console.warn('Web Share API not supported. Copying to clipboard.', error);
                navigator.clipboard.writeText(`${origin}/profile/${user.user_id}`).then(() => setCopied(true));
            }

        }

        window.addEventListener('copy', () => {
            setCopied(false);
        })

        return (
            <>
                {simple === true ?
                    <button
                        style={{border: 'none', background: 'none', color: 'var(--primary-colour)', cursor: 'pointer'}}
                        onClick={handleShare}>
                        <IosShareIcon fontSize={'small'}/>
                    </button>
                    :
                    <button className={'std-button'} onClick={handleShare}>
                        {copied ?
                            "Copied link!"
                            :
                            "Share profile"
                        }
                    </button>
                }
            </>
        )
    }

    const [isFollowing, setIsFollowing] = useState(isLoggedUserFollowing);
    // For optimistic updates
    const [followerNumber, setFollowerNumber] = useState(followers.length);

    const handleFollowClick = () => {
        if (!isFollowing) {
            setIsFollowing(true);
            const n = followerNumber;
            setFollowerNumber(n + 1);
            followUser(loggedUserID, user.user_id).then(() => {
                console.info('User followed!');
            }).catch((err) => {
                console.warn(`Error following user: `, err);
                setIsFollowing(false);
                setFollowerNumber(n);
            })
        } else {
            setIsFollowing(false);
            const n = followerNumber;
            setFollowerNumber(n - 1);
            unfollowUser(loggedUserID, user.user_id).then(() => {
                console.info('User unfollowed!');
            }).catch((err) => {
                console.warn(`Error unfollowing user: `, err);
                setIsFollowing(true);
                setFollowerNumber(n);
            })
        }
    }

    useEffect(() => {
        setIsFollowing(isLoggedUserFollowing);
    }, [isLoggedUserFollowing]);

    useEffect(() => {
        setFollowerNumber(followers.length);
    }, [followers]);


    return (
        <div className='user-container'>
            <div style={{display: 'flex', flexDirection: 'row', maxHeight: '150px', gap: '15px'}}>
                {user.profile_picture && (
                    <div className={'profile-picture'}>
                        <img alt={'profile picture'} className={'levitating-image'} src={user.profile_picture}
                             style={{height: '100%', width: '100%', objectFit: 'cover'}}/>
                    </div>
                )}
                <div className={'user-details'}>
                    <p style={{margin: '0'}}>Profile for</p>
                    <h2 style={{margin: '-5px 0 0 0', fontSize: '30px', wordBreak: 'keep-all'}}>
                        {user.username}
                        <ShareProfileButton simple/>
                    </h2>
                    <div style={{display: 'flex', flexDirection: 'row', gap: '5px', alignItems: 'center'}}>
                        <a href={`/followers#${user.user_id}`}
                           style={{margin: '0', color: 'var(--primary-colour)', textDecoration: 'none'}}><span
                            style={{fontWeight: 'bold'}}>{followerNumber}</span> follower{followerNumber !== 1 ? 's' : ''}
                        </a>
                        {isLoggedIn() && !isOwnPage && (
                            <button style={{
                                border: 'none',
                                background: 'none',
                                alignItems: 'center',
                                height: '20px',
                                width: '20px',
                                margin: '0',
                                padding: '0',
                                color: 'var(--primary-colour)',
                                cursor: 'pointer'
                            }}
                                    onClick={handleFollowClick}>
                                {isFollowing ?
                                    <CheckCircleOutlineIcon fontSize={'small'}/>
                                    :
                                    <AddCircleOutlineIcon fontSize={'small'}/>
                                }
                            </button>
                        )}
                    </div>
                </div>
                <div className={'user-links'}>
                    <SpotifyLink simple link={`https://open.spotify.com/user/${user.user_id}`}/>
                    <div style={{marginTop: 'auto'}}>
                        {windowWidth < 700 && !isOwnPage && isLoggedIn() &&
                            <ComparisonLink simple pageUser={user} loggedUserID={loggedUserID} longTermDP={longTermDP}/>
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}


function TopContainer(props) {
    const {
        pageUser,
        followers,
        isLoggedUserFollowing,
        isOwnPage,
        loggedUserID,
        longTermDP,
        terms,
        setTermIndex,
        termIndex
    } = props;

    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    window.addEventListener("resize", () => setWindowWidth(window.innerWidth));

    return (
        <div>
            <UserContainer windowWidth={windowWidth} user={pageUser} followers={followers}
                           isLoggedUserFollowing={isLoggedUserFollowing} isOwnPage={isOwnPage}
                           loggedUserID={loggedUserID} longTermDP={longTermDP} terms={terms} setTermIndex={setTermIndex}
                           termIndex={termIndex}/>
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                marginTop: '25px',
                width: '100%',
                alignItems: 'left',
                gap: '15px'
            }}>
                <TermSelection terms={terms} termIndex={termIndex} setTermIndex={setTermIndex}/>
                {!isOwnPage && isLoggedIn() && windowWidth > 700 &&
                    <ComparisonLink pageUser={pageUser} loggedUserID={loggedUserID} longTermDP={longTermDP}/>
                }
            </div>
        </div>
    );
}

function PlaylistItemList(props) {
    const {playlists} = props;

    const [listLength, setListLength] = useState(5);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: '10px',
            width: '100%'
        }}>
            {playlists.slice(0, listLength).map(p => {
                return (
                    <PlaylistItem key={p.playlist_id} playlist={p}/>
                )
            })}
            {playlists.length > listLength ?
                <button onClick={() => {
                    setListLength(playlists.length)
                }} style={{width: '100%', border: '1px solid var(--secondary-colour)', padding: '10px'}}
                        className={'std-button'}>See more</button>
                :
                (
                    playlists.length > 5 ?
                        <button onClick={() => {
                            setListLength(5)
                        }} style={{width: '100%', border: '1px solid var(--secondary-colour)', padding: '10px'}}
                                className={'std-button'}>See less</button>
                        :
                        <></>
                )
            }
        </div>
    )
}

const Profile = () => {

    const simpleDatapoints = ["artists", "songs", "genres"];
    const pageID = (useParams()).id;

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
    const [isError, setIsError] = useState(false);
    const [errorDetails, setErrorDetails] = useState({description: null, errCode: null});


    const loadPage = useCallback(() => {

        // Resolve logged user's information
        // and context of page
        const resolveContext = async () => {
            // The ID we will use for loading references
            let loadID;
            if (isLoggedIn()) {
                console.log('Context is of logged in user.')
                await retrieveLoggedUserID().then(id => {
                    // Are we on our page and don't know it?
                    if (id === pageID) {
                        window.location.href = '/profile/me'
                        // Are we on our own page and know it?
                    } else if (pageID === 'me') {
                        setIsOwnPage(true);
                        loadID = id;
                        setPageGlobalUserID(id);
                        // Are we on someone else's page?
                    } else {
                        followsUser(id, pageID).then(f => setIsLoggedUserFollowing(f));
                        loadID = pageID;
                        setPageGlobalUserID(pageID);
                        setLoggedUserID(id);
                    }
                })
            } else {
                setPageGlobalUserID(pageID)
                loadID = pageID;
            }
            return loadID;
        }

        resolveContext().then((loadID) => {
            const loadPromises = [
                retrieveUser(loadID).then(function (user) {
                    setPageUser(user);
                    retrieveFollowers(user.user_id).then(f => setFollowers(f));
                    if (pageID !== 'me') {
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
                            userExists(loadID).then(exists => {
                                if (exists) {
                                    setErrorDetails({
                                        description: 'We do not have enough information about this user to generate a profile for them.',
                                        errCode: 'complete_term_elimination'
                                    });
                                } else {
                                    setErrorDetails({
                                        description: "This user isn't on Harked yet so you can't view their profile.",
                                    });
                                }
                            })

                        }
                        let termsCopy = terms;
                        indexes.forEach(i => termsCopy[i] = null);
                        setTerms(termsCopy);
                    }
                    setAllDatapoints(datapoints);
                    setSelectedDatapoint(datapoints[termIndex]);
                    console.info("Datapoints retrieved!");
                    console.log(datapoints);
                }),
                retrievePrevAllDatapoints(loadID, 1).then(function (datapoints) {
                    setAllPreviousDatapoints(datapoints);
                    setSelectedPrevDatapoint(datapoints[2]);
                    console.info("Previous datapoints retrieved!");
                    console.log(datapoints);
                }),
                retrieveSettings(loadID).then(function (s) {
                    setSettings(s);
                    if (!s.public && pageID !== 'me') {
                        console.info("LOCKED PAGE", settings);
                        setIsError(true);
                        setErrorDetails({
                            description: 'This profile is private.'
                        });
                    }
                }),
                retrieveProfileData(loadID).then(function (d) {
                    setProfileData(d);
                }),
            ];

            Promise.all(loadPromises)
                .then(() => {
                        setLoaded(true);
                        if (isLoggedIn()) {
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
            if (pageID === "me") {
                // Create onHydration to update page
                // when hydration is fully complete
                onHydration(loadID, () => {
                    retrievePrevAllDatapoints(loadID, 1).then(function (datapoints) {
                        setAllPreviousDatapoints(datapoints);
                        setSelectedPrevDatapoint(datapoints[2]);
                        console.info("Previous datapoints retrieved!");
                        console.log(datapoints);
                    })
                })
            }
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
            {!loaded || isError ?
                isError ?
                    <PageError icon={errorDetails.icon} description={errorDetails.description}
                               errCode={errorDetails.errCode}/>
                    :
                    <LoadingIndicator/>
                :
                <div className='wrapper'>
                    <TopContainer pageUser={pageUser} followers={followers}
                                  isLoggedUserFollowing={isLoggedUserFollowing} isOwnPage={isOwnPage}
                                  loggedUserID={loggedUserID} longTermDP={allDatapoints[2]} terms={terms}
                                  setTermIndex={setTermIndex} termIndex={termIndex}/>
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
                                        <div>
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
                                    </div>
                                    <ShowcaseList allDatapoints={allDatapoints} selectedDatapoint={selectedDatapoint}
                                                  selectedPrevDatapoint={selectedPrevDatapoint} pageUser={pageUser}
                                                  playlists={playlists}
                                                  datapoint={selectedDatapoint} type={type} start={0} end={9}
                                                  term={terms[termIndex]} isOwnPage={isOwnPage}/>
                                    {type !== 'genres' &&
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
                                                type === 'artists' &&
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
                                                    <TopSongsOfArtists selectedDatapoint={selectedDatapoint}
                                                                       number={10}/>
                                                </div>
                                            }
                                        </div>
                                    }
                                </div>
                            )
                        })}
                        <div className={'simple-instance'} style={{alignItems: 'center'}}>
                            <div className={'section-header'}>
                                <div>
                                    <p style={{
                                        margin: '16px 0 0 0',
                                        textTransform: 'uppercase'
                                    }}>{possessive}</p>
                                    <h2 style={{margin: '0', textTransform: 'uppercase'}}>Playlists</h2>
                                    {isLoggedIn() ?
                                        <>
                                            <p>A look at {possessive} public playlists, sorted by their number of
                                                songs.</p>
                                        </>
                                        :
                                        <>
                                            <p>Viewing someone's playlists requires being logged in.</p>
                                            <button className={'subtle-button'} onClick={handleAlternateLogin}>Log-in
                                            </button>
                                        </>
                                    }
                                </div>
                            </div>
                            {!isLoggedIn() ?
                                <></>
                                :
                                playlists.length < 1 ?
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        flexWrap: 'wrap',
                                        gap: '10px',
                                        width: '100%'
                                    }}>
                                        <p style={{color: "var(--secondary-colour)", marginRight: 'auto'}}>Looks like
                                            there aren't any public playlists.</p>
                                    </div>
                                    :
                                    <PlaylistItemList playlists={playlists}/>
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
                                    {isLoggedIn() ?
                                        <>
                                            <p><span style={{textTransform: 'capitalize'}}>{possessive}</span> artists
                                                and songs
                                                that are recommended to others.</p>
                                        </>
                                        :
                                        <>
                                            <p>Viewing someone's recommendations requires being logged in.</p>
                                            <button className={'subtle-button'} onClick={handleAlternateLogin}>Log-in
                                            </button>
                                        </>
                                    }
                                </div>
                            </div>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'row',
                                flexWrap: 'wrap',
                                gap: '10px',
                                width: '100%'
                            }}>
                                {isLoggedIn() &&
                                    <ProfileRecommendations pageGlobalUserID={pageGlobalUserID} isOwnPage={isOwnPage}/>
                                }
                            </div>
                        </div>
                        <div className={'simple-instance'}>
                            <div className={'section-header'}>
                                <div style={{maxWidth: '400px'}}>
                                    <p style={{
                                        margin: '16px 0 0 0',
                                        textTransform: 'uppercase'
                                    }}>{possessive}</p>
                                    <h2 style={{margin: '0', textTransform: 'uppercase'}}>Reviews</h2>
                                    {isLoggedIn() ?
                                        <>
                                            <p>Have a look at {possessive} reviews on albums, artists and songs.</p>
                                            <a className={'subtle-button'} href={`/reviews/${pageUser.user_id}`}>View</a>
                                        </>
                                        :
                                        <>
                                            <p>Viewing someone's reviews requires being logged in.</p>
                                            <button className={'subtle-button'} onClick={handleAlternateLogin}>Log-in
                                            </button>
                                        </>
                                    }
                                </div>
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
                                width: '100%'
                            }}>
                                <CommentSection sectionID={hashString(pageGlobalUserID)} owner={pageUser}
                                                isAdmin={isOwnPage}/>
                            </div>
                        </div>
                    </div>

                </div>
            }
        </>
    )
}

export default Profile