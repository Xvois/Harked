import axios from 'axios';
import PocketBase from 'pocketbase';
import {batchAnalytics, formatArtist, hashString} from "./HDM.ts";
import {reAuthenticate} from "./Authentication";

const pb = new PocketBase("https://harked.fly.dev/");
/**
 * Makes requests data from the Spotify from the
 * designated endpoint (path). The function returns an object containing the data it has received.
 * @param path
 * @param retryCount
 * @returns {Promise<any>} An object.
 */
export async function fetchData(path, retryCount = 0) {
    try {
        const { data } = await axios.get(`https://api.spotify.com/v1/${path}`, {
            headers: {
                Authorization: `Bearer ${window.localStorage.getItem('access-token')}`
            },
        });
        return data;
    } catch (err) {
        if (err.response === undefined) {
            console.warn("[Error in Spotify API call] " + err);
        } else if (err.response.status === 401) {
            reAuthenticate();
        } else if (err.response.status === 429 || err.response.status === 503) {
            if (retryCount < 3) {
                console.warn(`[Error in API call] CODE : ${err.response.status}`);
                await new Promise((resolve) => setTimeout(resolve, 3000));
                return fetchData(path, retryCount + 1);
            } else {
                console.warn(`[Error in API call] CODE : ${err.response.status}`);
                return null;
            }
        } else {
            alert(err);
        }
    }
}


/**
 * Makes a put request to the Spotify api.
 * @param path
 */
export const putData = (path) => {
    axios.put(`https://api.spotify.com/v1/${path}`, {}, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${window.localStorage.getItem("token")}`
        },
    }).catch(function (err) {
        console.warn("[Error in Spotify API put] " + err);
    })
}

export const deleteData = (path) => {
    axios.delete(`https://api.spotify.com/v1/${path}`, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${window.localStorage.getItem("token")}`
        },
    }).catch(function (err) {
        console.warn("[Error in Spotify API delete] " + err);
    })
}


/**
 * Sends a GET HTTP request to the PRDB, fetching the user associated to the global user ID
 * and returning an object in response.
 * @param user_id The user's global user ID.
 * @returns {Promise<*>} A user object.
 */
export const getUser = async (user_id) => {
    console.log('Getting: ' + user_id)
    return await pb.collection('users').getFirstListItem(`user_id="${user_id}"`)
        .catch(
            function (err) {
                console.warn("Error getting user: ");
                console.warn(err);
            }
        );
}

/**
 * Will return all the user IDs in the database.
 * @returns {Promise<Array<Record>>} An array.
 */
export const getAllUserIDs = async () => {
    return (await pb.collection('users').getFullList()).map(e => e.user_id);
}

/**
 * Will update / create a record in the PRDB for a user.
 * @param user A user object.
 * @returns {Promise<void>}
 */
export const postUser = async (user) => {
    //console.info("User " + user.username + " posted.");
    user["id"] = hashString(user.user_id);
    await pb.collection('users').create(user).catch(
        function (err) {
            console.warn("Error posting user: ")
            console.warn(err);
        }
    )
}

const handleCreationException = (err) => {
    switch (err.status) {
        case 400:
            console.warn(`Error making an entry in the database, likely a unique constraint failure.`, err);
            break;
        default:
            console.error(`Error ${err.status} creating database record.`)
            console.error(err);
    }
}
const handleUpdateException = (err) => {
    switch (err.status) {
        default:
            console.error(`Error ${err.status} updating database record.`, err)
            console.error(err.data);
    }
}

const handleFetchException = (err) => {
    switch (err.status) {
        default:
            console.error(`Error ${err.status} fetching database record.`, err)
            console.error(err.data);
            break;
    }
}


let databaseCache = {
    artists: [],
    songs: [],
    genres: []
};
// TODO: This could become very expensive with time
const updateDatabaseCache = async () => {
    let p = [];
    p.push(await pb.collection('artists').getFullList());
    p.push(await pb.collection('songs').getFullList());
    p.push(await pb.collection('genres').getFullList());
    let cache = await Promise.all(p);
    databaseCache = {
        artists: cache[0],
        songs: cache[1],
        genres: cache[2]
    }
}
const updateDatabaseCacheWithItems = (items) => {
    if (items.hasOwnProperty("artists")) {
        databaseCache.artists = databaseCache.artists.concat(items.artists);
    }
    if (items.hasOwnProperty("songs")) {
        databaseCache.songs = databaseCache.songs.concat(items.songs);
    }
    if (items.hasOwnProperty("genres")) {
        databaseCache.genres = databaseCache.genres.concat(items.genres);
    }
}


