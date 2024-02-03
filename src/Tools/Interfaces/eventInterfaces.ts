import {DatabaseUser, Item, Record} from "./databaseInterfaces";
import {Artist} from "@/API/Interfaces/artistInterfaces";
import {Album} from "@/API/Interfaces/albumInterfaces";
import {Track} from "@/API/Interfaces/trackInterfaces";
import {Playlist} from "@/API/Interfaces/playlistInterfaces";

export interface UserEvent extends Record {
    owner: string;
    ref_num: number;
    item: Item;
}

export interface ResUserEvent<T extends Album | Track | Artist | Playlist | DatabaseUser> extends Omit<UserEvent, "item"> {
    item: T;
}