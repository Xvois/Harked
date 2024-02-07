import {ProfileContextProvider} from "@/Pages/Profile/ProfileContext";
import React from "react";
import {ProfileContent} from "@/Pages/Profile/ProfileContent";
import {ProfileError} from "@/Pages/Profile/ProfileError";
import {ProfileLoader} from "@/Pages/Profile/ProfileLoader";

export const Profile = () => {
    return (
        <ProfileContextProvider>
            <ProfileLoader/>
            <ProfileContent/>
            <ProfileError/>
        </ProfileContextProvider>
    )
}