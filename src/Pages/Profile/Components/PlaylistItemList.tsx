import React, {useEffect, useState} from "react";
import {retrievePlaylistMetadata} from "@/Tools/playlists";
import {Playlist, PlaylistFromList, PlaylistMeta, PlFromListWithTracks} from "@/API/Interfaces/playlistInterfaces";
import {createPictureSources} from "@/Tools/utils";
import {Button} from "@/Components/ui/button";
import {Separator} from "@/Components/ui/separator";
import he from "he";
import {Link} from "react-router-dom";
import {Skeleton} from "@/Components/ui/skeleton";


const PlaylistItem = function (props: { playlist: PlaylistFromList | Playlist | PlFromListWithTracks; }) {
    const {playlist} = props;

    const [playlistMetadata, setPlaylistMetadata] = useState<PlaylistMeta>(null);
    const imageSrcSet = createPictureSources(playlist.images, 0.2);

    useEffect(() => {
        if (playlist) {
            retrievePlaylistMetadata(playlist.id).then(res => setPlaylistMetadata(res));
        }
    }, [playlist])

    return (
        <div className={"relative flex flex-grow gap-4 p-4 min-w-32 border break-words"}>
            {imageSrcSet && (
                <img className={"h-32 w-32"} alt={'playlist'}
                     srcSet={imageSrcSet}></img>
            )}
            <div className={"flex-grow"}>
                <p className={"font-bold text-xl"}>{playlist.name}</p>
                <p className={"text-sm text-muted-foreground"}>{playlist.tracks.total} songs {playlistMetadata && `· ${Object.keys(playlistMetadata.meta).length} annotation${Object.keys(playlistMetadata.meta).length !== 1 ? 's' : ''}`}</p>
                <Separator/>
                <p>{he.decode(playlist.description)}</p>
                <Button asChild variant={"outline"}>
                    <Link className={"absolute right-4 bottom-4 w-fit"}
                          to={`/playlist/${playlist.id}`}>Explore</Link>
                </Button>
            </div>
        </div>
    )
}

const PlaylistItemSkeleton = function () {
    return (
        <div className={"relative flex flex-grow gap-4 p-4 min-w-32 border"}>
            <Skeleton className={"h-32 w-32"}></Skeleton>
            <div className={"flex-grow space-y-2"}>
                <Skeleton className={"h-8 w-48"}></Skeleton>
                <Skeleton className={"h-4 w-24"}></Skeleton>
                <Separator/>
                <Skeleton className={"h-4 w-48"}></Skeleton>
                <Button asChild variant={"outline"}>
                    <Skeleton className={"h-8 w-16 absolute right-4 bottom-4 "}></Skeleton>
                </Button>
            </div>
        </div>
    )
}


export function PlaylistItemList(props: { playlists: PlaylistFromList[] | Playlist[] | PlFromListWithTracks[]; }) {
    const {playlists} = props;

    const [listLength, setListLength] = useState<number>(5);

    return (
        <div className={"relative"}>
            <div className={"flex flex-row flex-wrap gap-4"}>
                {playlists ?
                    playlists.slice(0, listLength).map(p => {
                        return (
                            <PlaylistItem key={p.id} playlist={p}/>
                        )
                    })
                    :
                    Array.from(Array(5).keys()).map(i => {
                        return (
                            <PlaylistItemSkeleton key={i}/>
                        )
                    })
                }

            </div>
            {playlists ? (
                playlists.length > listLength ? (
                    <Button variant={"secondary"} className={"absolute top-100 right-0 mt-4"} onClick={() => {
                        setListLength(playlists.length)
                    }}>See more</Button>
                ) : (
                    playlists.length > 5 ? (
                        <Button variant={"secondary"} className={"absolute top-100 right-0 mt-4"} onClick={() => {
                            setListLength(5)
                        }}>See less</Button>
                    ) : <></>
                )
            ) : (
                <></>
            )}
        </div>
    )
}