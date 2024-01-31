import {Record} from './databaseInterfaces';
import {Track} from "@api/Interfaces/trackInterfaces";
import {Artist} from "@api/Interfaces/artistInterfaces";

export type Term = "short_term" | "medium_term" | "long_term";

export interface DatapointRecord extends Record {
    owner: string;
    term: Term;
    top_tracks: string[];
    top_artists: string[];
}

export interface Datapoint {
    top_tracks: Track[];
    top_artists: Artist[];
    top_genres: string[];
}
