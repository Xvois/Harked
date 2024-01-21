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

export interface Record {
    id: string,
    created: string,
    modified: string,
    expand?: any
}

export interface Review extends Record {
    description: string,
    item: Artist | Song | Album | { id: string, type: string },
    owner: string,
    rating: number
}

export interface User extends Record {
    username: string,
    email: string,
    user_id: string,
    profile_picture: string,
}

export interface Comment extends Record {
    user: User,
    parent: Comment,
    content: string,
}

export interface FollowingRecord extends Record {
    user: User | string,
    /** Following can be an array of the user objects or of their record ids **/
    following: Array<User> | Array<string>
}

export interface FollowersRecord extends Record {
    user: User | string,
    /** Followers can be an array of the user objects or of their record ids **/
    followers: Array<User> | Array<string>
}

/**
 * Stores information pertaining to the customisation of a
 * user's profile.
 */
interface ProfileData extends Record {
    user: User | string
}

interface Settings extends Record {
    user: User | string,
    public: boolean
}

interface Recommendation extends Record {
    item: { id: string, type: "songs" | "artists" } | Artist | Song,
    description: string
}

interface Genre extends Record {
    genre: string
}

export interface Artist extends Record {
    artist_id: string,
    name: string,
    image: string,
    link: string,
    genres: Array<string> | Array<Genre>
}

export interface UserEvent extends Record {
    owner: User | string,
    ref_num: number
    item: { id: string, type: string } | Album | Artist | Song | User,
}



interface ProfileRecommendations extends Record {
    user: User,
    recommendations: Array<Recommendation> | Array<string>
}

interface Datapoint extends Record {
    owner: User | string,
    top_songs: Array<Song> | Array<string>,
    top_artists: Array<Artist> | Array<string>,
    top_genres: Array<Genre> | Array<string>
}

export interface Album {
    album_id: string,
    artists: string,
    name: string,
    tracks: Array<Song>,
    image: string,
    link: string,
    saved_songs?: Array<Song>
}





let me = undefined;

export function hashString(inputString) {
    let hash = 0n; // Use BigInt to support larger values
    if (inputString.length === 0) {
        return '0000000000000000';
    }
    for (let i = 0; i < inputString.length; i++) {
        const char = BigInt(inputString.charCodeAt(i));
        hash = ((hash << 5n) - hash) + char;
        hash &= hash; // Convert to 64-bit integer
    }
    const hex = hash.toString(16);
    return hex.padStart(15, '0').substring(0, 15);
}



/**
 * Returns whether a user exists in the database.
 * @param user_id
 * @returns boolean
 */
export const userExists = async function (user_id: string) {
    return !!(await getUser(user_id));
}





/**
 * Returns the comments from a given comment section.
 * **Special case if it is a profile comment section, the ID will be
 * the hash of the userID.**
 * @param section_id
 */
export const retrieveComments = async function (section_id: string) {
    const comment_section = await getLocalDataByID("comment_section", section_id, "comments, comments.user");
    let comments = comment_section.expand.comments ?? [];
    comments.map(c => c.user = c.expand.user);
    comments.map(c => delete c.expand);
    return comments;
}

/**
 * Submits a comment to a given comment section, then returns that comment record.
 * @param user_id
 * @param section_id
 * @param content
 * @param parent
 * @returns Comment }
 */
export const submitComment = async function (user_id: string, owner_record_id: string, section_id: string, content: string, parent: Comment = null) {
    try {
        const user: User = await retrieveUser(user_id);
        // Just a random, valid, and unique ID.
        const commentID = hashString(section_id + user_id + content);
        const comment: { user: string; parent: Comment; id: string; content: string } = {
            id: commentID,
            user: user.id,
            parent: parent,
            content: content
        };
        await putLocalData("comments", comment);

        try {
            let record = await getLocalDataByID("comment_section", section_id);
            record.comments.push(commentID);
            await updateLocalData("comment_section", record, record.id);
        } catch (error) {
            console.log(error);
            await putLocalData("comment_section", {id: section_id, owner: owner_record_id, comments: [comment.id]})
        }


        return {...comment, user: user};
    } catch (error) {
        console.error("Error submitting comment:", error);
        throw error;
    }
};

