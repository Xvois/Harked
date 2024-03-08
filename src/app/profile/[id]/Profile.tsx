import {ProfileContextProvider} from "@/Pages/profile/ProfileContext";
import React from "react";
import {ProfileContent} from "@/Pages/profile/ProfileContent";

export const Profile = () => {
    return (
        <ProfileContextProvider>
            <ProfileContent/>
        </ProfileContextProvider>
    )
}