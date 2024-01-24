import {deleteLocalData, getLocalDataByID, putLocalData, updateLocalData} from "../API/pocketbase";

/**
 * Returns the comments from a given comment section.
 * **Special case if it is a profile comment section, the ID will be
 * the hash of the userID.**
 * @param section_id
 */
export const retrieveComments = async function (section_id: string) {
    const comment_section = await getLocalDataByID<CommentSection>("comment_section", section_id, "comments, comments.user");
    let comments = comment_section.expand.comments ?? [];
    comments.map(c => c.user = c.expand.user);
    comments.map(c => delete c.expand);
    return comments;
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
export const submitComment = async function (user_id: string, owner_record_id: string, section_id: string, content: string, parent: Comment = null) {
    try {
        const user: User = await retrieveUser(user_id);
        // Just a random, valid, and unique ID.
        const commentID = hashString(section_id + user_id + content);
        const comment: { user: string; parent: Comment; id: string; content: string } = {
            id: commentID,
            user: user.id,
            parent: parent,
            content: content
        };
        await putLocalData("comments", comment);

        try {
            let record = await getLocalDataByID("comment_section", section_id);
            record.comments.push(commentID);
            await updateLocalData("comment_section", record, record.id);
        } catch (error) {
            console.log(error);
            await putLocalData("comment_section", {id: section_id, owner: owner_record_id, comments: [comment.id]})
        }


        return {...comment, user: user};
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
