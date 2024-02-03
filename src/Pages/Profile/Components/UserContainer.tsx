import React, {useEffect, useState} from "react";
import IosShareIcon from "@mui/icons-material/IosShare";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import {followUser, unfollowUser} from "@/Tools/following"
import {isLoggedIn} from "@/Tools/users";
import {retrieveDatapoint} from "@/Tools/datapoints";
import {calculateSimilarity} from "@/Analysis/analysis";
import {SpotifyLink} from "@/Components/SpotifyLink";
import {ValueIndicator} from "@/Components/ValueIndicator";
import {Datapoint} from "@/Tools/Interfaces/datapointInterfaces";
import {User} from "@/Tools/Interfaces/userInterfaces";
import {createPictureSources} from "@/Tools/utils";

export function ComparisonLink(props: {
    pageUser: User;
    loggedUserID: string;
    selectedDatapoint: Datapoint;
    simple?: boolean;
}) {
    const {pageUser, loggedUserID, selectedDatapoint, simple = false} = props;
    const [loggedDP, setLoggedDP] = useState(null);
    useEffect(() => {
        retrieveDatapoint(loggedUserID, "long_term").then(res => setLoggedDP(res));
        console.log(selectedDatapoint)
    }, [])

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '15px',
            marginLeft: 'auto',
            height: 'max-content',
            flexGrow: '0',
            width: 'max-content'
        }}>
            {simple ?
                <a style={{height: 'max-content'}} href={`/compare#${loggedUserID}&${pageUser.id}`}>
                    <ValueIndicator
                        value={loggedDP === null ? (0) : (calculateSimilarity(loggedDP, selectedDatapoint).overall)}
                        diameter={50}/>
                </a>
                :
                <>
                    <div style={{maxWidth: '500px', marginRight: 'auto', textAlign: 'right'}}>
                        <h3 style={{margin: 0}}>Compare</h3>
                        <p style={{marginTop: 0}}>See how your stats stack up against {pageUser.display_name}'s.</p>
                        <div className={'terms-container'} style={{justifyContent: 'right'}}>
                            <a href={`/compare#${loggedUserID}&${pageUser.id}`}
                               className={'subtle-button'}>Compare</a>
                        </div>
                    </div>
                    <ValueIndicator
                        value={loggedDP === null ? (0) : (calculateSimilarity(loggedDP, selectedDatapoint).overall)}
                        diameter={64.5}/>
                </>
            }
        </div>
    )
}

