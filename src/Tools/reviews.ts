import {Artist} from "@/API/Interfaces/artistInterfaces";
import {User} from "./Interfaces/userInterfaces";
import {retrieveUser} from "./users";
import {hashString, resolveItems} from "./utils";
import {deleteLocalData, getFullLocalData, getLocalDataByID, getPagedLocalData, putLocalData} from "@/API/pocketbase";
import {Track} from "@/API/Interfaces/trackInterfaces";
import {Album} from "@/API/Interfaces/albumInterfaces";
import {createEvent} from "./events";
import {Item, ItemType} from "./Interfaces/databaseInterfaces";
import {Review, ReviewWithItem} from "./Interfaces/reviewInterfaces";
import {getLIName} from "../Analysis/analysis";
import {fetchSpotifyData} from "@/API/spotify";
import {ListResult} from "pocketbase";

/**
 * Submits a review from the target user.
 *
 * **Has built in createEvent side-effect.**
 * @param user_id
 * @param item
 * @param type
 * @param rating
 * @param description
 */
export const submitReview = async (user_id: string, item: Item, type: ItemType, rating: number, description: string) => {
    const user: User = await retrieveUser(user_id);
    const id = hashString(getLIName(item) + description + user_id);
    switch (type) {
        case 'artist':
            const artist = item as Artist;
            const artistItemObj: Item = {type: type, id: artist.id}
            const artistReview = {
                id: id,
                owner: user.id,
                item: artistItemObj,
                rating: rating,
                description: description
            };
            try {
                await putLocalData("reviews", artistReview).then(() => {
                    createEvent(3, user_id, artistItemObj)
                });
                break;
            } catch (e) {
                throw new Error(`Failed to submit review: ${e}`);
            }
        case 'track':
            const track = item as Track;
            const songItemObj: Item = {type: type, id: track.id}
            const songReview = {id: id, owner: user.id, item: songItemObj, rating: rating, description: description};
            try {
                await putLocalData("reviews", songReview).then(() => {
                    createEvent(3, user_id, songItemObj)
                });
                break;
            } catch (e) {
                throw new Error(`Failed to submit review: ${e}`);
            }
        case 'album':
            const album = item as Album;
            const albumItemObj: Item = {id: album.id, type: type};
            const albumReview = {id: id, owner: user.id, item: albumItemObj, rating: rating, description: description};
            try {
                await putLocalData("reviews", albumReview).then(() => {
                    createEvent(3, user_id, albumItemObj)
                });
                break;
            } catch (e) {
                throw new Error(`Failed to submit review: ${e}`);
            }
    }
}

/**
 * Retrieves paginated reviews for a specific user.
 *
 * @async
 * @param {string} user_id - The ID of the user.
 * @param {number} page - The page number to retrieve.
 * @param {number} itemsPerPage - The number of items per page.
 * @param {string} [sort="-created"] - The sorting order.
 * @returns {Promise<ReviewWithItem<any>[]>} - A promise that resolves to an array of reviews with their associated resolved items.
 */
export const retrievePaginatedReviews = async (user_id: string, page: number, itemsPerPage: number, sort: string = "-created"): Promise<ListResult<ReviewWithItem<any>>> => {
    let reviewsPage = await getPagedLocalData<Review>("reviews", itemsPerPage, page, `owner.user_id="${user_id}"`, sort);
    let reviews = reviewsPage.items;
    let formattedReviews: ReviewWithItem<any>[] = [];

    if (reviews === undefined) {
        return {items: undefined, page: 0, perPage: 0, totalItems: 0, totalPages: 0};
    }

    // Extract the 'item' property from each review
    let items = reviews.map(review => review.item);

    // Resolve the items
    let resolvedItems = await resolveItems(items);

    // Combine the resolved items with their associated reviews
    for (let i = 0; i < reviews.length; i++) {
        formattedReviews.push({
            ...reviews[i],
            item: resolvedItems[i]
        });
    }
    return {...reviewsPage, items: formattedReviews};
};

/**
 * Returns all reviews from a user but without their items resolved.
 *
 * Is preferred in any case where the item of a review will not themselves be accessed.
 * @param user_id
 */
export const retrieveUnresolvedReviews = async (user_id: string) => {
    return (await getFullLocalData<Review>("reviews", `owner.user_id="${user_id}"`, '-created'));
}


export const retrieveReview = async (id: string) => {
    let review = await getLocalDataByID<Review>("reviews", id, "owner");
    if (review === undefined) {
        return null;
    }
    review.owner = review.expand.owner;
    if (review.item.type === "artist") {
        const artist = await fetchSpotifyData<Artist>(`artists/${review.item.id}`);
        return {...review, item: artist} as ReviewWithItem<Artist>;
    } else if (review.item.type === "track") {
        let track = await fetchSpotifyData<Track>(`tracks/${review.item.id}`);
        return {...review, item: track} as ReviewWithItem<Track>;
    } else if (review.item.type === "album") {
        let album = await fetchSpotifyData<Album>(`albums/${review.item.id}`);
        return {...review, item: album} as ReviewWithItem<Album>;
    } else {
        throw new Error("Unknown type fetched from review.");
    }

}

export const deleteReview = async (id) => {
    await deleteLocalData("reviews", id);
}
