
export interface Record {
    id: string;
    created: string;
    updated: string;
}

export interface User extends Record {
    username: string,
    email: string,
    user_id: string,
    profile_picture: string
}