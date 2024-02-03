import {fetchSpotifyData} from "@/API/spotify";
import {
    Playlist,
    PlaylistFromList,
    PlaylistMeta,
    PlFromListWithTracks,
    PlItem,
    PlTrack
} from "@/API/Interfaces/playlistInterfaces";
import {SpotifyList} from "@/API/Interfaces/spotifyResponseInterface";
import {deleteLocalData, getLocalData, putLocalData, updateLocalData} from "@/API/pocketbase";
import {createEvent} from "./events";


/**
 * Returns an array of public non-collaborative playlists from a given user.
 * @param user_id
 * @returns {Promise<Array<PlFromListWithTracks>>}
 */
export const retrievePlaylists = async function (user_id: string): Promise<Array<PlFromListWithTracks>> {
    let formattedPlaylists: PlFromListWithTracks[] = [];
    // Fetch all playlists
    let playlists = (await fetchSpotifyData<SpotifyList<PlaylistFromList>>(`users/${user_id}/playlists`)).items;

    // Filter by those that are not collaborative and are public
    playlists = playlists.filter(p => !p.collaborative && p.public);

    // Resolve all songs in each playlist
    const playlistTrackPromises = playlists.map(playlist => {
        const totalTracks = playlist.tracks.total;
        const numCalls = Math.ceil(totalTracks / 50);
        const promises: Array<Promise<PlTrack[]>> = [];

        // Max of 50 songs per call, so they must be batched
        for (let i = 0; i < numCalls; i++) {
            const offset = i * 50;
            const promise = fetchSpotifyData<SpotifyList<PlItem>>(`playlists/${playlist.id}/tracks?limit=50&offset=${offset}`)
                .then(response => response.items.map(e => e.track))
                .catch(error => {
                    console.error(`Failed to retrieve tracks for playlist ${playlist.id}. Error: ${error}`);
                    return [] as PlTrack[];
                });

            promises.push(promise);
        }
        // Some tracks can be returned as null
        return Promise.all(promises).then(tracksArrays => tracksArrays.flat().filter(t => t !== null));
    });

    await Promise.all(playlistTrackPromises).then(tracksArrays => {
        tracksArrays.forEach((tracks, index) => {
            formattedPlaylists[index] = {...playlists[index], tracks: tracks};
        });
    });

    return formattedPlaylists;
}
/**
 *
 * @param playlist_id
 * @returns Promise<Playlist>
 */
export const retrievePlaylist = function (playlist_id: string) {
    return fetchSpotifyData<Playlist>(`playlists/${playlist_id}`);

}
/**
 *
 * @param playlist_id
 * @returns PlaylistMetadata
 */
export const retrievePlaylistMetadata = async function (playlist_id: string) {
    return (await getLocalData<PlaylistMeta>("playlist_metadata", `playlist_id="${playlist_id}"`, undefined, undefined, undefined, false))[0];
}


/**
 * Adds an annotation to an item in a playlist.
 *
 * **Has build in createEvent side-effect.**
 * @param user_id
 * @param playlist
 * @param song_id
 * @param annotation
 */
export const addAnnotation = async function (user_id: string, playlist: Playlist, song_id: string, annotation: string) {
    let returnValue;
    let existingMeta = await retrievePlaylistMetadata(playlist.id);
    if (existingMeta) {
        let modifiedMeta = existingMeta;
        modifiedMeta.meta[song_id] = annotation;
        await updateLocalData("playlist_metadata", modifiedMeta, existingMeta.id);
        returnValue = modifiedMeta;
    } else {
        let metaField = {};
        metaField[song_id] = annotation;
        const meta = {playlist_id: playlist.id, meta: metaField};
        returnValue = meta;
        await putLocalData("playlist_metadata", meta);
        createEvent(2, user_id, {id: playlist.id, type: "playlist"})
    }
    return returnValue;
}

export const deleteAnnotation = async function (playlist: Playlist, song_id: string) {
    let returnValue;
    let existingMeta = await retrievePlaylistMetadata(playlist.id);
    if (existingMeta) {
        if (Object.keys(existingMeta.meta).length <= 1) {
            await deleteLocalData("playlist_metadata", existingMeta.id);
            returnValue = undefined;
        } else {
            let modifiedMeta = existingMeta;
            delete modifiedMeta.meta[song_id];
            await updateLocalData("playlist_metadata", modifiedMeta, existingMeta.id);
            returnValue = modifiedMeta;
        }
    }
    return returnValue;
}