import {fetchSpotifyData} from "../API/spotify";
import {user_cache} from "./cache";
import {User} from "./Interfaces/userInterfaces";
import {deleteLocalData, getDatabaseUser, getLocalData} from "../API/pocketbase";
import {hashString} from "./utils";
import {Datapoint} from "./Interfaces/datapointInterfaces";
import {Comment} from "./Interfaces/commentInterfaces";



/**
 * Mapping of getUser with caching.
 * @param user_id
 * @returns User
 */
export const retrieveUser = async function (user_id: string) {
    if (user_cache.has(user_id)) {
        return user_cache.get(user_id);
    } else {
        const user = await fetchSpotifyData<User>('users/' + user_id);
        user_cache.set(user_id, user);
        return user;
    }
};

export const deleteUser = async (user_id: string) => {
    const universal_id = hashString(user_id);
    const user = await getDatabaseUser(user_id);
    if(user){
        const datapoints = await getLocalData<Datapoint>('datapoints', `owner.user_id="${user_id}"`);
        const datapointPromises = datapoints.map(d => deleteLocalData('datapoints', d.id));
        await Promise.all(datapointPromises);
        const comments = await getLocalData<Comment>('comments', `user.user_id="${user_id}"`);
        const commentPromises = comments.map(c => deleteLocalData('comments', c.id));
        await Promise.all(commentPromises);
        const connectedRecordsPromises = [
            deleteLocalData("user_followers", universal_id),
            deleteLocalData("user_following", universal_id),
            deleteLocalData("settings", universal_id),
            deleteLocalData("profile_data", universal_id),
            deleteLocalData("comment_section", universal_id),
            deleteLocalData("profile_recommendations", universal_id),
        ]
        await Promise.all(connectedRecordsPromises);
        await deleteLocalData('users', user.id);
    }
    else {
        throw new Error(`User ${user_id} does not exist in the database, but was requested to be deleted.`);
    }
}

/**
 * Returns whether a user exists in the database.
 * @param user_id
 * @returns boolean
 */
export const userExists = async function (user_id: string) {
    return !!(await getDatabaseUser(user_id));
}

/**
 * A boolean function for checking whether the session user is logged in or not.
 * @returns {boolean}
 */
export const isLoggedIn = function () {
    return !!(window.localStorage.getItem("access-token"));
}

export const retrieveLoggedUserID = (function() {
    let me = undefined;

    return async function() {
        if (!me) {
            me = await fetchSpotifyData('me');
        }
        return me.id;
    };
})();