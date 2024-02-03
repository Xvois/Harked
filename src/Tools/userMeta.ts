import {getLocalDataByID, updateLocalData} from "@/API/pocketbase";
import {hashString} from "./utils";
import {Settings} from "./Interfaces/userMeta";

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

