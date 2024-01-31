import {fetchSpotifyData} from "@api/spotify";

/**
 * Returns similar artists to the artist id passed in.
 * @param id
 * @returns Array<Artist>
 */
export const getSimilarArtists = async (id: string) => {
    return (await fetchSpotifyData(`artists/${id}/related-artists`)).artists;
}

/**
 * Takes in the ids of artists, genres and tracks and returns any song recommendations.
 * @param seed_artists
 * @param seed_genres
 * @param seed_tracks
 * @param limit
 * @returns Array<Song>
 */
export const getTrackRecommendations = async (seed_artists: string[], seed_genres: string[], seed_tracks: string[], limit = 20) => {
    let params = new URLSearchParams();
    params.append("seed_artists", seed_artists.join(','));
    params.append("seed_genres", seed_genres.join(','));
    params.append("seed_tracks", seed_tracks.join(','));
    params.append("limit", limit.toString());

    return (await fetchSpotifyData(`recommendations?${params}`)).tracks;
}
