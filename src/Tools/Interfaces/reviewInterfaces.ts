import {Item, Record} from "./databaseInterfaces";
import {Album} from "@/API/Interfaces/albumInterfaces";
import {Track} from "@/API/Interfaces/trackInterfaces";
import {Artist} from "@/API/Interfaces/artistInterfaces";


export interface Review extends Record {
    owner: string;
    item: Item;
    rating: number;
    content: string;
    description: string;
    expand?: { owner: string };
}

export interface ReviewWithItem<T extends Album | Track | Artist> extends Omit<Review, "expand" | "item"> {
    item: T
}