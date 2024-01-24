import {Artist} from "../API/artistInterfaces";
import {User} from "./Interfaces/userInterfaces";
import {retrieveUser} from "./users";
import {hashString} from "./utils";
import {putLocalData} from "../API/pocketbase";
import {Track} from "../API/trackInterfaces";

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
export const submitReview = async (user_id: string, item: Artist | Track | Album, type: "artists" | "songs" | "albums", rating: number, description: string) => {
    const user: User = await retrieveUser(user_id);
    const id = hashString(getLIName(item) + description + user_id);
    switch (type) {
        case 'artists':
            const artistRefID = hashString((item as Artist).artist_id);
            const artistItemObj = {type: type, id: artistRefID}
            const artistReview = {
                id: id,
                owner: user.id,
                item: artistItemObj,
                rating: rating,
                description: description
            };
            try {
                await putLocalData("reviews", artistReview).then(() => {
                    createEvent(3, user_id, item, type)
                });
                break;
            } catch (e) {
                throw new Error("Failed to submit review.", e);
            }
        case 'songs':
            const songRefID = hashString((item as Song).song_id);
            const songItemObj = {type: type, id: songRefID}
            const songReview = {id: id, owner: user.id, item: songItemObj, rating: rating, description: description};
            try {
                await putLocalData("reviews", songReview).then(() => {
                    createEvent(3, user_id, item, type)
                });
                break;
            } catch (e) {
                throw new Error("Failed to submit review.", e);
            }
        case 'albums':
            const albumItemObj = {id: item.album_id, type: type};
            const albumReview = {id: id, owner: user.id, item: albumItemObj, rating: rating, description: description};
            try {
                await putLocalData("reviews", albumReview).then(() => {
                    createEvent(3, user_id, item, type)
                });
                break;
            } catch (e) {
                throw new Error("Failed to submit review.", e);
            }
    }
}

/**
 * This function will resolve the items in an array of records with
 * item objects in them. It works directly off the object references so returns
 * nothing.
 * @param unresolvedItemRecords
 */
export const resolveItems = async (unresolvedItemRecords) => {
    const resolveAlbums = async (reviewBatch) => {
        const albumIds = reviewBatch
            .filter((e) => e.item.type === "albums")
            .map((e) => e.item.id);

        // Batch process albums if there are any to fetch
        if (albumIds.length > 0) {
            const batchSize = 20;
            for (let i = 0; i < albumIds.length; i += batchSize) {
                const batchIds = albumIds.slice(i, i + batchSize);
                const albums: Album[] = (await fetchData(`albums?ids=${batchIds.join(",")}`)).albums;
                for (const e of reviewBatch) {
                    if (e.item.type === "albums") {
                        let album = albums.find((a) => a.id === e.item.id);
                        if (album) {
                            album = formatAlbum(album);
                            e.item = album;
                        }
                    }
                }
            }
        }
    };

    for (let i = 0; i < unresolvedItemRecords.length; i++) {
        let e = unresolvedItemRecords[i];
        console.log(e.item.type)
        if (e.item.type === "artists") {
            let artist: Artist = await getLocalDataByID("artists", e.item.id, "genres");
            artist.genres = artist.expand.genres;
            if (artist.genres !== undefined) {
                artist.genres = artist.genres.map((e) => e.genre);
            }
            e.item = artist;
        } else if (e.item.type === "songs") {
            let song: Song = await getLocalDataByID("songs", e.item.id, "artists");
            song.artists = song.expand.artists;
            e.item = song;
        } else if (e.item.type === "albums") {
            // Albums will be resolved in the batch process
        } else if (e.item.type === "users") {
            let user: User = await getLocalDataByID("users", e.item.id);
            e.item = user;
        }else if (e.item.type === "playlists") {
            let playlist = await retrievePlaylist(e.item.id, false);
            e.item = playlist;
        } else {
            throw new Error("Unknown type fetched from reviews.");
        }
    }

    // Resolve albums in the end to ensure all the batches are processed
    await resolveAlbums(unresolvedItemRecords);
}

/**
 * Retrieves all reviews from a user.
 * @param user_id
 */
export const retrievePaginatedReviews = async (user_id: string, page: number, itemsPerPage: number, sort: string = "-created") => {
    let reviewsPage = await getPagedLocalData("reviews", itemsPerPage, page, `owner.user_id="${user_id}"`, sort);
    let reviews = reviewsPage.items;
    if (reviews === undefined) {
        return [];
    }

    await resolveItems(reviews);

    return reviewsPage;
};
/**
 * Returns all reviews from a user but without their items resolved.
 *
 * Is preferred in any case where the item of a review will not themselves be accessed.
 * @param user_id
 */
export const retrieveUnresolvedReviews = async (user_id: string) => {
    return (await getFullLocalData("reviews", `owner.user_id="${user_id}"`, '-created'));
}


export const retrieveReview = async (id: string) => {
    let review = await getLocalDataByID("reviews", id, "owner");
    if (review === undefined) {
        return null;
    }
    review.owner = review.expand.owner;
    if (review.item.type === "artists") {
        let artist: Artist = await getLocalDataByID("artists", review.item.id, "genres");
        artist.genres = artist.expand.genres;
        if (artist.genres !== undefined) {
            artist.genres = artist.genres.map(e => e.genre);
        }
        review.item = artist;
    } else if (review.item.type === "songs") {
        let song: Song = await getLocalDataByID("songs", review.item.id, "artists");
        song.artists = song.expand.artists;
        review.item = song;
    } else if (review.item.type === "albums") {
        let album: Album = await fetchData(`albums/${review.item.id}`);
        album = formatAlbum(album);
        review.item = album;
    } else {
        throw new Error("Unknown type fetched from review.");
    }

    return review;
}

export const deleteReview = async (id) => {
    await deleteLocalData("reviews", id);
}
