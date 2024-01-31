import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {User} from "@tools/Interfaces/userInterfaces";
import {FollowersRecord} from "@tools/Interfaces/followingInterfaces";
import {DatabaseUser} from "@tools/Interfaces/databaseInterfaces";
import {Datapoint} from "@tools/Interfaces/datapointInterfaces";
import {Playlist, PlaylistFromList, PlFromListWithTracks} from "@api/Interfaces/playlistInterfaces";
import {Settings} from "@tools/Interfaces/userMeta";

export const ProfileContext = createContext({
  terms: ["short_term", "medium_term", "long_term"] as string[],
  setTerms: (() => {}) as React.Dispatch<React.SetStateAction<string[]>>,
  selectedDatapoint: null as Datapoint,
  setSelectedDatapoint: (() => {}) as React.Dispatch<React.SetStateAction<Datapoint>>,
  selectedPrevDatapoint: null as Datapoint,
  setSelectedPrevDatapoint: (() => {}) as React.Dispatch<React.SetStateAction<Datapoint>>,
  termIndex: 2,
  setTermIndex: (() => {}) as React.Dispatch<React.SetStateAction<number>>,
  loaded: false,
  setLoaded: (() => {}) as React.Dispatch<React.SetStateAction<boolean>>,
  isLoggedUserFollowing: null as boolean,
  setIsLoggedUserFollowing: (() => {}) as React.Dispatch<React.SetStateAction<boolean>>,
  loggedUserID: null as string,
  setLoggedUserID: (() => {}) as React.Dispatch<React.SetStateAction<string>>,
  pageUser: null as User,
  setPageUser: (() => {}) as React.Dispatch<React.SetStateAction<User>>,
  isOwnPage: false,
  setIsOwnPage: (() => {}) as React.Dispatch<React.SetStateAction<boolean>>,
  pageGlobalUserID: null as string,
  setPageGlobalUserID: (() => {}) as React.Dispatch<React.SetStateAction<string>>,
  followers: [] as DatabaseUser[],
  setFollowers: (() => {}) as React.Dispatch<React.SetStateAction<DatabaseUser[]>>,
  allDatapoints: [] as DatabaseUser[],
  setAllDatapoints: (() => {}) as React.Dispatch<React.SetStateAction<DatabaseUser[]>>,
  allPreviousDatapoints: [] as Datapoint[],
  setAllPreviousDatapoints: (() => {}) as React.Dispatch<React.SetStateAction<Datapoint[]>>,
  playlists: [] as PlFromListWithTracks[],
  setPlaylists: (() => {}) as React.Dispatch<React.SetStateAction<PlFromListWithTracks[]>>,
  possessive: '',
  setPossessive: (() => {}) as React.Dispatch<React.SetStateAction<string>>,
  settings: null as Settings,
  setSettings: (() => {}) as React.Dispatch<React.SetStateAction<Settings>>,
  profileData: {},
  setProfileData: (() => {}) as React.Dispatch<React.SetStateAction<{}>>,
  isError: false,
  setIsError: (() => {}) as React.Dispatch<React.SetStateAction<boolean>>,
  errorDetails: {description: null, errCode: null},
  setErrorDetails: (() => {}) as React.Dispatch<React.SetStateAction<{description: null, errCode: null}>>
});

export const ProfileContextProvider = ({ children }) => {
    const simpleDatapoints = ["artist", "track", "genre"];
    const pageID = (useParams()).id;

    const [terms, setTerms] = useState(["short_term", "medium_term", "long_term"]);
    // The datapoint that is selected for viewing
    const [selectedDatapoint, setSelectedDatapoint] = useState<Datapoint>(null);
    // The datapoint prior to the current that is selected for comparison
    const [selectedPrevDatapoint, setSelectedPrevDatapoint] = useState<Datapoint>(null);
    // The currently selected term
    const [termIndex, setTermIndex] = useState<number>(2);
    const [loaded, setLoaded] = useState<boolean>(false);
    const [isLoggedUserFollowing, setIsLoggedUserFollowing] = useState<boolean>(null);
    const [loggedUserID, setLoggedUserID] = useState<string>(null);

    // Uninitialised variables
    const [pageUser, setPageUser] = useState<User>(null);
    const [isOwnPage, setIsOwnPage] = useState<boolean>(false);
    const [pageGlobalUserID, setPageGlobalUserID] = useState<string>(null);
    const [followers, setFollowers] = useState<DatabaseUser[]>([]);
    const [allDatapoints, setAllDatapoints] = useState<DatabaseUser[]>([]);
    const [allPreviousDatapoints, setAllPreviousDatapoints] = useState<Datapoint[]>([]);
    const [playlists, setPlaylists] = useState<PlFromListWithTracks[]>([]);
    const [possessive, setPossessive] = useState<string>('');
    const [settings, setSettings] = useState<Settings>(null);
    const [profileData, setProfileData] = useState({});

    // If something happens that doesn't allow a user to load the page
    // then an error is passed. These states are passed in to the PageError object
    // and then shown on the page.
    const [isError, setIsError] = useState(false);
    const [errorDetails, setErrorDetails] = useState({description: null, errCode: null});

  return (
    <ProfileContext.Provider value={{
      terms,
      setTerms,
      selectedDatapoint,
      setSelectedDatapoint,
      selectedPrevDatapoint,
      setSelectedPrevDatapoint,
      termIndex,
      setTermIndex,
      loaded,
      setLoaded,
      isLoggedUserFollowing,
      setIsLoggedUserFollowing,
      loggedUserID,
      setLoggedUserID,
      pageUser,
      setPageUser,
      isOwnPage,
      setIsOwnPage,
      pageGlobalUserID,
      setPageGlobalUserID,
      followers,
      setFollowers,
      allDatapoints,
      setAllDatapoints,
      allPreviousDatapoints,
      setAllPreviousDatapoints,
      playlists,
      setPlaylists,
      possessive,
      setPossessive,
      settings,
      setSettings,
      profileData,
      setProfileData,
      isError,
      setIsError,
      errorDetails,
      setErrorDetails
    }}>
      {children}
    </ProfileContext.Provider>
  );
};