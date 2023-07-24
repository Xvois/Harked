import {ReactElement, SetStateAction, useEffect, useRef, useState} from "react";
/* @ts-ignore */
import {
    Album,
    Artist,
    Comment,
    deleteComment,
    isLoggedIn,
    retrieveComments,
    retrieveLoggedUserID,
    retrieveSearchResults,
    Song,
    submitComment,
    User
} from "./HDM.ts"
import {Rating, styled, TextField} from "@mui/material";
import {getLIDescription, getLIName} from "./Analysis"

export const StyledRating = styled(Rating)({
    '& .MuiRating-iconEmpty': {
        color: 'var(--secondary-colour)',
    },
    '& .MuiRating-iconFilled': {
        color: 'var(--primary-colour)',
    },
    '& .MuiRating-iconHover': {
        color: 'var(--primary-colour)',
    },
});

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
                     marginLeft: `${alignment === 'right' ? 'auto' : ''}`,
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

export function LoadingObject(props: { num: number, height? : number }) {

    const {num, height = 156} = props;

    const arr = [];

    for(let i = 0; i < num; i++) {
        arr.push(i);
    }

    return (
        <div style={{width: '100%', height: '100%'}}>
            <div className="loading-object-instance">
                {arr.map(i => <div className="animated-background" key={`loading_object_${i}`} style={{animationDelay: `${i / 10}s`, height: `${height}px`}}></div>)}
            </div>
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

export const PageError = (props: { description: string, errCode?: string }) => {
    const {description, errCode} = props;
    return (
        !!description ?
            <div className="page-error centre">
                <h1 style={{margin: 0}}>Uh oh...</h1>
                <p>{description}</p>
                {errCode && (
                    <p style={{fontSize: '12px'}}>ERR CODE: {errCode}</p>
                )}
                <a style={{color: 'var(--primary-colour)'}} href={'/'}>Take me home</a>
            </div>
            :
            <></>
    )
}

export const StyledField = styled(TextField)({
    "& .MuiInputBase-root": {
        background: 'rgba(125, 125, 125, 0.1)',
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
            borderColor: 'rgba(125, 125, 125, 0.2)',
            borderRadius: `0px`,
            borderWidth: '1px',
            transition: `all 0.1s ease-in`
        },
        '&:hover fieldset': {
            borderColor: 'rgba(125, 125, 125, 0.2)',
        },
        '&.Mui-focused fieldset': {
            borderColor: 'rgba(125, 125, 125, 0.2)',
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
                const date = new Date();
                const formattedComment = {...c, created: date};
                const newComments = comments.concat([formattedComment]);
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
                                    style={{background: 'rgba(125, 125, 125, 0.1)', borderColor: 'rgba(125, 125, 125, 0.2)', borderTop: "none"}} type={"button"} onClick={handleSubmit}>
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

function CommentInstance(props: { item: Comment, onDelete: any, isDeletable: boolean, canReply: boolean }) {
    const {item, onDelete, isDeletable, canReply} = props;
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
            <div
                style={{
                    display: 'flex',
                    gap: '15px',
                    width: "max-content",
                    marginLeft: "auto"
                }}>
                {canReply && (
                    <button
                        onClick={handleDelete}
                        className={'subtle-button'}>
                        Reply
                    </button>
                )}
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


export const SimpleModal = (props: {
    id: string,
    showModal: boolean,
    setShowModal: React.Dispatch<SetStateAction<boolean>>,
    children: ReactElement
}) => {

    const {id, showModal, setShowModal, children} = props;

    useEffect(() => {
        const modal = document.getElementById(id) as HTMLDialogElement;
        if (showModal && modal) {
            modal.showModal();
        } else if (!showModal) {
            modal.close();
        }
    }, [showModal])

    return (
        <dialog id={id}>
            <button className={'modal-exit-button'} onClick={() => {setShowModal(false);}}>x</button>
            {children}
        </dialog>
    )
}

export const SelectionModal = (props: {
    showModal: boolean,
    setShowModal: React.Dispatch<SetStateAction<boolean>>,
    onSubmit: Function,
    onModify?: Function,
    modifyTarget?: Song | Artist | Album,
    description?: boolean,
    rating?: boolean
}) => {

    const {showModal, setShowModal, onSubmit, onModify = null, description = false, rating = false, modifyTarget = null} = props;
    const [searchResults, setSearchResults] = useState(null);
    const [selectedItem, setSelectedItem] = useState(modifyTarget);
    const [processing, setProcessing] = useState(false);
    const searchRef = useRef('');
    const descriptionRef = useRef('');
    const [stars, setStars] = useState(0);
    const typeChoices = ['songs', 'artists', 'albums'];
    const [type, setType] = useState(typeChoices[0]);

    useEffect(() => {
        setSelectedItem(modifyTarget);
    }, [modifyTarget])

    useEffect(() => {
        const modal = document.getElementById('rec-modal') as HTMLDialogElement;
        if (showModal) {
            modal.showModal();
        } else if (!showModal) {
            modal.close();
        }
    }, [showModal])

    const handleSearch = () => {
        if (searchRef.current !== null && searchRef.current !== undefined && searchRef.current.value !== '') {
            retrieveSearchResults(searchRef.current.value, type).then(res => {
                setSearchResults(res);
            });
        }
    }

    const successCleanup = () => {
        setSearchResults(null);
        setSelectedItem(null);
        setShowModal(false);
    }

    return (
        <dialog autoFocus id={'rec-modal'}>
            {selectedItem === null ?
                <div style={{justifyContent: 'right'}}>
                    <button className={'modal-exit-button'} onClick={() => {
                        setShowModal(false);
                        setSearchResults(null)
                    }}>x
                    </button>
                    <h3 style={{margin: 0}}>Type</h3>
                    <p style={{marginTop: 0}}>of item.</p>
                    <div id={'rec-type-wrapper'}>
                        {typeChoices.map(t => {
                            return <button type={'button'} onClick={() => setType(t)} key={t}
                                           className={'subtle-button'} style={type === t ? {
                                background: 'var(--primary-colour)',
                                color: 'var(--bg-colour)',
                                textTransform: 'capitalize'
                            } : {textTransform: 'capitalize'}}>{t.slice(0, t.length - 1)}</button>
                        })}
                    </div>
                    <h3 style={{marginBottom: 0}}>Search</h3>
                    <p style={{marginTop: 0}}>for an item.</p>
                    <StyledField
                        placeholder={`Search for ${type}`}
                        variant='outlined'
                        rows={1}
                        inputRef={searchRef}
                        inputProps={{maxLength: 100}}
                    />
                    <div style={{width: "max-content", marginLeft: 'auto'}}>
                        <button className="std-button"
                                style={{background: 'rgba(125, 125, 125, 0.1)', borderColor: 'rgba(125, 125, 125, 0.2)', borderTop: "none"}} type={"button"} onClick={handleSearch}>
                            Search
                        </button>
                    </div>
                    {searchResults && (
                        <div id={'rec-search-results'}>
                            {/* Render search results */}
                            {searchResults.slice(0, 5).map((result, index) => {
                                return (
                                    <div key={getLIName(result) + index} style={{position: 'relative'}}>
                                        {index % 2 === 0 && <div className={'bg-element'}/>}
                                        <button onClick={() => setSelectedItem(result)} className={'rec-search-result'}>
                                            <img alt={getLIName(result)} src={result.image}
                                                 className={'levitating-image'}/>
                                            <h4>{getLIName(result, 20)}</h4>
                                            <p>{getLIDescription(result, 20)}</p>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )
                    }
                </div>
                :
                <div>
                    {processing && (
                        <div className={'processing-indicator-wrapper'}>
                            <LoadingIndicator/>
                        </div>
                    )
                    }
                    <button className={'modal-exit-button'} onClick={() => {
                        setShowModal(false);
                        setSearchResults(null)
                    }}>x
                    </button>
                    <form>
                        <div style={{position: 'relative'}} className={'rec-details-img'}>
                            <img alt={'backdrop-image'} src={selectedItem.image} className={'backdrop-image'}/>
                            <img alt={getLIName(selectedItem)} src={selectedItem.image} className={'levitating-image'}/>
                        </div>
                        <div style={{maxWidth: '300px'}}>
                            <h2 style={{marginBottom: 0}}>{getLIName(selectedItem)}</h2>
                            <p style={{marginTop: 0}}>{getLIDescription(selectedItem)}</p>
                            {rating &&
                                <div style={{marginBottom: '16px'}}>
                                    <StyledRating
                                        name="text-feedback"
                                        value={stars}
                                        onChange={(event, newValue) => {
                                            console.log(newValue);
                                            setStars(newValue);
                                        }}
                                        precision={0.5}
                                    />
                                </div>
                            }
                            {description &&
                            <StyledField
                                variant='outlined'
                                placeholder={'Write your thoughts'}
                                multiline
                                rows={3}
                                inputRef={descriptionRef}
                            />
                            }
                            <div style={{
                                display: 'flex',
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                marginTop: '16px'
                            }}>
                                {modifyTarget === null && (
                                    <button className={'subtle-button'} type={'button'}
                                            onClick={() => setSelectedItem(null)}>Back</button>
                                )}
                                <button className={'subtle-button'} type={"button"} style={{marginLeft: 'auto'}}
                                        onClick={() => {
                                            if (!!modifyTarget) {
                                                setProcessing(true);
                                                onModify(selectedItem, type, descriptionRef.current.value, stars).then(
                                                    () => { setProcessing(false); successCleanup(); });
                                            } else {
                                                setProcessing(true);
                                                onSubmit(selectedItem, type, descriptionRef.current.value, stars).then(
                                                    () => { setProcessing(false); successCleanup(); });
                                            }
                                        }}>
                                    Submit
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            }
        </dialog>
    )
}