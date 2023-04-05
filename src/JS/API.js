import axios from 'axios';
import {authURI} from './Authentication';
import PocketBase from 'pocketbase';
import {batchAnalytics} from "./PDM";

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
            Authorization: `Bearer ${window.localStorage.getItem("token")}`
        },
    }).catch(function (err) {
        if (err.response === undefined) {
            console.warn("[Error in Spotify API call] " + err);
        }
        if (err.response.status === 401) {
            window.localStorage.setItem("token", "");
            window.location.replace(authURI)
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

export const deleteUser = (userID) => {
    axios.put(`https://photon-database.tk/PRDB/delete?userID=${userID}`).catch(
        function (err) {
            console.warn(err)
        }
    )
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

// noinspection JSUnusedGlobalSymbols
/**
 * @deprecated
 * Makes a get request to the PRDB at the given endpoint and output the response.
 * @param path The endpoint.
 */
export const fetchLocalData = async (path) => {
    console.info("Local API call made to " + path);
    const {data} = await axios.get(`https://photon-database.tk/PRDB/${path}`).catch(
        function (err) {
            console.warn(err)
        }
    )
    console.log(data)
}


/**
 * Sends a GET HTTP request to the PRDB, fetching the user associated to the global user ID
 * and returning an object in response.
 * @param userID The user's global user ID.
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
 * Returns all the users in the PRDB.
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
 * @returns {Promise<void>} An array.
 */
export const getAllUserIDs = async () => {
    let user_ids;
    await axios.get(`https://photon-database.tk/PRDB/getIDs`).then(
        function (result) {
            console.log(result.data);
            user_ids = result.data;
        }
    ).catch(
        function (err) {
            console.warn("Error getting all user_ids: ")
            console.warn(err);
        }
    )
    return user_ids;
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
async function artistsToIDs(artists) {
    let artist_db_ids = [];
    for (const artist of artists) {
        await pb.collection('artists').getFirstListItem(`artist_id="${artist.artist_id}"`).then(res => artist_db_ids.push(res.id))
            .catch(async function (err){
                switch (err.status){
                    case 404:
                        if (!!artist.genres) {
                            await genresToIDs(artist.genres).then(ids => artist.genres = ids);
                        } else {
                            artist.genres = null;
                        }
                        await pb.collection('artists').create(artist)
                            .catch(handleCreationException);
                        // Turn the name of the genre into its id in the database
                        await pb.collection('artists').getFirstListItem(`artist_id="${artist.artist_id}"`).then(res => artist_db_ids.push(res.id));
                        break;
                    default:
                        console.error("Error finding artist.");
                        console.error(err);
                        break;
                }
            })
    }
    return artist_db_ids;
}

async function songsToIDs(songs) {
    let song_db_ids = [];
    for (const song of songs) {
        // Check if the song already exists
        await pb.collection('songs').getFirstListItem(`song_id="${song.song_id}"`).then(res => song_db_ids.push(res.id))
            .catch(async function(err){
                switch (err.status){
                    case 404:
                        for (let i = 0; i < song.artists.length; i++) {
                            // Check that each artist is in the correct format
                            // If not then get the information and format again
                            if(!song.artists[i].hasOwnProperty('artist_id')){
                                await fetchData(`artists/${song.artists[i].id}`)
                                    .then(function (res) {
                                        song.artists[i] = {
                                            artist_id: res.id,
                                            name: res.name,
                                            image: res.images[1]?.url,
                                            link: `https://open.spotify.com/artist/${res.id}`,
                                            genres: res.genres
                                        }
                                    });
                            }
                        }
                        await artistsToIDs(song.artists).then(ids => song.artists = ids);
                        await pb.collection('songs').create(song)
                            .catch(handleCreationException);
                        await pb.collection('songs').getFirstListItem(`song_id="${song.song_id}"`).then(res => song_db_ids.push(res.id));
                        break;
                    default:
                        console.error("Error finding song.");
                        console.error(err);
                        break;
                }
            })
    }
    return song_db_ids;
}

async function genresToIDs(genres) {
    let genres_db_ids = [];
    for (let i = 0; i < genres.length; i++) {
        await pb.collection('genres').getFirstListItem(`genre="${genres[i]}"`).then(res => genres_db_ids.push(res.id))
            .catch(async function(err){
                switch (err.status){
                    case 404:
                        await pb.collection('genres').create({genre: genres[i]})
                            .catch(handleCreationException);
                        await pb.collection('genres').getFirstListItem(`genre="${genres[i]}"`).then(res => genres_db_ids.push(res.id));
                        break;
                    default:
                        console.error("Error finding genre.");
                        console.error(err);
                        break;
                }
            })
    }
    return genres_db_ids;
}
// TODO: MAKE PLAYLISTS GET POSTED ON LOG-IN
export const postPlaylist = async (playlist) => {
    // Fetch the tracks of the playlist from the Spotify API
    const res = await fetchData(`playlists/${playlist.id}/tracks`);

    // Extract the track objects from the response
    const tracks = res.items.map(e => e.track);

    // Transform the track objects into our desired format
    const transformedTracks = tracks.map(track => ({
        song_id: track.id,
        title: track.name,
        artists: track.artists,
        image: track.album.images[1].url,
        link: track.external_urls.spotify,
        analytics: {}
    }));

    let newTracks = [];
    for (const track of transformedTracks) {
        await pb.collection('songs').getFirstListItem(`song_id="${track.song_id}"`) //TODO : THIS TAKES A WHILE
            .then(res => track.analytics = res.analytics)
            .catch(function (err) {
                switch (err.status) {
                    case 404:
                        // Track not found, add to newTracks array
                        newTracks.push(track);
                        // Remove the track from the transformedTracks array
                        transformedTracks.slice(transformedTracks.findIndex(t => t.song_id === track.song_id), 1);
                        break;
                    default:
                        console.error('Error finding song.');
                        console.error(err);
                        break;
                }
            });
    }

    // Add audio feature analytics to all songs
    const analytics = await batchAnalytics(newTracks);
    newTracks.forEach((track, i) => track.analytics = analytics[i]);
    transformedTracks.push(...newTracks);

    // Convert the transformed tracks into an array of IDs
    const ids = await songsToIDs(transformedTracks);

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
 * @param userId The ID of the user to retrieve playlists for.
 * @returns {Promise<Array>} An array of playlist objects.
 */
export const getPlaylists = (userId) => {
    return pb.collection('playlists').getFullList(`owner.user_id="${userId}"`);
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

    // Convert top genres, songs, and artists to their respective IDs.
    await genresToIDs(datapoint.top_genres).then(ids => datapoint.top_genres = ids);
    await songsToIDs(datapoint.top_songs).then(ids => datapoint.top_songs = ids);
    await artistsToIDs(datapoint.top_artists).then(ids => datapoint.top_artists = ids);

    // Log the datapoint being posted.
    console.info('Attempting to post...');
    console.log(datapoint);

    // Post the datapoint to the database and catch any errors.
    await pb.collection('datapoints').create(datapoint)
        .catch(handleCreationException);

    // Re-enable auto-cancellation.
    pb.autoCancellation(true);
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
         `user_id="${user_id}"&&term="${term}"`, {
             expand: 'top_songs,top_artists,top_genres,top_artists.genres,top_songs.artists,top_songs.artists.genres'
         })
        .catch(err => {
            if(err.status === 404){
                console.info(`No datapoints for ${user_id} found.`)
            } else(console.warn(err));
        })
}