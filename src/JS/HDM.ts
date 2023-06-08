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
    putLocalData, songsToRefIDs,
    updateLocalData
} from "./API.ts";
import {getLIName} from "./Analysis";


export interface Record {
    id : string,
    created : string,
    modified : string,
    expand? : any
}

export interface User extends Record {
    username: string,
    email: string,
    user_id: string,
    profile_picture: string,
}

export interface Comment extends Record {
    user : User,
    parent : Comment,
    content : string,
}
export interface FollowingRecord extends Record {
    user : User | string,
    /** Following can be an array of the user objects or of their record ids **/
    following : Array<User> | Array<string>
}
export interface FollowersRecord extends Record {
    user : User | string,
    /** Followers can be an array of the user objects or of their record ids **/
    followers : Array<User> | Array<string>
}
/**
 * Stores information pertaining to the customisation of a
 * user's profile.
 */
interface ProfileData extends Record {
    user : User | string
}
interface Settings extends Record {
    user : User | string,
    public : boolean
}

interface Recommendation extends Record {
    item : {id : string, type: "songs" | "artists"} | Artist | Song,
    description : string
}

interface Genre extends Record {
    genre : string
}

interface Artist extends Record {
    artist_id : string,
    name : string,
    image : string,
    link : string,
    genres : Array<string> | Array<Genre>
}

interface Song extends Record {
    song_id : string,
    title : string,
    artists : Array<Artist> | Array<string>,
    link : string,
    image : string,
    analytics : Analytics
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
    user : User,
    recommendations : Array<Recommendation> | Array<string>
}

