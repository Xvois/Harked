import axios from 'axios';
import PocketBase from 'pocketbase';
import {batchAnalytics, formatArtist, formatSong} from "./PDM";
import {handleLogin} from "./Authentication";

const pb = new PocketBase(process.env.REACT_APP_PB_ROUTE);
/**
 * Makes requests data from the Spotify from the
 * designated endpoint (path). The function returns an object containing the data it has received.
 * @param path
 * @returns {Promise<any>} An object.
 */
export const fetchData = async (path) => {
    //console.log("External API call made to: " + path)
    const {data} = await axios.get(`https://api.spotify.com/v1/${path}`, {
        headers: {
            Authorization: `Bearer ${window.localStorage.getItem("access-token")}`
        },
    }).catch(function (err) {
        if (err.response === undefined) {
            console.warn("[Error in Spotify API call] " + err);
        }
        else if (err.response.status === 401) {
            handleLogin(); //TODO : FIX THIS - SHOULD USE authRefresh BUT THAT DOES NOT WORK
        } else if (err.response.status === 429) {
            alert("Too many API calls made! Take a deep breath and refresh the page.")
        } else if (err.response.status === 503) {
            console.warn("[Error in API call] Server is temporarily unavailable, retrying in 3 seconds...");
            return new Promise((resolve) => setTimeout(resolve, 3000));
        } else {
            alert(err);
        }
    })
    return data;
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
    switch (err.status){
        case 400:
            console.warn(`Error making an entry in the database, likely a unique constraint failure.`);
            break;
        default:
            console.error(`Error ${err.status} creating database record.`)
            console.error(err.data);
    }
}
const handleUpdateException = (err) => {
    switch (err.status){
        default:
            console.error(`Error ${err.status} updating database record.`)
            console.error(err.data);
    }
}

const handleFetchException = (err) => {
    switch (err.status){
        default:
            console.error(`Error ${err.status} fetching database record.`)
            console.error(err.data);
            break;
    }
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

export const postPlaylist = async (playlist) => {
    // Fetch the tracks of the playlist from the Spotify API
    const res = await fetchData(`playlists/${playlist.id}/tracks`);

    // Extract the track objects from the response
    const tracks = res.items.map(e => e.track);

    // Transform the track objects into our desired format
    const transformedTracks = tracks.map(track => formatSong(track));

    let newTracks = [];
    for (const track of transformedTracks) {
        const index = databaseCache.songs.findIndex(e => e.song_id === track.song_id);
        if(index !== -1){track.analytics = databaseCache.songs[index].analytics}
        else{
            // Track not found, add to newTracks array
            newTracks.push(track);
            // Remove the track from the transformedTracks array
            transformedTracks.slice(transformedTracks.findIndex(t => t.song_id === track.song_id), 1);
        }
    }

    // Add audio feature analytics to all songs
    const analytics = await batchAnalytics(newTracks);
    newTracks.forEach((track, i) => track.analytics = analytics[i]);
    transformedTracks.push(...newTracks);

    // Convert the transformed tracks into an array of IDs
    const trackIds = await songsToRefIDs(transformedTracks);

    // Get the playlist owner's ID from our database
    const owner = await pb.collection('users').getFirstListItem(`user_id="${playlist.owner.id}"`);

    const playlistId = hashString(playlist.id);

    // Construct the playlist object with the extracted data
    const playlistObj = {
        id: playlistId,
        playlist_id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        owner: owner.id,
        tracks: trackIds,
        image: playlist.images[0].url
    };

    try {
        // Check if the playlist already exists in our database
        await pb.collection('playlists').update(playlistId, playlistObj);
    } catch (err) {
        if (err.status === 404) {
            // Playlist not found, create a new one in our database
            await pb.collection('playlists').create(playlistObj).catch(handleCreationException);
        } else {
            console.error('Error finding/updating playlist.');
            console.error(err);
        }
    }

    console.info(`PLAYLIST: '${playlist.name}' posted!`)
};



export const postMultiplePlaylists = async (playlists) => {
    await updateDatabaseCache();
    for (const playlist of playlists) {
        await postPlaylist(playlist);
    }
};

/**
 * Retrieves all playlists for a given user from the local PocketBase database.
 * @param user_id The ID of the user to retrieve playlists for.
 * @param expandTracks
 * @returns {Promise<Array>} An array of playlist objects.
 */
export const getPlaylists = async (user_id, expandTracks = false) => {
    return await pb.collection('playlists').getFullList({
        filter: `owner.user_id="${user_id}"`,
        expand: expandTracks ? 'tracks' : ''
    }).catch(handleFetchException);
}

let databaseCache = {
    artists: [],
    songs: [],
    genres: []
};

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
    if(items.hasOwnProperty("artists")){databaseCache.artists = databaseCache.artists.concat(items.artists);}
    if(items.hasOwnProperty("songs")){databaseCache.songs = databaseCache.songs.concat(items.songs);}
    if(items.hasOwnProperty("genres")){databaseCache.genres = databaseCache.genres.concat(items.genres);}
}


