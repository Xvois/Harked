import {fetchSpotifyData} from "@/API/spotify";
import {Artist, RelatedArtists} from "@/API/Interfaces/artistInterfaces";
import {TrackRecommendations} from "@/API/Interfaces/trackInterfaces";

/**
 * Returns similar artists to the artist id passed in.
 * @param id
 * @returns Array<Artist>
 */
export const getSimilarArtists = async (id: string) => {
    return (await fetchSpotifyData<RelatedArtists>(`artists/${id}/related-artists`)).artists;
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

    return (await fetchSpotifyData<TrackRecommendations>(`recommendations?${params}`)).tracks;
}

// A function that gets similar artists to a particular genre.

/**
 * Returns similar artists to the genre id passed in.
 * @returns Array<Artist>
 * @param genre
 * @param artists
 */
export const getGenresRelatedArtists = (genre: string, artists: Artist[]) => {
    return artists.filter(a => a.genres ? a.genres.some(g => g === genre) : false)
}




