export interface Record {
    id: string;
    created: string;
    updated: string;
}

export interface DatabaseUser extends Record {
    username: string,
    email: string,
    user_id: string,
}