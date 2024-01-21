import {hashString} from "./HDM";
import {deleteLocalData, getLocalDataByID, putLocalData, updateLocalData} from "../API/pocketbase";
import {Track} from "../API/trackInterfaces";
import {Artist} from "../API/artistInterfaces";


/*
 * Returns the settings of the target user.
 * @param user_id
 * @returns {Settings}
 */
export const retrieveSettings = async function (user_id: string) {
    const id: string = hashString(user_id);
    const res: Settings = await getLocalDataByID("settings", id);
    return res;
}

/**
 * Modifies the settings of the target user.
 * @param user_id
 * @param new_settings : Settings
 */
export const changeSettings = async function (user_id: string, new_settings: Settings) {
    const id = hashString(user_id);
    await updateLocalData("settings", new_settings, id);
}

/**
 * Returns the profile data of the target user.
 * @param user_id
 * @returns ProfileData
 */
export const retrieveProfileData = async function (user_id: string) {
    const id = hashString(user_id);
    return await getLocalDataByID("profile_data", id);
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
export const submitRecommendation = async function (user_id: string, item: Track | Artist | Album, type: "songs" | "artists" | "albums", description: string) {
    const id = hashString(getLIName(item) + description + user_id);
    let currRecommendations: ProfileRecommendations = await getLocalDataByID("profile_recommendations", hashString(user_id));
    if (currRecommendations.recommendations === null) {
        currRecommendations.recommendations = [];
    }
    switch (type) {
        case 'artists':
            const artistRefID = hashString((item as Artist).artist_id);
            const artistItemObj = {type: type, id: artistRefID}
            const artistRecommendation = {id: id, item: artistItemObj, description: description};
            await putLocalData("recommendations", artistRecommendation);
            const newRecs_a: ProfileRecommendations = {
                ...currRecommendations,
                recommendations: currRecommendations.recommendations.concat(id)
            }
            await updateLocalData("profile_recommendations", newRecs_a, currRecommendations.id);
            break;
        case 'songs':
            const songRefID = hashString((item as Song).song_id);
            const songItemObj = {type: type, id: songRefID}
            const songRecommendation = {id: id, item: songItemObj, description: description};
            await putLocalData("recommendations", songRecommendation);
            const newRecs_s = {...currRecommendations, recommendations: currRecommendations.recommendations.concat(id)}
            await updateLocalData("profile_recommendations", newRecs_s, currRecommendations.id);
            break;
        case 'albums':
            const albumItemObj = {id: (item as Album).album_id, type: type};
            const albumRecommendation = {id: id, item: albumItemObj, description: description};
            await putLocalData("recommendations", albumRecommendation);
            const newRecs_al = {...currRecommendations, recommendations: currRecommendations.recommendations.concat(id)}
            await updateLocalData("profile_recommendations", newRecs_al, currRecommendations.id);
            break;
    }
    createEvent(1, user_id, item, type);
}
/**
 * Modifies an existing recommendation with a new description.
 *
 * **Has built in createEvent side-effect.**
 * @param user_id
 * @param existingRecommendation
 * @param type
 * @param newDescription
 */
export const modifyRecommendation = async (user_id: string, existingRecommendation: Recommendation, type: "songs" | "artists" | "albums", newDescription: string) => {
    // We need to unresolve the item to its id and type
    let unresolvedExistingRec = structuredClone(existingRecommendation);
    let item = existingRecommendation.item;
    let item_id;
    if (type === "songs" || type === "artists") {
        item_id = retrieveDatabaseID(item, type);
    } else if (type === "albums") {
        item_id = item["album_id"];
    }
    unresolvedExistingRec.item = {id: item_id, type: type};
    const newRecommendation = {
        ...unresolvedExistingRec,
        description: newDescription
    };
    await updateLocalData("recommendations", newRecommendation, existingRecommendation.id).then(() => {
        createEvent(53, user_id, existingRecommendation.item, type);
    });
}

/**
 * Deletes a profile recommendation.
 * @param rec_id
 */
export const deleteRecommendation = async function (rec_id: string) {
    await deleteLocalData("recommendations", rec_id);
}