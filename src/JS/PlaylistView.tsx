import React, {useEffect, useRef, useState} from "react";
import {
    addAnnotation,
    deleteAnnotation,
    isLoggedIn,
    PlaylistMetadata,
    retrieveLoggedUserID,
    retrievePlaylist,
    retrievePlaylistMetadata,
    Song
} from "./HDM.ts";
import {LoadingIndicator, PageError, StyledField} from "./SharedComponents.tsx";
import {getLIDescription, getLIName, getPlaylistAnalysis} from "./Analysis"
import "./../CSS/PlaylistView.css"
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import NoiseAwareIcon from '@mui/icons-material/NoiseAware';
import TimelineIcon from '@mui/icons-material/Timeline';
import {useParams} from "react-router-dom";

interface Playlist {
    collaborative: boolean;
    description: string;
    external_urls: {
        spotify: string;
    };
    followers: {
        href: null | string;
        total: number;
    };
    href: string;
    id: string;
    images: {
        height: null | number;
        url: string;
        width: null | number;
    }[];
    name: string;
    owner: {
        display_name: string;
        external_urls: {
            spotify: string;
        };
        href: string;
        id: string;
        type: string;
        uri: string;
    };
    primary_color: null | string;
    public: boolean;
    snapshot_id: string;
    tracks: {
        song_id: string;
        title: string;
        artists: {
            artist_id: string;
            name: string;
            image: null | string;
            link: string;
        }[];
        image: string;
        link: string;
    }[];
    type: string;
    uri: string;
}

const AnnotationViewModal = (props: {
    targetSong: Song,
    playlistMetadata: PlaylistMetadata,
    isOwnPlaylist: boolean,
    isOpen: boolean,
    setIsOpen: React.SetStateAction<boolean>,
    setIsEditorOpen: React.SetStateAction<boolean>
}) => {
    
    const {targetSong, playlistMetadata, isOwnPlaylist, isOpen, setIsOpen, setIsEditorOpen} = props;
    const [metadata, setMetadata] = useState(playlistMetadata);
    useEffect(() => {
        const modal: HTMLDialogElement = document.getElementById('annotation-viewer-modal');
        if (isOpen) {
            modal.showModal();
        } else {
            modal.close();
        }
    }, [isOpen])

    useEffect(() => {
        console.log(playlistMetadata);
        setMetadata(playlistMetadata);
    }, [playlistMetadata])

    return (
        <dialog autoFocus id={'annotation-viewer-modal'}>
            <div>
                <h3 style={{margin: 0}}>Annotation for</h3>
                <p style={{margin: 0}}>{getLIName(targetSong, 50)}</p>
            </div>
            <button className={'modal-exit-button'} onClick={() => {
                setIsOpen(false);
                const modal: HTMLDialogElement = document.getElementById('annotation-viewer-modal');
                modal.close();
            }
            }
            >x
            </button>
            {targetSong && metadata &&
                <p>{metadata.meta[targetSong.song_id]}</p>
            }
            <div id={'annotation-editor-modal-button-wrapper'}>
                {isOwnPlaylist && (
                    <button className={'subtle-button'} onClick={() => {setIsOpen(false); setIsEditorOpen(true)}}>Edit</button>
                )}
            </div>
        </dialog>
    )
}
                             

const AnnotationEditModal = (props: {
    user_id: string | null,
    playlist: Playlist,
    targetSong: Song,
    playlistMetadata: PlaylistMetadata,
    setPlaylistMetadata: React.SetStateAction<PlaylistMetadata>,
    isOpen: boolean,
    setIsOpen: React.SetStateAction<boolean>
}) => {

    const {user_id, playlist, targetSong, playlistMetadata, setPlaylistMetadata, isOpen, setIsOpen} = props;

    const annotationRef = useRef('');
    const [metadata, setMetadata] = useState(playlistMetadata);

    useEffect(() => {
        const modal: HTMLDialogElement = document.getElementById('annotation-editor-modal');
        if (isOpen) {
            modal.showModal();
        } else {
            modal.close();
        }
    }, [isOpen])

    useEffect(() => {
        setMetadata(playlistMetadata);
    }, [playlistMetadata])

    const submitAnnotation = () => {
        const modal: HTMLDialogElement = document.getElementById('annotation-editor-modal');
        addAnnotation(user_id, playlist, targetSong.song_id, annotationRef.current.value).then((returnVal) => {
            setPlaylistMetadata(returnVal);
            setIsOpen(false);
        });
    }

    const removeAnnotation = () => {
        const modal: HTMLDialogElement = document.getElementById('annotation-editor-modal');
        deleteAnnotation(playlist, targetSong.song_id).then((returnVal) => {
            setPlaylistMetadata(returnVal);
            setIsOpen(false);
        });
    }

    return (
        <dialog autoFocus id={'annotation-editor-modal'}>
            <div>
                <h3>Write an annotation.</h3>
                <p>Describe the importance of this song in this playlist.</p>
            </div>
            <button id={'modal-exit-button'} onClick={() => {
                setIsOpen(false);
                const modal: HTMLDialogElement = document.getElementById('annotation-editor-modal');
                modal.close();
            }
            }
            >x
            </button>
            <StyledField
                label={`Annotation`}
                variant='outlined'
                multiline
                inputRef={annotationRef}
                inputProps={{maxLength: 100}}
            />
            <div id={'annotation-modal-button-wrapper'}>
                {metadata?.meta[targetSong?.song_id] !== undefined && (
                    <button className={'subtle-button'} onClick={removeAnnotation}>Delete</button>
                )}
                <button style={{marginLeft: 'auto'}} className={'subtle-button'} onClick={submitAnnotation}>Submit
                </button>
            </div>
        </dialog>
    )
}


