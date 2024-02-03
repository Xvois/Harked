import {DatabaseUser, Item, Record} from "./databaseInterfaces";
import {Album} from "@/API/Interfaces/albumInterfaces";
import {Artist} from "@/API/Interfaces/artistInterfaces";
import {Track} from "@/API/Interfaces/trackInterfaces";

export interface Recommendation extends Record {
    item: Item,
    description: string,
}

export interface FormattedRecommendation<T extends Album | Track | Artist> {
    item: T,
    description: string,
}

export interface ProfileRecommendations extends Record {
    user: string
    recommendations: string[]
    expand?: {
        recommendations: Recommendation[]
        user: DatabaseUser
    }
}

export interface FormattedProfileRecommendations {
    artists: FormattedRecommendation<Artist>[],
    albums: FormattedRecommendation<Album>[],
    tracks: FormattedRecommendation<Track>[],
}