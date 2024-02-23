import {Item, Record} from "./databaseInterfaces";
import {Album} from "@/API/Interfaces/albumInterfaces";
import {Track} from "@/API/Interfaces/trackInterfaces";
import {Artist} from "@/API/Interfaces/artistInterfaces";
import {User} from "@/Tools/Interfaces/userInterfaces";


export interface Review extends Record {
    owner: string;
    item: Item;
    rating: number;
    content: string;
    description: string;
    expand?: { owner: User };
}

export interface ReviewWithItem<T extends Album | Track | Artist> extends Omit<Review, "expand" | "item"> {
    item: T
}

export interface NumOfReviews extends Record{
    owner: string;
    review_count: number;
    expand?: { owner: User };
}