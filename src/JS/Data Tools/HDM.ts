// @ts-ignore
import {
    deleteLocalData,
    disableAutoCancel,
    enableAutoCancel,
    fetchData,
    getAllUserIDs,
    getAuthData,
    getDatapoint,
    getDelayedDatapoint,
    getFullLocalData,
    getLocalData,
    getLocalDataByID,
    getPagedLocalData,
    getUser,
    postDatapoint,
    putLocalData,
    subscribe,
    unsubscribe,
    updateLocalData,
    validDPExists
} from "../API/API.ts";
import {containsElement, getLIName} from "./Analysis";
import LRUCache from 'lru-cache';
import {Artist} from "../API/artistInterfaces";
import {hashString} from "./utils";



/**
 * Will always return the database id for either a song, artist or album.
 * The type does not need to be specified and the id may **not** always be valid
 * as it can be unresolved.
 */
export const retrieveDatabaseID = (item, type) => {
    if (type === "songs" || type === "artists") {
        return hashString(item[`${type.slice(0, type.length - 1)}_id`]);
    } else if (type === "users") {
        // Assumes a user record is being submitted, otherwise it would
        // be impossible to know what the id was
        return item.id;
    } else {
        throw new Error("Unknown type seen in retrieveDatabaseID.");
    }
}


/**
 * Creates an event in the database.
 *
 * An event is any action that another user following the target user will be notified about.
 *  The event reference number is a reference to the type of event triggered.
 *
 *  1-50 | Major events
 *
 *  1: Added recommendation
 *
 *  2: Added annotations
 *
 *  3: Added review
 *
 *  51-100 | Minor events
 *
 *  51: Removes recommendation
 *
 *  52: Follows user
 *
 *  53: Edit recommendation
 *
 *
 * @param event_ref_num
 * @param user_id
 * @param item
 * @param item_type
 */
export const createEvent = async function (event_ref_num: number, user_id: string, item: Artist | Song | Album | Playlist, item_type: "artists" | "songs" | "albums" | "users" | "playlists") {
    await disableAutoCancel();
    const user: User = await retrieveUser(user_id);
    let item_id;
    console.log(item_type)
    if (item_type === "songs" || item_type === "artists" || item_type === "users") {
        item_id = retrieveDatabaseID(item, item_type);
    } else if (item_type === "playlists") {
        item_id = item["playlist_id"];
    } else if (item_type === "albums") {
        item_id = item["album_id"];
    }
    console.log({
        event_ref_num: event_ref_num,
        user_id: user_id,
        item: item,
        item_type: item_type,
        item_id: item_id
    });
    await putLocalData("events",
        {
            owner: user.id,
            ref_num: event_ref_num,
            item: {id: item_id, type: item_type}
        }
    )
    await enableAutoCancel();
}
export const retrieveEventsForUser = async function (user_id: string, page: number = 1, eventsPerPage: number = 50) {
    const following: Array<User> = await retrieveFollowing(user_id);
    const followingMap = new Map();
    // Create a map to reference users from their db id
    following.forEach(u => followingMap.set(u.id, u));
    const conditions = following.map(u => `owner.id = "${u.id}"`);
    const filter = conditions.join(" || ");

    let events: Array<UserEvent> = await getLocalData("events", filter, '-created', page, eventsPerPage);

    // Replace the owner.id with the actual user object in the events array
    events.forEach(event => {
        if (event.owner && followingMap.has(event.owner)) {
            event.owner = followingMap.get(event.owner);
        }
    });

    await resolveItems(events);

    return events;
}




/**
 * Returns all the users currently in the database.
 * @returns {Promise<Array<User>>}
 */
export const retrieveAllUsers = async function () {
    await disableAutoCancel();
    const users = await getFullLocalData("users");
    await enableAutoCancel();
    return users;
}
/**
 * Returns all the users that have public profiles currently in the database.
 * @returns {Promise<Array<User>>}
 */
export const retrieveAllPublicUsers = async function () {
    await disableAutoCancel();
    let users: Array<User> = await getFullLocalData("users");
    const settings: Array<Settings> = await getFullLocalData("settings");
    users = users.filter(u => settings.some(s => s.user === u.id && s.public));
    await enableAutoCancel();
    return users;
}

/**
 * Returns all the profile recommendations from the target user.
 * @param user_id
 */
export const retrieveProfileRecommendations = async function (user_id: string) {
    const data = await getLocalDataByID("profile_recommendations", hashString(user_id), "recommendations");
    let recs: Array<Recommendation> = data.expand.recommendations;

    if (recs === undefined) {
        return [];
    }
    // Resolve all the items in the recommendations
    for (let i = 0; i < recs.length; i++) {
        let e = recs[i];
        if (e.item.type === "artists") {
            let artist: Artist = await getLocalDataByID("artists", e.item.id, "genres");
            artist.genres = artist.expand.genres;
            if (artist.genres !== undefined) {
                artist.genres = artist.genres.map(e => e.genre);
            }
            e.item = artist;
        } else if (e.item.type === "songs") {
            let song: Song = await getLocalDataByID("songs", e.item.id, "artists");
            song.artists = song.expand.artists;
            e.item = song;
        } else if (e.item.type === "albums") {
            let album: Album = await fetchData(`albums/${e.item.id}`);
            album = formatAlbum(album);
            e.item = album;
        } else {
            throw new Error("Unknown type fetched from profile recommendations.");
        }
    }
    return recs;
}