export function UserContainer(props: {
    windowWidth: any;
    pageUser: User;
    followers: any;
    isLoggedUserFollowing: any;
    loggedUserID: any;
    isOwnPage: any;
    selectedDatapoint: Datapoint;
}) {
    const {
        windowWidth,
        pageUser,
        followers,
        isLoggedUserFollowing,
        loggedUserID,
        isOwnPage,
        selectedDatapoint
    } = props;
    const ShareProfileButton = (props: { simple?: boolean; }) => {
        const {simple = false} = props;
        const location = window.location;
        const origin = (new URL(location.toString())).origin;
        const link = `${origin}/profile/{user.user_id}`;

        const [copied, setCopied] = useState(false);

        const handleShare = () => {
            const content = {
                title: "Harked",
                text: `View ${pageUser.display_name}'s profile on Harked.`,
                url: link
            }
            try {
                if (navigator.canShare(content)) {
                    navigator.share(content).then(() => setCopied(true));
                } else {
                    navigator.clipboard.writeText(`${origin}/profile/${pageUser.id}`).then(() => setCopied(true));
                }
            } catch (error) {
                console.warn('Web Share API not supported. Copying to clipboard.', error);
                navigator.clipboard.writeText(`${origin}/profile/${pageUser.id}`).then(() => setCopied(true));
            }

        }

        window.addEventListener('copy', () => {
            setCopied(false);
        })

        return (
            <>
                {simple ?
                    <button
                        style={{border: 'none', background: 'none', color: 'var(--primary-colour)', cursor: 'pointer'}}
                        onClick={handleShare}>
                        <IosShareIcon fontSize={'small'}/>
                    </button>
                    :
                    <button className={'std-button'} onClick={handleShare}>
                        {copied ?
                            "Copied link!"
                            :
                            "Share profile"
                        }
                    </button>
                }
            </>
        )
    }

    const [isFollowing, setIsFollowing] = useState(isLoggedUserFollowing);
    // For optimistic updates
    const [followerNumber, setFollowerNumber] = useState(followers.length);

    const handleFollowClick = () => {
        if (!isFollowing) {
            setIsFollowing(true);
            const n = followerNumber;
            setFollowerNumber(n + 1);
            followUser(loggedUserID, pageUser.id).then(() => {
                console.info('User followed!');
            }).catch((err) => {
                console.warn(`Error following user: `, err);
                setIsFollowing(false);
                setFollowerNumber(n);
            })
        } else {
            setIsFollowing(false);
            const n = followerNumber;
            setFollowerNumber(n - 1);
            unfollowUser(loggedUserID, pageUser.id).then(() => {
                console.info('User unfollowed!');
            }).catch((err) => {
                console.warn(`Error unfollowing user: `, err);
                setIsFollowing(true);
                setFollowerNumber(n);
            })
        }
    }

    useEffect(() => {
        setIsFollowing(isLoggedUserFollowing);
    }, [isLoggedUserFollowing]);

    useEffect(() => {
        setFollowerNumber(followers.length);
    }, [followers]);

    const profileImages = pageUser.images;
    const profileImageSrcSet = createPictureSources(profileImages, 0.1)

    return (
        <div className='user-container'>
            <div style={{display: 'flex', flexDirection: 'row', maxHeight: '150px', gap: '15px'}}>
                {profileImages && (
                    <div className={'profile-picture'}>
                        <img alt={'profile picture'} className={'levitating-image'} srcSet={profileImageSrcSet}
                             style={{height: '100%', width: '100%', objectFit: 'cover'}}/>
                    </div>
                )}
                <div className={'user-details'}>
                    <p style={{margin: '0'}}>Profile for</p>
                    <h2 style={{margin: '-5px 0 0 0', fontSize: '30px', wordBreak: 'keep-all'}}>
                        {pageUser.display_name}
                        <ShareProfileButton simple/>
                    </h2>
                    <div style={{display: 'flex', flexDirection: 'row', gap: '5px', alignItems: 'center'}}>
                        <a href={`/followers#${pageUser.id}`}
                           style={{margin: '0', color: 'var(--primary-colour)', textDecoration: 'none'}}><span
                            style={{fontWeight: 'bold'}}>{followerNumber}</span> follower{followerNumber !== 1 ? 's' : ''}
                        </a>
                        {isLoggedIn() && !isOwnPage && (
                            <button style={{
                                border: 'none',
                                background: 'none',
                                alignItems: 'center',
                                height: '20px',
                                width: '20px',
                                margin: '0',
                                padding: '0',
                                color: 'var(--primary-colour)',
                                cursor: 'pointer'
                            }}
                                    onClick={handleFollowClick}>
                                {isFollowing ?
                                    <CheckCircleOutlineIcon fontSize={'small'}/>
                                    :
                                    <AddCircleOutlineIcon fontSize={'small'}/>
                                }
                            </button>
                        )}
                    </div>
                </div>
                <div className={'user-links'}>
                    <SpotifyLink simple link={`https://open.spotify.com/user/${pageUser.id}`}/>
                    <div style={{marginTop: 'auto'}}>
                        {windowWidth < 700 && !isOwnPage && isLoggedIn() &&
                            <ComparisonLink simple pageUser={pageUser} loggedUserID={loggedUserID}
                                            selectedDatapoint={selectedDatapoint}/>
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}
