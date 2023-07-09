// @ts-ignore
import {
    artistsToRefIDs,
    deleteLocalData,
    disableAutoCancel,
    enableAutoCancel,
    fetchData,
    getDatapoint,
    getDelayedDatapoint,
    getFullLocalData,
    getLocalData,
    getLocalDataByID,
    getUser,
    postDatapoint,
    putLocalData,
    songsToRefIDs,
    subscribe,
    unsubscribe,
    updateLocalData,
    validDPExists
} from "./API.ts";
import {containsElement, getLIName} from "./Analysis";

// TODO: REINSTATE CACHE WITH PROPER GUARD RAILS


export interface Record {
    id: string,
    created: string,
    modified: string,
    expand?: any
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

interface Artist extends Record {
    artist_id: string,
    name: string,
    image: string,
    link: string,
    genres: Array<string> | Array<Genre>
}

export interface Song extends Record {
    song_id: string,
    title: string,
    artists: Array<Artist> | Array<string>,
    link: string,
    image: string,
    analytics: Analytics
}

export interface UserEvent extends Record {
    owner: User | string,
    ref_num: number
    item: {id: string, type: string} | Album | Artist | Song | User,
}

type Analytics = {
    acousticness: number,
    analysis_url: string,
    danceability: number,
    duration_ms: number,
    energy: number,
    id: string,
    instrumentalness: number,
    key: number,
    liveness: number,
    loudness: number,
    mode: number,
    speechiness: number,
    tempo: number,
    time_signature: number,
    track_href: string,
    type: string,
    uri: string,
    valence: number
}

interface ProfileRecommendations extends Record {
    user: User,
    recommendations: Array<Recommendation> | Array<string>
}

interface Datapoint extends Record {
    owner: User,
    top_songs: Array<Song> | Array<string>,
    top_artists: Array<Artist> | Array<string>,
    top_genres: Array<Genre> | Array<string>
}

interface Album {
    album_id: string,
    artists: string,
    name: string,
    image: string,
    link: string
}


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
 * A boolean function that returns true if the currently logged-in user follows the target and false if not.
 * @returns {Promise<*>}
 * @param primaryUserID
 * @param targetUserID
 */
export const followsUser = async function (primaryUserID: string, targetUserID: string) {
    // If both are the same we can simply return false as a user cannot follow themself.
    if (primaryUserID === targetUserID) {
        return false;
    }
    let follows = false;
    const targetUser: User = await getUser(targetUserID);
    // Get who the primary user follows
    await getLocalData("user_following", `user.user_id="${primaryUserID}"`)
        .then((res: FollowingRecord) => {
            const item = res[0];
            // Check if the record id of the target user is held in the array of
            // the primary user's following array
            if (item.following.some((e: string) => e === targetUser.id)) {
                follows = true;
            }
        });
    return follows;
}

/**
 * Will make the primary user follow the target user.
 *
 * **Has a built-in event creation side effect.**
 * @param primaryUserID
 * @param targetUserID
 */
export const followUser = async function (primaryUserID: string, targetUserID: string) {
    if (await followsUser(primaryUserID, targetUserID)) {
        return;
    }
    // Get the record for who follows who for both the primary and target user
    let [primaryObj, targetObj]: Array<FollowingRecord> = [await getLocalDataByID("user_following", hashString(primaryUserID)), await getLocalDataByID("user_following", hashString(targetUserID))];

    // Since this is a relational key, .user is simply the record id for that user
    if (!primaryObj.following.some(e => e === targetObj.user)) {
        primaryObj.following.push(targetObj.user);
        // Update the primary user's data to show they are following the target user
        await updateLocalData("user_following", primaryObj, primaryObj.id);
        getUser(targetUserID).then(targetUser => createEvent(52, primaryUserID, targetUser, "users"));
        // Update the target user's data to show they are being followed by the primary user
        await getLocalDataByID("user_followers", hashString(targetUserID)).then(res => {
            let item = res;
            item.followers.push(primaryObj.user);
            updateLocalData("user_followers", item, item.id);
        })
    }
}
/**
 * Will make the primary user unfollow the target user.
 * @param primaryUserID
 * @param targetUserID
 */
export const unfollowUser = async function (primaryUserID: string, targetUserID: string) {
    // Get the record for who follows who for both the primary and target user
    let [primaryObj, targetObj]: Array<FollowingRecord> = [await getLocalDataByID("user_following", hashString(primaryUserID)), await getLocalDataByID("user_following", hashString(targetUserID))];

    // Since this is a relational key, .user is simply the record id for tha user
    if (primaryObj.following.some(e => e === targetObj.user)) {
        primaryObj.following = primaryObj.following.filter(e => e !== targetObj.user);
        // Update the primary user's data to show they are not following the target user
        await updateLocalData("user_following", primaryObj, primaryObj.id);
        // Update the target user's data to show they are not being followed by the primary user
        await getLocalDataByID("user_followers", hashString(targetUserID)).then((res: FollowersRecord) => {
            let item = res;
            item.followers = item.followers.filter(e => e !== primaryObj.user);
            updateLocalData("user_followers", item, item.id);
        })
    }
}
/**
 * Returns the user records of the followers of the target.
 * @param user_id
 * @returns {Array<User>}
 */
export const retrieveFollowers = async function (user_id: string) {
    const res: FollowersRecord = await getLocalDataByID("user_followers", hashString(user_id), "followers");
    if (res.followers.length > 0) {
        return res.expand.followers;
    } else {
        return [];
    }
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
 * Returns the user records who the target is following.
 * @param user_id
 * @returns {Array<User>}
 */
export const retrieveFollowing = async function (user_id: string) {
    console.log('retrieveFollowing called!')
    const res: FollowingRecord = await getLocalDataByID("user_following", hashString(user_id), "following");
    if (res.following.length > 0) {
        return res.expand.following;
    } else {
        return [];
    }
}


/**
 * Returns the settings of the target user.
 * @param user_id
 * @returns {Settings}
 */
export const retrieveSettings = async function (user_id: string) {
    const id: string = hashString(user_id);
    const res: Settings = await getLocalDataByID("settings", id);
    return res;
}

/**
 * Modifies the settings of the target user.
 * @param user_id
 * @param new_settings : Settings
 */
export const changeSettings = async function (user_id: string, new_settings: Settings) {
    const id = hashString(user_id);
    await updateLocalData("settings", new_settings, id);
}

/**
 * Returns the profile data of the target user.
 * @param user_id
 * @returns ProfileData
 */
export const retrieveProfileData = async function (user_id: string) {
    const id = hashString(user_id);
    return await getLocalDataByID("profile_data", id);
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
export const submitComment = async function (user_id: string, section_id: string, content: string, parent: Comment = null) {
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
        console.log(comment)
        await putLocalData("comments", comment);

        let profileComments = await getLocalDataByID("comment_section", section_id);
        profileComments.comments.push(commentID);

        await updateLocalData("comment_section", profileComments, profileComments.id);

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
 * Creates a recommendation for the target user on their page.
 * @param user_id
 * @param item
 * @param type
 * @param description
 */
export const submitRecommendation = async function (user_id: string, item: Song | Artist | Album, type: "songs" | "artists" | "albums", description: string) {
    const id = hashString(getLIName(item) + description + user_id);
    let currRecommendations: ProfileRecommendations = await getLocalDataByID("profile_recommendations", hashString(user_id));
    if (currRecommendations.recommendations === null) {
        currRecommendations.recommendations = [];
    }
    switch (type) {
        case 'artists':
            const [artistRefID]: Array<string> = await artistsToRefIDs([item]);
            const artistItemObj = {type: type, id: artistRefID}
            const artistRecommendation = {id: id, item: artistItemObj, description: description};
            await putLocalData("recommendations", artistRecommendation);
            const newRecs_a: ProfileRecommendations = {
                ...currRecommendations,
                recommendations: currRecommendations.recommendations.concat(id)
            }
            await updateLocalData("profile_recommendations", newRecs_a, currRecommendations.id);
            break;
        case 'songs':
            const [songRefID]: Array<string> = await songsToRefIDs([item]);
            const songItemObj = {type: type, id: songRefID}
            const songRecommendation = {id: id, item: songItemObj, description: description};
            await putLocalData("recommendations", songRecommendation);
            const newRecs_s = {...currRecommendations, recommendations: currRecommendations.recommendations.concat(id)}
            await updateLocalData("profile_recommendations", newRecs_s, currRecommendations.id);
            break;
        case 'albums':
            const albumItemObj = {id: item.album_id, type: type};
            const albumRecommendation = {id: id, item: albumItemObj, description: description};
            await putLocalData("recommendations", albumRecommendation);
            const newRecs_al = {...currRecommendations, recommendations: currRecommendations.recommendations.concat(id)}
            await updateLocalData("profile_recommendations", newRecs_al, currRecommendations.id);
            break;
    }
}
/**
 * Will always return the database id for either a song, artist or album.
 * The type does not need to be specified and the id may **not** always be valid
 * as it can be unresolved.
 */
export const retrieveDatabaseID = (item, type) => {
    if(type === "songs" || type === "artists"){
        return hashString(item[`${type.slice(0, type.length-1)}_id`]);
    }else if (type === "albums") {
        return item.album_id;
    } else if (type === "users") {
        // Assumes a user record is being submitted, otherwise it would
        // be impossible to know what the id was
        return item.id;
    }else {
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
 *  51-100 | Minor events
 *
 *  51: Removes recommendation
 *
 *  52: Follows user
 *
 *
 * @param event_ref_num
 * @param user_id
 * @param item
 * @param item_type
 */
export const createEvent = async function (event_ref_num : number, user_id : string, item : Artist | Song | Album | User, item_type : "artists" | "songs" | "albums" | "users") {
    const user : User = await retrieveUser(user_id);
    console.log(item_type)
    const item_id = retrieveDatabaseID(item, item_type);
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
}
export const retrieveEventsForUser = async function (user_id : string, page : number = 1, eventsPerPage : number = 50) {
    const following : Array<User> = await retrieveFollowing(user_id);
    const followingMap = new Map();
    // Create map to reference user from their db id
    following.forEach(u => followingMap.set(u.id, u));
    const conditions = following.map(u => `owner.id = "${u.id}"`);
    const filter = conditions.join(" || ");

    // TODO : REMOVE
    //const filter = `owner.user_id = "${user_id}"`;
    //const user = await getUser(user_id);

    const events : Array<UserEvent> = await getLocalData("events", filter, '-created', page, eventsPerPage);
    for (const e of events) {
        e.owner = followingMap.get(e.owner);
        // TODO : REMOVE
        //e.owner = user;
        switch (e.item.type) {
            case "albums":
                const album = await fetchData(`albums/${e.item.id}`);
                e.item = formatAlbum(album);
                break;
            case "songs":
                e.item = await getLocalDataByID("songs", e.item.id, "artists");
                break;
            case "artists":
                e.item = await getLocalDataByID("artists", e.item.id, "genres");
                break;
            case "users":
                e.item = await getLocalDataByID("users", e.item.id);
                break;
            default:
                throw new Error(`Unknown type of item in event ${e.id}`);
        }
    }
    console.log(events)
    return events;
}


/**
 * Deletes a profile recommendation.
 * @param rec_id
 */
export const deleteRecommendation = async function (rec_id: string) {
    await deleteLocalData("recommendations", rec_id);
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
    if(calcVal > 60){
        calcVal /= 60;
        unit = 'm';
        // Hours
        if(calcVal > 60){
            calcVal /= 60;
            unit = Math.trunc(calcVal) !== 1 ? 'hrs' : 'hr';
            // Days
            if(calcVal > 24){
                calcVal /= 24;
                unit = 'd';
                // Weeks
                if(calcVal > 7){
                    calcVal /= 7;
                    unit = 'w';
                    // Months
                    if(calcVal > 30){
                        calcVal /= 30;
                        unit = 'm';
                        // Years
                        if(calcVal > 12){
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
 * @returns Artist | Song
 */
export const retrieveSearchResults = async function (query: string, type: "artists" | "songs" | "albums") {
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
        ["limit", 10]
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
 * @returns {Promise<Array>}
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

    return playlists;
}

export const retrievePlaylist = async function (playlist_id: string){
    let playlist = await fetchData(`playlists/${playlist_id}`);

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
    playlist.tracks.map((t,i) => t.analytics = analytics[i]);

    return playlist;
}


/**
 * Formats a user object from spotify in to a formatted user object.
 * @returns User
 */
export const formatUser = async function (user) {
    // Get our global user_id
    let pfp = null;
    if (user.images.length > 0) {
        console.log(user);
        pfp = user.images[0].url;
    }
    return {
        user_id: user.id,
        username: user.display_name,
        profile_picture: pfp,
        media: null,
    }
}
/**
 * Returns all the users that have a matching item for a given term.
 */
export const followingContentsSearch = async function (user_id: string, item: Artist | Song | string, type: 'artists' | 'songs' | 'genres', term: 'short_term' | 'medium_term' | 'long_term') {
    const following = await retrieveFollowing(user_id);
    const dpPromises = [];
    following.forEach((user: User) => {
        dpPromises.push(getDatapoint(user.user_id, term));
    })
    const dps = await Promise.all(dpPromises);
    const ownerIDs = dps.filter(e => containsElement(item, e, type)).map(e => e.owner);
    return following.filter(e => ownerIDs.some(id => id === e.id));
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

/**
 * Returns a valid datapoint for a given user in a given term.
 * If the function does not get a valid datapoint from the database, it will hydrate the user's datapoints
 * and return a valid one from that selection.
 * @param user_id
 * @param term [short_term, medium_term, long_term]
 * @returns {Promise<*>} A datapoint object.
 */
export const retrieveDatapoint = async function (user_id: string, term: "short_term" | "medium_term" | "long_term") {
    let timeSensitive = false;
    // Are we accessing the logged-in user?
    // [Unknowingly]
    if (isLoggedIn()) {
        const loggedUserID = await retrieveLoggedUserID();
        if (user_id === loggedUserID) {
            timeSensitive = true
        }
    }

    let currDatapoint: Datapoint = await getDatapoint(user_id, term, timeSensitive).catch(function (err) {
        console.warn("Error retrieving datapoint: ");
        console.warn(err);
    })
    if (currDatapoint === undefined && timeSensitive) {
        console.warn('Deprecated behaviour: Hydration is triggered by retrieveDatapoint method.')
        await hydrateDatapoints().then(async () =>
            currDatapoint = await getDatapoint(user_id, term, timeSensitive).catch(function (err) {
                console.warn("Error retrieving datapoint: ");
                console.warn(err);
            })
        );
    }

    currDatapoint = formatDatapoint(currDatapoint);
    return currDatapoint;
}

export const retrievePrevDatapoint = async function (user_id: string, term: "short_term" | "medium_term" | "long_term") {
    const datapoint: Datapoint = await getDelayedDatapoint(user_id, term, 1);
    if (datapoint === undefined) {
        return null
    } else {
        return formatDatapoint(datapoint);
    }
}


export const retrieveAllDatapoints = async function (user_id) {

    await disableAutoCancel();
    const validExists = await validDPExists(user_id, 'long_term');
    const terms = ['short_term', 'medium_term', 'long_term'];
    let datapoints = [];

    if(isLoggedIn()){
        const loggedUserID = await retrieveLoggedUserID();
        if(user_id === loggedUserID) {
            if(validExists) {
                for (const term of terms) {
                    const datapoint = await retrieveDatapoint(user_id, term);
                    datapoints.push(datapoint);
                }
            }else {
                datapoints = await hydrateDatapoints();
            }
        }else{
            for (const term of terms) {
                const datapoint = await retrieveDatapoint(user_id, term);
                datapoints.push(datapoint);
            }
        }
    }else{
        for (const term of terms) {
            const datapoint = await retrieveDatapoint(user_id, term);
            datapoints.push(datapoint);
        }
    }

    await enableAutoCancel();

    return datapoints;
};

export const retrievePrevAllDatapoints = async function (user_id) {

    await disableAutoCancel();
    const terms = ['short_term', 'medium_term', 'long_term'];
    const datapoints = [];

    for (const term of terms) {
        const datapoint = await retrievePrevDatapoint(user_id, term);
        datapoints.push(datapoint);
    }

    await enableAutoCancel();

    return datapoints;
};


export function getAllIndexes(arr, val) {
    let indexes = [], i;
    for (i = 0; i < arr.length; i++)
        if (arr[i] === val)
            indexes.push(i);
    return indexes;
}

const formatDatapoint = function (d: Datapoint) {
    if (d === null || d === undefined) {
        return null;
    }
    // Turn relation ids into the actual arrays / records themselves using
    // pocketbase's expand property
    d.top_artists = d.expand.top_artists;
    d.top_songs = d.expand.top_songs;
    d.top_genres = d.expand.top_genres.map(e => e.genre);
    d.top_artists.map(e => e.genres = e.expand.genres?.map(g => g.genre));
    d.top_songs.map(e => e.artists = e.expand.artists);
    d.top_songs.map(e => e.artists.map(a => a.genres = a.expand.genres?.map(g => g.genre)));
    // Delete redundant expansions
    delete d.expand;
    d.top_artists.forEach(e => delete e.expand);
    d.top_songs.forEach(e => delete e.expand);
    d.top_songs.forEach(e => e.artists.forEach(a => delete a.expand));
    return d;
};

async function retrieveFromCache(cacheName, cacheKey) {
    if ('caches' in window) {
        const cacheStorage = await caches.open(cacheName);
        const cachedResponse = await cacheStorage.match(cacheKey);

        if (cachedResponse) {
            const cachedData = await cachedResponse.json().catch(err => {
                console.error('Cache retrieval failure:', err);
                cacheStorage.delete(cacheKey);
            });
            if (cachedData) {
                return cachedData;
            }
        }
    }

    return null;
}

async function cacheData(cacheName, cacheKey, data, maxAgeInSeconds = null) {
    if ('caches' in window) {
        const cacheStorage = await caches.open(cacheName);
        const headers = new Headers();
        if (maxAgeInSeconds !== null) {
            headers.append('Cache-Control', `max-age=${maxAgeInSeconds}`);
        }
        const responseToCache = new Response(JSON.stringify(data), {
            headers,
        });
        await cacheStorage.put(cacheKey, responseToCache);
    }
}

export const retrieveLoggedUserID = async function () {
    const cacheName = 'userIDCache';
    const cacheKey = 'loggedUserID';

    // Check if the result is in the cache
    const cachedData = await retrieveFromCache(cacheName, cacheKey);
    if (cachedData) {
        return cachedData;
    }

    // If not in cache, make the API request
    const response = await fetchData('me');
    const userID = response.id;

    // Cache the result
    await cacheData(cacheName, cacheKey, userID);

    return userID;
};

export const retrieveUser = async function (user_id) {
    const cacheName = 'userDataCache';
    const cacheKey = `user_${user_id}`;

    // Check if the result is in the cache
    const cachedData = await retrieveFromCache(cacheName, cacheKey);
    if (cachedData) {
        return cachedData;
    }

    // If not in cache, make the API request
    const userData = await getUser(user_id);

    // Cache the result with max age of 10 hours
    await cacheData(cacheName, cacheKey, userData, 36000);

    return userData;
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

export const deleteUser = async (user_id : string) => {
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

export const handleCacheReset = () => {
    if ('caches' in window) {
        const cacheTypes = ['userDataCache', 'datapointsCache', 'prevDatapointsCache', 'userIDCache'];
        cacheTypes.forEach(t => {
            caches.delete(t).then(success => {
                if (success) {
                    console.log(`Cache ${t} has been cleared.`);
                } else {
                    console.log(`Cache ${t} does not exist.`);
                }
            }).catch(error => {
                console.error(`Error while clearing cache ${t}: ${error}`);
            });
        })
    } else {
        console.warn('The caches API is not supported in this browser.');
    }
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

    const albums = (await fetchData(`artists/${artistID}/albums`)).items;
    const albumPromises = albums.map((album) => fetchData(`albums/${album.id}/tracks`));
    const albumTracks = await Promise.all(albumPromises);


    for (let i = 0; i < albums.length; i++) {
        const album = albums[i];
        const trackList: Array<Song> = albumTracks[i].items;
        album["saved_songs"] = trackList.filter((t1) => tracks.some(t2 => t1.id === t2.song_id));
        if (album["saved_songs"].length > 0 && !albumsWithTracks.some((item) => item["saved_songs"].length === album["saved_songs"].length && item.name === album.name)) {
            albumsWithTracks.push(album);
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
        artist_id: artist.id,
        name: artist.name,
        image: image,
        link: `https://open.spotify.com/artist/${artist.id}`,
        genres: artist.genres
    }
}
/**
 *
 * @param album
 * @returns Album
 */
const formatAlbum = (album) => {
    let image = null;
    if (album.hasOwnProperty("images")) {
        if (album.images[1] !== undefined) {
            image = album.images[1].url
        }
    }
    const artists = album.artists.map(a => formatArtist(a));
    return {
        album_id: album.id,
        artists: artists,
        name: album.name,
        image: image,
        link: album.external_urls.spotify
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
        song_id: song.id,
        title: song.name,
        artists: artists,
        image: image,
        link: song.external_urls.spotify,}
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

/**
 * Creates a datapoint for each term for the logged-in user and posts them
 * to the database using postDatapoint
 *
 * **The hydration will optimistically return the datapoints prior to
 * posting.**
 * @returns {[short_term : Datapoint, medium_term : Datapoint, long_term : Datapoint]}
 */
export const hydrateDatapoints = async function () {
    console.time("Hydration."); // Start a timer for performance measurement
    console.time("Compilation")
    const terms = ['short_term', 'medium_term', 'long_term'];
    const loggedUserID = await retrieveLoggedUserID();
    const datapoints = [];

    for (const term of terms) {
        console.info("Hydrating: " + term);
        let datapoint = {
            user_id: loggedUserID,
            term: term,
            top_songs: [],
            top_artists: [],
            top_genres: [],
        };
        let top_songs;
        let top_artists;

        // Queue up promises for fetching top songs and top artists
        let result = await Promise.all([fetchData(`me/top/tracks?time_range=${term}&limit=50`), fetchData(`me/top/artists?time_range=${term}&limit=50`)]);
        top_songs = result[0].items;
        top_artists = result[1].items;

        // Add all the songs
        datapoint.top_songs = top_songs.map(s => formatSong(s));
        await batchAnalytics(datapoint.top_songs).then(res =>
            datapoint.top_songs.map((e, i) =>
                e.analytics = res[i]
            )
        );

        // Add all the artists
        datapoint.top_artists = top_artists.map(a => formatArtist(a));

        datapoint.top_genres = calculateTopGenres(top_artists);
        console.log(datapoint);

        datapoints.push(datapoint);
    }
    console.timeEnd("Compilation");
    console.info("Posting datapoints...");
    // Create deep copy clone to prevent optimistic return
    // resolving in to references via the API
    let postClone =  structuredClone(datapoints);
    postHydration(postClone).then(() => {
        console.info("Hydration over.");
        console.timeEnd("Hydration."); // End the timer and display the elapsed time
    });
    return datapoints;
};

const postHydration = async (datapoints) => {
    for (const datapoint of datapoints) {
        await postDatapoint(datapoint).then(() => {
            console.info(datapoint.term + " success!");
        });
    }
}
/**
 * Runs the argument callback function as a side effect of a successful
 * hydration by the argument user_id.
 * @param user_id
 * @param callback
 */
export const onHydration = async (user_id: string, callback : Function) => {
    const user = await retrieveUser(user_id);
    const func = (e) => {
        if(e.action === "create" && e.record.term === "long_term" && e.record.owner === user.id){
            console.info("Hydration event noted!");
            callback()
            destroyOnHydration();
        }
    }
    await subscribe("datapoints", "*", func);
}
/**
 * Destroys the onHydration subscription.
 *
 * **Should be called after a successful call of the
 * callback for the onHydration event.**
 */
const destroyOnHydration = async () => {
    await unsubscribe("datapoints", "*");
}

/**
 * Creates an ordered array of a users top genres based on an order list of artists.
 * @param artists
 * @returns {*[]}
 */
const calculateTopGenres = function (artists: Array<Artist>) {

    let topGenres = [];

    artists.forEach((artist, i) => {
        artist.genres.forEach((genre) => {
            const existingGenre = topGenres.find((g) => g.genre === genre);

            if (existingGenre) {
                existingGenre.weight += artists.length - i;
            } else {
                topGenres.push({genre, weight: artists.length - i});
            }
        });
    });

    topGenres.sort((a, b) => b.weight - a.weight);

    // Extract the genre names as an array of strings
    return topGenres.map((genre) => genre.genre);
};