/**
 * Returns the results of a query of a certain type.
 * @param query
 * @param type
 * @param limit
 * @returns Promise<Array<any>>
 */
export const retrieveSearchResults = async function (query: string, type: "artists" | "songs" | "albums", limit: number = 10) {
    let typeParam;
    switch (type) {
        case 'artists':
            typeParam = 'artist';
            break;
        case 'songs':
            typeParam = 'track';
            break;
        case 'albums':
            typeParam = 'album'
            break;
        default:
            typeParam = null;
    }
    let params = new URLSearchParams([
        ["q", query],
        ["type", typeParam],
        ["limit", limit]
    ]);

    let data = await fetchData(`search?${params}`);
    let returnValue;

    if (type === 'artists') {
        data.artists = data.artists.items;
        data.artists = data.artists.map(a => formatArtist(a));
        returnValue = data.artists;
    } else if (type === 'songs') {
        data.tracks = data.tracks.items;
        data.tracks = data.tracks.map(t => formatSong(t));
        returnValue = data.tracks;
    } else {
        data = data.albums.items
        data = data.map(a => formatAlbum(a));
        console.log(data)
        returnValue = data;
    }
    return returnValue;
}

/**
 * Returns an array of public non-collaborative playlists from a given user.
 * @param user_id
 * @returns {Promise<Array<Playlist>>>}
 */
export const retrievePlaylists = async function (user_id: string) {
    // Fetch all playlists
    let playlists = (await fetchData(`users/${user_id}/playlists`)).items;
    // Filter by those that are not collaborative and are public
    playlists = playlists.filter(p => !p.collaborative && p.public);

    // Resolve all songs in each playlist
    const playlistTrackPromises = playlists.map(playlist => {
        const totalTracks = playlist.tracks.total;
        const numCalls = Math.ceil(totalTracks / 50);
        const promises = [];

        // Max of 50 songs per call, so they must be batched
        for (let i = 0; i < numCalls; i++) {
            const offset = i * 50;
            const promise: Array<Song> = fetchData(`playlists/${playlist.id}/tracks?limit=50&offset=${offset}`)
                .then(response => response.items.map(e => e.track))
                .catch(error => {
                    console.error(`Failed to retrieve tracks for playlist ${playlist.id}. Error: ${error}`);
                    return [];
                });

            promises.push(promise);
        }
        // Some tracks can be returned as null
        return Promise.all(promises).then(tracksArrays => tracksArrays.flat().filter(t => t !== null).map(t => formatSong(t)));
    });

    await Promise.all(playlistTrackPromises).then(tracksArrays => {
        tracksArrays.forEach((tracks, index) => {
            playlists[index].tracks = tracks;
        });
    });

    playlists = playlists.map(p => formatPlaylist(p));

    return playlists;
}
/**
 *
 * @param playlist_id
 * @param retrieveTracks
 * @returns Playlist
 */
export const retrievePlaylist = async function (playlist_id: string, retrieveTracks: boolean = true) {
    let playlist = await fetchData(`playlists/${playlist_id}`).catch(err => console.warn(err));

    if (!playlist) {
        return null;
    }

    if (retrieveTracks) {
        const totalTracks = playlist.tracks.total;
        const numCalls = Math.ceil(totalTracks / 50);
        const promises: Array<Array<Song>> = [];

        // Max of 50 songs per call, so they must be batched
        for (let i = 0; i < numCalls; i++) {
            const offset = i * 50;
            const promise: Array<Song> = fetchData(`playlists/${playlist.id}/tracks?limit=50&offset=${offset}`)
                .then(response => response.items.map(e => e.track))
                .catch(error => {
                    console.error(`Failed to retrieve tracks for playlist ${playlist.id}. Error: ${error}`);
                    return [];
                });

            promises.push(promise);
        }

        playlist.tracks = await Promise.all(promises).then(tracksArrays => tracksArrays.flat().filter(t => t !== null).map(t => formatSong(t)));
        const analytics = await batchAnalytics(playlist.tracks);
        playlist.tracks.map((t, i) => t.analytics = analytics[i]);
    }

    return formatPlaylist(playlist);
}

export interface PlaylistMetadata extends Record {
    playlist_id: string,
    meta: {},
}

/**
 *
 * @param playlist_id
 * @returns PlaylistMetadata
 */
export const retrievePlaylistMetadata = async function (playlist_id: string) {
    return (await getLocalData("playlist_metadata", `playlist_id="${playlist_id}"`, undefined, undefined, undefined, false))[0];
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
    if (user_id === null) {
        throw new Error("Null userID passed into addAnnotation!");
    }
    let returnValue;
    let existingMeta = await retrievePlaylistMetadata(playlist.playlist_id);
    if (existingMeta) {
        let modifiedMeta = existingMeta;
        modifiedMeta.meta[song_id] = annotation;
        await updateLocalData("playlist_metadata", modifiedMeta, existingMeta.id);
        returnValue = modifiedMeta;
    } else {
        let metaField = {};
        metaField[song_id] = annotation;
        const meta = {playlist_id: playlist.playlist_id, meta: metaField};
        returnValue = meta;
        await putLocalData("playlist_metadata", meta);
        createEvent(2, user_id, playlist, "playlists")
    }
    return returnValue;
}