/**
 * Deletes a comment.
 * @param comment_id
 */
export const deleteComment = async function (comment_id: string) {
    await deleteLocalData("comments", comment_id);
}

/**
 * Submits a review from the target user.
 *
 * **Has built in createEvent side-effect.**
 * @param user_id
 * @param item
 * @param type
 * @param rating
 * @param description
 */
export const submitReview = async (user_id: string, item: Artist | Song | Album, type: "artists" | "songs" | "albums", rating: number, description: string) => {
    const user: User = await retrieveUser(user_id);
    const id = hashString(getLIName(item) + description + user_id);
    switch (type) {
        case 'artists':
            const artistRefID = hashString((item as Artist).artist_id);
            const artistItemObj = {type: type, id: artistRefID}
            const artistReview = {
                id: id,
                owner: user.id,
                item: artistItemObj,
                rating: rating,
                description: description
            };
            try {
                await putLocalData("reviews", artistReview).then(() => {
                    createEvent(3, user_id, item, type)
                });
                break;
            } catch (e) {
                throw new Error("Failed to submit review.", e);
            }
        case 'songs':
            const songRefID = hashString((item as Song).song_id);
            const songItemObj = {type: type, id: songRefID}
            const songReview = {id: id, owner: user.id, item: songItemObj, rating: rating, description: description};
            try {
                await putLocalData("reviews", songReview).then(() => {
                    createEvent(3, user_id, item, type)
                });
                break;
            } catch (e) {
                throw new Error("Failed to submit review.", e);
            }
        case 'albums':
            const albumItemObj = {id: item.album_id, type: type};
            const albumReview = {id: id, owner: user.id, item: albumItemObj, rating: rating, description: description};
            try {
                await putLocalData("reviews", albumReview).then(() => {
                    createEvent(3, user_id, item, type)
                });
                break;
            } catch (e) {
                throw new Error("Failed to submit review.", e);
            }
    }
}
/**
 * This function will resolve the items in an array of records with
 * item objects in them. It works directly off the object references so returns
 * nothing.
 * @param unresolvedItemRecords
 */
export const resolveItems = async (unresolvedItemRecords) => {
    const resolveAlbums = async (reviewBatch) => {
        const albumIds = reviewBatch
            .filter((e) => e.item.type === "albums")
            .map((e) => e.item.id);

        // Batch process albums if there are any to fetch
        if (albumIds.length > 0) {
            const batchSize = 20;
            for (let i = 0; i < albumIds.length; i += batchSize) {
                const batchIds = albumIds.slice(i, i + batchSize);
                const albums: Album[] = (await fetchData(`albums?ids=${batchIds.join(",")}`)).albums;
                for (const e of reviewBatch) {
                    if (e.item.type === "albums") {
                        let album = albums.find((a) => a.id === e.item.id);
                        if (album) {
                            album = formatAlbum(album);
                            e.item = album;
                        }
                    }
                }
            }
        }
    };

    for (let i = 0; i < unresolvedItemRecords.length; i++) {
        let e = unresolvedItemRecords[i];
        console.log(e.item.type)
        if (e.item.type === "artists") {
            let artist: Artist = await getLocalDataByID("artists", e.item.id, "genres");
            artist.genres = artist.expand.genres;
            if (artist.genres !== undefined) {
                artist.genres = artist.genres.map((e) => e.genre);
            }
            e.item = artist;
        } else if (e.item.type === "songs") {
            let song: Song = await getLocalDataByID("songs", e.item.id, "artists");
            song.artists = song.expand.artists;
            e.item = song;
        } else if (e.item.type === "albums") {
            // Albums will be resolved in the batch process
        } else if (e.item.type === "users") {
            let user: User = await getLocalDataByID("users", e.item.id);
            e.item = user;
        }else if (e.item.type === "playlists") {
            let playlist = await retrievePlaylist(e.item.id, false);
            e.item = playlist;
        } else {
            throw new Error("Unknown type fetched from reviews.");
        }
    }

    // Resolve albums in the end to ensure all the batches are processed
    await resolveAlbums(unresolvedItemRecords);
}

