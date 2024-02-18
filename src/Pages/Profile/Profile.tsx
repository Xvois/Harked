import {ProfileContextProvider} from "@/Pages/Profile/ProfileContext";
import React from "react";
import {ProfileContent} from "@/Pages/Profile/ProfileContent";

export const Profile = () => {
    return (
        <ProfileContextProvider>
            <ProfileContent/>
        </ProfileContextProvider>
    )
}