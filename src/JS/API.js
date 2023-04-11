import axios from 'axios';
import PocketBase from 'pocketbase';
import {batchAnalytics, batchArtists, formatArtist, formatSong} from "./PDM";
import {authRefresh, handleLogin} from "./Authentication";

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
 * Returns all the users in the database.
 * @returns {Promise<*>} An array of user objects.
 */
export const getAllUsers = async () => {
    console.info('Get users called!');
    let users;
    await pb.collection('users').getFullList()
        .then(res => users = res)
        .catch(
            function (err) {
                console.warn("Error getting all users: ")
                console.warn(err);
            }
        );
    return users;
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
const postArtist = async (artist, cache = null) => {
    // Ensure the artist is properly formatted first
    if (!artist.hasOwnProperty("artist_id")) {
        artist = formatArtist(artist);
    }
    try {
        let res;
        res = await genresToRefIDs(artist.genres, cache);
        await pb.collection('artists').create({
            ...artist,
            genres: res
        });
    } catch (err) {
        handleCreationException(err);
    }
};

const postGenre = async (genre) => {
    await pb.collection('genres').create({genre: genre}).catch(handleCreationException);
}

const postSong = async (song, cache = null) => {
    // Ensure the song is properly formatted first
    if(!song.hasOwnProperty("song_id")){
        song = formatSong(song);
    }
    const resolvedArtists = await batchArtists(song.artists.map(e => e.id));
    await artistsToRefIDs(resolvedArtists, cache).then(async function(res){
        await pb.collection('songs').create(
            {
                ...song,
                artists: res
            }
        ).catch(handleCreationException)
    });
}
/**
 artistsToRefIDs takes an array of artist objects and returns an array of their corresponding Ref IDs in the artists collection.
 @param {Array} artists An array of artist objects.
 @param cache
 @returns {Array} An array of Ref IDs for the given artist objects.
 **/
const artistsToRefIDs = async (artists, cache = null) => {
    let ids = [];
    const storedArtists = cache?.artists;

    for (const artist of artists) {
        // Copy the artist object to avoid modifying the original input
        let formattedArtist = { ...artist };

        // Ensure the artist is properly formatted first
        if (!formattedArtist.hasOwnProperty("artist_id")) {
            formattedArtist = formatArtist(formattedArtist);
        }
        const index = storedArtists.findIndex(e => e.artist_id === formattedArtist.artist_id);
        if(index !== -1) {
            ids.push(storedArtists[index].id);
        } else {
                try {
                    await postArtist(formattedArtist, cache);
                    const res = await pb.collection('artists').getFirstListItem(`artist_id="${formattedArtist.artist_id}"`);
                    ids.push(res.id);
                } catch (postErr) {
                    handleCreationException(postErr);
                }
            }
        }
    return ids;
}

/**

 genresToRefIDs takes an array of genre strings and returns an array of their corresponding Ref IDs in the genres collection.
 @param {Array} genres An array of genre strings.
 @param cache
 @returns {Array} An array of Ref IDs for the given genre strings.
 **/
const genresToRefIDs = async (genres, cache = null) => {
    if(genres === undefined || genres === null){
        throw new Error(genres + " value inserted into genresToRefIDS.")
    }
    let ids = [];
    const storedGenres = cache?.genres;
    for (let i = 0; i < genres.length; i++) {
        const index = storedGenres.findIndex(e => e.genre === genres[i]);
        if(index !== -1) {
            ids.push(storedGenres[index].id);
        } else {
            try {
                await postGenre(genres[i]);
                const res = await pb.collection('genres').getFirstListItem(`genre="${genres[i]}"`);
                ids.push(res.id);
            } catch (err) {
                handleCreationException(err);
            }
        }
    }
    return ids;
}

/**

 songsToRefIDs takes an array of song objects and returns an array of their corresponding Ref IDs in the songs collection.
 @param {Array} songs An array of song objects.
 @param cache
 @returns {Array} An array of Ref IDs for the given song objects.
 **/
const songsToRefIDs = async (songs, cache = null) => {
    let ids = [];
    const storedSongs = cache?.songs;
    let promises = [];
    for (let song of songs) {
        // Ensure the song is properly formatted first
        if (!song.hasOwnProperty("song_id")) {
            song = formatSong(song);
        }
        const index = storedSongs.findIndex(e => e.song_id === song.song_id);
        if(index !== -1){
            ids.push(storedSongs[index].id);
        }else{
            promises.push(await postSong(song, cache)
                .then(function(){
                    pb.collection('songs').getFirstListItem(`song_id="${song.song_id}"`)
                        .then(res => ids.push(res.id));
                })
            )
        }
    }
    await Promise.all(promises);
    return ids;
}

export const postPlaylist = async (playlist) => {
    const cache = await getCache();
    // Fetch the tracks of the playlist from the Spotify API
    const res = await fetchData(`playlists/${playlist.id}/tracks`);

    // Extract the track objects from the response
    const tracks = res.items.map(e => e.track);

    // Transform the track objects into our desired format
    const transformedTracks = tracks.map(track => formatSong(track));

    let newTracks = [];
    for (const track of transformedTracks) {
        const index = cache.songs.findIndex(e => e.song_id === track.song_id);
        if(index !== -1){track.analytics = cache.songs[index].analytics}
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
    const ids = await songsToRefIDs(transformedTracks, cache);

    // Get the playlist owner's ID from our database
    const owner = await pb.collection('users').getFirstListItem(`user_id="${playlist.owner.id}"`);

    // Construct the playlist object with the extracted data
    const playlistObj = {
        playlist_id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        owner: owner.id,
        tracks: ids,
        image: playlist.images[0].url
    };

    try {
        // Check if the playlist already exists in our database
        const res = await pb.collection('playlists').getFirstListItem(`playlist_id="${playlist.id}"`);
        await pb.collection('playlists').update(res.id, playlistObj);
    } catch (err) {
        if (err.status === 404) {
            // Playlist not found, create a new one in our database
            await pb.collection('playlists').create(playlistObj);
        } else {
            console.error('Error finding/updating playlist.');
            console.error(err);
        }
    }

    console.info(`PLAYLIST: '${playlist.name}' posted!`)
};



export const postMultiplePlaylists = async (playlists) => {
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
export const getPlaylists = (user_id, expandTracks = false) => {
    return pb.collection('playlists').getList(1, 50, {
        filter: `owner.user_id="${user_id}"`,
        expand: expandTracks ? 'tracks' : ''
    }).then(response => response.items) // <--- Only return the items property
        .catch(handleFetchException);
}

const getCache = async () => {
    let p = [];
    p.push(await pb.collection('artists').getFullList());
    p.push(await pb.collection('songs').getFullList());
    p.push(await pb.collection('genres').getFullList());
    let cache = await Promise.all(p);
    return {
        artists: cache[0],
        songs: cache[1],
        genres: cache[2]
    }
}


/**
 * postDatapoint will post the datapoint to the PRDB. Checks in the database controller are made to ensure the
 * datapoint is not redundant in the database.
 * @param datapoint A datapoint object.
 * @returns {Promise<void>}
 */
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
        return;
    }
    // Convert top genres, songs, artists and the owner to their respective IDs.
    let cache = await getCache();
    console.log(cache);
    console.time('artistsToRefIDs');
    await artistsToRefIDs(datapoint.top_artists, cache).then(ids => datapoint.top_artists = ids);
    console.timeEnd('artistsToRefIDs');
    cache = await getCache();
    console.time('songsToRefIDs');
    await songsToRefIDs(datapoint.top_songs, cache).then(ids => datapoint.top_songs = ids);
    console.timeEnd('songsToRefIDs');
    cache = await getCache();
    console.time('genresToRefIDs');
    await genresToRefIDs(datapoint.top_genres, cache).then(ids => datapoint.top_genres = ids);
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


/**
 * getDatapoint makes a GET HTTP request to the PRDB to retrieve the most recent datapoint for a given user
 * in the database.
 * @param user_id A global user ID.
 * @param term [short_term, medium_term, long_term]
 * @param timeSens Whether or not the datapoint collection should be time sensitive.
 * @param delay If not time sensitive, enter the number of datapoints to skip. Default is
 * 0, and this behaviour will get the last known datapoint regardless of date.
 * @returns {Promise<*>} A datapoint object or false.
 */
export const getDatapoint = async (user_id, term, timeSens, delay = 0) => {
     return await pb.collection('datapoints').getFirstListItem(
         `owner.user_id="${user_id}"&&term="${term}"`, {
             expand: 'top_songs,top_artists,top_genres,top_artists.genres,top_songs.artists,top_songs.artists.genres'
         })
        .catch(err => {
            if(err.status === 404){
                console.info(`No datapoints for ${user_id} found.`)
            } else(console.warn(err));
        })
}