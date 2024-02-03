import React, {useContext} from 'react';
import {ProfileContext} from './ProfileContext';
import {PageError} from "@/Components/PageError";

export const ProfileError = () => {
    const {isError, errorDetails} = useContext(ProfileContext);

    if (isError) {
        return <PageError description={errorDetails.description} errCode={errorDetails.errCode}/>;
    }

    return null;
};