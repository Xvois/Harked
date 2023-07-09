import React, {useEffect, useState} from "react";
import {retrieveLoggedUserID, retrievePlaylist, Song} from "./HDM.ts";
import {LoadingIndicator} from "./SharedComponents.tsx";
import {getLIDescription, getPlaylistAnalysis} from "./Analysis"
import "./../CSS/PlaylistView.css"
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CommentIcon from '@mui/icons-material/Comment';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import NoiseAwareIcon from '@mui/icons-material/NoiseAware';
import TimelineIcon from '@mui/icons-material/Timeline';

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


const Track = (props : {track : Song, index : number, isOwnPlaylist : boolean}) => {

    const {track, index, isOwnPlaylist} = props

    return (
        <div className={'track-wrapper'}>
            {index % 2 === 0 && <div className={'bg-element'}/>}
            <p className={'track-number'}>{index + 1}.</p>
            <div style={{position: 'relative'}} className={'track-img-wrapper'}>
                <div className={'play-overlay'}>
                    <div style={{position: 'absolute', width: '75px', height: '75px', background: 'var(--secondary-colour)', opacity: '0.75', zIndex: '0'}} />
                    <div className={'centre'} style={{zIndex: '1'}}>
                        <PlayArrowIcon fontSize={'large'} />
                    </div>
                </div>
                <img className={'track-img'} src={track.image} alt={track.title} />
            </div>
            <div className={'track-text'}>
                <h3>{track.title}</h3>
                <p>{getLIDescription(track)}</p>
            </div>
            {isOwnPlaylist && (
                <div className={'annotation-icon'}>
                    <CommentIcon fontSize={'medium'} />
                </div>
            )}

        </div>
    )
}


const PlaylistView = () => {
    const playlist_id = window.location.hash.split("#")[1];

    const [playlist, setPlaylist] = useState(null);
    const [playlistAnalysis, setPlaylistAnalysis] = useState(null);
    const [isOwnPlaylist, setIsOwnPlaylist] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const p : Playlist = await retrievePlaylist(playlist_id);
            const userID = await retrieveLoggedUserID();
            if(p.owner.id === userID){
                setIsOwnPlaylist(true);
                console.info('Is own playlist.')
            }
            console.log(p)
            setPlaylist(p);
            setPlaylistAnalysis(getPlaylistAnalysis(p.tracks));
        }

        fetchData();

    }, [])

    return (
        playlist === null ?
            <LoadingIndicator />
            :
            <div className={'playlist-view-wrapper'}>
                <div className={'playlist-view-header'}>
                    <div style={{position: 'relative', width: '250px', flexShrink: 0}} className={'supplemental-content'}>
                        <img className={'backdrop-image'} style={{width: '100%', height: '100%', aspectRatio: '1', objectFit: 'cover'}} src={playlist.images[0].url} />
                        <img className={'levitating-image'} style={{width: '100%', height: '100%', aspectRatio: '1', objectFit: 'cover'}} src={playlist.images[0].url} />
                    </div>
                    <div className={'header-text'}>
                        <div className={'header-main-text'}>
                            <p>Playlist</p>
                            <h1>{playlist.name}</h1>
                            <p>{playlist.description}</p>
                            <br />
                        </div>
                        <div className={'playlist-analysis'}>
                            <div className={'playlist-analysis-item'}>
                                <GraphicEqIcon fontSize={'medium'} />
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
                            {playlistAnalysis.notableAnalytics && (
                                <div className={'playlist-analysis-item'}>
                                    <NoiseAwareIcon fontSize={'medium'} />
                                    <p style={{fontWeight: 'bold'}}>Vibe: </p>
                                    <p style={{textTransform: 'capitalize'}}>
                                        {playlistAnalysis.notableAnalytics}
                                    </p>
                                </div>
                            )}
                            {playlistAnalysis.trends[0] && (
                                <div className={'playlist-analysis-item'}>
                                    <TimelineIcon fontSize={'medium'} />
                                    <p style={{fontWeight: 'bold'}}>Trend: </p>
                                    <p>
                                        {playlistAnalysis.trends[0].slope > 0 ? 'Increasingly ' : 'Decreasingly '} {playlistAnalysis.trends[0].name}
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className={'header-sub-text'}>
                            <p>
                                by <a href={`/profile#${playlist.owner.id}`}>{playlist.owner.display_name}</a> · {playlist.tracks.length} songs · {playlist.followers.total} followers
                            </p>
                        </div>
                    </div>
                </div>
                <h2>Track list</h2>
                <div className={'playlist-view-tracks'}>
                    {playlist.tracks.map((t : Song, i : number) => {
                        return <Track track={t} index={i} isOwnPlaylist={isOwnPlaylist} />
                    })}
                </div>
            </div>
    )
}

export default PlaylistView;