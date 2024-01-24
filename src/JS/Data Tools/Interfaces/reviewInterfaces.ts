import { Record } from "./databaseInterfaces";

interface Item {
    type: "artist" | "track" | "album";
    id: string;
}

export interface Review extends Record {
    owner: string;
    item: Item;
    rating: number;
    content: string;
    expand?: {owner: string};
}