/**
 * Retrieves all reviews from a user.
 * @param user_id
 */
export const retrievePaginatedReviews = async (user_id: string, page: number, itemsPerPage: number, sort: string = "-created") => {
    let reviewsPage = await getPagedLocalData("reviews", itemsPerPage, page, `owner.user_id="${user_id}"`, sort);
    let reviews = reviewsPage.items;
    if (reviews === undefined) {
        return [];
    }

    await resolveItems(reviews);

    return reviewsPage;
};
/**
 * Returns all reviews from a user but without their items resolved.
 *
 * Is preferred in any case where the item of a review will not themselves be accessed.
 * @param user_id
 */
export const retrieveUnresolvedReviews = async (user_id: string) => {
    return (await getFullLocalData("reviews", `owner.user_id="${user_id}"`, '-created'));
}


export const retrieveReview = async (id: string) => {
    let review = await getLocalDataByID("reviews", id, "owner");
    if (review === undefined) {
        return null;
    }
    review.owner = review.expand.owner;
    if (review.item.type === "artists") {
        let artist: Artist = await getLocalDataByID("artists", review.item.id, "genres");
        artist.genres = artist.expand.genres;
        if (artist.genres !== undefined) {
            artist.genres = artist.genres.map(e => e.genre);
        }
        review.item = artist;
    } else if (review.item.type === "songs") {
        let song: Song = await getLocalDataByID("songs", review.item.id, "artists");
        song.artists = song.expand.artists;
        review.item = song;
    } else if (review.item.type === "albums") {
        let album: Album = await fetchData(`albums/${review.item.id}`);
        album = formatAlbum(album);
        review.item = album;
    } else {
        throw new Error("Unknown type fetched from review.");
    }

    return review;
}

export const deleteReview = async (id) => {
    await deleteLocalData("reviews", id);
}

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

