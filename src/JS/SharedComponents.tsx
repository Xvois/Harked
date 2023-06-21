import {ReactJSXElement} from "@emotion/react/types/jsx-namespace";
import DeleteIcon from "@mui/icons-material/Delete";
import React, {useEffect, useRef, useState} from "react";
/* @ts-ignore */
import {
    Comment,
    deleteComment, followUser,
    isLoggedIn,
    retrieveComments,
    retrieveLoggedUserID,
    submitComment,
    unfollowUser,
    User
} from "./HDM.ts"
import {styled, TextField} from "@mui/material";

export const StatBlock = (props: {
    name: string,
    description: string,
    value: number,
    alignment?: "left" | "right",
    shadow?: number
}) => {
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
                 style={{
                     '--val': `${value}%`,
                     marginLeft: `${alignment === 'right' ? 'auto' : ''}`
                 } as React.CSSProperties}></div>
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

export const SpotifyLink = (props: { link: string, simple?: boolean }) => {
    const {link, simple = false} = props;
    const darkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return (
        simple ?
            <a href={link} style={{height: 'max-content', alignItems: 'center'}}>
                <img alt={'Spotify logo'} style={{height: '21px', width: '21px', marginBottom: '-4px'}}
                     src={`/Spotify_Icon_RGB_${!darkMode ? 'Black' : 'White'}.png`}/>
            </a>
            :
            <a className={'std-button'} style={{
                flexDirection: 'row',
                display: 'flex',
                alignItems: 'center',
                gap: '10.5px',
                height: 'max-content'
            }} href={link}>
                <img alt={'Spotify logo'} style={{height: '21px', width: '21px'}}
                     src={`/Spotify_Icon_RGB_${!darkMode ? 'Black' : 'White'}.png`}/>
                <p style={{margin: '0'}}>Open in Spotify</p>
            </a>
    )
}

export const PageError = (props: { icon: ReactJSXElement, description: string, errCode?: string }) => {
    const {icon, description, errCode} = props;
    console.log(props);
    return (
        <div className="centre" style={{textAlign: 'center', width: '75%'}}>
            {icon}
            <h1>{description}</h1>
            {errCode && (
                <p>ERR CODE: {errCode}</p>
            )}
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

export function LoadingIndicator() {
    return (
        <div className={'centre'}>
            <div className="lds-grid">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
            </div>
        </div>
    )
}

export function ValueIndicator(props: { value: number, diameter?: number }) {
    const {value, diameter = 70} = props;
    const padding = 5 * (diameter / 70);

    return (
        <div style={{
            padding: '3px',
            border: `3px solid var(--primary-colour)`,
            borderRadius: '100%',
            height: 'max-content',
            width: 'max-content',
            margin: 'auto'
        }}>
            <div style={{
                position: 'relative',
                height: `${diameter}px`,
                width: `${diameter}px`,
                padding: `${padding}px`,
                borderRadius: '100%',
                overflow: 'hidden'
            }}>
                <div style={{
                    zIndex: '0',
                    transform: `translate(0, ${(diameter + 2 * padding) - ((value / 100) * (diameter + 2 * padding))}px)`,
                    position: 'absolute',
                    height: `${diameter + 2 * padding}px`,
                    width: `${diameter + 2 * padding}px`,
                    background: 'var(--accent-colour)',
                    top: '0',
                    left: '0',
                    animation: 'rise 1s ease-out'
                }}/>
                <div style={{position: 'relative', width: '100%', height: '100%'}}>
                    <div className={'centre'}>
                        <h2 style={{
                            margin: '0',
                            color: 'var(--primary-colour)',
                            fontSize: `${(diameter / 70) * 24}px`
                        }}>{Math.round(value)}%</h2>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function CommentSection(props: { sectionID: string, isAdmin: boolean }) {
    // An admin will be able to delete all comments in the comment section
    const {sectionID, isAdmin} = props;
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
        submitComment(loggedUserID, sectionID, valueRef.current.value)
            .then((c) => {
                const newComments = comments.concat([c]);
                setComments(newComments);
            })
            .catch((err) => {
                console.error(err);
            });
    };

    const handleDelete = async (id) => {
        await deleteComment(id);
        const newComments = comments.filter((c) => c.id !== id);
        setComments(newComments);
    };

    return (
        <>
            {isLoggedIn() && (
                <div className="comment-submit-field">
                    <form noValidate autoComplete="off" onSubmit={handleSubmit}>
                        <div
                            onKeyDown={(e) => {
                                if (e.keyCode === 13 && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                            }}
                        >
                            <StyledField
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
                            <button className="std-button" type={"submit"}>
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
                                                isDeletable={ownComment || isAdmin}/>;
                    })
                ) : (
                    <p style={{color: "var(--secondary-colour)"}}>Looks like there aren't any comments yet.</p>
                )}
            </div>
        </>
    );
}

function CommentInstance(props: { item: Comment, onDelete: any, isDeletable: boolean }) {
    const {item, onDelete, isDeletable} = props;
    const user: User = item.user;
    const date = new Date(item.created);

    const handleDelete = async () => {
        await onDelete(item.id);
    };

    return (
        <div className="comment">
            <a href={`/profile#${user.user_id}`}>{user.username}</a>
            {item.created && (
                <p style={{fontSize: "12px", color: "var(--accent-colour)", paddingBottom: "5px"}}>
                    {date.getUTCDate()}/{date.getUTCMonth()}/{date.getFullYear()}
                </p>
            )}
            <p>{item.content}</p>
            {isDeletable && (
                <button
                    style={{
                        background: "none",
                        border: "none",
                        color: "var(--accent-colour)",
                        width: "max-content",
                        cursor: "pointer",
                        marginLeft: "auto"
                    }}
                    onClick={handleDelete}
                >
                    <DeleteIcon/>
                </button>
            )}
        </div>
    );
}