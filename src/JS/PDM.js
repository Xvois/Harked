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
    hashString,
    postDatapoint,
    putLocalData, songsToRefIDs,
    updateLocalData
} from "./API";
import {getLIName} from "./Analysis";


/**
 * Gets a user from the PRDB as well as updating the media attribute for the
 * current user, if that is the parameter.
 * @param user_id A local user_id.
 * @returns {Promise<{profilePicture: string, media: {image: string, name: string}, user_id: string, username: string}>} A user object.
 */
export const retrieveUser = async function (user_id) {
    let user = {
        user_id: '',
        username: '',
        profile_picture: '',
        media: {name: '', image: ''},
    }
    // Check if we are retrieving the current user
    if (user_id === 'me') {
        // Get the global user ID from local storage
        let globalUser_id = window.localStorage.getItem("user_id");
        user.user_id = globalUser_id;
        // Get the user's profile information from the local database
        await getUser(globalUser_id).then(result => user = result);
    } else {
        // Get the user's profile information from the local database
        await getUser(user_id).then(result => user = result);
    }
    console.log(user);
    return user;
}

/**
 * A boolean function that returns true if the currently logged-in user follows the target and false if not.
 * @returns {Promise<*>}
 * @param primaryUserID
 * @param targetUserID
 */
export const followsUser = async function (primaryUserID, targetUserID) {
    if (primaryUserID === targetUserID) {
        return false;
    }
    let follows = false;
    const targetUser = await getUser(targetUserID);
    await getLocalData("user_following", `user.user_id="${primaryUserID}"`)
        .then((res) => {
            const item = res[0];
            if (item.following.some(e => e === targetUser.id)) {
                follows = true;
            }
            console.info(`followsUser dump`,
                {
                    targetUser: targetUser,
                    res: res,
                    follows: follows
                }
                )
        });
    return follows;
}


/**
 *
 * @param primaryUserID
 * @param targetUserID
 */
export const followUser = async function (primaryUserID, targetUserID) {
    // Get the record for who follows who for both the primary and target user
    let [primaryObj, targetObj] = [await getLocalDataByID("user_following", hashString(primaryUserID)), await getLocalDataByID("user_following", hashString(targetUserID))];

    // Since this is a relational key, .user is simply the record id for tha user
    if (!primaryObj.following.some(e => e === targetObj.user)) {
        primaryObj.following.push(targetObj.user);
        // Update the primary user's data to show they are following the target user
        await updateLocalData("user_following", primaryObj, primaryObj.id);
        // Update the target user's data to show they are being followed by the primary user
        await getLocalDataByID("user_followers", hashString(targetUserID)).then((res) => {
            let item = res;
            item.followers.push(primaryObj.user);
            updateLocalData("user_followers", item, item.id);
        })
    }
}
/**
 *
 * @param primaryUserID
 * @param targetUserID
 */
export const unfollowUser = async function (primaryUserID, targetUserID) {
    // Get the record for who follows who for both the primary and target user
    let [primaryObj, targetObj] = [await getLocalDataByID("user_following", hashString(primaryUserID)), await getLocalDataByID("user_following", hashString(targetUserID))];

    // Since this is a relational key, .user is simply the record id for tha user
    if (primaryObj.following.some(e => e === targetObj.user)) {
        primaryObj.following = primaryObj.following.filter(e => e !== targetObj.user);
        // Update the primary user's data to show they are not following the target user
        await updateLocalData("user_following", primaryObj, primaryObj.id);
        // Update the target user's data to show they are not being followed by the primary user
        await getLocalDataByID("user_followers", hashString(targetUserID)).then((res) => {
            let item = res;
            item.followers = item.followers.filter(e => e !== primaryObj.user);
            updateLocalData("user_followers", item, item.id);
        })
    }
}

export const retrieveFollowers = async function (user_id) {
    const res = await getLocalDataByID("user_followers", hashString(user_id), "followers");
    if (res.followers.length > 0) {
        return res.expand.followers;
    } else {
        return [];
    }
}

