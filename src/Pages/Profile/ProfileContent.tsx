import React, {useContext} from 'react';
import {ProfileContext} from './ProfileContext';
import {TopContainer} from "./Components/TopContainer";
import {LoadingIndicator} from "@/Components/LoadingIndicator";
import {ShowcaseList} from "@/Pages/Profile/Components/ShowcaseList";
import {Term} from "@/Tools/Interfaces/datapointInterfaces";
import {ProfileRecommendations} from "@/Pages/Profile/Components/ProfileRecommendations";
import {PlaylistItemList} from "@/Pages/Profile/Components/PlaylistItemList";
import {CommentSection} from "@/Components/CommentSection";


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
        loaded,
        playlists,
        allDatapoints,
        selectedPrevDatapoint,
    } = useContext(ProfileContext);

    // Use the state variables to render the content

    return (
        <div className='wrapper'>
            {loaded && <React.Fragment>
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
                <ShowcaseList {...{
                    pageUser,
                    playlists,
                    allDatapoints,
                    selectedDatapoint,
                    selectedPrevDatapoint,
                    isOwnPage
                }}
                              term={terms[termIndex] as Term} start={0} end={9} type={'genre'}/>
                <ProfileRecommendations isOwnPage={isOwnPage} pageGlobalUserID={pageUser.id} />
                <PlaylistItemList playlists={playlists}/>
                <CommentSection sectionID={pageUser.id} owner={pageUser} isAdmin={isOwnPage} />
            </React.Fragment>
            }
            {/* Other components go here */}
        </div>
    );
};