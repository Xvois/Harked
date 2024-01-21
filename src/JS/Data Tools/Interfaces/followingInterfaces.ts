import {Record, User} from './databaseInterfaces';

export interface FollowingRecord extends Record {
    user: string;
    following: string[];
    expand?: User[];
}

export interface FollowersRecord extends Record {
    user: string;
    followers: string[];
    expand?: User[];
}