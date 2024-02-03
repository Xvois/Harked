interface Image {
    url: string;
    height: number;
    width: number;
}

interface ExternalUrls {
    spotify: string;
}

interface Restrictions {
    reason: string;
}

interface Artist {
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
    restrictions: Restrictions;
    type: string;
    uri: string;
    artists: Artist[];
}

interface Followers {
    href: string;
    total: number;
}

interface ArtistInSong {
    external_urls: ExternalUrls;
    followers: Followers;
    genres: string[];
    href: string;
    id: string;
    images: Image[];
    name: string;
    popularity: number;
    type: string;
    uri: string;
}

interface ExternalIds {
    isrc: string;
    ean: string;
    upc: string;
}

interface LinkedFrom {
}

export interface Track {
    album: Album;
    artists: ArtistInSong[];
    available_markets: string[];
    disc_number: number;
    duration_ms: number;
    explicit: boolean;
    external_ids: ExternalIds;
    external_urls: ExternalUrls;
    href: string;
    id: string;
    is_playable: boolean;
    linked_from: LinkedFrom;
    restrictions: Restrictions;
    name: string;
    popularity: number;
    preview_url: string;
    track_number: number;
    type: string;
    uri: string;
    is_local: boolean;
}

export interface RetrievedTracks {
    tracks: Track[]
}

export interface TrackAnalytics {
    acousticness: number,
    analysis_url: string,
    danceability: number,
    duration_ms: number,
    energy: number,
    id: string,
    instrumentalness: number,
    key: number,
    liveness: number,
    loudness: number,
    mode: number,
    speechiness: number,
    tempo: number,
    time_signature: number,
    track_href: string,
    type: string,
    uri: string,
    valence: number
}

export interface MultipleAnalytics {
    audio_features: TrackAnalytics[]
}

interface Seed {
    afterFilteringSize: number;
    afterRelinkingSize: number;
    href: string;
    id: string;
    initialPoolSize: number;
    type: string;
}

export interface TrackRecommendations {
    seeds: Seed[];
    tracks: Track[];
}