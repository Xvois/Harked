import React, {useEffect, useRef, useState} from "react";
import {isLoggedIn, retrieveLoggedUserID} from "@/Tools/users";
import {deleteComment, retrieveComments, submitComment} from "@/Tools/comments";
import {User} from "@/Tools/Interfaces/userInterfaces";
import {StyledField} from "@/Components/styles";
import {CommentWithUser} from "@/Tools/Interfaces/commentInterfaces";

export function CommentSection(props: { sectionID: string, owner: User, isAdmin: boolean }) {
    // An admin will be able to delete all comments in the comment section
    const {sectionID, owner, isAdmin} = props;
    const [comments, setComments] = useState([]);
    const [loggedUserID, setLoggedUserID] = useState(null)
    const valueRef = useRef(null); // Creating a reference for TextField Component
    const charLimit = 500;

    useEffect(() => {
        if (isLoggedIn()) {
            retrieveLoggedUserID().then(id => setLoggedUserID(id));
        }
        retrieveComments(sectionID).then(function (c) {
            setComments(c);
        })
    }, [])

    const handleSubmit = () => {
        submitComment(loggedUserID, owner.id, sectionID, valueRef.current.value)
            .then((c) => {
                const date = new Date();
                const formattedComment = {...c, created: date};
                const newComments = comments.concat([formattedComment]);
                setComments(newComments);
            })
            .catch((err) => {
                console.error(err);
            });
    };

    const handleDelete = async (id: string) => {
        await deleteComment(id);
        const newComments = comments.filter((c) => c.id !== id);
        setComments(newComments);
    };

    return (
        <>
            {isLoggedIn() && (
                <div className="comment-submit-field">
                    <form noValidate autoComplete="off">
                        <div
                            onKeyDown={(e) => {
                                if (e.keyCode === 13 && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                            }}
                        >
                            <StyledField
                                fullWidth
                                id="outlined-textarea"
                                label="Comment"
                                placeholder="Write your thoughts"
                                variant="outlined"
                                rows={2}
                                multiline
                                inputRef={valueRef}
                                inputProps={{maxLength: charLimit}}
                            />
                        </div>
                        <div style={{margin: "0 0 0 auto", width: "max-content"}}>
                            <button className="std-button"
                                    style={{
                                        background: 'rgba(125, 125, 125, 0.1)',
                                        borderColor: 'rgba(125, 125, 125, 0.2)',
                                        borderTop: "none"
                                    }} type={"button"} onClick={handleSubmit}>
                                Submit
                            </button>
                        </div>
                    </form>
                </div>
            )}
            <div className="comments-wrapper">
                {comments.length > 0 ? (
                    comments.map((c) => {
                        const ownComment = isLoggedIn() ? loggedUserID === c.user.user_id : false;
                        return <CommentInstance key={c.id} item={c} onDelete={handleDelete}
                                                isDeletable={ownComment || isAdmin} canReply/>;
                    })
                ) : (
                    <p style={{color: "var(--secondary-colour)"}}>Looks like there aren't any comments yet.</p>
                )}
            </div>
        </>
    );
}

function CommentInstance(props: { item: CommentWithUser, onDelete: any, isDeletable: boolean, canReply: boolean }) {
    const {item, onDelete, isDeletable, canReply} = props;
    const user = item.user;
    const date = new Date(item.created);

    const handleDelete = async () => {
        await onDelete(item.id);
    };

    return (
        <div className="comment">
            <a href={`/profile#${user.id}`}>{user.display_name}</a>
            {item.created && (
                <p style={{fontSize: "12px", color: "var(--accent-colour)", paddingBottom: "5px"}}>
                    {date.getUTCDate()}/{date.getUTCMonth()}/{date.getFullYear()}
                </p>
            )}
            <p>{item.content}</p>
            <div
                style={{
                    display: 'flex',
                    gap: '15px',
                    width: "max-content",
                    marginLeft: "auto"
                }}>
                {isDeletable && (
                    <button
                        onClick={handleDelete}
                        className={'subtle-button'}>
                        Delete
                    </button>
                )}
            </div>
        </div>
    );
}