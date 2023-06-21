// noinspection JSValidateTypes

import React, {useCallback, useEffect, useRef, useState} from 'react';
import './../CSS/Profile.css';
import './../CSS/Graph.css'
import {
    deleteRecommendation,
    followsUser,
    followUser,
    getAlbumsWithTracks,
    getAllIndexes,
    getSimilarArtists,
    getTrackRecommendations,
    hashString,
    isLoggedIn,
    retrieveAllDatapoints,
    retrieveDatapoint,
    retrieveFollowers,
    retrieveLoggedUserID,
    retrievePlaylists,
    retrievePrevAllDatapoints,
    retrieveProfileData,
    retrieveProfileRecommendations,
    retrieveSearchResults,
    retrieveSettings,
    retrieveSongAnalytics,
    retrieveUser,
    submitRecommendation,
    unfollowUser
} from './HDM.ts';
import ArrowCircleDownIcon from '@mui/icons-material/ArrowCircleDown';
import ArrowCircleUpIcon from '@mui/icons-material/ArrowCircleUp';
import ClearAllOutlinedIcon from '@mui/icons-material/ClearAllOutlined';
import ReportGmailerrorredIcon from '@mui/icons-material/ReportGmailerrorred';
import {
    calculateSimilarity,
    getAverageAnalytics,
    getGenresRelatedArtists,
    getItemAnalysis,
    getItemIndexChange,
    getItemType,
    getLIDescription,
    getLIName,
    translateAnalytics
} from "./Analysis";
import {handleLogin} from "./Authentication";
import LockIcon from '@mui/icons-material/Lock';
import DeleteIcon from '@mui/icons-material/Delete';
import Fuse from "fuse.js";
import {
    CommentSection,
    LoadingIndicator,
    PageError,
    SpotifyLink,
    StatBlock,
    StyledField,
    ValueIndicator
} from "./SharedComponents.tsx";
import {ExpandMore} from "@mui/icons-material";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import * as PropTypes from "prop-types";

const translateTerm = {short_term: '4 weeks', medium_term: '6 months', long_term: 'All time'}

const ShowcaseList = (props) => {
    const {pageUser, possessive, playlists, selectedDatapoint, selectedPrevDatapoint = null, type, start, end} = props;

    return (
        <div className={'showcase-list-wrapper'}>
            {selectedDatapoint[`top_${type}`].map(function (element, index) {
                if (index >= start && index <= end) {
                    return (
                        <ShowcaseListItem
                            key={type === 'genres' ? element : element[`${type.slice(0, type.length - 1)}_id`]}
                            pageUser={pageUser} possesive={possessive} playlists={playlists} element={element}
                            index={index} selectedDatapoint={selectedDatapoint}
                            selectedPrevDatapoint={selectedPrevDatapoint} type={type}/>
                    )
                }
            })}
        </div>
    )
}

