import {disableAutoCancel, enableAutoCancel, getDatapoint, getDelayedDatapoint, validDPExists} from "../API/API";
import {hydrateDatapoints, isLoggedIn, retrieveLoggedUserID} from "./HDM";
import { Artist } from "../API/artistInterfaces";
import {Datapoint} from "./Interfaces/datapointInterfaces";
import {fetchSpotifyData} from "../API/spotify";
import {calculateTopGenres} from "./genres";
import {TopItemsRequest} from "../API/spotifyResponseInterface";
import {Track} from "../API/trackInterfaces";
import {dp_cache} from "./cache";



/**
 * Returns a valid datapoint for a given user in a given term.
 * If the function does not get a valid datapoint from the database, it will hydrate the user's datapoints
 * and return a valid one from that selection.
 * @param user_id
 * @param term short_term | medium_term | long_term
 * @returns {Promise<*>} A datapoint object.
 */
export const retrieveDatapoint = async function (user_id: string, term: "short_term" | "medium_term" | "long_term"): Promise<any> {
    const cacheID = `${user_id}_${term}`;
    if (dp_cache.has(cacheID)) {
        console.log(`[Cache] Returning cached datapoint.`)
        return dp_cache.get(cacheID);
    }

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
        console.warn('Deprecated behaviour: Hydration is triggered by retrieveDatapoint method, not retrieveAllDatapoints.')
        await hydrateDatapoints().then(async () =>
            currDatapoint = await getDatapoint(user_id, term, timeSensitive).catch(function (err) {
                console.warn("Error retrieving datapoint: ");
                console.warn(err);
            })
        );
    }


    dp_cache.set(cacheID, currDatapoint)
    return currDatapoint;
}

export const retrievePrevDatapoint = async function (user_id: string, term: "short_term" | "medium_term" | "long_term") {
    const datapoint: Datapoint = await getDelayedDatapoint(user_id, term, 1);
    if (datapoint === undefined) {
        return null
    } else {
        return datapoint;
    }
}


export const retrieveAllDatapoints = async function (user_id) {

    await disableAutoCancel();
    const validExists = await validDPExists(user_id, 'long_term');
    const terms = ['short_term', 'medium_term', 'long_term'];
    let datapoints = [];

    if (isLoggedIn() && user_id === await retrieveLoggedUserID() && validExists) {
        // Retrieve datapoints for each term
        for (const term of terms) {
            const datapoint = await retrieveDatapoint(user_id, term);
            datapoints.push(datapoint);
        }
    } else if (isLoggedIn() && user_id === await retrieveLoggedUserID() && !validExists) {
        // Hydrate datapoints
        datapoints = await hydrateDatapoints();
    } else {
        // Retrieve datapoints for each term
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

/**
 * Creates a datapoint for each term for the logged-in user and posts them
 * to the database using postDatapoint
 *
 * **The hydration will optimistically return the datapoints prior to
 * posting.**
 * @returns {[short_term : Datapoint, medium_term : Datapoint, long_term : Datapoint]}
 */
export const hydrateDatapoints = async function (): Promise<[short_term: Datapoint, medium_term: Datapoint, long_term: Datapoint]> {
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
        };
        let top_songs;
        let top_artists;

        // Queue up promises for fetching top songs and top artists
        let result = await Promise.all([fetchSpotifyData<TopItemsRequest<Track>>(`me/top/tracks?time_range=${term}&limit=50`), fetchSpotifyData<TopItemsRequest<Artist>>(`me/top/artists?time_range=${term}&limit=50`)]);
        top_songs = result[0].items;
        top_artists = result[1].items;

        // Turn in to just their ids
        datapoint.top_songs = top_songs.map(song => song.id);
        datapoint.top_artists = top_artists.map(artist => artist.id);
        datapoints.push(datapoint);
    }
    console.timeEnd("Compilation");
    console.info("Posting datapoints...");
    // Create deep copy clone to prevent optimistic return
    // resolving in to references via the API
    let postClone = structuredClone(datapoints);
    console.log(datapoints);
    postHydration(postClone).then(() => {
        console.info("Hydration over.");
        console.timeEnd("Hydration."); // End the timer and display the elapsed time
    });
    return datapoints;
}


