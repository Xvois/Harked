import {fetchSpotifyData} from "@/API/spotify";
import {SpotifyList} from "@/API/Interfaces/spotifyResponseInterface";
import {Artist} from "@/API/Interfaces/artistInterfaces";
import {SpotifySearch} from "@/Tools/Interfaces/searchInterfaces";
import {retrieveAllDatapoints} from "@/Tools/datapoints";
import {containsElement} from "../Analysis/analysis";
import {Track} from "@/API/Interfaces/trackInterfaces";
import {Album} from "@/API/Interfaces/albumInterfaces";
import {albums_cache} from "@/Tools/cache";
import {PlTrack} from "@/API/Interfaces/playlistInterfaces";
import {debounceAsync} from "@/Tools/utils";

/**
 * Returns the results of a query of a certain type.
 * @param query
 * @param type
 * @param limit
 * @returns Promise<Array<any>>
 */
export const retrieveSearchResults = async function (query: string, type: "artist" | "track" | "album", limit: number = 10) {
    let params = new URLSearchParams([
        ["q", query],
        ["type", type],
        ["limit", limit.toString()]
    ]);

    let search = await fetchSpotifyData<SpotifySearch>(`search?${params}`);

    switch (type) {
        case "artist":
            return search.artists.items;
        case "track":
            return search.tracks.items;
        case "album":
            return search.albums.items;
    }
}

export const debouncedSearchResults = debounceAsync(retrieveSearchResults, 250);


/**
 * Returns all the users that have a matching item in their most recent datapoints.
 */
export const followingContentsSearch = async function (user_id: string, item: Artist | Track | string) {
    const following = null;
    const dpPromises = [];
    following.forEach((user) => {
        dpPromises.push(retrieveAllDatapoints(user.user_id));
    })
    let dps = await Promise.all(dpPromises);
    dps = dps.flat().filter(d => d !== null);
    const ownerIDs = dps.filter(e => containsElement(item, e)).map(e => e.owner);
    return following.filter(e => ownerIDs.some((id: string) => id === e.id));
}

/**
 * Returns any albums from a given that contain the tracks given.
 * @param artistID
 * @param tracks
 */
export const getAlbumsContainingTracks = async function (artistID: string, tracks: Track[] | PlTrack[]) {
    let albumsContainingTracks: Album[] = [];

    if (!tracks) {
        return [];
    }

    let albums: Array<Album>;
    const trackMap: Map<string, Track[]> = new Map();

    if (albums_cache.has(artistID)) {
        console.log('[Cache] Returning cached albums.')
        albums = albums_cache.get(artistID);
    } else {
        albums = (await fetchSpotifyData<SpotifyList<Album>>(`artists/${artistID}/albums`)).items;
        albums_cache.set(artistID, albums);
    }

    const albumPromises = albums.map((album) => fetchSpotifyData<SpotifyList<Track>>(`albums/${album.id}/tracks`));
    const albumTracks = await Promise.all(albumPromises);
    albumTracks.forEach((t, i) => trackMap.set(albums[i].id, t.items));

    albumsContainingTracks = albums.filter(album => {
        const albumTrackIds = trackMap.get(album.id).map(track => track.id);
        return tracks.some(track => albumTrackIds.includes(track.id));
    });
    return albumsContainingTracks;
}