const Track = (props: {
    track: Song,
    index: number,
    isOwnPlaylist: boolean,
    annotation: string | undefined,
    setSelectedTrack: Function,
    setIsEditorOpen: Function,
    setIsViewerOpen: Function,
    windowWidth: number
}) => {

    const {track, index, isOwnPlaylist, annotation, setSelectedTrack, setIsEditorOpen, setIsViewerOpen, windowWidth} = props;

    return (
        <div className={'track-wrapper'}>
            {index % 2 === 0 && <div className={'bg-element'}/>}
            <p className={'track-number'}>{index + 1}.</p>
            <div style={{position: 'relative'}} className={'track-img-wrapper'}>
                <img className={'track-img'} src={track.image} alt={track.title}/>
            </div>
            <div className={'track-text'}>
                <h3>{getLIName(track)}</h3>
                <p>{getLIDescription(track)}</p>
            </div>
            {annotation !== undefined ?
                <div className={'annotation supplemental-content'}>
                    <p>
                        <em>
                            <span style={{color: 'var(--accent-colour)', margin: '0 2px'}}>"</span>
                            {annotation}
                            <span style={{color: 'var(--accent-colour)', margin: '0 2px'}}>"</span>
                        </em>
                    </p>
                </div>
                :
                <></>
            }
            {windowWidth > 650 ?
                isOwnPlaylist &&
                <button onClick={() => {
                    setSelectedTrack(track);
                    setIsEditorOpen(true)
                }} style={annotation !== undefined ? {animation: 'none', opacity: '0.5', right: '2.5%'} : {}}
                        className={'annotation-icon subtle-button'}>
                    {annotation === undefined ?
                        'Add annotation'
                        :
                        'Edit annotation'
                    }
                </button>
                :
                isOwnPlaylist ?
                    <button style={{animation: 'none', opacity: '0.5', right: '2.5%'}} className={'annotation-icon subtle-button'}
                            onClick={() => {
                                setSelectedTrack(track);
                                if (annotation === undefined) {
                                    setIsEditorOpen(true);
                                } else {
                                    setIsViewerOpen(true);
                                }
                            }}>
                        {annotation === undefined ?
                            '+'
                            :
                            'View'
                        }
                    </button>
                    :
                    annotation !== undefined &&
                    <button style={{animation: 'none', opacity: '0.5', right: '2.5%'}} className={'annotation-icon'} onClick={() => setIsViewerOpen(true)}>
                            View annotation
                    </button>
            }
        </div>
    )
}


