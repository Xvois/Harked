import {Artist, RetrievedArtists} from "@api/Interfaces/artistInterfaces";
import {fetchSpotifyData} from "@api/spotify";
import {SpotifyList} from "@api/Interfaces/spotifyResponseInterface";
import {RetrievedTracks, Track} from "@api/Interfaces/trackInterfaces";
import {dp_cache} from "./cache";
import {Datapoint, DatapointRecord, Term} from "./Interfaces/datapointInterfaces";
import {isLoggedIn, retrieveLoggedUserID} from "./users";
import {postHydration} from "./hydration";
import {
    disableAutoCancel,
    enableAutoCancel,
    getDatapointRecord,
    getDelayedDatapoint,
    validDPExists
} from "@api/pocketbase";
import {calculateTopGenres} from "@tools/genres";


function isDatapointRecord(obj: any): obj is DatapointRecord {
    return obj && obj.user_id && typeof obj.user_id === 'string';
}

/**
 * Returns a valid datapoint for a given user in a given term.
 * If the function does not get a valid datapoint from the database, it will hydrate the user's datapoints
 * and return a valid one from that selection.
 * @param user_id
 * @param term short_term | medium_term | long_term
 * @returns {Promise<*>} A datapoint object.
 */
export const retrieveDatapoint = async function (user_id: string, term: Term): Promise<Datapoint> {
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

    let dpRecord = await getDatapointRecord(user_id, term, timeSensitive).catch(function (err) {
        console.warn("Error retrieving datapoint: ");
        console.warn(err);
    })
    if (dpRecord === undefined && timeSensitive) {
        throw new Error('Deprecated behaviour: Hydration is triggered by retrieveDatapoint method, not retrieveAllDatapoints.')
    }

    let datapoint;

    if (isDatapointRecord(dpRecord)) {
        datapoint = await convertDatapointRecordToDatapoint(dpRecord);
    }

    return datapoint;
}

// Helper function to convert a datapoint record to a datapoint
async function convertDatapointRecordToDatapoint(dpRecord: DatapointRecord): Promise<Datapoint> {
    const top_tracks = (await fetchSpotifyData<RetrievedTracks>("tracks/?ids=" + dpRecord.top_tracks.join(","))).tracks;
    const top_artists = (await fetchSpotifyData<RetrievedArtists>("artists/?ids=" + dpRecord.top_artists.join(","))).artists;
    const top_genres = calculateTopGenres(top_artists);
    return { top_tracks, top_artists, top_genres };
}

export const retrievePrevDatapoint = async function (user_id: string, term: Term) {
    const datapoint = await getDelayedDatapoint(user_id, term, 1);
    if (datapoint === undefined) {
        return null
    } else {
        return datapoint;
    }
}


export const retrieveAllDatapoints = async function (user_id: string) {

    await disableAutoCancel();
    const validExists = await validDPExists(user_id, 'long_term');
    const terms = ['short_term', 'medium_term', 'long_term'];
    let datapoints = [];

    if (isLoggedIn() && user_id === await retrieveLoggedUserID() && validExists) {
        // Retrieve datapoints for each term
        for (const term of terms) {
            const datapoint = await retrieveDatapoint(user_id, (term as Term));
            datapoints.push(datapoint);
        }
    } else if (isLoggedIn() && user_id === await retrieveLoggedUserID() && !validExists) {
        // Hydrate datapoints
        datapoints = await hydrateDatapoints();
    } else {
        // Retrieve datapoints for each term
        for (const term of terms) {
            const datapoint = await retrieveDatapoint(user_id, (term as Term));
            datapoints.push(datapoint);
        }
    }


    await enableAutoCancel();

    return datapoints;
};

export const retrievePrevAllDatapoints = async function (user_id: string) {

    await disableAutoCancel();
    const terms = ['short_term', 'medium_term', 'long_term'];
    const datapoints = [];

    for (const term of terms) {
        const datapoint = await retrievePrevDatapoint(user_id, (term as Term));
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
            top_tracks: [],
            top_artists: [],
        };
        let top_tracks;
        let top_artists;

        // Queue up promises for fetching top songs and top artists
        let result = await Promise.all([fetchSpotifyData<SpotifyList<Track>>(`me/top/tracks?time_range=${term}&limit=50`), fetchSpotifyData<SpotifyList<Artist>>(`me/top/artists?time_range=${term}&limit=50`)]);
        top_tracks = result[0].items;
        top_artists = result[1].items;

        // Turn in to just their ids
        datapoint.top_tracks = top_tracks.map(t => t.id);
        datapoint.top_artists = top_artists.map(a => a.id);
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