export const retrieveFollowing = async function (user_id) {
    const res = await getLocalDataByID("user_following", hashString(user_id), "following");
    if (res.following.length > 0) {
        return res.expand.following;
    } else {
        return [];
    }
}

export const retrieveSettings = async function (user_id) {
    const globalUser_id = user_id === 'me' ? window.localStorage.getItem('user_id') : user_id;
    const id = hashString(globalUser_id);
    const res = await getLocalDataByID("settings", id);
    console.log(res);
    return res;
}

export const changeSettings = function (user_id, new_settings) {
    const globalUser_id = user_id === 'me' ? window.localStorage.getItem('user_id') : user_id;
    const id = hashString(globalUser_id);
    updateLocalData("settings", new_settings, id);
}

export const retrieveProfileData = async function (user_id) {
    const globalUser_id = user_id === 'me' ? window.localStorage.getItem('user_id') : user_id;
    const id = hashString(globalUser_id);
    return await getLocalDataByID("profile_data", id);
}

export const retrieveProfileComments = async function (user_id) {
    const globalUser_id = user_id === 'me' ? window.localStorage.getItem('user_id') : user_id;
    const id = hashString(globalUser_id);
    const profile_comments = await getLocalDataByID("profile_comments", id, "comments, comments.user");
    console.log(profile_comments);
    let comments = profile_comments.expand.comments ?? [];
    comments.map(c => c.user = c.expand.user);
    comments.map(c => delete c.expand);
    return comments;
}

export const submitComment = async function (user_id, target_user_id, content, parent = null){
    const user = await retrieveUser(user_id);
    target_user_id = target_user_id === 'me' ? window.localStorage.getItem('user_id') : target_user_id;
    // Just a random, valid and unique ID.
    const commentID = hashString(target_user_id + user_id + content);
    const comment = {id: commentID, user: user.id, parent: parent, content: content};
    await putLocalData("comments", comment);
    let profileComments = await getLocalDataByID("profile_comments", hashString(target_user_id));
    profileComments.comments.push(commentID);
    await updateLocalData("profile_comments", profileComments, profileComments.id);
    return {...comment, user: user};
}

export const deleteComment = async function (comment) {
    await deleteLocalData("comments", comment.id);
}

export const submitRecommendation = async function (user_id, item, type, description) {
    const globalUser_id = user_id === 'me' ? window.localStorage.getItem('user_id') : user_id;
    const id = hashString(getLIName(item) + description + globalUser_id);
    let currRecommendations = await getLocalDataByID("profile_recommendations", hashString(globalUser_id));
    if(currRecommendations.recommendations === null){
        currRecommendations.recommendations = [];
    }
    switch (type){
        case 'artists':
            const [artistRefID] = await artistsToRefIDs([item]);
            const artistItemObj = {type: type, id: artistRefID}
            const artistRecommendation = {id: id, item: artistItemObj, description: description};
            await putLocalData("recommendations", artistRecommendation);
            const newRecs_a = {...currRecommendations, recommendations: currRecommendations.recommendations.concat(id)}
            console.log(newRecs_a);
            await updateLocalData("profile_recommendations", newRecs_a, currRecommendations.id);
            break;
        case 'songs':
            const [songRefID] = await songsToRefIDs([item]);
            const songItemObj = {type: type, id: songRefID}
            const songRecommendation = {id: id, item: songItemObj, description: description};
            await putLocalData("recommendations", songRecommendation);
            const newRecs_s = {...currRecommendations, recommendations: currRecommendations.recommendations.concat(id)}
            await updateLocalData("profile_recommendations", newRecs_s, currRecommendations.id);
            break;
    }

}

export const deleteRecommendation = async function (rec_id) {
    await deleteLocalData("recommendations", rec_id);
}

/**
 * Returns all the user_ids currently in the database.
 * @returns {Promise<Array<Record>>}
 */