interface Datapoint extends Record {
    owner: User,
    top_songs: Array<Song> | Array<string>,
    top_artists: Array<Artist> | Array<string>,
    top_genres: Array<Genre> | Array<string>
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
 * A mapping of the getUser method.
 */
export const retrieveUser = getUser;

/**
 * A boolean function that returns true if the currently logged-in user follows the target and false if not.
 * @returns {Promise<*>}
 * @param primaryUserID
 * @param targetUserID
 */
export const followsUser = async function (primaryUserID : string, targetUserID : string) {
    // If both are the same we can simply return false as a user cannot follow themself.
    if (primaryUserID === targetUserID) {
        return false;
    }
    let follows = false;
    const targetUser : User = await getUser(targetUserID);
    // Get who the primary user follows
    await getLocalData("user_following", `user.user_id="${primaryUserID}"`)
        .then((res : FollowingRecord) => {
            const item = res[0];
            // Check if the record id of the target user is held in the array of
            // the primary user's following array
            if (item.following.some((e : string) => e === targetUser.id)) {
                follows = true;
            }
        });
    return follows;
}

/**
 * Will make the primary user follow the target user.
 * @param primaryUserID
 * @param targetUserID
 */
export const followUser = async function (primaryUserID : string, targetUserID : string) {
    if(await followsUser(primaryUserID, targetUserID)){
        return;
    }
    // Get the record for who follows who for both the primary and target user
    let [primaryObj , targetObj] : Array<FollowingRecord> = [await getLocalDataByID("user_following", hashString(primaryUserID)), await getLocalDataByID("user_following", hashString(targetUserID))];

    // Since this is a relational key, .user is simply the record id for that user
    if (!primaryObj.following.some(e => e === targetObj.user)) {
        primaryObj.following.push(targetObj.user);
        // Update the primary user's data to show they are following the target user
        await updateLocalData("user_following", primaryObj, primaryObj.id);
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
export const unfollowUser = async function (primaryUserID : string, targetUserID : string) {
    // Get the record for who follows who for both the primary and target user
    let [primaryObj, targetObj] : Array<FollowingRecord> = [await getLocalDataByID("user_following", hashString(primaryUserID)), await getLocalDataByID("user_following", hashString(targetUserID))];

    // Since this is a relational key, .user is simply the record id for tha user
    if (primaryObj.following.some(e => e === targetObj.user)) {
        primaryObj.following = primaryObj.following.filter(e => e !== targetObj.user);
        // Update the primary user's data to show they are not following the target user
        await updateLocalData("user_following", primaryObj, primaryObj.id);
        // Update the target user's data to show they are not being followed by the primary user
        await getLocalDataByID("user_followers", hashString(targetUserID)).then((res : FollowersRecord) => {
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
export const retrieveFollowers = async function (user_id : string) {
    const res : FollowersRecord = await getLocalDataByID("user_followers", hashString(user_id), "followers");
    if (res.followers.length > 0) {
        return res.expand.followers;
    } else {
        return [];
    }
}

/**
 * Returns the user records who the target is following.
 * @param user_id
 * @returns {Array<User>}
 */
export const retrieveFollowing = async function (user_id : string) {
    const res : FollowingRecord = await getLocalDataByID("user_following", hashString(user_id), "following");
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
export const retrieveSettings = async function (user_id : string) {
    const id : string = hashString(user_id);
    const res : Settings = await getLocalDataByID("settings", id);
    return res;
}

/**
 * Modifies the settings of the target user.
 * @param user_id
 * @param new_settings : Settings
 */
export const changeSettings = async function (user_id : string, new_settings : Settings) {
    const id = hashString(user_id);
    await updateLocalData("settings", new_settings, id);
}

/**
 * Returns the profile data of the target user.
 * @param user_id
 * @returns ProfileData
 */
export const retrieveProfileData = async function (user_id : string) {
    const id = hashString(user_id);
    return await getLocalDataByID("profile_data", id);
}
/**
 * Returns the comments from a given comment section.
 * **Special case if it is a profile comment section, the ID will be
 * the hash of the userID.**
 * @param section_id
 */
export const retrieveComments = async function (section_id : string) {
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
export const submitComment = async function (user_id : string, section_id : string, content : string, parent : Comment = null) {
    try {
        const user : User = await retrieveUser(user_id);
        // Just a random, valid, and unique ID.
        const commentID = hashString(section_id + user_id + content);
        const date = new Date();
        const comment : { user: string; parent: Comment; id: string; content: string } = { id: commentID, user: user.id, parent: parent, content: content };
        console.log(comment)
        await putLocalData("comments", comment);

        let profileComments = await getLocalDataByID("comment_section", section_id);
        profileComments.comments.push(commentID);

        await updateLocalData("comment_section", profileComments, profileComments.id);

        return { ...comment, user: user };
    } catch (error) {
        console.error("Error submitting comment:", error);
        throw error;
    }
};

/**
 * Deletes a comment.
 * @param comment_id
 */
export const deleteComment = async function (comment_id : string) {
    await deleteLocalData("comments", comment_id);
}
/**
 * Creates a recommendation for the target user on their page.
 * @param user_id
 * @param item
 * @param type
 * @param description
 */
export const submitRecommendation = async function (user_id : string, item : Song | Artist, type : "songs" | "artists", description : string) {
    const id = hashString(getLIName(item) + description + user_id);
    let currRecommendations : ProfileRecommendations = await getLocalDataByID("profile_recommendations", hashString(user_id));
    if(currRecommendations.recommendations === null){
        currRecommendations.recommendations = [];
    }
    switch (type){
        case 'artists':
            const [artistRefID] : Array<string> = await artistsToRefIDs([item]);
            const artistItemObj = {type: type, id: artistRefID}
            const artistRecommendation = {id: id, item: artistItemObj, description: description};
            await putLocalData("recommendations", artistRecommendation);
            const newRecs_a : ProfileRecommendations = {...currRecommendations, recommendations: currRecommendations.recommendations.concat(id)}
            await updateLocalData("profile_recommendations", newRecs_a, currRecommendations.id);
            break;
        case 'songs':
            const [songRefID] : Array<string> = await songsToRefIDs([item]);
            const songItemObj = {type: type, id: songRefID}
            const songRecommendation = {id: id, item: songItemObj, description: description};
            await putLocalData("recommendations", songRecommendation);
            const newRecs_s = {...currRecommendations, recommendations: currRecommendations.recommendations.concat(id)}
            await updateLocalData("profile_recommendations", newRecs_s, currRecommendations.id);
            break;
    }

}
/**
 * Deletes a profile recommendation.
 * @param rec_id
 */
export const deleteRecommendation = async function (rec_id : string) {
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
    let users : Array<User> = await getFullLocalData("users");
    const settings : Array<Settings> = await getFullLocalData("settings");
    users = users.filter(u => settings.some(s => s.user === u.id && s.public));
    await enableAutoCancel();
    return users;
}

/**
 * Returns all the profile recommendations from the target user.
 * @param user_id
 */
export const retrieveProfileRecommendations = async function (user_id : string)  {
    const data = await getLocalDataByID("profile_recommendations", hashString(user_id), "recommendations");
    let recs : Array<Recommendation> = data.expand.recommendations;
    if(recs === undefined){
        return [];
    }
    // Resolve all the items in the recommendations
    for (let i = 0; i < recs.length; i++){
        let e = recs[i];
        if(e.item.type === "artists"){
            let artist : Artist = await getLocalDataByID("artists", e.item.id, "genres");
            artist.genres = artist.expand.genres;
            if(artist.genres !== undefined){
                artist.genres = artist.genres.map(e  => e.genre);
            }
            e.item = artist;
        }else if(e.item.type === "songs"){
            let song : Song = await getLocalDataByID("songs", e.item.id, "artists");
            song.artists = song.expand.artists;
            e.item = song;
        }else{
            throw new Error("Unknown type fetched from profile recommendations.");
        }
    }
    return recs;
}
/**
 * Returns the results of a query of a certain type.
 * @param query
 * @param type
 * @returns Artist | Song
 */
export const retrieveSearchResults = async function (query : string, type : "artists" | "songs") {
    let typeParam;
    switch (type) {
        case 'artists':
            typeParam = 'artist';
            break;
        case 'songs':
            typeParam = 'track';
            break;
        default:
            typeParam = null;
    }
    let params = new URLSearchParams([
        ["q", query],
        ["type", typeParam],
        ["limit", 5]
    ]);

    let data = await fetchData(`search?${params}`);

    if(type === 'artists'){
        data.artists = data.artists.items;
        data.artists = data.artists.map(a => formatArtist(a));
    }else if(type === 'songs'){
        data.tracks = data.tracks.items;
        data.tracks = data.tracks.map(t => formatSong(t));
    }else {
        console.warn('No type identified for', data);
    }
    return data;
}

/**
 * Returns an array of public non-collaborative playlists from a given user.
 * @param user_id
 * @returns {Promise<Array>}
 */
export const retrievePlaylists = async function (user_id : string) {
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
            const promise : Array<Song> = fetchData(`playlists/${playlist.id}/tracks?limit=50&offset=${offset}`)
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
 * A boolean function for checking whether the session user is logged in or not.
 * @returns {boolean}
 */
export const isLoggedIn = function () {
    return !!(window.localStorage.getItem("user_id") && window.localStorage.getItem("access-token"));
}

/**
 * Returns a valid datapoint for a given user in a given term.
 * If the function does not get a valid datapoint from the database, it will hydrate the user's datapoints
 * and return a valid one from that selection.
 * @param user_id
 * @param term [short_term, medium_term, long_term]
 * @returns {Promise<*>} A datapoint object.
 */
export const retrieveDatapoint = async function (user_id : string, term : "short_term" | "medium_term" | "long_term") {
    let timeSensitive = false;
    // Are we accessing the logged-in user?
    // [Unknowingly]
    if (user_id === window.localStorage.getItem("user_id")) {
        timeSensitive = true
    }
    let currDatapoint : Datapoint = await getDatapoint(user_id, term, timeSensitive).catch(function (err) {
        console.warn("Error retrieving datapoint: ");
        console.warn(err);
    })
    if (!currDatapoint && timeSensitive) {
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

export function getAllIndexes(arr, val) {
    let indexes = [], i;
    for(i = 0; i < arr.length; i++)
        if (arr[i] === val)
            indexes.push(i);
    return indexes;
}

export const retrievePrevDatapoint = async function (user_id : string, term : "short_term" | "medium_term" | "long_term") {
    const datapoint : Datapoint = await getDelayedDatapoint(user_id, term, 1);
    if (datapoint === undefined) {
        return null
    } else {
        return formatDatapoint(datapoint);
    }
}


const formatDatapoint = function (d : Datapoint) {
    if(d === null || d === undefined){
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
}

export const retrieveAllDatapoints = async function (user_id) {
    const terms : Array<"short_term" | "medium_term" | "long_term">  = ["short_term", "medium_term", "long_term"];
    const datapoints = [];
    for (const term of terms) {
        const datapoint = await retrieveDatapoint(user_id, term);
        datapoints.push(datapoint);
    }
    return datapoints;
}


export const retrievePrevAllDatapoints = async function (user_id) {
    const terms : Array<"short_term" | "medium_term" | "long_term"> = ["short_term", "medium_term", "long_term"];
    const datapoints = [];
    for (const term of terms) {
        const datapoint = await retrievePrevDatapoint(user_id, term);
        datapoints.push(datapoint);
    }
    return datapoints;
}

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
export const retrieveSongAnalytics = async (song_id : string) => {
    const data = await fetchData(`audio-features?id=${song_id}`)
    return data.audio_features;
}
/**
 * Returns an array of the analytics of the songs in the array
 * @param songs
 * @returns Array<Analytics>
 */
export const batchAnalytics = async (songs : Array<{song_id : string}>) => {
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
export const batchArtists = async (artist_ids : Array<string>) => {
    const artistChunks = chunks(artist_ids, 50);
    const artists = [];
    for (const chunk of artistChunks) {
        const ids = chunk.join(',');
        const result = (await fetchData(`artists/?ids=${ids}`)).artists;
        artists.push(...result.map(function (e) {
            let image = null;
            if (e.images.length > 0) {
                image = e.images[1].url
            }
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
export const getAlbumsWithTracks = async function (artistID : string, tracks : Array<Song>) {
    let albumsWithTracks = [];

    if (!tracks) {
        return [];
    }

    const albums = (await fetchData(`artists/${artistID}/albums`)).items;
    const albumPromises = albums.map((album) => fetchData(`albums/${album.id}/tracks`));
    const albumTracks = await Promise.all(albumPromises);


    for (let i = 0; i < albums.length; i++) {
        const album = albums[i];
        const trackList : Array<Song> = albumTracks[i].items;
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
    let artists : Array<Artist> = song.artists.map(a => formatArtist(a));
    return {
        song_id: song.id,
        title: song.name,
        artists: artists,
        image: image,
        link: song.external_urls.spotify,
        analytics: {}
    }
}
/**
 * Returns similar artists to the artist id passed in.
 * @param id
 * @returns Array<Artist>
 */
export const getSimilarArtists = async (id : string) => {
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
 * to the database using postDatapoint.
 */
export const hydrateDatapoints = async function () {
    console.time("Hydration."); // Start a timer for performance measurement
    const terms : Array<"short_term" | "medium_term" | "long_term"> = ['short_term', 'medium_term', 'long_term'];

    const datapointPromises = terms.map(async (term) => {
        console.info("Hydrating: " + term);
        let datapoint = {
            user_id: window.localStorage.getItem("user_id"),
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
            datapoint.top_songs.map((e: Song, i) =>
                e.analytics = res[i]
            )
        );

        // Add all the artists
        datapoint.top_artists = top_artists.map(a => formatArtist(a));

        datapoint.top_genres = calculateTopGenres(top_artists);
        console.log(datapoint);

        return datapoint;
    });

    const datapoints = await Promise.all(datapointPromises);

    console.info("Posting datapoints...");
    for (let i = 0; i < datapoints.length; i++) {
        const datapoint = datapoints[i];
        await postDatapoint(datapoint).then(function () {
            console.info(datapoint.term + " success!");
        });
    }

    console.info("Hydration over.");
    console.timeEnd("Hydration."); // End the timer and display the elapsed time
}


/**
 * Creates an ordered array of a users top genres based on an order list of artists.
 * @param artists
 * @returns {*[]}
 */
const calculateTopGenres = function (artists : Array<Artist>) {

    let topGenres = [];

    artists.forEach((artist, i) => {
        artist.genres.forEach((genre) => {
            const existingGenre = topGenres.find((g) => g.genre === genre);

            if (existingGenre) {
                existingGenre.weight += artists.length - i;
            } else {
                topGenres.push({ genre, weight: artists.length - i });
            }
        });
    });

    topGenres.sort((a, b) => b.weight - a.weight);

    // Extract the genre names as an array of strings
    return topGenres.map((genre) => genre.genre);
};
