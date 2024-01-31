import {SpotifyList} from "@api/Interfaces/spotifyResponseInterface";
import {Track} from "@api/Interfaces/trackInterfaces";
import {Artist} from "@api/Interfaces/artistInterfaces";
import {Album} from "@api/Interfaces/albumInterfaces";
import {Playlist} from "@api/Interfaces/playlistInterfaces";

export interface SpotifySearch {
  tracks: SpotifyList<Track>;
  artists: SpotifyList<Artist>;
  albums: SpotifyList<Album>;
  playlists: SpotifyList<Playlist>;
}