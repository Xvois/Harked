import axios from 'axios';
import {authURI} from './Authentication';
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090/');
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

/**
 * postDatapoint will post the datapoint to the PRDB. Checks in the database controller are made to ensure the
 * datapoint is not redundant in the database.
 * @param datapoint A datapoint object.
 * @returns {Promise<void>}
 */
export const postDatapoint = async (datapoint) => {
    console.info('Posting datapoint.')
    const d = new Date();
    const WEEK_IN_MILLISECONDS = 6.048e+8;
    d.setMilliseconds(d.getMilliseconds() - WEEK_IN_MILLISECONDS);
    const valid_exists = await pb.collection('datapoints').getFirstListItem( `created >= "${d.toISOString()}" && term="${datapoint.term}"`)
        .catch(function(err){if(err.status !== 404){console.warn(err);}})
    if(!!valid_exists){
        console.info("Attempted to post new datapoint, but valid already exists.");
        return;
    }


    let genres_db_ids = [];
    for(let i = 0; i < datapoint.top_genres.length; i++){
        await pb.collection('genres').create({genre: datapoint.top_genres[i]})
            .catch(handleCreationException);
        await pb.collection('genres').getFirstListItem(`genre="${datapoint.top_genres[i]}"`).then(res => genres_db_ids.push(res.id));
    }
    datapoint.top_genres = genres_db_ids;
    let song_db_ids = [];
    for (const song of datapoint.top_songs) {
        await pb.collection('songs').create(song)
            .catch(handleCreationException);
        await pb.collection('songs').getFirstListItem(`song_id="${song.song_id}"`).then(res => song_db_ids.push(res.id));
    }
    datapoint.top_songs = song_db_ids;
    let artist_db_ids = [];
    for (const artist of datapoint.top_artists) {
        if(!!artist.genre){
            await pb.collection('genres').getFirstListItem(`genre="${artist.genre}"`).then(async function(res){
                if(!!res){artist.genre = res.id;}
                // Handle case where genre is not already in the database
                else{
                    await pb.collection('genres').create({genre: artist.genre})
                        .catch(handleCreationException);
                    await pb.collection('genres').getFirstListItem(`genre="${artist.genre}"`).then(new_res => artist.genre = new_res.id);
                }});
        }else{
            artist.genre = null;
        }
        await pb.collection('artists').create(artist)
            .catch(handleCreationException);
        // Turn the name of the genre into its id in the database
        await pb.collection('artists').getFirstListItem(`artist_id="${artist.artist_id}"`).then(res => artist_db_ids.push(res.id));
    }
    datapoint.top_artists = artist_db_ids;
    await pb.collection('datapoints').create(datapoint)
        .catch(handleCreationException);
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
             expand: 'top_songs,top_artists,top_genres,top_artists.genre'
         })
        .catch(err => {
            if(err.status === 404){
                console.info(`No datapoints for ${user_id} found.`)
            } else(console.warn(err));
        })
}