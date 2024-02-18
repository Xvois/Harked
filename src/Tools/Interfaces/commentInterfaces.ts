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
    children: string[];
    content: string;
    likes: number
    expand: { user: DatabaseUser };
}

// Comment with user and children
export interface CommentWUC extends Omit<Comment, 'expand' | 'user' | 'children'> {
    user: User;
    children: CommentWUC[];
}