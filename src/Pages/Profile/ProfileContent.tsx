import React, {useContext} from 'react';
import {TopContainer} from "./Components/TopContainer";
import {ShowcaseList} from "@/Pages/Profile/Components/ShowcaseList";
import {SectionWrapper} from "@/Pages/Profile/Components/SectionWrapper";
import {ProfileContext} from "@/Pages/Profile/ProfileContext";
import {ProfileRecommendations} from "@/Pages/Profile/Components/ProfileRecommendations";
import {PlaylistItemList} from "@/Pages/Profile/Components/PlaylistItemList";
import CommentSection from "@/Components/CommentSection";
import {hashString} from "@/Tools/utils";


export const ProfileContent = () => {
    const {pageUser, isOwnPage, playlists} = useContext(ProfileContext);
    return (
        <div className={"flex flex-col gap-4 justify-center items-center"}>
            <React.Fragment>

                <TopContainer/>

                <SectionWrapper title={"Top items showcase."} description={"Blah blah blah"}>
                    <ShowcaseList start={0} end={9}/>
                </SectionWrapper>

                <SectionWrapper title={'Profile Recommendations'}
                                description={'These are the recommended profiles based on your preferences.'}>
                    <ProfileRecommendations/>
                </SectionWrapper>

                <SectionWrapper title={'Playlist Items'} description={'These are the playlists available for you.'}>
                    <PlaylistItemList playlists={playlists}/>
                </SectionWrapper>

                <SectionWrapper title={'Comment section.'} description={"View and contribute to the discussion."}>
                    {
                        pageUser &&
                        <CommentSection sectionID={hashString(pageUser.id)} isAdmin={isOwnPage}/>

                    }
                </SectionWrapper>

            </React.Fragment>
        </div>
    );
};