import {DatabaseUser, Record} from "./databaseInterfaces";

export interface Settings extends Record {
    user: string;
    public: boolean;
    expand?: {
        user: DatabaseUser
    }
}