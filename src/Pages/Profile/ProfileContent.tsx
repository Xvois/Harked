import React, {useContext} from 'react';
import {ProfileContext} from './ProfileContext';
import {TopContainer} from "./Components/TopContainer";
import {LoadingIndicator} from "@/Components/LoadingIndicator";


export const ProfileContent = () => {
    const {
        pageUser,
        followers,
        isLoggedUserFollowing,
        isOwnPage,
        loggedUserID,
        selectedDatapoint,
        terms,
        setTermIndex,
        termIndex,
        loaded
    } = useContext(ProfileContext);

  // Use the state variables to render the content

  return (
    <div className='wrapper'>
        <LoadingIndicator/>
        {loaded &&
            <TopContainer {...{
                pageUser,
                followers,
                isLoggedUserFollowing,
                isOwnPage,
                loggedUserID,
                selectedDatapoint,
                terms,
                setTermIndex,
                termIndex
            }}/>
        }
      {/* Other components go here */}
    </div>
  );
};