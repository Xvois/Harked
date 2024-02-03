/*
Holds the cache for the data tools.
 */

import LRUCache from "lru-cache";
import {Datapoint} from "./Interfaces/datapointInterfaces";
import {User} from "./Interfaces/userInterfaces";
import {Album} from "@/API/Interfaces/albumInterfaces";

export const albums_cache = new LRUCache<string, Album[]>({max: 100})

export const user_cache = new LRUCache<string, User>({max: 100});

export const dp_cache = new LRUCache<string, Datapoint>({
    max: 100,
});
