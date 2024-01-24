import {Record, DatabaseUser} from "./databaseInterfaces";


interface CommentSection extends Record {
    owner: string;
    comments: string[];
    expand?: {comments: Comment[]};
}

interface Comment extends Record {
    user: string;
    parent: string;
    content: string;
    expand?: {user: DatabaseUser };
}