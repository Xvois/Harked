// ProfileLoader.tsx
import React, {useContext} from 'react';
import {ProfileContext} from './ProfileContext';
import {LoadingIndicator} from "@/Components/LoadingIndicator";

export const ProfileLoader = () => {
    const {loaded} = useContext(ProfileContext);

    if (!loaded) {
        return <LoadingIndicator/>;
    }

    return null;
};