export const deleteAnnotation = async function (playlist: Playlist, song_id: string) {
    let returnValue;
    let existingMeta = await retrievePlaylistMetadata(playlist.playlist_id);
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


/**
 * Returns all the users that have a matching item in their most recent datapoints.
 */
export const followingContentsSearch = async function (user_id: string, item: Artist | Song | string, type: 'artists' | 'songs' | 'genres') {
    const following: Array<User> = await retrieveFollowing(user_id);
    const dpPromises = [];
    following.forEach((user: User) => {
        dpPromises.push(retrieveAllDatapoints(user.user_id));
    })
    let dps: Array<Datapoint> = await Promise.all(dpPromises);
    dps = dps.flat().filter(d => d !== null);
    const ownerIDs = dps.filter(e => containsElement(item, e, type)).map(e => e.owner);
    return following.filter(e => ownerIDs.some((id: string) => id === e.id));
}


/**
 * @returns user_id
 */



export function getAllIndexes(arr, val) {
    let indexes = [], i;
    for (i = 0; i < arr.length; i++)
        if (arr[i] === val)
            indexes.push(i);
    return indexes;
}






/**
 * Returns the analytics for the song with a given id.
 * @param song_id
 * @returns Analytics
 */
export const retrieveSongAnalytics = async (song_id: string) => {
    const data = await fetchData(`audio-features?ids=${song_id}`)
    return data.audio_features[0];
}
/**
 * Returns an array of the analytics of the songs in the array
 * @param songs
 * @returns Array<Analytics>
 */
export const batchAnalytics = async (songs: Array<{ song_id: string }>) => {
    const songChunks = chunks(songs, 50);
    const analytics = [];
    for (const chunk of songChunks) {
        const songIDs = chunk.map(song => song.song_id).join(',');
        const result = await fetchData(`audio-features?ids=${songIDs}`);
        analytics.push(...result.audio_features);
    }
    return analytics;
};
/**
 * Returns the artist objects from an array of artist ids.
 * @param artist_ids
 * @returns Array<Artist>
 */
export const batchArtists = async (artist_ids: Array<string>) => {
    const artistChunks = chunks(artist_ids, 50);
    const artists = [];
    for (const chunk of artistChunks) {
        const ids = chunk.join(',');
        const result = (await fetchData(`artists/?ids=${ids}`)).artists;
        artists.push(...result.map(function (e) {
            return formatArtist(e);
        }));
    }
    return artists;
};



/**
 * Returns any albums from a given that contain the tracks given.
 * @param artistID
 * @param tracks
 */
export const getAlbumsWithTracks = async function (artistID: string, tracks: Array<Song>) {
    let albumsWithTracks = [];

    if (!tracks) {
        return [];
    }

    let albums: Array<Album>;

    if (albums_cache.has(artistID)) {
        console.log('[Cache] Returning cached albums.')
        albums = albums_cache.get(artistID);
    } else {
        albums = (await fetchData(`artists/${artistID}/albums`)).items;
        const albumPromises = albums.map((album) => fetchData(`albums/${album.id}/tracks`));
        const albumTracks = await Promise.all(albumPromises);
        albums.forEach((a, i) => {
            a.tracks = albumTracks[i].items;
            albums_cache.set(artistID, albums);
        });
    }

    for (let i = 0; i < albums.length; i++) {
        const album = albums[i];
        const trackList = album.tracks;
        album["saved_songs"] = trackList.filter((t1) => tracks.some(t2 => t1.id === t2.song_id));
        if (album["saved_songs"].length > 0 && !albumsWithTracks.some((item) => item["saved_songs"].length === album["saved_songs"].length && item.name === album.name)) {
            albumsWithTracks.push(formatAlbum(album));
        }
    }

    return albumsWithTracks;
}


/**
 * Returns similar artists to the artist id passed in.
 * @param id
 * @returns Array<Artist>
 */
export const getSimilarArtists = async (id: string) => {
    return (await fetchData(`artists/${id}/related-artists`)).artists.map(a => formatArtist(a));
}

/**
 * Takes in the ids of artists, genres and tracks and returns any song recommendations.
 * @param seed_artists
 * @param seed_genres
 * @param seed_tracks
 * @param limit
 * @returns Array<Song>
 */
export const getTrackRecommendations = async (seed_artists, seed_genres, seed_tracks, limit = 20) => {
    let params = new URLSearchParams([
        ["seed_artists", seed_artists],
        ["seed_genres", seed_genres],
        ["seed_tracks", seed_tracks],
        ["limit", limit]
    ]);
    return (await fetchData(`recommendations?${params}`)).tracks.map(t => formatSong(t));
}