const postSong = async (song) => {
    if (!song.song_id || !song.id) {
        throw new Error("Song must have a database ID and be formatted before posting!");
    }

    if (databaseCache.songs.some(s => s.id === song.id)) {
        console.info('Song attempting to be posted already cached.');
        return;
    }

    if(!song.hasOwnProperty('analytics') || Object.keys(song.analytics).length === 0){
        console.info('Resolving analytics for song attempting to be posted.');
        await batchAnalytics([song]).then(res =>
            song.analytics = res[0]
        );
    }

    let artists = song.artists;
    const unresolvedArtists = song.artists.filter(a1 => !databaseCache.artists.some(a2 => a1.artist_id === a2.artist_id));
    const cachedArtists = databaseCache.artists.filter(a => artists.some(e => e.artist_id === a.artist_id));
    if (unresolvedArtists.length > 0) {
        artists = cachedArtists.concat(await resolveNewArtists(unresolvedArtists));
    }

    song.artists = await artistsToRefIDs(artists);
    await pb.collection('songs').create(song).catch(handleCreationException);
    updateDatabaseCacheWithItems({songs: [song]});
}

async function resolveNewArtists(newArtists) {
    const artistPromises = newArtists.map(async (e) => {
        const artistData = await fetchData(`artists/${e.artist_id}`);
        return formatArtist(artistData);
    });
    return Promise.all(artistPromises);
}

const postArtist = async (artist) => {
    if (artist.hasOwnProperty("artist_id") && !artist.hasOwnProperty("id")) {
        throw new Error("Artist must have database id before posting!");
    } else if (!artist.hasOwnProperty("artist_id") && artist.hasOwnProperty("id")) {
        throw new Error("Artist must be formatted before posting!");
    }
    artist.genres = await genresToRefIDs(artist.genres);
    await pb.collection('artists').create(artist).catch(handleCreationException);
    updateDatabaseCacheWithItems({artists: [artist]});
}
// TODO: MAKE UPDATE METHODS FOR ARTISTS


const postGenre = async (genre) => {
    if (!genre.hasOwnProperty("id")) {
        throw new Error("Genre must have database id before posting!");
    }
    await pb.collection('genres').create(genre).catch(handleCreationException);
    updateDatabaseCacheWithItems({genres: [genre]});
}


export const artistsToRefIDs = async (artists) => {
    if (databaseCache.artists.length === 0) {
        await updateDatabaseCache();
    }
    let ids = [];
    const artistIDs = artists.map(e => e.artist_id);
    const newArtistIDs = artistIDs.filter(id => !databaseCache.artists.some(a => a.artist_id === id));

    for (let i = 0; i < artists.length; i++) {
        let artist = artists[i];
        artist.id = hashString(artist.artist_id);
        ids.push(artist.id);
        if (newArtistIDs.includes(artist.artist_id)) {
            await postArtist(artist);
        }
    }
    return ids;
}


export const genresToRefIDs = async (genres) => {
    if (databaseCache.genres.length === 0) {
        await updateDatabaseCache();
    }
    let ids = [];
    // Genres are added as an array of strings, but stored in cache as having their string and id
    const newGenres = genres.filter(g1 => !databaseCache.genres.some(g2 => g2.genre === g1));

    for (let i = 0; i < genres.length; i++) {
        let genre = genres[i];
        const id = hashString(genre);
        ids.push(id);
        if (newGenres.includes(genre)) {
            await postGenre({
                id: id,
                genre: genre
            });
        }
    }
    return ids;
}
export const songsToRefIDs = async (songs) => {
    if (databaseCache.songs.length === 0) {
        await updateDatabaseCache();
    }
    const existingSongIDs = new Set(databaseCache.songs.map((song) => song.song_id));
    const ids = [];

    for (let i = 0; i < songs.length; i++) {
        const song = songs[i];
        const {song_id} = song;
        const id = hashString(song_id);
        song.id = id;
        ids.push(id);

        if (!existingSongIDs.has(song_id)) {
            await postSong(song);
        }
    }

    return ids;
};

export const validDPExists = async (user_id, term) => {
    // Calculate the date of a week ago.
    const d = new Date();
    const WEEK_IN_MILLISECONDS = 6.048e+8;
    d.setMilliseconds(d.getMilliseconds() - WEEK_IN_MILLISECONDS);

    return await pb.collection('datapoints').getFirstListItem(`created >= "${d.toISOString()}" && term="${term}" && owner.user_id = "${user_id}"`)
        .catch(function (err) {
            if (err.status !== 404) {
                console.warn(err);
            }
        });
}


