import {deleteLocalData, getLocalDataByID, putLocalData, updateLocalData} from "@/API/pocketbase";
import {CommentSection, CommentWithUser} from "./Interfaces/commentInterfaces";
import {chunks, hashString} from "./utils";
import {retrieveUser} from "./users";
import {User} from "./Interfaces/userInterfaces";

export const retrieveComments = async function (section_id: string): Promise<CommentWithUser[]> {
    const comment_section = await getLocalDataByID<CommentSection>("comment_section", section_id, "comments, comments.user");
    const comments = comment_section.expand.comments ?? [];
    const userIDs = new Set(comments.map(c => c.expand.user.user_id));

    const userIDChunks: string[][] = chunks(Array.from(userIDs), 50);
    let users: User[] = [];
    for (const chunk of userIDChunks) {
        const userPromises = chunk.map(id => retrieveUser(id));
        const chunkUsers = await Promise.all(userPromises);
        users = [...users, ...chunkUsers];
    }

    let formattedComments: CommentWithUser[] = [];
    const userMap = new Map();
    users.forEach(u => userMap.set(u.id, u));
    comments.forEach(c => {
        const user = userMap.get(c.expand.user.user_id);
        formattedComments.push({...c, user: user});
    })

    return formattedComments;
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
        const user = await retrieveUser(user_id);
        // Just a random, valid, and unique ID.
        const commentID = hashString(section_id + user_id + content);
        const comment = {
            id: commentID,
            user: user.id,
            parent: parent,
            content: content
        };
        await putLocalData("comments", comment);

        try {
            let record = await getLocalDataByID<CommentSection>("comment_section", section_id);
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
