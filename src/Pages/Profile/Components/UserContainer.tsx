import React, {useContext, useEffect, useState} from "react";
import {retrieveDatapoint} from "@/Tools/datapoints";
import {calculateSimilarity} from "@/Analysis/analysis";
import {ValueIndicator} from "@/Components/ValueIndicator";
import {Datapoint} from "@/Tools/Interfaces/datapointInterfaces";
import {User} from "@/Tools/Interfaces/userInterfaces";
import {Badge} from "@/Components/ui/badge";
import {UserRoundMinus, UserRoundPlus} from "lucide-react";
import {ProfileContext} from "@/Pages/Profile/ProfileContext";
import {useAuth} from "@/Authentication/AuthContext";
import {Skeleton} from "@/Components/ui/skeleton";


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

export function UserContainer(props: {}) {
    const {isAuthenticated} = useAuth();
    const {pageUser, isLoggedUserFollowing, isOwnPage} = useContext(ProfileContext);

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
                            <h1 className="text-2xl font-bold tracking-tighter sm:text-4xl">
                                {pageUser.display_name}
                            </h1>
                            :
                            <Skeleton className={"h-8 w-48"}/>
                        }
                        {pageUser &&
                            <div className={"space-y-2 justify-center"}>
                                <div className={"flex justify-center gap-4"}>
                                    <Badge className={"text-sm"}>{pageUser.followers.total} followers</Badge>
                                    <Badge variant={"outline"} className={"w-max"}>Pro</Badge>
                                    {isAuthenticated && !isOwnPage &&
                                        (
                                            isLoggedUserFollowing ?
                                                <button className={"p-0 bg-none"}>
                                                    <UserRoundMinus/>
                                                </button>
                                                :
                                                <button className={"p-0 bg-none"}>
                                                    <UserRoundPlus/>
                                                </button>
                                        )

                                    }
                                </div>
                                <div className={"flex justify-between gap-4"}>
                                    <Badge variant={"secondary"}>Developer</Badge>
                                    <Badge variant={"secondary"}>Tester</Badge>
                                </div>
                            </div>
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}
