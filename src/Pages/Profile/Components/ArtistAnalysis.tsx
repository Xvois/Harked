import React, {useEffect, useState} from "react";
import {followingContentsSearch, getAlbumsWithTracks} from "@/Tools/search";
import {getLIName} from "@/Analysis/analysis";
import {Artist} from "@/API/Interfaces/artistInterfaces";
import {PlFromListWithTracks} from "@/API/Interfaces/playlistInterfaces";


export const ArtistAnalysis = (props: {
    user_id: string;
    artist: Artist;
    playlists: Array<PlFromListWithTracks>;
    term: string;
    isOwnPage: boolean;
}) => {
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
        const plTracks = playlists.map(e => e.tracks).flat(1);
        getAlbumsWithTracks(artist.id, plTracks).then(
            result => {
                setArtistsAlbumsWithLikedSongs(result);
                setOrderedAlbums(result.sort((a, b) => b.saved_songs.length - a.saved_songs.length).slice(0, 4));
                if (result.length === 0 && isOwnPage) {
                    setShowing("following")
                }
            }
        );
        if (isOwnPage) {
            followingContentsSearch(user_id, artist).then(
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