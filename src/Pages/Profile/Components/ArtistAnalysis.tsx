import React, {useEffect, useState} from "react";
import {getAlbumsContainingTracks} from "@/Tools/search";
import {getLIName} from "@/Analysis/analysis";
import {Artist} from "@/API/Interfaces/artistInterfaces";
import {PlFromListWithTracks} from "@/API/Interfaces/playlistInterfaces";
import {Album} from "@/API/Interfaces/albumInterfaces";
import {Separator} from "@/Components/ui/separator";
import {Skeleton} from "@/Components/ui/skeleton";


export const ArtistAnalysis = (props: {
    user_id: string;
    artist: Artist;
    playlists: Array<PlFromListWithTracks>;
    term: string;
    isOwnPage: boolean;
}) => {
    const {user_id, artist, playlists, term, isOwnPage} = props;

    const [artistsAlbumsWithLikedSongs, setArtistsAlbumsWithLikedSongs] = useState<Album[]>(null);


    useEffect(() => {
        const plTracks = playlists.map(e => e.tracks.items).flat(1);
        getAlbumsContainingTracks(artist.id, plTracks).then(
            result => {
                setArtistsAlbumsWithLikedSongs(result);
            }
        );
    }, [playlists])

    return (
        <div>
            <h3 className={"text-xl font-bold"}>Most listened to albums</h3>
            <p className={"text-sm text-muted-foreground"}>Ordered by number of songs included in public
                playlists.</p>
            <Separator className={'my-4'}/>
            {artistsAlbumsWithLikedSongs !== null ?
                (artistsAlbumsWithLikedSongs.length > 0 ?
                        artistsAlbumsWithLikedSongs.map((a, i) => {
                            return (
                                <div key={getLIName(a)}>
                                    <a className={"inline-flex gap-4"} href={a.uri}>
                                        <img src={a.images[0].url} alt={a.name} className={"h-16 w-16"}/>
                                        <p className={"font-bold"}>{getLIName(a)}</p>
                                    </a>
                                </div>
                            )
                        })
                        :
                        <div>
                            <div>
                                <p className={"text-muted-foreground"}>No public playlists with this artist found on
                                    this
                                    profile.</p>
                            </div>
                        </div>
                )
                :
                <>
                    <Skeleton className={"h-16 w-16"}/>
                    <Skeleton className={"h-16 w-16"}/>
                    <Skeleton className={"h-16 w-16"}/>
                </>
            }
        </div>
    )
}