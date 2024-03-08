import React, {createContext, useCallback, useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import {User} from "@/Tools/Interfaces/userInterfaces";
import {DatabaseUser} from "@/Tools/Interfaces/databaseInterfaces";
import {Datapoint} from "@/Tools/Interfaces/datapointInterfaces";
import {PlFromListWithTracks} from "@/API/Interfaces/playlistInterfaces";
import {Settings} from "@/Tools/Interfaces/userMeta";
import {retrieveAllDatapoints} from "@/Tools/datapoints";
import {retrieveUser} from "@/Tools/users";
import {retrievePlaylists} from "@/Tools/playlists";
import {useAuth} from "@/Authentication/AuthContext";
import {followingContainsUser} from "@/Tools/following";

export const ProfileContext = createContext({
    terms: ["short_term", "medium_term", "long_term"] as string[],
    setTerms: (() => {
    }) as React.Dispatch<React.SetStateAction<string[]>>,
    selectedDatapoint: null as Datapoint,
    selectedPrevDatapoint: null as Datapoint,
    termIndex: 2,
    setTermIndex: (() => {
    }) as React.Dispatch<React.SetStateAction<number>>,
    isLoggedUserFollowing: null as boolean,
    setIsLoggedUserFollowing: (() => {
    }) as React.Dispatch<React.SetStateAction<boolean>>,
    pageUser: null as User,
    setPageUser: (() => {
    }) as React.Dispatch<React.SetStateAction<User>>,
    isOwnPage: false,
    allDatapoints: [] as Datapoint[],
    setAllDatapoints: (() => {
    }) as React.Dispatch<React.SetStateAction<Datapoint[]>>,
    allPreviousDatapoints: [] as Datapoint[],
    setAllPreviousDatapoints: (() => {
    }) as React.Dispatch<React.SetStateAction<Datapoint[]>>,
    playlists: [] as PlFromListWithTracks[],
    setPlaylists: (() => {
    }) as React.Dispatch<React.SetStateAction<PlFromListWithTracks[]>>,
    settings: null as Settings,
    setSettings: (() => {
    }) as React.Dispatch<React.SetStateAction<Settings>>,
    profileData: {},
    setProfileData: (() => {
    }) as React.Dispatch<React.SetStateAction<{}>>,
    selectedType: "artist",
    setSelectedType: (() => {
    }) as React.Dispatch<React.SetStateAction<string>>
});

export const ProfileContextProvider = ({children}) => {
    const pageID = (useParams()).id;
    const {user, isAuthenticated} = useAuth();
    const isOwnPage = isAuthenticated && (user.id === pageID);

    const [terms, setTerms] = useState(["short_term", "medium_term", "long_term"]);
    // The currently selected term
    const [termIndex, setTermIndex] = useState<number>(2);
    const [isLoggedUserFollowing, setIsLoggedUserFollowing] = useState<boolean>(false);

    // Uninitialised variables
    const [pageUser, setPageUser] = useState<User>(null);
    const [followers, setFollowers] = useState<DatabaseUser[]>([]);
    const [allDatapoints, setAllDatapoints] = useState<Datapoint[]>([]);
    // The datapoint that is selected for viewing
    const selectedDatapoint = allDatapoints[termIndex] ? allDatapoints[termIndex] : null;
    const [allPreviousDatapoints, setAllPreviousDatapoints] = useState<Datapoint[]>([]);
    const selectedPrevDatapoint = allPreviousDatapoints[termIndex] ? allPreviousDatapoints[termIndex] : null;
    const [playlists, setPlaylists] = useState<PlFromListWithTracks[]>(null);
    const [settings, setSettings] = useState<Settings>(null);
    const [profileData, setProfileData] = useState({});
    const [selectedType, setSelectedType] = useState<string>("artist");


    const initializeStates = useCallback(async () => {
        retrieveUser(pageID).then(res => setPageUser(res));
        retrieveAllDatapoints(pageID).then(res => setAllDatapoints(res));
        retrieveAllDatapoints(pageID).then(res => setAllPreviousDatapoints(res));
        retrievePlaylists(pageID).then(res => setPlaylists(res));
        if (isAuthenticated) {
            followingContainsUser(pageID).then(res => setIsLoggedUserFollowing(res));
        }
    }, [pageID]);

    useEffect(() => {
        console.log("ProfileContextProvider: useEffect");
        initializeStates();

    }, [initializeStates]);

    return (
        <ProfileContext.Provider value={{
            terms,
            setTerms,
            selectedDatapoint,
            selectedPrevDatapoint,
            termIndex,
            setTermIndex,
            isLoggedUserFollowing,
            setIsLoggedUserFollowing,
            pageUser,
            setPageUser,
            isOwnPage,
            allDatapoints,
            setAllDatapoints,
            allPreviousDatapoints,
            setAllPreviousDatapoints,
            playlists,
            setPlaylists,
            settings,
            setSettings,
            profileData,
            setProfileData,
            selectedType,
            setSelectedType
        }}>
            {children}
        </ProfileContext.Provider>
    );
};