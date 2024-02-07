import {hashString, retrieveID} from "./utils";
import {deleteLocalData, getLocalDataByID, putLocalData, updateLocalData} from "@/API/pocketbase";
import {Artist} from "@/API/Interfaces/artistInterfaces";
import {Track} from "@/API/Interfaces/trackInterfaces";
import {Album} from "@/API/Interfaces/albumInterfaces";
import {fetchSpotifyData} from "@/API/spotify";
import {createEvent} from "./events";
import {ItemType} from "./Interfaces/databaseInterfaces";
import {
    FormattedProfileRecommendations,
    ProfileRecommendations,
    Recommendation
} from "./Interfaces/recommendationInterfaces";
import {getLIName} from "@/Analysis/analysis";

/**
 * Returns all the profile recommendations from the target user.
 * @param user_id
 */
export const retrieveProfileRecommendations = async function (user_id: string) {
    const data = await getLocalDataByID<ProfileRecommendations>("profile_recommendations", hashString(user_id), "recommendations");
    let recs = data.expand.recommendations;

    let formattedRecs: FormattedProfileRecommendations = {
        artists: [],
        albums: [],
        tracks: []
    }

    if (recs === undefined) {
        return formattedRecs;
    }

    // TODO: BATCH
    // Resolve all the items in the recommendations
    for (let i = 0; i < recs.length; i++) {
        let e = recs[i];
        if (e.item.type === "artist") {
            let artist = await fetchSpotifyData<Artist>(`artists/${e.item.id}`)
            formattedRecs.artists.push({item: artist, description: e.description});
        } else if (e.item.type === "track") {
            let track = await fetchSpotifyData<Track>(`tracks/${e.item.id}`);
            formattedRecs.tracks.push({item: track, description: e.description});
        } else if (e.item.type === "album") {
            let album = await fetchSpotifyData<Album>(`albums/${e.item.id}`);
            formattedRecs.albums.push({item: album, description: e.description});
        } else {
            throw new Error("Unknown type fetched from profile recommendations.");
        }
    }

    return formattedRecs;
}

/**
 * Creates a recommendation for the target user on their page.
 *
 * **Has built in createEvent side-effect.**
 * @param user_id
 * @param item
 * @param type
 * @param description
 */
export const submitRecommendation = async function (user_id: string, item: Track | Artist | Album, type: ItemType, description: string) {
    const id = hashString(getLIName(item) + description + user_id);
    let currRecommendations = await getLocalDataByID<ProfileRecommendations>("profile_recommendations", hashString(user_id));
    if (currRecommendations.recommendations === null) {
        currRecommendations.recommendations = [];
    }
    switch (type) {
        case 'artist':
            const artist = item as Artist;
            const artistItemObj = {type: type, id: artist.id}
            const artistRecommendation = {id: id, item: artistItemObj, description: description};
            await putLocalData("recommendations", artistRecommendation);
            const newRecs_a: ProfileRecommendations = {
                ...currRecommendations,
                recommendations: currRecommendations.recommendations.concat(id)
            }
            await updateLocalData("profile_recommendations", newRecs_a, currRecommendations.id);
            break;
        case 'track':
            const track = item as Track;
            const songItemObj = {type: type, id: track.id}
            const songRecommendation = {id: id, item: songItemObj, description: description};
            await putLocalData("recommendations", songRecommendation);
            const newRecs_s = {...currRecommendations, recommendations: currRecommendations.recommendations.concat(id)}
            await updateLocalData("profile_recommendations", newRecs_s, currRecommendations.id);
            break;
        case 'album':
            const album = item as Album;
            const albumItemObj = {id: album.id, type: type};
            const albumRecommendation = {id: id, item: albumItemObj, description: description};
            await putLocalData("recommendations", albumRecommendation);
            const newRecs_al = {...currRecommendations, recommendations: currRecommendations.recommendations.concat(id)}
            await updateLocalData("profile_recommendations", newRecs_al, currRecommendations.id);
            break;
        default:
            throw new Error("Invalid item type for recommendation.");
    }
    createEvent(1, user_id, {id: item.id, type: type});
}

export const modifyRecommendation = async (user_id: string, existingRecommendation: Recommendation, type: ItemType, newDescription: string) => {
    const validTypes = ["track", "artist", "album"];
    if (!validTypes.includes(type)) {
        throw new Error("Invalid item type for recommendation modification.");
    }

    let item = existingRecommendation.item;
    let item_id = retrieveID(item, type);
    existingRecommendation.item = {id: item_id, type: type};
    existingRecommendation.description = newDescription;

    await updateLocalData("recommendations", existingRecommendation, existingRecommendation.id).then(() => {
        createEvent(53, user_id, {id: item.id, type: type});
    });
}

/**
 * Deletes a profile recommendation.
 * @param rec_id
 */
export const deleteRecommendation = async function (rec_id: string) {
    await deleteLocalData("recommendations", rec_id);
}