import React, {useEffect, useState} from "react";
import {isLoggedIn} from "@/Tools/users";
import ArrowCircleDownIcon from "@mui/icons-material/ArrowCircleDown";
import ArrowCircleUpIcon from "@mui/icons-material/ArrowCircleUp";
import ClearAllOutlinedIcon from "@mui/icons-material/ClearAllOutlined";
import FlareIcon from "@mui/icons-material/Flare";
import {getGenresRelatedArtists, getSimilarArtists, getTrackRecommendations} from "@/Tools/similar";
import {getAverageAnalytics, getItemIndexChange, getLIDescription, getLIName} from "@/Analysis/analysis";
import {TrackAnalysis} from "./TrackAnalysis";
import {ArtistAnalysis} from "./ArtistAnalysis";
import {PlFromListWithTracks} from "@/API/Interfaces/playlistInterfaces";
import {User} from "@/Tools/Interfaces/userInterfaces";
import {Datapoint, Term} from "@/Tools/Interfaces/datapointInterfaces";
import {Artist} from "@/API/Interfaces/artistInterfaces";
import {TrackWithAnalytics} from "@/API/Interfaces/trackInterfaces";
import {createPictureSources, isArtist, isTrack} from "@/Tools/utils";
import {ItemDescriptor} from "@/Analysis/ItemDescriptor";
import {ShowcaseListItem} from "@/Pages/Profile/Components/ShowcaseListItem";

export const ShowcaseList = (props: {
    pageUser: User;
    playlists: Array<PlFromListWithTracks>;
    allDatapoints: Datapoint[];
    selectedDatapoint: Datapoint;
    selectedPrevDatapoint?: Datapoint;
    type: string;
    start: number;
    end: number;
    term: Term;
    isOwnPage: boolean;
}) => {
    const {
        pageUser,
        playlists,
        allDatapoints,
        selectedDatapoint,
        selectedPrevDatapoint = null,
        type,
        start,
        end,
        term,
        isOwnPage
    } = props;

    console.log(selectedDatapoint)

    return (
        <div className={'showcase-list-wrapper'}>
            {selectedDatapoint[`top_${type}s`].map(function (element: Artist | TrackWithAnalytics | string, index: number) {
                if (index >= start && index <= end) {
                    return (
                        <ShowcaseListItem
                            key={(isTrack(element) || isArtist(element)) ? element.id : element}
                            allDatapoints={allDatapoints}
                            pageUser={pageUser} playlists={playlists} element={element}
                            index={index} selectedDatapoint={selectedDatapoint}
                            selectedPrevDatapoint={selectedPrevDatapoint} type={type} term={term}
                            isOwnPage={isOwnPage}/>
                    )
                }
            })}
        </div>
    )
}

