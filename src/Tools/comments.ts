import {deleteLocalData, getLocalDataByID, putLocalData, updateLocalData} from "@/API/pocketbase";
import {Comment, CommentSection, CommentWUC} from "./Interfaces/commentInterfaces";
import {hashString} from "./utils";
import {retrieveUser} from "./users";

// FIXME: WITH LOTS OF COMMENTS WILL BE ISSUE

// This function retrieves comments for a given section.
export const retrieveSectionComments = async function (section_id: string): Promise<CommentWUC[]> {
    // Fetch the comment section data from the local database.
    const comment_section = await getLocalDataByID<CommentSection>("comment_section", section_id, "comments, comments.user");

    // Extract the comments from the fetched data. If there are no comments, default to an empty array.
    const comments = comment_section.expand.comments ?? [];

    const formattedComments: CommentWUC[] = [];

    // For each comment, add the user data to the comment and add it to the formatted comments array.
    for (const c of comments) {
        const cWUC = await retrieveCommentTreeAndUser(c);
        formattedComments.push(cWUC);
    }

    // Return the formatted comments.
    return formattedComments;
}


export const retrieveCommentTreeAndUser = async function (comment: Comment): Promise<CommentWUC> {
    const user = await retrieveUser(comment.expand.user.user_id);
    const childrenPromises = comment.children.map(child => getLocalDataByID<Comment>("comments", child, "user, children, children.user"));
    const children = await Promise.all(childrenPromises);
    const childrenWUC: CommentWUC[] = [];
    for (const c of children) {
        const cWUC = await retrieveCommentTreeAndUser(c);
        childrenWUC.push(cWUC);
    }
    return {...comment, user: user, children: childrenWUC};
}

export const modifyComment = async function (comment_id: string, content: string, likes: number) {
    await updateLocalData("comments", {id: comment_id, content: content, likes: likes}, comment_id);
}

/**
 * Submits a comment to a given comment section, then returns that comment record.
 * @param user_id
 * @param owner_record_id
 * @param section_id
 * @param content
 * @param parent
 * @returns Comment }
 */
export const submitComment = async function (section_id: string, owner_record_id: string, content: string, parent?: string) {
    try {
        // Just a random, valid, and unique ID.
        const commentID = hashString(section_id + owner_record_id + content + parent);
        const comment = {
            id: commentID,
            user: owner_record_id,
            children: [],
            content: content,
            likes: 0
        };
        await putLocalData("comments", comment);
        try {
            // If parent is defined, we need to add the comment to the parent's children.
            if (parent) {
                let parentComment = await getLocalDataByID<Comment>("comments", parent);
                parentComment.children.push(commentID);
                await updateLocalData("comments", parentComment, parent);
                // otherwise, we add the comment to the comment section.
            } else {
                let commentSection = await getLocalDataByID<CommentSection>("comment_section", section_id);
                commentSection.comments.push(commentID);
                await updateLocalData("comment_section", commentSection, commentSection.id);
            }
        } catch (error) {
            if (!parent) {
                await putLocalData("comment_section", {id: section_id, owner: owner_record_id, comments: [comment.id]})
            }
        }
    } catch (error) {
        console.error("Error submitting comment:", error);
        throw error;
    }
};

/**
 * Deletes a comment.
 * @param comment_id
 */
export const deleteComment = async function (comment_id: string) {
    await deleteLocalData("comments", comment_id);
}
