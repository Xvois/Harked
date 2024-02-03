import {RetrievedArtists} from "@/API/Interfaces/artistInterfaces";
import {fetchSpotifyData} from "@/API/spotify";
import {MultipleAnalytics, RetrievedTracks} from "@/API/Interfaces/trackInterfaces";
import {dp_cache} from "./cache";
import {Datapoint, DatapointRecord, Term} from "./Interfaces/datapointInterfaces";
import {isLoggedIn, retrieveLoggedUserID} from "./users";
import {hydrateDatapoints} from "./hydration";
import {
    disableAutoCancel,
    enableAutoCancel,
    getDatapointRecord,
    getDelayedDatapoint,
    validDPExists
} from "@/API/pocketbase";
import {calculateTopGenres} from "@/Tools/genres";


function isDatapointRecord(obj: any): obj is DatapointRecord {
    return obj && obj.owner && typeof obj.owner === 'string';
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

    let datapoint = null;

    if (isDatapointRecord(dpRecord)) {
        datapoint = await convertDatapointRecordToDatapoint(dpRecord);
        dp_cache.set(cacheID, datapoint);
    }
    return datapoint;
}

// Helper function to convert a datapoint record to a datapoint
async function convertDatapointRecordToDatapoint(dpRecord: DatapointRecord): Promise<Datapoint> {
    const [topTracksData, topArtistsData, analyticsData] = await Promise.all([
        fetchSpotifyData<RetrievedTracks>("tracks/?ids=" + dpRecord.top_tracks.join(",")),
        fetchSpotifyData<RetrievedArtists>("artists/?ids=" + dpRecord.top_artists.join(",")),
        fetchSpotifyData<MultipleAnalytics>("audio-features/?ids=" + dpRecord.top_tracks.join(","))
    ]);

    const top_tracks = topTracksData.tracks;
    const top_artists = topArtistsData.artists;
    const analytics = analyticsData.audio_features;

    // Create a new object with top_tracks properties & audio_features
    const top_tracks_w_a = top_tracks.map((track, index) => ({
        ...track,
        audio_features: analytics[index]
    }));
    const top_genres = calculateTopGenres(top_artists);
    return {owner: dpRecord.owner, term: dpRecord.term, top_tracks: top_tracks_w_a, top_artists, top_genres};
}

// Helper function to convert a datapoint to a datapoint record
export async function convertDatapointToDatapointRecord(owner: string, term: Term, dp: Datapoint): Promise<Omit<DatapointRecord, "id" | "created" | "updated">> {
    const top_tracks = dp.top_tracks.map(t => t.id);
    const top_artists = dp.top_artists.map(a => a.id);
    return {owner: owner, term: term, top_tracks, top_artists};
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
    const db_id = window.localStorage.getItem("db_id");
    if (!db_id) {
        throw new Error("User does not exist in the database to retrieve their datapoints.");
    }
    const validExists = await validDPExists(db_id, 'long_term');
    const terms = ['short_term', 'medium_term', 'long_term'];
    const datapoints = [];

    const shouldHydrate = isLoggedIn() && !validExists;
    if (shouldHydrate) {
        datapoints.push(...await hydrateDatapoints());
    } else {
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



