import {DatabaseUser, Item, Record} from "./databaseInterfaces";
import {Artist} from "@api/Interfaces/artistInterfaces";
import {Album} from "@api/Interfaces/albumInterfaces";
import {Track} from "@api/Interfaces/trackInterfaces";
import {Playlist} from "@api/Interfaces/playlistInterfaces";

export interface UserEvent extends Record {
    owner: string;
    ref_num: number;
    item: Item;
}

export interface ResUserEvent<T extends Album | Track | Artist | Playlist | DatabaseUser> extends Omit<UserEvent, "item"> {
    item: T;
}