const ShowcaseListItem = (props) => {
    const {pageUser, possessive, element, index, selectedDatapoint, selectedPrevDatapoint, playlists, type} = props;

    const maxExpansion = 650;
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
            generateRecommendations();
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
            <div style={{position: 'relative', textAlign: 'right'}} className={'analysis supplemental-content'}>
                {recommendations ?
                    <>
                        <h3 style={{margin: '0'}}>Recommendations for</h3>
                        <p style={{margin: '-5px 0 5px 0'}}>{getLIName(element)}</p>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '17px'}}>
                            {
                                recommendations.slice(0, 4).map(e => {
                                    return (
                                        <div key={getLIName(e)} style={{
                                            display: 'flex',
                                            flexDirection: 'row',
                                            cursor: 'pointer',
                                            justifyContent: 'right',
                                            alignItems: 'center',
                                            gap: '5px'
                                        }}>
                                            <div>
                                                <p style={{margin: 0}}>{getLIName(e)}</p>
                                                <p style={{
                                                    margin: 0,
                                                    fontSize: '12px',
                                                    color: 'var(--accent-colour)'
                                                }}>{getLIDescription(e)}</p>
                                            </div>
                                            <SpotifyLink link={e.link} simple/>
                                        </div>
                                    )
                                })
                            }
                        </div>
                    </>
                    :
                    <LoadingIndicator/>
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
    }

    const description = getItemAnalysis(element, type, pageUser, selectedDatapoint);
    const image = element.image ? element.image : (getGenresRelatedArtists(element, selectedDatapoint.top_artists)[0]).image;

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
                                    {type !== 'genres' ?
                                        <SpotifyLink link={element.link} simple/>
                                        :
                                        <></>
                                    }
                                </div>
                                <p style={{marginTop: '0 auto'}}>{description.header}</p>
                                <p className={'supplemental-content'} style={{marginTop: '0 auto'}}>{description.subtitle}</p>
                                {type !== 'genres' && isLoggedIn() ?
                                    <div style={{width: 'max-content', alignContent: 'center'}}>
                                        <button style={{
                                            fontFamily: 'Inter Tight',
                                            color: 'var(--primary-colour)',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'row',
                                            alignItems: 'center'
                                        }} onClick={handleClick}>
                                            <div style={{
                                                transform: `rotate(${showAnalytics ? '180' : '0'}deg)`,
                                                transition: '0.25s all',
                                                height: 'max-content'
                                            }}>
                                                <ExpandMore fontSize={'large'}/>
                                            </div>
                                            <h3>{showAnalytics ? 'Less' : 'More'}</h3>
                                        </button>
                                    </div>
                                    :
                                    <></>
                                }
                            </div>
                        </div>
                        {showAnalytics ?
                            <>
                                <hr style={{width: '100%', border: '1px solid var(--secondary-colour)'}}/>
                                <div className={'analysis-wrapper'}>
                                    {
                                        type === 'songs' ?
                                            <SongAnalysis song={element}/>
                                            :
                                            type === 'artists' ?
                                                isLoggedIn() ?
                                                    <ArtistAnalysis artist={element} playlists={playlists}/>
                                                    :
                                                    <div className={'analysis'}
                                                         style={{textAlign: 'right', padding: '0px'}}>
                                                        <p>Log in to see {possessive} analysis
                                                            for {getLIName(element)}</p>
                                                        <button style={{width: 'max-content', marginLeft: 'auto'}}
                                                                className={'std-button'} onClick={handleLogin}>Log-in
                                                        </button>
                                                    </div>
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
                    <button className={'showcase-exit-button'} onClick={() => {setExpansion(minExpansion); setShowAnalytics(false)}}>x</button>
                </>
                :
                <div className={"showcase-list-item-text"}>
                    <h2>{getLIName(element)}</h2>
                    <div className={"showcase-list-item-text"} style={{display:'flex', flexDirection: 'row'}}>
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
    const {pageUser, loggedUserID, longTermDP, concise = false} = props;
    const [loggedDP, setLoggedDP] = useState(null);

    useEffect(() => {
        retrieveDatapoint(loggedUserID, "long_term").then(res => setLoggedDP(res));
    }, [])

    return (
        <div style={{display: 'flex', flexDirection: 'row', gap: '15px', marginLeft: 'auto'}}>
            {concise ?
                <a style={{height: 'max-content'}} href={`/compare#${loggedUserID}&${pageUser.user_id}`}>
                    <ValueIndicator value={loggedDP === null ? (0) : (calculateSimilarity(loggedDP, longTermDP).overall)}
                                    diameter={50}/>
                </a>
                :
                <>
                    <div style={{textAlign: 'right', marginLeft: 'auto'}}>
                        <h3 style={{margin: 0}}>Compare</h3>
                        <p style={{margin: '0 0 5px 0'}}>See how your stats stack up against {pageUser.username}</p>
                        <a className={'std-button'} style={{marginLeft: 'auto'}}
                           href={`/compare#${loggedUserID}&${pageUser.user_id}`}>Compare</a>
                    </div>
                    <ValueIndicator value={loggedDP === null ? (0) : (calculateSimilarity(loggedDP, longTermDP).overall)}
                                    diameter={50}/>
                </>
            }
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
            if (searchRef.current !== null && searchRef.current !== undefined && searchRef.current.value !== '') {
                console.log('ran with', searchRef.current.value)
                retrieveSearchResults(searchRef.current.value, type).then(res => setSearchResults(formatSearchResults(res)));
            }
        }

        const handleSubmit = async () => {
            let type = getItemType(selectedItem);
            let submissionItem = selectedItem;
            if (type === 'songs') {
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

            switch (type) {
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
                    <form noValidate autoComplete="off" onSubmit={handleSearch}
                          onKeyDown={(e) => {
                              if (e.keyCode === 13 && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSearch();
                              }
                          }}
                    >
                        <StyledField
                            label='Search'
                            placeholder={`Search for ${type}`}
                            multiline
                            variant='outlined'
                            rows={1}
                            inputRef={searchRef}
                            inputProps={{maxLength: 100}}
                        />
                        <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between'}}>
                            <div>
                                {typeChoices.map(e => {
                                    return <button key={e} className={'std-button'} style={type !== e ? {
                                        color: 'var(--secondary-colour)',
                                        borderColor: 'var(--secondary-colour)',
                                        textTransform: 'capitalize'
                                    } : {textTransform: 'capitalize'}} onClick={() => setType(e)}>{e}</button>
                                })}
                            </div>
                            <button className={'std-button'} type={"submit"}>Search</button>
                        </div>
                    </form>
                )
                }

                <div style={{display: 'flex', flexDirection: 'column'}}>
                    {searchResults !== null && selectedItem === null ?
                        (
                            searchResults.slice(0, 5).map((e, i) => {
                                return (
                                    <button className={'std-button'}
                                            style={i === searchResults.slice(0, 5).length - 1 ? {
                                                border: 'none',
                                                width: '100%'
                                            } : {
                                                borderTop: 'none',
                                                borderLeft: 'none',
                                                borderRight: 'none',
                                                width: '100%'
                                            }} key={e.link} onClick={() => setSelectedItem(e)}>
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
                            <img alt={`${getLIName(selectedItem)}`} className={'supplemental-content'}
                                 style={{aspectRatio: '1', objectFit: 'cover', width: '300px', height: '300px'}}
                                 src={selectedItem.image}/>
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
                                    inputProps={{maxLength: 400}}
                                />
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    marginTop: 'auto'
                                }}>
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
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                gap: '15px',
                flexWrap: 'wrap',
                margin: '16px 0',
                position: 'relative',
            }}>
                {recs.length > 0 ?
                    recs.map(e => {
                        const type = getItemType(e.item);
                        return <Recommendation key={e.id} rec={e} type={type} isOwnPage={isOwnPage} handleDelete={handleDelete}/>
                    })
                    :
                    <p style={{color: 'var(--secondary-colour)'}}>Looks like there aren't any recommendations yet.</p>
                }
            </div>
            {isOwnPage && (
                <div style={{
                    margin: '0 auto',
                    width: 'max-content',
                    transform: `rotate(${showSelection ? '180' : '0'}deg)`,
                    transition: '0.25s all',
                    cursor: 'pointer'
                }}>
                    <button style={{background: 'none', border: 'none', color: 'var(--primary-colour)'}}
                            onClick={() => {
                                if (showSelection) {
                                    setShowSelection(false)
                                } else {
                                    setShowSelection(true)
                                }
                            }}>
                        <ExpandMore fontSize={'large'}/>
                    </button>
                </div>
            )}
            <Selection show={showSelection}/>
        </div>
    )
}

const Recommendation = (props) => {
    const {rec, type, isOwnPage, handleDelete} = props;
    return (
        <div key={rec.id} style={{
            display: 'flex',
            flexDirection: 'row',
            flexGrow: '1',
            gap: '15px',
            border: '1px solid var(--secondary-colour)',
            padding: '15px',
            width: 'max-content',
            overflow: 'hidden',
            wordBreak: 'break-word'
        }}>
            <div className={'supplemental-content'} style={{position: 'relative', height: '150px', width: '150px'}}>
                <img alt={`${getLIName(rec.item)}`} src={rec.item.image} className={'backdrop-image'}/>
                <img alt={`${getLIName(rec.item)}`} src={rec.item.image} className={'levitating-image'}
                     style={{aspectRatio: '1', width: '100%'}}/>
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
                    <p>
                        <em>
                            <span style={{color: 'var(--accent-colour)', margin: '0 2px'}}>"</span>
                            {rec.description}
                            <span style={{color: 'var(--accent-colour)', margin: '0 2px'}}>"</span>
                        </em>
                    </p>
                )}
                {isOwnPage && (
                    <div style={{margin: 'auto 0 0 auto'}}>
                        <button style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--accent-colour)',
                            width: 'max-content',
                            cursor: 'pointer',
                            marginLeft: 'auto'
                        }}
                                onClick={() => handleDelete(rec.id)}>
                            <DeleteIcon/>
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

const ArtistAnalysis = (props) => {
    const {artist, playlists} = props;

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
                <h3 style={{margin: '0'}}>Analysis</h3>
                <p style={{margin: '-5px 0 5px 0'}}>of {getLIName(artist)}</p>
                {artistsAlbumsWithLikedSongs === null ?
                    <LoadingIndicator/>
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
                                                          alignment={'left'}/>
                                    })
                                }
                            </>

                            :
                            <p>There are no saved songs from this
                                artist on in any public playlists, so an analysis is not available.</p>
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
        if (analytics !== undefined && analytics !== null) {
            return (
                <div className={'analysis'} style={{textAlign: 'left'}}>
                    <h3 style={{margin: '0'}}>Analysis</h3>
                    <p style={{margin: '-5px 0 5px 0'}}>of {getLIName(song)}</p>
                    {
                        Object.keys(translateAnalytics).map(function (key) {
                            if (excludedKeys.findIndex(e => e === key) === -1) {
                                return <StatBlock key={key} name={translateAnalytics[key].name}
                                                  description={translateAnalytics[key].description}
                                                  value={analytics[key] * 100} alignment={'left'}/>
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
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                color: 'var(--primary-colour)',
                flexGrow: '1',
                wordBreak: 'break-all'
            }}>
                <p style={{margin: '0 0 5px 0'}}>{playlist.name}</p>
                <p style={{
                    margin: '0 0 5px 0',
                    borderBottom: '1px solid var(--secondary-colour)'
                }}>{playlist.description}</p>
                <p style={{margin: '0', opacity: '0.5'}}>{playlist.tracks.length} songs</p>
                <div style={{marginTop: 'auto', marginLeft: 'auto'}}>
                    <SpotifyLink link={playlist.external_urls.spotify} simple/>
                </div>
            </div>
        </div>
    )
}

function TermSelection(props) {
    const {terms, termIndex, setTermIndex} = props;
    return (
        <div>
            {terms.map((t, i) => {
                if(t !== null){
                    return <button className={'term-button'} style={termIndex === i ? {background: 'var(--primary-colour)'} : {background: 'none'}} onClick={() => setTermIndex(i)}></button>
                }
            })}
        </div>
    );
}

function UserContainer(props){
    const {user, followers, isLoggedUserFollowing , loggedUserID, isOwnPage, longTermDP, setTermIndex, terms, termIndex} = props;

    const ShareProfileButton = (props) => {
        const {pageGlobalUserID} = props;
        const origin = (new URL(window.location)).origin;

        const [copied, setCopied] = useState(false);

        window.addEventListener('copy', () => {
            setCopied(false);
        })

        return (
            <button className={'std-button'} onClick={() => {
                navigator.clipboard.writeText(`${origin}/profile#${pageGlobalUserID}`).then(() => setCopied(true))
            }}>
                {copied ?
                    "Copied link!"
                    :
                    "Share profile"
                }
            </button>
        )
    }

    const [isFollowing, setIsFollowing] = useState(isLoggedUserFollowing);
    // For optimistic updates
    const [followerNumber, setFollowerNumber] = useState(followers.length);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    const updateSize = () => {
        setWindowWidth(window.innerWidth);
    }
    window.addEventListener("resize", updateSize);

    const handleFollowClick = () => {
        if(!isFollowing){
            setIsFollowing(true);
            const n = followerNumber;
            setFollowerNumber(n+1);
            followUser(loggedUserID, user.user_id).then(() => {
                console.info('User followed!');
            }).catch((err) => {
                console.warn(`Error following user: `, err);
                setIsFollowing(false);
            })
        }else{
            setIsFollowing(false);
            const n = followerNumber;
            setFollowerNumber(n-1);
            unfollowUser(loggedUserID, user.user_id).then(() => {
                console.info('User unfollowed!');
            }).catch((err) => {
                console.warn(`Error unfollowing user: `, err);
                setIsFollowing(true);
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
            <div style={{display: 'flex', flexDirection: 'row'}}>

                    <div className={'profile-picture'}>
                        {user.profile_picture && (
                        <img alt={'profile picture'} className={'levitating-image'} src={user.profile_picture} style={{height: '100%', width: '100%', objectFit: 'cover'}} />
                        )}
                    </div>
                <div className={'user-details'}>
                    <p style={{margin: '0'}}>Profile for</p>
                    <h2 style={{margin: '0'}}>{user.username}</h2>
                    <div style={{display: 'flex', flexDirection: 'row', gap: '5px', alignItems: 'center'}}>
                        <a href={`/followers#${user.user_id}`} style={{margin: '0', color: 'var(--primary-colour)', textDecoration: 'none'}}><span style={{fontWeight: 'bold'}}>{followerNumber}</span> follower{followerNumber !== 1 ? 's' : ''}</a>
                        {isLoggedIn() && !isOwnPage && (
                            <button style={{border: 'none', background: 'none', alignItems: 'center', height: '20px', width: '20px', margin: '0', padding: '0', color: 'var(--primary-colour)'}}
                                    onClick={handleFollowClick}>
                                {isFollowing ?
                                    <CheckCircleOutlineIcon fontSize={'small'} />
                                    :
                                    <AddCircleOutlineIcon fontSize={'small'} />
                                }
                            </button>
                        )}
                    </div>
                    <TermSelection setTermIndex={setTermIndex} terms={terms} termIndex={termIndex}/>
                </div>
                <div className={'user-links'}>
                    <SpotifyLink simple={windowWidth < 700} link={`https://open.spotify.com/user/${user.user_id}`} />
                    {!isOwnPage && isLoggedIn() &&
                        <ComparisonLink concise={windowWidth < 700} pageUser={user} loggedUserID={loggedUserID} longTermDP={longTermDP} />
                    }
                </div>
            </div>
        </div>
    )
}


const Profile = () => {

    const simpleDatapoints = ["artists", "songs", "genres"]
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
            if (isLoggedIn()) {
                console.log('Context is of logged in user.')
                await retrieveLoggedUserID().then(id => {
                    // Are we on our page and don't know it?
                    if (id === pageHash) {
                        window.location = 'profile#me';
                        // Are we on our own page and know it?
                    } else if (pageHash === 'me') {
                        setIsOwnPage(true);
                        loadID = id;
                        setPageGlobalUserID(id);
                        // Are we on someone else's page?
                    } else {
                        followsUser(id, pageHash).then(f => setIsLoggedUserFollowing(f));
                        loadID = pageHash;
                        setPageGlobalUserID(pageHash);
                        setLoggedUserID(id);
                    }
                })
            } else {
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
                            setErrorDetails({
                                icon: <ReportGmailerrorredIcon fontSize={'large'}/>,
                                description: 'We do not have enough information about this user to generate a profile for them.',
                                errCode: 'complete_term_elimination'
                            });
                        }
                        let termsCopy = terms;
                        indexes.forEach(i => termsCopy[i] = null);
                        setTerms(termsCopy);
                    }
                    console.log(datapoints);
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
                    if (!s.public && pageHash !== 'me') {
                        console.info("LOCKED PAGE", settings);
                        setIsError(true);
                        setErrorDetails({
                            icon: <LockIcon fontSize={'large'}/>,
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
                    <PageError icon={errorDetails.icon} description={errorDetails.description}
                               errCode={errorDetails.errCode}/>
                    :
                    <LoadingIndicator/>
                :
                <div className='wrapper'>
                    <meta
                        name="description"
                        content={`Explore ${pageUser.username}'s profile on Harked.`}
                    />
                    <UserContainer user={pageUser} followers={followers} isLoggedUserFollowing={isLoggedUserFollowing} isOwnPage={isOwnPage} loggedUserID={loggedUserID} longTermDP={allDatapoints[2]} terms={terms} setTermIndex={setTermIndex} termIndex={termIndex} />
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
                                    <ShowcaseList selectedDatapoint={selectedDatapoint}
                                                  selectedPrevDatapoint={selectedPrevDatapoint} pageUser={pageUser}
                                                  playlists={playlists} possessive={possessive}
                                                  datapoint={selectedDatapoint} type={type} start={0} end={9}/>
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
                                                    <TopSongsOfArtists selectedDatapoint={selectedDatapoint}
                                                                       number={10}/>
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
                                <div>
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
                                        width: '100%'
                                    }}>
                                        <p style={{color: "var(--secondary-colour)", marginRight: 'auto'}}>Looks like
                                            there aren't any public playlists.</p>
                                    </div>
                                    :
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        flexWrap: 'wrap',
                                        gap: '10px',
                                        width: '100%'
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
                                    <p><span style={{textTransform: 'capitalize'}}>{possessive}</span> artists and songs
                                        that are recommended to others.</p>
                                </div>
                            </div>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'row',
                                flexWrap: 'wrap',
                                gap: '10px',
                                width: '100%'
                            }}>
                                <ProfileRecommendations pageGlobalUserID={pageGlobalUserID} isOwnPage={isOwnPage}/>
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
                                <CommentSection sectionID={hashString(pageGlobalUserID)} isAdmin={isOwnPage}/>
                            </div>
                        </div>
                    </div>

                </div>
            }
        </>
    )
}

export default Profile