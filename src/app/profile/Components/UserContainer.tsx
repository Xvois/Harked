import React, {useContext, useEffect, useState} from "react";
import {retrieveDatapoint} from "@/Tools/datapoints";
import {calculateSimilarity} from "@/Analysis/analysis";
import {ValueIndicator} from "@/Components/ValueIndicator";
import {Datapoint} from "@/Tools/Interfaces/datapointInterfaces";
import {User} from "@/Tools/Interfaces/userInterfaces";
import {Badge} from "@/Components/ui/badge";
import {UserRoundMinus, UserRoundPlus} from "lucide-react";
import {ProfileContext} from "@/Pages/profile/ProfileContext";
import {useAuth} from "@/Authentication/AuthContext";
import {Skeleton} from "@/Components/ui/skeleton";
import {followUser, unfollowUser} from "@/Tools/following";


export function ComparisonLink(props: {
    pageUser: User;
    loggedUserID: string;
    selectedDatapoint: Datapoint;
    simple?: boolean;
}) {
    const {pageUser, loggedUserID, selectedDatapoint, simple = false} = props;
    const [loggedDP, setLoggedDP] = useState(null);


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

export function UserContainer(props: {}) {
    const {user, isAuthenticated} = useAuth();
    const {pageUser, isLoggedUserFollowing, isOwnPage, selectedDatapoint, setIsLoggedUserFollowing} = useContext(ProfileContext);

    const [loggedDP, setLoggedDP] = useState(null);
    const similarity = loggedDP && selectedDatapoint ? calculateSimilarity(loggedDP, selectedDatapoint).overall : null;

    useEffect(() => {
        if (user && isAuthenticated) {
            retrieveDatapoint(user.id, "long_term").then(res => setLoggedDP(res));
        }
    }, [user, isAuthenticated])

    const handleFollow = () => {
        setIsLoggedUserFollowing(true); // Optimistically set state
        followUser(pageUser.id).catch(() => {
            // If the request fails, revert the state
            setIsLoggedUserFollowing(false);
        });
    };

    const handleUnfollow = () => {
        setIsLoggedUserFollowing(false); // Optimistically set state
        unfollowUser(pageUser.id).catch(() => {
            // If the request fails, revert the state
            setIsLoggedUserFollowing(true);
        });
    };

    return (
        <div className="py-6 lg:py-12">
            <div className="grid gap-4 text-center md:gap-8 md:px-6">
                <div className="flex flex-col items-center space-y-2">
                    <div className="rounded-full overflow-hidden border-4">
                        {pageUser ?
                            <img alt="Profile Picture" className="aspect-square" height="100"
                                 srcSet={pageUser.images[0].url}
                                 width="100"/>
                            :
                            <Skeleton className={"h-24 w-24 rounded-full"}/>
                        }

                    </div>
                    <div className="space-y-1">
                        {pageUser ?
                            <div className="relative ">
                                <h2 className={"text-2xl font-bold sm:text-4xl tracking-tighter"}>{pageUser.display_name}</h2>
                                <Badge variant={"secondary"}
                                       className={"absolute left-[100%] bottom-100 -mx-6 -my-5 w-fit backdrop-blur hover:bg-secondary/50 bg-secondary/50"}>Pro</Badge>
                            </div>
                            :
                            <Skeleton className={"h-8 w-48"}/>
                        }
                        {pageUser &&
                            <div className={"space-y-2 justify-center"}>
                                <div className={"flex justify-center gap-4 flex-wrap max-w-48"}>
                                    <Badge className={"text-sm"}>{pageUser.followers.total} followers</Badge>
                                    {isAuthenticated && !isOwnPage &&
                                        (
                                            isLoggedUserFollowing ?
                                                <button className={"p-0 bg-none"}
                                                        onClick={handleUnfollow}>
                                                    <UserRoundMinus/>
                                                </button>
                                                :
                                                <button className={"p-0 bg-none"}
                                                        onClick={handleFollow}>
                                                    <UserRoundPlus/>
                                                </button>
                                        )

                                    }
                                    {
                                        !isOwnPage && similarity &&
                                        <Badge variant={"outline"}>{similarity}%</Badge>

                                    }
                                </div>
                            </div>
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}
