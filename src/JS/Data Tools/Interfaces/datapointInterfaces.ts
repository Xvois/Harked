import { Record } from './databaseInterfaces';
export interface Datapoint extends Record {
    owner: string;
    term: "short_term" | "medium_term" | "long_term";
    top_tracks: string[];
    top_artists: string[];
}