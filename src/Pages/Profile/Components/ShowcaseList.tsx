import React, {useEffect, useState} from "react";
import {isLoggedIn} from "@/Tools/users";
import ArrowCircleDownIcon from "@mui/icons-material/ArrowCircleDown";
import ArrowCircleUpIcon from "@mui/icons-material/ArrowCircleUp";
import ClearAllOutlinedIcon from "@mui/icons-material/ClearAllOutlined";
import FlareIcon from "@mui/icons-material/Flare";
import {getGenresRelatedArtists, getSimilarArtists, getTrackRecommendations} from "@/Tools/similar";
import {getAverageAnalytics, getItemAnalysis, getItemIndexChange, getLIDescription, getLIName} from "@/Tools/analysis";
import {SongAnalysis} from "./SongAnalysis";
import {ArtistAnalysis} from "./ArtistAnalysis";

export const ShowcaseList = (props) => {
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
    // TODO: CREATE SRCSET
    const image = element.image ? element.image : (getGenresRelatedArtists(element, selectedDatapoint.top_artists)[0])?.images[0];

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
                                                                isOwnPage={isOwnPage} />
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