const PlaylistView = () => {
    const playlist_id = (useParams()).id;

    const [loggedUserID, setLoggedUserID] = useState(null);
    const [playlist, setPlaylist] = useState(null);
    const [playlistAnalysis, setPlaylistAnalysis] = useState(null);
    const [playlistMetadata, setPlaylistMetadata] = useState(null);
    const [isOwnPlaylist, setIsOwnPlaylist] = useState(false);
    const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
    const [isViewerModalOpen, setIsViewerModalOpen] = useState(false);
    const [selectedTrack, setSelectedTrack] = useState(null);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [isError, setIsError] = useState(false);
    const [errorDetails, setErrorDetails] = useState({description: null, errCode: null});

    const updateSize = () => {
        setWindowWidth(window.innerWidth);
    }
    window.addEventListener("resize", updateSize);

    useEffect(() => {
        const fetchData = async () => {
            if(isLoggedIn()){
                const p: Playlist = await retrievePlaylist(playlist_id);
                if(!p){
                    setIsError(true);
                    setErrorDetails({description: "This playlist doesn't seem to exist.", errCode: "id_fetch_failed"});
                }else{
                    const metadata = await retrievePlaylistMetadata(playlist_id);
                    const userID = await retrieveLoggedUserID();
                    if (p.owner.user_id === userID) {
                        setIsOwnPlaylist(true);
                        console.info('Is own playlist.')
                    }
                    setLoggedUserID(userID);
                    setPlaylist(p);
                    setPlaylistAnalysis(getPlaylistAnalysis(p.tracks));
                    setPlaylistMetadata(metadata);
                }
            }else{
                setIsError(true);
                setErrorDetails({description: "You must be logged in to use Harked's playlist viewer."});
            }
        }

        fetchData();

    }, [])

    return (
        playlist === null || isError ?
            isError ?
                <PageError description={errorDetails.description} errCode={errorDetails.errCode} />
                :
                <LoadingIndicator/>
            :
            <div className={'playlist-view-wrapper'}>
                <div className={'playlist-view-header'}>
                    <div style={{position: 'relative', width: '250px', flexShrink: 0}}
                         className={'supplemental-content'}>
                        <img className={'backdrop-image'}
                             style={{width: '100%', height: '100%', aspectRatio: '1', objectFit: 'cover'}}
                             src={playlist.image}/>
                        <img className={'levitating-image'}
                             style={{width: '100%', height: '100%', aspectRatio: '1', objectFit: 'cover'}}
                             src={playlist.image}/>
                    </div>
                    <div className={'header-text'}>
                        <div className={'header-main-text'}>
                            <p>Playlist</p>
                            <h1>{playlist.name}</h1>
                            <p>{playlist.description}</p>
                            <br/>
                        </div>
                        <div className={'playlist-analysis'}>
                            <div className={'playlist-analysis-item'}>
                                <GraphicEqIcon fontSize={'medium'}/>
                                <p style={{fontWeight: 'bold'}}>Variability: </p>
                                <p>
                                    {playlistAnalysis.variability > 0.5 ?
                                        'High'
                                        :
                                        playlistAnalysis.variability > 0.25 ?
                                            'Medium'
                                            :
                                            'Low'
                                    }
                                </p>
                            </div>
                            {playlistAnalysis.vibe && (
                                <div className={'playlist-analysis-item'}>
                                    <NoiseAwareIcon fontSize={'medium'}/>
                                    <p style={{fontWeight: 'bold'}}>Vibe: </p>
                                    <p style={{textTransform: 'capitalize'}}>
                                        {playlistAnalysis.vibe}
                                    </p>
                                </div>
                            )}
                            {playlistAnalysis.trends[0] && (
                                <div className={'playlist-analysis-item'}>
                                    <TimelineIcon fontSize={'medium'}/>
                                    <p style={{fontWeight: 'bold'}}>Trend: </p>
                                    <p>
                                        {playlistAnalysis.trends[0].slope > 0 ? 'Increasingly ' : 'Decreasingly '} {playlistAnalysis.trends[0].name}
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className={'header-sub-text'}>
                            <p>
                                by <a
                                href={`/profile#${playlist.owner.user_id}`}>{playlist.owner.username}</a> · {playlist.tracks.length} songs
                                · {playlist.followers} follower{playlist.followers !== 1 && 's'}
                            </p>
                        </div>
                    </div>
                </div>
                <h2>Track list</h2>
                <div className={'playlist-view-tracks'}>
                    {playlist.tracks.map((t: Song, i: number) => {
                        let annotation = playlistMetadata?.meta[t.song_id];
                        return <Track key={t.song_id} windowWidth={windowWidth} setSelectedTrack={setSelectedTrack}
                                      track={t} index={i} isOwnPlaylist={isOwnPlaylist} annotation={annotation}
                                      setIsEditorOpen={setIsEditorModalOpen} setIsViewerOpen={setIsViewerModalOpen}/>
                    })}
                    <AnnotationEditModal user_id={loggedUserID} playlist={playlist} targetSong={selectedTrack}
                                         playlistMetadata={playlistMetadata} setPlaylistMetadata={setPlaylistMetadata}
                                         isOpen={isEditorModalOpen} setIsOpen={setIsEditorModalOpen}/>
                    <AnnotationViewModal targetSong={selectedTrack} playlistMetadata={playlistMetadata} isOwnPlaylist={isOwnPlaylist} isOpen={isViewerModalOpen} setIsOpen={setIsViewerModalOpen} setIsEditorOpen={setIsEditorModalOpen} />
                </div>
            </div>
    )
}

export default PlaylistView;