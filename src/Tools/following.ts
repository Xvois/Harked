import {deleteSpotifyData, fetchSpotifyData, putSpotifyData} from "@/API/spotify";


export function followUser(userID: string) {
    return putSpotifyData(`me/following?type=user&ids=${userID}`, {ids: [userID]})
}

export function unfollowUser(userID: string) {
    return deleteSpotifyData(`me/following?type=user&ids=${userID}`, {ids: [userID]})
}

export function followingContainsUser(userID: string) {
    return fetchSpotifyData(`me/following/contains?type=user&ids=${userID}`).then(res => res[0])
}