export const retrieveAllUsers = async function () {
    await disableAutoCancel();
    const users = await getFullLocalData("users");
    await enableAutoCancel();
    return users;
}

export const retrieveAllPublicUsers = async function () {
    await disableAutoCancel();
    let users = await getFullLocalData("users");
    const settings = await getFullLocalData("settings");
    users = users.filter(u => settings.some(s => s.user === u.id && s.public));
    await enableAutoCancel();
    return users;
}

export const retrieveProfileRecommendations = async function (user_id)  {
    const globalUser_id = user_id === 'me' ? window.localStorage.getItem('user_id') : user_id;
    const data = await getLocalDataByID("profile_recommendations", hashString(globalUser_id), "recommendations");
    let recs = data.expand.recommendations;
    if(recs === undefined){
        return [];
    }
    for (let i = 0; i < recs.length; i++){
        let e = recs[i];
        if(e.item.type === "artists"){
            e.item = await getLocalDataByID("artists", e.item.id, "genres");
            e.item.genres = e.item.expand.genres;
            if(e.item.genres !== undefined){
                e.item.genres = e.item.genres.map(e => e.genre);
            }
        }else if(e.item.type === "songs"){
            e.item = await getLocalDataByID("songs", e.item.id, "artists");
            e.item.artists = e.item.expand.artists;
        }else{
            throw new Error("Unknown type fetched from profile recommendations.");
        }
    }
    return recs;
}
// Only returns songs and artists
export const retrieveSearchResults = async function (query, type) {
    let typeParam;
    switch (type) {
        case 'artists':
            typeParam = 'artist';
            break;
        case 'songs':
            typeParam = 'track';
            break;
        case 'albums':
            typeParam = 'album';
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
export const retrievePlaylists = async function (user_id) {
    const globalUser_id = user_id === 'me' ? window.localStorage.getItem('user_id') : user_id;
    let playlists = (await fetchData(`users/${globalUser_id}/playlists`)).items;
    playlists = playlists.filter(p => !p.collaborative && p.public);

    const playlistTrackPromises = playlists.map(playlist => {
        const totalTracks = playlist.tracks.total;
        const numCalls = Math.ceil(totalTracks / 50);
        const promises = [];

        for (let i = 0; i < numCalls; i++) {
            const offset = i * 50;
            const promise = fetchData(`playlists/${playlist.id}/tracks?limit=50&offset=${offset}`)
                .then(response => response.items.map(e => e.track))
                .catch(error => {
                    console.error(`Failed to retrieve tracks for playlist ${playlist.id}. Error: ${error}`);
                    return [];
                });

            promises.push(promise);
        }

        return Promise.all(promises).then(tracksArrays => tracksArrays.flat().map(t => formatSong(t)));
    });

    await Promise.all(playlistTrackPromises).then(tracksArrays => {
        tracksArrays.forEach((tracks, index) => {
            playlists[index].tracks = tracks;
        });
    });

    return playlists;
}

/**
 * Creates / updates the logged-in user's record.
 * @returns {Promise<{user_id, profile_picture: null, media: null, username: *}>}
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
export const retrieveDatapoint = async function (user_id, term) {
    let currDatapoint;
    let timeSensitive = false;
    let globalUser_id = user_id;
    // Are we accessing the logged-in user?
    // [Unknowingly]
    if (globalUser_id === window.localStorage.getItem("user_id")) {
        timeSensitive = true
    }
    // [Knowingly]
    else if (globalUser_id === "me") {
        timeSensitive = true;
        globalUser_id = window.localStorage.getItem("user_id");
    }
    await getDatapoint(globalUser_id, term, timeSensitive).then(function (result) {
        currDatapoint = result;
    }).catch(function (err) {
        console.warn("Error retrieving datapoint: ");
        console.warn(err);
    })
    if (!currDatapoint && user_id === 'me') {
        await hydrateDatapoints().then(async () =>
            await getDatapoint(globalUser_id, term, timeSensitive).then(result =>
                currDatapoint = result
            ).catch(function (err) {
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

export const retrievePrevDatapoint = async function (user_id, term) {
    let globalUser_id = user_id;
    // Are we accessing the logged-in user?
    // [Knowingly]
    if (globalUser_id === "me") {
        globalUser_id = window.localStorage.getItem("user_id");
    }
    const datapoint = await getDelayedDatapoint(globalUser_id, term, 1);
    if (datapoint === undefined) {
        return null
    } else {
        return formatDatapoint(datapoint);
    }
}


const formatDatapoint = function (d) {
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
    const terms = ["short_term", "medium_term", "long_term"];
    const datapoints = [];
    for (const term of terms) {
        const datapoint = await retrieveDatapoint(user_id, term);
        datapoints.push(datapoint);
    }
    return datapoints;
}


export const retrievePrevAllDatapoints = async function (user_id) {
    const terms = ["short_term", "medium_term", "long_term"];
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

export const retrieveSongAnalytics = async (song_id) => {
    const data = await fetchData(`audio-features?id=${song_id}`)
    return data.audio_features;
}

export const batchAnalytics = async (songs) => {
    const songChunks = chunks(songs, 50);
    const analytics = [];
    for (const chunk of songChunks) {
        const songIDs = chunk.map(song => song.song_id).join(',');
        const result = await fetchData(`audio-features?ids=${songIDs}`);
        analytics.push(...result.audio_features);
    }
    return analytics;
};

export const batchArtists = async (artist_ids) => {
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
            return {
                artist_id: e.id,
                name: e.name,
                image: image,
                link: `https://open.spotify.com/artist/${e.id}`,
                genres: e.genres
            }
        }));
    }
    return artists;
};


export const getAlbumsWithTracks = async function (artistID, tracks) {
    let albumsWithTracks = [];

    if (!tracks) {
        return [];
    }

    const albums = (await fetchData(`artists/${artistID}/albums`)).items;
    const albumPromises = albums.map((album) => fetchData(`albums/${album.id}/tracks`));
    const albumTracks = await Promise.all(albumPromises);


    for (let i = 0; i < albums.length; i++) {
        const album = albums[i];
        const trackList = albumTracks[i].items;
        album["saved_songs"] = trackList.filter((t1) => tracks.some(t2 => t1.id === t2.song_id));
        if (album["saved_songs"].length > 0 && !albumsWithTracks.some((item) => item["saved_songs"].length === album["saved_songs"].length && item.name === album.name)) {
            albumsWithTracks.push(album);
        }
    }
    return albumsWithTracks;
}


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

export const formatSong = (song) => {
    let image = null;
    if (song.album.images !== undefined) {
        try {
            image = song.album.images[1].url
        } catch (e) {
            console.warn("Error formatting song: Image not found for ", song);
        }
    }
    let artists = song.artists.map(a => formatArtist(a));
    return {
        song_id: song.id,
        title: song.name,
        artists: artists,
        image: image,
        link: song.external_urls.spotify,
        analytics: {}
    }
}

export const getSimilarArtists = async (artist) => {
    return (await fetchData(`artists/${artist.artist_id}/related-artists`)).artists;
}

export const getTrackRecommendations = async (seed_artists, seed_genres, seed_tracks, limit = 20) => {
    let params = new URLSearchParams([
        ["seed_artists", seed_artists],
        ["seed_genres", seed_genres],
        ["seed_tracks", seed_tracks],
        ["limit", limit]
    ]);
    return (await fetchData(`recommendations?${params}`)).tracks;
}

/**
 * Creates a datapoint for each term for the logged-in user and posts them
 * to the database using postDatapoint.
 */
export const hydrateDatapoints = async function () {
    console.time("Hydration."); // Start a timer for performance measurement
    const terms = ['short_term', 'medium_term', 'long_term'];

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
            datapoint.top_songs.map((e, i) =>
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
const calculateTopGenres = function (artists) {

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
