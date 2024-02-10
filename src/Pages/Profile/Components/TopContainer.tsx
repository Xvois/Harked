import React, {useState} from "react";
import {isLoggedIn} from "@/Tools/users";
import {ComparisonLink, UserContainer} from "./UserContainer";
import {User} from "@/Tools/Interfaces/userInterfaces";
import {DatabaseUser} from "@/Tools/Interfaces/databaseInterfaces";
import {Datapoint} from "@/Tools/Interfaces/datapointInterfaces";

export function TopContainer(props: {
    pageUser: User;
    followers: DatabaseUser[];
    isLoggedUserFollowing: boolean;
    isOwnPage: boolean;
    loggedUserID: string;
    selectedDatapoint: Datapoint;
    terms: string[];
    setTermIndex: React.Dispatch<React.SetStateAction<number>>;
    termIndex: number;
}) {
    const {
        pageUser,
        followers,
        isLoggedUserFollowing,
        isOwnPage,
        loggedUserID,
        selectedDatapoint,
        terms,
        setTermIndex,
        termIndex
    } = props;

    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    window.addEventListener("resize", () => setWindowWidth(window.innerWidth));

    return (
        <div>
            <UserContainer {...{
                windowWidth,
                pageUser,
                followers,
                isLoggedUserFollowing,
                isOwnPage,
                loggedUserID,
                selectedDatapoint
            }}/>
        </div>
    );
}