const postSong = async (song) => {
    if(!song.song_id || !song.id) {
        throw new Error("Song must have a database ID and be formatted before posting!");
    }

    if(databaseCache.songs.some(s => s.id === song.id)) {
        console.info('Song attempting to be posted already cached.');
        return;
    }

    let artists = song.artists;
    const unresolvedArtists = song.artists.filter(a1 => !databaseCache.artists.some(a2 => a1.artist_id === a2.artist_id));
    const cachedArtists = databaseCache.artists.filter(a => artists.some(e => e.artist_id === a.artist_id));
    if(unresolvedArtists.length > 0){ artists = cachedArtists.concat(await resolveNewArtists(unresolvedArtists)); }

    song.artists = await artistsToRefIDs(artists);
    await pb.collection('songs').create(song);
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
    if(artist.hasOwnProperty("artist_id") && !artist.hasOwnProperty("id")){
        throw new Error("Artist must have database id before posting!");
    }
    else if(!artist.hasOwnProperty("artist_id") && artist.hasOwnProperty("id")){
        throw new Error("Artist must be formatted before posting!");
    }
    artist.genres = await genresToRefIDs(artist.genres);
    await pb.collection('artists').create(artist);
    updateDatabaseCacheWithItems({artists: [artist]});
}

const postGenre = async (genre) => {
    if(!genre.hasOwnProperty("id")){
        throw new Error("Genre must have database id before posting!");
    }
    await pb.collection('genres').create(genre);
    updateDatabaseCacheWithItems({genres: [genre]});
}



// Artists must be formatted
const artistsToRefIDs = async (artists) => {
    let ids = [];
    const artistIDs = artists.map(e => e.artist_id);
    const newArtistIDs = artistIDs.filter(id => !databaseCache.artists.some(a => a.artist_id === id));

    for(let i = 0; i < artists.length; i++){
        let artist = artists[i];
        artist.id = hashString(artist.artist_id);
        ids.push(artist.id);
        if(newArtistIDs.includes(artist.artist_id)){
            await postArtist(artist);
        }
    }
    return ids;
}

const genresToRefIDs = async (genres) => {
    let ids = [];
    // Genres are added as an array of strings, but stored in cache as having their string and id
    const newGenres = genres.filter(g1 => !databaseCache.genres.some(g2 => g2.genre === g1));

    for(let i = 0; i < genres.length; i++){
        let genre = genres[i];
        const id = hashString(genre);
        ids.push(id);
        if(newGenres.includes(genre)){
            await postGenre({
                id: id,
                genre: genre
            });
        }
    }
    return ids;
}

const songsToRefIDs = async (songs) => {
    let ids = [];
    const songIDs = songs.map(e => e.song_id);
    const newSongIDs = songIDs.filter(id => !databaseCache.songs.some(a => a.song_id === id));

    for(let i = 0; i < songs.length; i++){
        let song = songs[i];
        song.id = hashString(song.song_id);
        ids.push(song.id);
        if(newSongIDs.includes(song.song_id)){
            await postSong(song);
        }
    }
    return ids;
}


export const postDatapoint = async (datapoint) => {
    // Disable auto-cancellation to avoid the script being canceled during async operations.
    pb.autoCancellation(false);
    console.info('Posting datapoint.')

    // Calculate the date of a week ago.
    const d = new Date();
    const WEEK_IN_MILLISECONDS = 6.048e+8;
    d.setMilliseconds(d.getMilliseconds() - WEEK_IN_MILLISECONDS);

    // Check if a valid datapoint already exists in the database for the given term and within the past week.
    const valid_exists = await pb.collection('datapoints').getFirstListItem(`created >= "${d.toISOString()}" && term="${datapoint.term}"`)
        .catch(function (err) {
            if (err.status !== 404) {
                console.warn(err);
            }
        })

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

export const getLocalData = async (collection, filter) => {
    return (await pb.collection(collection).getList(1, 50, filter).catch(handleFetchException)).items;
}

export const getLocalDataByID = async (collection, id, expand = '') => {
    return await pb.collection(collection).getOne(id, {expand: expand}).catch(handleFetchException);
}

export const putLocalData = (collection, data) => {
    pb.collection(collection).create(data).catch(handleCreationException);
}

export const updateLocalData = (collection, data, id) => {
    pb.collection(collection).update(id, data).catch(handleUpdateException);
}

export const getFullLocalData = async (collection, filter = '') => {
    return await pb.collection(collection).getFullList(filter);
}


export const getDelayedDatapoint = async (user_id, term, delay) => {
    const dps = await pb.collection("datapoints").getFullList({
        filter: `owner.user_id="${user_id}"&&term="${term}"`,
        sort: '-created'
    });
    return dps[delay];
}


/**
 * getDatapoint makes a GET HTTP request to the PRDB to retrieve the most recent datapoint for a given user
 * in the database.
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
    if(timeSens){
        filter = `owner.user_id="${user_id}"&&term="${term}"&&created>="${d1.toISOString()}"&&created<="${d2.toISOString()}"`;
    }else{
        filter = `owner.user_id="${user_id}"&&term="${term}"`;
    }


    return await pb.collection('datapoints').getFirstListItem(
         filter, {
             expand: 'top_songs,top_artists,top_genres,top_artists.genres,top_songs.artists,top_songs.artists.genres',
            sort: '-created'
         })
        .catch(err => {
            if(err.status === 404){
                console.info(`No datapoints for ${user_id} found for within the last week.`)
            } else(console.warn(err));
        })
}