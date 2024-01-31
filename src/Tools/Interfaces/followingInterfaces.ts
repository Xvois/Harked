import {DatabaseUser, Record} from './databaseInterfaces';

export interface FollowingRecord extends Record {
    user: string;
    following: string[];
    expand?: { following: DatabaseUser[] };
}

export interface FollowersRecord extends Record {
    user: string;
    followers: string[];
    expand?: { followers: DatabaseUser[] };
}