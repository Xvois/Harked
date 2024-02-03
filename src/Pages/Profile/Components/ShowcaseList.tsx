import React, {useEffect, useState} from "react";
import {isLoggedIn} from "@/Tools/users";
import ArrowCircleDownIcon from "@mui/icons-material/ArrowCircleDown";
import ArrowCircleUpIcon from "@mui/icons-material/ArrowCircleUp";
import ClearAllOutlinedIcon from "@mui/icons-material/ClearAllOutlined";
import FlareIcon from "@mui/icons-material/Flare";
import {getGenresRelatedArtists, getSimilarArtists, getTrackRecommendations} from "@/Tools/similar";
import {getAverageAnalytics, getItemIndexChange, getLIDescription, getLIName} from "@/Analysis/analysis";
import {TrackAnalysis} from "./TrackAnalysis";
import {ArtistAnalysis} from "./ArtistAnalysis";
import {PlFromListWithTracks} from "@/API/Interfaces/playlistInterfaces";
import {User} from "@/Tools/Interfaces/userInterfaces";
import {Datapoint, Term} from "@/Tools/Interfaces/datapointInterfaces";
import {Artist} from "@/API/Interfaces/artistInterfaces";
import {TrackWithAnalytics} from "@/API/Interfaces/trackInterfaces";
import {createPictureSources, isArtist, isTrack} from "@/Tools/utils";
import {ItemDescriptor} from "@/Analysis/ItemDescriptor";

export const ShowcaseList = (props: {
    pageUser: User;
    playlists: Array<PlFromListWithTracks>;
    allDatapoints: Datapoint[];
    selectedDatapoint: Datapoint;
    selectedPrevDatapoint?: Datapoint;
    type: string;
    start: number;
    end: number;
    term: Term;
    isOwnPage: boolean;
}) => {
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

    console.log(selectedDatapoint)

    return (
        <div className={'showcase-list-wrapper'}>
            {selectedDatapoint[`top_${type}s`].map(function (element: Artist | TrackWithAnalytics | string, index: number) {
                if (index >= start && index <= end) {
                    return (
                        <ShowcaseListItem
                            key={(isTrack(element) || isArtist(element)) ? element.id : element}
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

const ShowcaseListItem = (props: {
    pageUser: User;
    element: Artist | TrackWithAnalytics | string;
    index: number;
    allDatapoints: Datapoint[];
    selectedDatapoint: Datapoint;
    selectedPrevDatapoint: Datapoint;
    playlists: Array<PlFromListWithTracks>;
    type: string;
    term: Term;
    isOwnPage: boolean;
}) => {
    const {
        pageUser,
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

    const [expansion, setExpansion] = useState(index === 0 ? (type === 'genre' ? secondExpansion : maxExpansion) : minExpansion);
    const [showAnalytics, setShowAnalytics] = useState(index === 0 ? (type !== 'genre' && isLoggedIn()) : false);
    const indexChange = selectedPrevDatapoint ? getItemIndexChange(element, index, type, selectedPrevDatapoint) : null;


    useEffect(() => {
        setExpansion(index === 0 ? (type === 'genre' || !isLoggedIn() ? secondExpansion : maxExpansion) : minExpansion)
        setShowAnalytics(index === 0 ? (type !== 'genre' && isLoggedIn()) : false);
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
                if (isArtist(element)) {
                    getSimilarArtists(element.id).then(function (result) {
                        setRecommendations(result);
                    });
                } else if (isTrack(element)) {
                    const seed_artists = element.artists.map(a => a.id).slice(0, 2);
                    const seed_genres = selectedDatapoint.top_genres.slice(0, 2);
                    const seed_track = [element.id];
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

    // TODO: CREATE SRCSET
    let images;
    if (isTrack(element)) {
        images = element.album?.images;
    } else if (isArtist(element)) {
        images = element.images;
    } else if (typeof element === 'string') {
        const relatedArtists = getGenresRelatedArtists(element, selectedDatapoint.top_artists);
        images = relatedArtists[0]?.images;
    }

    const imageSrcSet = createPictureSources(images, 0.25);

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
                                    <img alt={'decorative blur'} srcSet={imageSrcSet} className={'backdrop-image'}
                                         style={{
                                             width: '100%',
                                             height: '100%',
                                             objectFit: 'cover',
                                             animation: 'fadeIn 0.25s'
                                         }}/>
                                    <img alt={getLIName(element)} srcSet={imageSrcSet} className={'levitating-image'}
                                         style={{
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
                                <ItemDescriptor
                                    item={element}
                                    user={pageUser}
                                    selectedDatapoint={selectedDatapoint}
                                    allDatapoints={allDatapoints}
                                    term={term}
                                    isOwnPage={isOwnPage}
                                />
                                {type !== 'genre' && isLoggedIn() ?
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
                                        isTrack(element) ?
                                            <TrackAnalysis track={element}
                                                           averageAnalytics={getAverageAnalytics(selectedDatapoint.top_tracks)}/>
                                            :
                                            isArtist(element) ?
                                                <ArtistAnalysis user_id={pageUser.id} artist={element}
                                                                playlists={playlists} term={term}
                                                                isOwnPage={isOwnPage}/>
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