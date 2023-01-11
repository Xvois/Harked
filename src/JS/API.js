import axios from 'axios';
import {authURI} from './Authentication';

const LRU = require('lru-cache');

// Create a new LRU cache with a maximum size of 1000 items
// and a default expiration time of 1 hour
const cache = new LRU({
    max: 1000,
    ttl: 1000 * 60 * 60,
});

/**
 * Makes requests data from the Spotify from the
 * designated endpoint (path). The function returns an object containing the data it has received.
 * @param path
 * @returns {Promise<any>} An object.
 */
export const fetchData = async (path) => {
    let data = cache.get(path);
    if(data){console.log("Returning cache: "); console.log(data); return data;}
    //console.log("External API call made to: " + path)
     await axios.get(`https://api.spotify.com/v1/${path}`, {
        headers: {
            Authorization: `Bearer ${window.localStorage.getItem("token")}`
        },
    }).then(function (response){
         data = response.data;
         cache.set(path, data)
     })
         .catch(function (err) {
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
    console.log("Path: " + path + " Data: ");
    console.log(data);
    return data;
}

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
 * Makes a get request to the PRDB at the given endpoint and return the response as an object.
 * @param path The endpoint.
 * @returns {Promise<void>} An object containing the response.
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
export const getUser = async (userID) => {
    let user;

    // If the user data is not in the cache, make the API call and cache the result
    await axios.get(`https://photon-database.tk/PRDB/getUser?userID=${userID}`).then(
        function (result) {
            user = result.data;
        }
    ).catch(
        function (err) {
            console.warn("Error getting user: ");
            console.warn(err);
        }
    )
    return user;
}

/**
 * Returns all the users in the PRDB.
 * @returns {Promise<*>} An array of user objects.
 */
export const getAllUsers = async () => {
    let users;
    await axios.get(`https://photon-database.tk/PRDB/all`,).then(
        function (result) {
            users = result.data;
        }
    ).catch(
        function (err) {
            console.warn("Error getting all users: ")
            console.warn(err);
        }
    )
    return users;
}

export const isServerAlive = async () => {
    let alive = false;
    await axios.options('https://photon-database.tk/PRDB/all').then(function () {
        alive = true;
    }).catch(function (err) {
        console.warn("Error checking server status: ");
        console.warn(err);
    })
    return alive;
}

/**
 /**
 * Will return all the user IDs in the database.
 * @returns {Promise<void>} An array.
 */
export const getAllUserIDs = async () => {
    let userIDs;
    await axios.get(`https://photon-database.tk/PRDB/getIDs`).then(
        function (result) {
            console.log(result.data);
            userIDs = result.data;
        }
    ).catch(
        function (err) {
            console.warn("Error getting all userIDs: ")
            console.warn(err);
        }
    )
    return userIDs;
}


/**
 * Will update / create a record in the PRDB for a user.
 * @param user A user object.
 * @returns {Promise<void>}
 */
export const postUser = async (user) => {
    //console.info("User " + user.username + " posted.");
    await axios.post(`https://photon-database.tk/PRDB/create`, user).catch(
        function (err) {
            console.warn("Error posting user: ")
            console.warn(err);
        }
    )
}

/**
 * postDatapoint will post the datapoint to the PRDB. Checks in the database controller are made to ensure the
 * datapoint is not redundant in the database.
 * @param datapoint A datapoint object.
 * @returns {Promise<void>}
 */
export const postDatapoint = async (datapoint) => {
    await axios.post(`https://photon-database.tk/PRDB/addDatapoint`, datapoint).then((res) => {
        console.log(res.data)
    }).catch(
        function (err) {
            console.warn("Error posting datapoint: ");
            console.warn(err);
        }
    )
}

/**
 * getDatapoint makes a GET HTTP request to the PRDB to retrieve the most recent datapoint for a given user
 * in the database.
 * @param userID A global user ID.
 * @param term [short_term, medium_term, long_term]
 * @param timeSens Whether or not the datapoint collection should be time sensitive.
 * @returns {Promise<*>} A datapoint object or false.
 */
export const getDatapoint = async (userID, term, timeSens) => {
    let returnRes = cache.get(userID + term);
    console.log("Cache = ");
    console.log(returnRes);
    if (returnRes) {
        // Return the cached user data
        console.log("Returning cached datapoint.")
        return returnRes;
    }
    await axios.get(`https://photon-database.tk/PRDB/getDatapoint?userID=${userID}&term=${term}&timed=${timeSens}`).then(result => {
        if (result.data != null) { // Does the datapoint exist? (Has the collectionDate been overwritten?)
            returnRes = result.data;
            cache.set(userID + term, returnRes);
        } else {
            returnRes = false;
        }
    }).catch(function (err) {
        console.warn("Error getting datapoint: ")
        console.warn(err)
    })
    return returnRes;
}