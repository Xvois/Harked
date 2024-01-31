import {DatabaseUser, Record} from "./databaseInterfaces";
import {User} from "./userInterfaces";

// Must always be expanded
export interface CommentSection extends Record {
    owner: string;
    comments: string[];
    expand: { comments: Comment[] };
}

// Must always be expanded
export interface Comment extends Record {
    user: string;
    parent: string;
    content: string;
    expand: { user: DatabaseUser };
}

export interface CommentWithUser extends Omit<Comment, 'expand' | 'user'> {
    user: User;
}