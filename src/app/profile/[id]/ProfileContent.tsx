import React, {useContext} from 'react';
import {TopContainer} from "../Components/TopContainer";
import {ShowcaseList} from "@/Pages/profile/Components/ShowcaseList";
import {SectionWrapper} from "@/Pages/profile/Components/SectionWrapper";
import {ProfileContext} from "@/Pages/profile/ProfileContext";
import {ProfileRecommendations} from "@/Pages/profile/Components/ProfileRecommendations";
import {PlaylistItemList} from "@/Pages/profile/Components/PlaylistItemList";
import CommentSection from "@/Components/CommentSection";
import {hashString} from "@/Tools/utils";
import {UserReviews} from "@/Components/UserReviews";


export const ProfileContent = () => {
    const {pageUser, isOwnPage, playlists} = useContext(ProfileContext);
    return (
        <div className={"flex flex-col gap-4 justify-center items-center"}>
            <React.Fragment>

                <TopContainer/>

                <SectionWrapper title={"Top items showcase."} description={"Blah blah blah"}>
                    <ShowcaseList start={0} end={9}/>
                </SectionWrapper>

                <SectionWrapper title={'profile Recommendations'}
                                description={'These are the recommended profiles based on your preferences.'}>
                    <ProfileRecommendations/>
                </SectionWrapper>

                <SectionWrapper title={'Reviews'} description={'Blah blah blah'}>
                    <UserReviews user={pageUser} />
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