/*
Holds the cache for the data tools.
 */

import LRUCache from "lru-cache";
import {Album, User} from "./HDM";
import {Datapoint} from "./Interfaces/datapointInterfaces";

export const albums_cache = new LRUCache<string, Album, unknown>({max: 100})

export const user_cache = new LRUCache<string, User, unknown>({max: 100});

export const dp_cache = new LRUCache<string, Datapoint, unknown>({
    max: 100,
});
