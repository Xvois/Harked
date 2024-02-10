import React, {useEffect, useState} from "react";
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
import {Badge} from "@/Components/ui/badge";


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
        <div className={"inline-flex gap-4"}>
            {profileImages && (
                <div>
                    <img className={"w-16 h-16 rounded-full object-cover"} alt={'profile picture'} srcSet={profileImageSrcSet}/>
                </div>
            )}
            <div className={"flex flex-col"}>

                <div className={"inline-flex flex-row gap-2 items-center"}>
                    <p className={"text-4xl font-bold"}>
                        {pageUser.display_name}
                    </p>
                    <SpotifyLink simple link={`https://open.spotify.com/user/${pageUser.id}`}/>
                </div>

                <div className={"inline-flex gap-2"}>
                    <Badge variant={"outline"}>{selectedDatapoint.top_artists[0].name}</Badge>
                    <Badge variant={"outline"}>{selectedDatapoint.top_tracks[0].name}</Badge>
                    <Badge variant={"outline"}>{selectedDatapoint.top_genres[0]}</Badge>
                </div>

            </div>
            <div>
                <div style={{marginTop: 'auto'}}>
                    {windowWidth < 700 && !isOwnPage && isLoggedIn() &&
                        <ComparisonLink simple pageUser={pageUser} loggedUserID={loggedUserID}
                                        selectedDatapoint={selectedDatapoint}/>
                    }
                </div>
            </div>
        </div>
    )
}
