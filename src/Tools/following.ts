import {getLocalData, getLocalDataByID, updateLocalData} from "@/API/pocketbase";
import {FollowersRecord, FollowingRecord} from "./Interfaces/followingInterfaces";
import {hashString} from "./utils";
import {createEvent} from "./events";
import {retrieveUser} from "./users";

/**
 * A boolean function that returns true if the currently logged-in user follows the target and false if not.
 * @returns {Promise<*>}
 * @param primaryUserID
 * @param targetUserID
 */
export const followsUser = async function (primaryUserID: string, targetUserID: string) {
    // If both are the same we can simply return false as a user cannot follow themselves.
    if (primaryUserID === targetUserID) {
        return false;
    }
    let follows = false;
    const targetUser = await retrieveUser(targetUserID);
    if (!targetUser) {
        console.warn('"void" value returned from followsUser.');
        return null;
    }
    // Get who the primary user follows
    await getLocalData<FollowingRecord>("user_following", `user.user_id="${primaryUserID}"`)
        .then((res) => {
            const item = res[0];
            // Check if the record id of the target user is held in the array of
            // the primary user's following array
            if (item.following.some((e: string) => e === targetUser.id)) {
                follows = true;
            }
        });
    return follows;
}

/**
 * Will make the primary user follow the target user.
 *
 * **Has a built-in event creation side effect.**
 * @param primaryUserID
 * @param targetUserID
 */
export const followUser = async function (primaryUserID: string, targetUserID: string) {
    if (await followsUser(primaryUserID, targetUserID)) {
        return;
    }
    // Get the record for who follows who for both the primary and target user
    let [primaryObj, targetObj] = [await getLocalDataByID<FollowingRecord>("user_following", hashString(primaryUserID)), await getLocalDataByID<FollowingRecord>("user_following", hashString(targetUserID))];

    // Since this is a relational key, .user is simply the record id for that user
    if (!primaryObj.following.some(e => e === targetObj.user)) {
        primaryObj.following.push(targetObj.user);
        // Update the primary user's data to show they are following the target user
        await updateLocalData("user_following", primaryObj, primaryObj.id);
        retrieveUser(targetUserID).then(targetUser => createEvent(52, primaryUserID, {
            id: targetUser.id,
            type: "user"
        }));
        // Update the target user's data to show they are being followed by the primary user
        await getLocalDataByID<FollowersRecord>("user_followers", hashString(targetUserID)).then(res => {
            let item = res;
            item.followers.push(primaryObj.user);
            updateLocalData("user_followers", item, item.id);
        })
    }
}
/**
 * Will make the primary user unfollow the target user.
 * @param primaryUserID
 * @param targetUserID
 */
export const unfollowUser = async function (primaryUserID: string, targetUserID: string) {
    // Get the record for who follows who for both the primary and target user
    let [primaryObj, targetObj]: Array<FollowingRecord> = [await getLocalDataByID("user_following", hashString(primaryUserID)), await getLocalDataByID("user_following", hashString(targetUserID))];

    // Since this is a relational key, .user is simply the record id for tha user
    if (primaryObj.following.some(e => e === targetObj.user)) {
        primaryObj.following = primaryObj.following.filter(e => e !== targetObj.user);
        // Update the primary user's data to show they are not following the target user
        await updateLocalData("user_following", primaryObj, primaryObj.id);
        // Update the target user's data to show they are not being followed by the primary user
        await getLocalDataByID("user_followers", hashString(targetUserID)).then((res: FollowersRecord) => {
            let item = res;
            item.followers = item.followers.filter(e => e !== primaryObj.user);
            updateLocalData("user_followers", item, item.id);
        })
    }
}
/**
 * Returns the user records of the followers of the target.
 * @param user_id
 * @returns {Array<User>}
 */
export const retrieveFollowers = async function (user_id: string) {
    const res = await getLocalDataByID<FollowersRecord>("user_followers", hashString(user_id), "followers");
    if (res.followers.length > 0) {
        return res.expand.followers;
    } else {
        return [];
    }
}

/**
 * Returns the user records who the target is following.
 * @param user_id
 * @returns {Array<User>}
 */
export const retrieveFollowing = async function (user_id: string) {
    console.log('retrieveFollowing called!')
    const res = await getLocalDataByID<FollowingRecord>("user_following", hashString(user_id), "following");
    if (res.following.length > 0) {
        return res.expand.following;
    } else {
        return [];
    }
}