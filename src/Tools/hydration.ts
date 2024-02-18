import {postDatapointRecord, subscribe, unsubscribe} from "@/API/pocketbase";
import {retrieveUser} from "./users";
import {RecordSubscription} from "pocketbase";
import {Datapoint} from "@/Tools/Interfaces/datapointInterfaces";
import {convertDatapointToDatapointRecord} from "@/Tools/datapoints";
import {fetchSpotifyData} from "@/API/spotify";
import {SpotifyList} from "@/API/Interfaces/spotifyResponseInterface";
import {Track} from "@/API/Interfaces/trackInterfaces";
import {Artist} from "@/API/Interfaces/artistInterfaces";
import {calculateTopGenres} from "@/Tools/genres";


/**
 * Creates a datapoint for each term for the logged-in user and posts them
 * to the database using postDatapoint
 */
export const hydrateDatapoints = async function () {
    console.time("Hydration."); // Start a timer for performance measurement
    console.time("Compilation")
    const terms = ['short_term', 'medium_term', 'long_term'];
    const db_id = window.localStorage.getItem("db_id");
    const datapoints = [];

    if (!db_id) {
        throw new Error("Logged in user does not exist in the database.");
    }

    for (const term of terms) {
        console.info("Hydrating: " + term);
        let datapoint = {
            owner: db_id,
            term: term,
            top_tracks: [],
            top_artists: [],
            top_genres: []
        };

        let top_tracks;
        let top_artists;

        // Queue up promises for fetching top songs and top artists
        let result = await Promise.all([fetchSpotifyData<SpotifyList<Track>>(`me/top/tracks?time_range=${term}&limit=50`), fetchSpotifyData<SpotifyList<Artist>>(`me/top/artists?time_range=${term}&limit=50`)]);
        top_tracks = result[0].items;
        top_artists = result[1].items;

        datapoint.top_tracks = top_tracks;
        datapoint.top_artists = top_artists;
        datapoint.top_genres = calculateTopGenres(top_artists);
        datapoints.push(datapoint);
    }

    console.timeEnd("Compilation");
    console.info("Posting datapoints...");
    // Create deep copy clone to prevent optimistic return
    // resolving in to references via the API
    let postClone = structuredClone(datapoints);
    console.log(datapoints);
    await postHydration(postClone).then(() => {
        console.info("Hydration over.");
        console.timeEnd("Hydration."); // End the timer and display the elapsed time
    });
    return datapoints;
}

export const postHydration = async (datapoints: Datapoint[]) => {
    for (const datapoint of datapoints) {
        const record = await convertDatapointToDatapointRecord(datapoint.owner, datapoint.term, datapoint);
        await postDatapointRecord(record).then(() => {
            console.info(datapoint.term + " success!");
        });
    }
}
/**
 * Runs the argument callback function as a side effect of a successful
 * hydration by the argument user_id.
 * @param user_id
 * @param callback
 */
export const onHydration = async (user_id: string, callback: Function) => {
    const user = await retrieveUser(user_id);
    const func = (e: RecordSubscription<Datapoint>) => {
        if (e.action === "create" && e.record.term === "long_term" && e.record.owner === user.id) {
            console.info("Hydration event noted!");
            callback();
            destroyOnHydration();
        }
    }
    await subscribe("datapoints", "*", func);
}
/**
 * Destroys the onHydration subscription.
 *
 * **Should be called after a successful call of the
 * callback for the onHydration event.**
 */
const destroyOnHydration = async () => {
    await unsubscribe("datapoints", "*");
}