export const milliToHighestOrder = function (milliseconds) {
    let calcVal = milliseconds / 1000;
    let unit = 's';
    // Minutes
    if (calcVal > 60) {
        calcVal /= 60;
        unit = 'm';
        // Hours
        if (calcVal > 60) {
            calcVal /= 60;
            unit = Math.trunc(calcVal) !== 1 ? 'hrs' : 'hr';
            // Days
            if (calcVal > 24) {
                calcVal /= 24;
                unit = 'd';
                // Weeks
                if (calcVal > 7) {
                    calcVal /= 7;
                    unit = 'w';
                    // Months
                    if (calcVal > 30) {
                        calcVal /= 30;
                        unit = 'm';
                        // Years
                        if (calcVal > 12) {
                            calcVal /= 12;
                            unit = Math.trunc(calcVal) !== 1 ? 'yrs' : 'yr';
                        }
                    }
                }
            }
        }
    }
    return {
        value: Math.trunc(calcVal),
        unit: unit
    }
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
 * Formats a user object from spotify in to a formatted user object.
 * @returns User
 */
export const formatUser = function (user) {
    let pfp = null;
    if (user.images?.length > 0) {
        console.log(user);
        pfp = user.images[0].url;
    }
    return {
        user_id: user.id,
        username: user.display_name,
        profile_picture: pfp,
    }
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
 * A boolean function for checking whether the session user is logged in or not.
 * @returns {boolean}
 */
export const isLoggedIn = function () {
    return !!(window.localStorage.getItem("access-token"));
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

export const retrieveLoggedUserID = async function () {
    if (!me) {
        me = await fetchData('me');
    }
    return me.id;
};
/**
 * Mapping of getUser with caching.
 * @param user_id
 * @returns User
 */
export const retrieveUser = async function (user_id: string) {
    if (user_cache.has(user_id)) {
        return user_cache.get(user_id);
    } else {
        const user = await getUser(user_id);
        user_cache.set(user_id, user);
        return user;
    }
};


function chunks(array, size) {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
    }
    return result;
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

export const deleteUser = async (user_id: string) => {
    const universal_id = hashString(user_id);
    const datapoints = await getLocalData('datapoints', `owner.user_id="${user_id}"`);
    const datapointPromises = datapoints.map(d => deleteLocalData('datapoints', d.id));
    await Promise.all(datapointPromises);
    const comments = await getLocalData('comments', `user.user_id="${user_id}"`);
    const commentPromises = comments.map(c => deleteLocalData('comments', c.id));
    await Promise.all(commentPromises);
    const connectedRecordsPromises = [
        deleteLocalData("user_followers", universal_id),
        deleteLocalData("user_following", universal_id),
        deleteLocalData("settings", universal_id),
        deleteLocalData("profile_data", universal_id),
        deleteLocalData("comment_section", universal_id),
        deleteLocalData("profile_recommendations", universal_id),
    ]
    await Promise.all(connectedRecordsPromises);
    const user = await getUser(user_id);
    await deleteLocalData('users', user.id);
}

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
 * Formats a spotify artist in to an artist object.
 * @param artist
 * @returns Artist
 */
export const formatArtist = (artist) => {
    let image = null;
    if (artist.hasOwnProperty("images")) {
        if (artist.images[1] !== undefined) {
            image = artist.images[1].url
        }
    }
    return {
        id: hashString(artist.id),
        artist_id: artist.id,
        name: artist.name,
        image: image,
        link: `https://open.spotify.com/artist/${artist.id}`,
        genres: artist.genres
    }
}
/**
 * Formats a spotify album into an album object.
 * @param album
 * @returns Album
 */
const formatAlbum = (album) => {
    let image = null;
    if (album.hasOwnProperty("images")) {
        if (album.images[1] !== undefined) {
            image = album.images[1].url;
        }
    }
    const artists = album.artists.map(a => formatArtist(a));
    return {
        album_id: album.id,
        artists: artists,
        name: album.name,
        image: image,
        link: album.external_urls.spotify,
        saved_songs: album.saved_songs,
        tracks: album.tracks
    }
}

interface Playlist {
    playlist_id: string,
    image: string,
    name: string,
    description: string,
    tracks: Array<Song>,
    link: string,
    followers: number
    owner: User
}

/**
 * Formats a spotify playlist into a playlist object.
 * @param playlist
 * @returns Playlist
 */
const formatPlaylist = (playlist) => {
    let image = null;
    if (playlist.hasOwnProperty("images")) {
        if (playlist.images[0] !== undefined) {
            image = playlist.images[0].url;
        }
    }
    let tracks: any[];
    if (playlist.hasOwnProperty("tracks")) {
        tracks = playlist.tracks;
    } else {
        tracks = undefined;
    }
    return {
        playlist_id: playlist.id,
        image: image,
        name: playlist.name,
        description: playlist.description,
        tracks: tracks,
        link: playlist.external_urls.spotify,
        followers: playlist.followers?.total,
        owner: formatUser(playlist.owner),
    }
}
/**
 * Formats a spotify song in to a song object.
 * @param song
 * @returns Song
 */
export const formatSong = (song) => {
    let image = null;
    if (song.album.images !== undefined) {
        try {
            image = song.album.images[1].url
        } catch (e) {
            console.warn("Error formatting song: Image not found for ", song);
        }
    }
    let artists: Array<Artist> = song.artists.map(a => formatArtist(a));
    return {
        id: hashString(song.id),
        song_id: song.id,
        title: song.name,
        artists: artists,
        image: image,
        link: song.external_urls.spotify,
    }
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