export const postDatapoint = async (datapoint) => {
    // Disable auto-cancellation to avoid the script being canceled during async operations.
    pb.autoCancellation(false);
    console.info('Posting datapoint.')

    const valid_exists = await validDPExists(datapoint.user_id, datapoint.term);
    // If a valid datapoint already exists, log a message and return without creating a new datapoint.
    if (!!valid_exists) {
        console.info("Attempted to post new datapoint, but valid already exists.");
        console.info(valid_exists)
        return;
    }

    await updateDatabaseCache();

    // Convert top genres, songs, artists and the owner to their respective IDs.
    console.time('artistsToRefIDs');
    await artistsToRefIDs(datapoint.top_artists).then(ids => datapoint.top_artists = ids);
    console.timeEnd('artistsToRefIDs');
    console.time('songsToRefIDs');
    await songsToRefIDs(datapoint.top_songs).then(ids => datapoint.top_songs = ids);
    console.timeEnd('songsToRefIDs');
    console.time('genresToRefIDs');
    await genresToRefIDs(datapoint.top_genres).then(ids => datapoint.top_genres = ids);
    console.timeEnd('genresToRefIDs');
    console.time('resolveOwner');
    console.log(datapoint.user_id)
    await pb.collection('users').getFirstListItem(`user_id="${datapoint.user_id}"`).then(user => datapoint.owner = user.id);
    console.timeEnd('resolveOwner');

    // Log the datapoint being posted.
    console.log(datapoint);

    await pb.collection('datapoints').create(datapoint).catch(handleCreationException)

    // Re-enable auto-cancellation.
    pb.autoCancellation(true);
}

export const disableAutoCancel = async () => {
    await pb.autoCancellation(false);
}

export const enableAutoCancel = async () => {
    await pb.autoCancellation(true);
}

export const deleteLocalData = async (collection, id) => {
    await pb.collection(collection).delete(id);
}

export const getLocalData = async (collection, filter) => {
    return (await pb.collection(collection).getList(1, 50, {filter: filter}).catch(handleFetchException)).items;
}

export const getLocalDataByID = async (collection, id, expand = '') => {
    return await pb.collection(collection).getOne(id, {expand: expand}).catch(handleFetchException);
}

export const putLocalData = async (collection, data) => {
    await pb.collection(collection).create(data).catch(handleCreationException);
}

export const updateLocalData = async (collection, data, id) => {
    await pb.collection(collection).update(id, data).catch(handleUpdateException);
}

export const getFullLocalData = async (collection, filter = '') => {
    return await pb.collection(collection).getFullList(filter).catch(handleFetchException);
}


export const getDelayedDatapoint = async (user_id, term, delay) => {
    const dps = await pb.collection("datapoints").getFullList({
        expand: 'top_songs,top_artists,top_genres,top_artists.genres,top_songs.artists,top_songs.artists.genres',
        filter: `owner.user_id="${user_id}"&&term="${term}"`,
        sort: '-created'
    }).catch(handleFetchException);
    return dps[delay];
}


/**
 *
 * @param user_id A global user ID.
 * @param term [short_term, medium_term, long_term]
 * @param timeSens Whether or not the datapoint collection should be time sensitive.
 * @returns {Promise<*>} A datapoint object or false.
 */
export const getDatapoint = async (user_id, term, timeSens) => {
    const WEEK_IN_MILLISECONDS = 6.048e+8;
    // Calculate the start boundary time.
    const d1 = new Date();
    d1.setMilliseconds(d1.getMilliseconds() - WEEK_IN_MILLISECONDS);
    // Calculate the end boundary time.
    const d2 = new Date();
    d2.setMilliseconds(d2.getMilliseconds());

    let filter;
    if (timeSens) {
        filter = `owner.user_id="${user_id}"&&term="${term}"&&created>="${d1.toISOString()}"&&created<="${d2.toISOString()}"`;
    } else {
        filter = `owner.user_id="${user_id}"&&term="${term}"`;
    }


    return await pb.collection('datapoints').getFirstListItem(
        filter, {
            expand: 'top_songs,top_artists,top_genres,top_artists.genres,top_songs.artists,top_songs.artists.genres',
            sort: '-created'
        })
        .catch(err => {
            if (err.status === 404) {
                console.info(`No datapoints for ${user_id} found for within the last week.`)
            } else (console.warn(err));
        })
}