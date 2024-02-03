import {SpotifyList} from "@/API/Interfaces/spotifyResponseInterface";
import {Track} from "@/API/Interfaces/trackInterfaces";
import {Artist} from "@/API/Interfaces/artistInterfaces";
import {Album} from "@/API/Interfaces/albumInterfaces";
import {Playlist} from "@/API/Interfaces/playlistInterfaces";

export interface SpotifySearch {
    tracks: SpotifyList<Track>;
    artists: SpotifyList<Artist>;
    albums: SpotifyList<Album>;
    playlists: SpotifyList<Playlist>;
}