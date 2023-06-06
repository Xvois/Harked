import {ReactJSXElement} from "@emotion/react/types/jsx-namespace";
import DeleteIcon from "@mui/icons-material/Delete";
import {useEffect, useRef, useState} from "react";
import {deleteComment, isLoggedIn, retrieveProfileComments, submitComment} from './HDM'
import {styled, TextField} from "@mui/material";

interface UserInterface {
    id: string,
    username: string,
    email: string,
    user_id: string,
    profile_picture: string,
    created: string,
    updated: string
}

interface CommentInterface {
    id : string,
    user : UserInterface,
    parent : CommentInterface,
    content : string,
    created : string,
    updated: string
}


export const StatBlock = (props: {name: string, description: string, value: number, alignment? : "left" | "right", shadow? : number}) => {
    const {name, description, value, alignment = 'left', shadow = null} = props;

    return (
        <div className={'stat-block'}>
        <h3 style={{textAlign: alignment}}>{name}</h3>
    <div className={'stat-bar'} style={
    {
        '--val': `100%`,
        backgroundColor: 'var(--primary-colour)',
        opacity: '0.1',
        marginBottom: '-5px',
        animation: 'none'
    } as React.CSSProperties
}></div>
    <div className={'stat-bar'}
    style={{'--val': `${value}%`, marginLeft: `${alignment === 'right' ? 'auto' : ''}`} as React.CSSProperties }></div>
    {shadow ?
        <div className={'stat-bar'}
        style={{
            '--val': `${shadow}%`,
            marginLeft: `${alignment === 'right' ? 'auto' : ''}`,
            marginTop: '-5px',
            opacity: '0.25'
    } as React.CSSProperties
        }></div>
    :
        <></>
    }

    <p style={{textAlign: alignment}}>{description}</p>
    </div>
)
}

export const SpotifyLink = (props : {link: string, simple?: boolean}) => {
    const {link, simple = false} = props;
    const darkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return (
        simple ?
            <a href={link} style={{height: 'max-content', alignItems: 'center'}}>
                <img alt={'Spotify logo'} style={{height: '21px', width: '21px'}} src={`/Spotify_Icon_RGB_${!darkMode ? 'Black' : 'White'}.png`} />
            </a>
        :
            <a className={'std-button'} style={{flexDirection: 'row', display: 'flex', alignItems: 'center', gap: '10.5px', height: 'max-content'}} href={link}>
                <img alt={'Spotify logo'} style={{height: '21px', width: '21px'}} src={`/Spotify_Icon_RGB_${!darkMode ? 'Black' : 'White'}.png`} />
                <p style={{margin: '0'}}>Open in Spotify</p>
            </a>
)
}

export const PageError = (props : {icon : ReactJSXElement, description: string}) => {
    const {icon, description} = props;
    return (
        <div style={{top: '50%', left: '0', right: '0', position: 'absolute'}}>
            <div className="centre" style={{textAlign: 'center'}}>
                {icon}
                <h1>{description}</h1>
            </div>
        </div>
    )
}

export const StyledField = styled(TextField)({
    "& .MuiInputBase-root": {
        color: 'var(--primary-colour)'
    },
    '& .MuiInput-underline': {
        color: `var(--secondary-colour)`,
    },
    '& .MuiFormLabel-root.Mui-disabled': {
        color: `var(--secondary-colour)`,
    },
    '& .MuiInput-underline:after': {
        borderBottomColor: 'var(--accent-colour)',
    },
    '& .MuiOutlinedInput-root': {
        '& fieldset': {
            borderColor: 'var(--secondary-colour)',
            borderRadius: `0px`,
            borderWidth: '1px',
            transition: `all 0.1s ease-in`
        },
        '&:hover fieldset': {
            borderColor: 'var(--secondary-colour)',
        },
        '&.Mui-focused fieldset': {
            borderColor: 'var(--secondary-colour)',
            borderWidth: '1px',
            transition: `all 0.1s ease-in`
        },
    },
    '& label.Mui-focused': {
        color: 'var(--primary-colour)',
        fontFamily: 'Inter Tight, sans-serif',
    },
    '& .MuiFormLabel-root': {
        color: 'var(--primary-colour)',
        marginLeft: `5px`,
        fontFamily: 'Inter Tight, sans-serif',
    },
});
// PAGE HASH SHOULD BE CHANGED SO THE COMMENT SECTION CAN BE USED ON ANY PAGE
export function CommentSection (props : {pageHash : string, isAdmin : boolean}) {
    // An admin will be able to delete all comments in the comment section
    const {pageHash, isAdmin} = props;
    const [comments, setComments] = useState([]);
    const valueRef = useRef(""); // Creating a reference for TextField Component
    const charLimit = 500;
    const loggedIn = isLoggedIn();
    const loggedUserID = loggedIn ? window.localStorage.getItem('user_id') : null;

    useEffect(() => {
        retrieveProfileComments(pageHash).then(function(c) {
            setComments(c);
        })
    }, [])

    const handleSubmit = () => {
        submitComment(window.localStorage.getItem("user_id"), pageHash, valueRef.current)
            .then((c) => {
                const newComments = comments.concat([c]);
                setComments(newComments);
            })
            .catch((err) => {
                console.error(err);
            });
    };

    const handleDelete = async (comment) => {
        await deleteComment(comment);
        const newComments = comments.filter((c) => c.id !== comment.id);
        setComments(newComments);
    };

    return (
        <>
            {loggedIn && (
                <div className="comment-submit-field">
                    <form noValidate autoComplete="off">
                        <div>
                            <StyledField
                                id="outlined-textarea"
                                label="Comment"
                                placeholder="Write your thoughts"
                                multiline
                                variant="outlined"
                                rows={2}
                                inputRef={valueRef}
                                inputProps={{ maxLength: charLimit }}
                            />
                        </div>
                    </form>
                    <div style={{ margin: "0 0 0 auto", width: "max-content" }}>
                        <button className="std-button" onClick={handleSubmit}>
                            Submit
                        </button>
                    </div>
                </div>
            )}
            <div className="comments-wrapper">
                {comments.length > 0 ? (
                    comments.map((c) => {
                        const ownComment = loggedIn ? loggedUserID === c.user.user_id : false;
                        return <Comment key={c.id} item={c} onDelete={handleDelete} isDeletable={ownComment || isAdmin} />;
                    })
                ) : (
                    <p style={{ color: "var(--secondary-colour)" }}>Looks like there aren't any comments yet.</p>
                )}
            </div>
        </>
    );
}
function Comment(props : {item : CommentInterface, onDelete : any, isDeletable : boolean}) {
    const { item, onDelete, isDeletable } = props;
    const user = item.user;
    const date = new Date(item.created);

    const handleDelete = async () => {
        await onDelete(item);
    };

    return (
        <div className="comment">
            <a href={`/profile#${user.user_id}`}>{user.username}</a>
            {item.created && (
                <p style={{ fontSize: "12px", color: "var(--accent-colour)", paddingBottom: "5px" }}>
                    {date.getUTCDate()}/{date.getUTCMonth()}/{date.getFullYear()}
                </p>
            )}
            <p>{item.content}</p>
            {isDeletable && (
                <button
                    style={{ background: "none", border: "none", color: "var(--accent-colour)", width: "max-content", cursor: "pointer", marginLeft: "auto" }}
                    onClick={handleDelete}
                >
                    <DeleteIcon />
                </button>
            )}
        </div>
    );
}