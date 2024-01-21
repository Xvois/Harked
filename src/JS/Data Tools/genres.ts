import {Artist} from "../API/artistInterfaces";

/**
 * Creates an ordered array of a users top genres based on an order list of artists.
 * @param artists
 * @returns {*[]}
 */
export const calculateTopGenres = function (artists: Array<Artist>) {

    let topGenres = [];

    artists.forEach((artist, i) => {
        artist.genres.forEach((genre) => {
            const existingGenre = topGenres.find((g) => g.genre === genre);

            if (existingGenre) {
                existingGenre.weight += artists.length - i;
            } else {
                topGenres.push({genre, weight: artists.length - i});
            }
        });
    });

    topGenres.sort((a, b) => b.weight - a.weight);

    // Extract the genre names as an array of strings
    return topGenres.map((genre) => genre.genre);
};