import {Record} from "@/Tools/Interfaces/databaseInterfaces";

interface Image {
    url: string;
    height: number;
    width: number;
}

interface ExternalUrls {
    spotify: string;
}

interface Followers {
    href: string;
    total: number;
}

interface Owner {
    external_urls: ExternalUrls;
    followers: Followers;
    href: string;
    id: string;
    type: string;
    uri: string;
    display_name: string;
}

interface PlArtist {
    external_urls: ExternalUrls;
    href: string;
    id: string;
    name: string;
    type: string;
    uri: string;
}

interface Album {
    album_type: string;
    total_tracks: number;
    available_markets: string[];
    external_urls: ExternalUrls;
    href: string;
    id: string;
    images: Image[];
    name: string;
    release_date: string;
    release_date_precision: string;
    restrictions: {
        reason: string;
    };
    type: string;
    uri: string;
    artists: PlArtist[];
}

export interface PlTrack {
    album: Album;
    artists: PlArtist[];
    available_markets: string[];
    disc_number: number;
    duration_ms: number;
    explicit: boolean;
    external_ids: {
        isrc: string;
        ean: string;
        upc: string;
    };
    external_urls: ExternalUrls;
    href: string;
    id: string;
    is_playable: boolean;
    linked_from: any;
    restrictions: {
        reason: string;
    };
    name: string;
    popularity: number;
    preview_url: string;
    track_number: number;
    type: string;
    uri: string;
    is_local: boolean;
}

interface AddedBy {
    external_urls: ExternalUrls;
    followers: Followers;
    href: string;
    id: string;
    type: string;
    uri: string;
}

export interface PlItem {
    added_at: string;
    added_by: AddedBy;
    is_local: boolean;
    track: PlTrack;
}

interface PlTracks {
    href: string;
    limit: number;
    next: string;
    offset: number;
    previous: string;
    total: number;
    items: PlItem[];
}

export interface Playlist {
    collaborative: boolean;
    description: string;
    external_urls: ExternalUrls;
    followers: Followers;
    href: string;
    id: string;
    images: Image[];
    name: string;
    owner: Owner;
    public: boolean;
    snapshot_id: string;
    tracks: PlTracks;
    type: string;
    uri: string;
}

interface PlTracksFromList {
    href: string;
    total: number;
}

export interface PlaylistFromList {
    collaborative: boolean;
    description: string;
    external_urls: ExternalUrls;
    href: string;
    id: string;
    images: Image[];
    name: string;
    owner: Owner;
    public: boolean;
    snapshot_id: string;
    tracks: PlTracksFromList;
    type: string;
    uri: string;
}

export interface PlFromListWithTracks extends Omit<PlaylistFromList, 'tracks'> {
    tracks: PlTrack[]
}

export interface PlaylistMeta extends Record {
    playlist_id: string;
    meta: {
        [key: string]: string
    }
}
