import {Item, ItemType} from "./Interfaces/databaseInterfaces";
import {fetchSpotifyData} from "@/API/spotify";
import {Album, RetrievedAlbums} from "@/API/Interfaces/albumInterfaces";
import {RetrievedTracks, Track} from "@/API/Interfaces/trackInterfaces";
import {Artist, RetrievedArtists} from "@/API/Interfaces/artistInterfaces";
import {Playlist} from "@/API/Interfaces/playlistInterfaces";
import {User} from "./Interfaces/userInterfaces";
import {RefObject} from 'react';

export function hashString(inputString: string) {
    // @ts-ignore
    let hash = 0n; // Use BigInt to support larger values
    if (inputString.length === 0) {
        return '0000000000000000';
    }
    for (let i = 0; i < inputString.length; i++) {
        const char = BigInt(inputString.charCodeAt(i));
        // @ts-ignore
        hash = ((hash << 5n) - hash) + char;
        hash &= hash; // Convert to 64-bit integer
    }
    const hex = hash.toString(16);
    return hex.padStart(15, '0').substring(0, 15);
}

export const milliToHighestOrder = function (milliseconds: number) {
    const units = [
        {value: 1, unit: 's'},
        {value: 60, unit: 'm'},
        {value: 60 * 60, unit: 'hr'},
        {value: 24 * 60 * 60, unit: 'd'},
        {value: 7 * 24 * 60 * 60, unit: 'w'},
        {value: 30 * 24 * 60 * 60, unit: 'm'},
        {value: 12 * 30 * 24 * 60 * 60, unit: 'yr'},
    ];

    let calcVal = milliseconds / 1000;
    let unit = 's';

    for (let i = units.length - 1; i >= 0; i--) {
        if (calcVal >= units[i].value) {
            calcVal /= units[i].value;
            unit = units[i].unit;
            break;
        }
    }

    return {
        value: Math.trunc(calcVal),
        unit: unit
    }
}

export function chunks<T>(array: any[], size: number): Array<T> {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
    }
    return result;
}

/**
 * Will always return the database id for either a song, artist or album.
 * The type does not need to be specified and the id may **not** always be valid
 * as it can be unresolved.
 */
export const retrieveID = (item: Item, type: ItemType) => {
    switch (type) {
        case "track":
            return item["track_id"];
        case "artist":
            return item["artist_id"];
        case "album":
            return item["album_id"];
        case "playlist":
            return item["playlist_id"];
        case "user":
            return item["user_id"];
        default:
            throw new Error("Unknown type seen in retrieveID.");
    }
}

/**
 * This function resolves an array of items by making batch requests to the Spotify API.
 * It categorizes items into tracks, artists, albums, playlists, and users, and fetches their data from the Spotify API.
 * For tracks, artists, and albums, it makes batch requests in chunks of 50, 50, and 20 respectively.
 * For playlists and users, it makes individual requests for each item.
 *
 * @param {Item[]} items - An array of items to be resolved. Each item is an object with a type property that can be "track", "artist", "album", "playlist", or "user".
 * @returns {Promise<{tracks: Track[], artists: Artist[], albums: Album[], playlists: Playlist[], users: User[]}>} - A promise that resolves to an object containing arrays of resolved items categorized by type.
 * @throws {Error} - Throws an error if an item has an unknown type.
 */
export const resolveItems = async (items: Item[]) => {
    let resolvedItems = {
        tracks: [] as Track[],
        artists: [] as Artist[],
        albums: [] as Album[],
        playlists: [] as Playlist[],
        users: [] as User[]
    };
    let unresolvedItems = {
        tracks: [] as Item[],
        artists: [] as Item[],
        albums: [] as Item[],
        playlists: [] as Item[],
        users: [] as Item[]
    };
    for (const item of items) {
        switch (item.type) {
            case "track":
                unresolvedItems.tracks.push(item);
                break;
            case "artist":
                unresolvedItems.artists.push(item);
                break;
            case "album":
                unresolvedItems.albums.push(item);
                break;
            case "playlist":
                unresolvedItems.playlists.push(item);
                break;
            case "user":
                unresolvedItems.users.push(item);
                break;
            default:
                throw new Error("Unknown type seen in resolveItems.");
        }
    }

    const trackChunks = chunks<Item[]>(unresolvedItems.tracks, 50);
    const artistChunks = chunks<Item[]>(unresolvedItems.artists, 50);
    const albumChunks = chunks<Item[]>(unresolvedItems.albums, 20);

    for (const chunk of trackChunks) {
        const tracks = await fetchSpotifyData<RetrievedTracks>(`tracks?ids=${chunk.map(e => e.id).join(",")}`);
        resolvedItems.tracks = resolvedItems.tracks.concat(tracks.tracks);
    }

    for (const chunk of artistChunks) {
        const artists = await fetchSpotifyData<RetrievedArtists>(`artists?ids=${chunk.map(e => e.id).join(",")}`);
        resolvedItems.artists = resolvedItems.artists.concat(artists.artists);
    }

    for (const chunk of albumChunks) {
        const albums = await fetchSpotifyData<RetrievedAlbums>(`albums?ids=${chunk.map(e => e.id).join(",")}`);
        resolvedItems.albums = resolvedItems.albums.concat(albums.albums);
    }

    for (const playlist of unresolvedItems.playlists) {
        const playlistData = await fetchSpotifyData<Playlist>(`playlists/${playlist.id}`);
        resolvedItems.playlists.push(playlistData);
    }

    for (const user of unresolvedItems.users) {
        const userData = await fetchSpotifyData<User>(`users/${user.id}`);
        resolvedItems.users.push(userData);
    }

    return resolvedItems;
}

export function getAllIndexes(arr, val) {
    let indexes = [], i;
    for (i = 0; i < arr.length; i++)
        if (arr[i] === val)
            indexes.push(i);
    return indexes;
}

export function createPictureSources(images: {
    url: string,
    height: number,
    width: number
}[], imageWidthPercentage: number) {
    return images.map((image, index, array) => {
        let width = image.width;
        if (index !== array.length - 1) {
            // If it's not the last image, adjust the width by the imageWidthPercentage
            width = Math.floor(array[index + 1].width * imageWidthPercentage);
        }
        return `${image.url} ${width}w`;
    }).join(', ');
}

export function getInputRefValue(ref: RefObject<HTMLInputElement>): string | undefined {
    return ref.current?.value;
}

export function isAlbum(item: Album | Track | Artist | Playlist | string): item is Album {
    return typeof item !== 'string' && 'images' in item && 'album_type' in item;
}

export function isTrack(item: Album | Track | Artist | Playlist | string): item is Track {
    return typeof item !== 'string' && 'album' in item;
}

export function isArtist(item: Album | Track | Artist | Playlist | string): item is Artist {
    return typeof item !== 'string' && 'images' in item && 'genres' in item;
}

export function isPlaylist(item: Album | Track | Artist | Playlist | string): item is Playlist {
    return typeof item !== 'string' && 'images' in item && 'tracks' in item;
}
