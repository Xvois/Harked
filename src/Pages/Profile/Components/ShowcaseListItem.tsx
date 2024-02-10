import {User} from "@/Tools/Interfaces/userInterfaces";
import {Artist} from "@/API/Interfaces/artistInterfaces";
import {TrackWithAnalytics} from "@/API/Interfaces/trackInterfaces";
import {Datapoint, Term} from "@/Tools/Interfaces/datapointInterfaces";
import {PlFromListWithTracks} from "@/API/Interfaces/playlistInterfaces";
import React, {createContext, PropsWithChildren, useContext, useState} from "react";
import {isLoggedIn} from "@/Tools/users";
import {getItemIndexChange, getLIDescription, getLIName} from "@/Analysis/analysis";
import {createPictureSources, getImgSrcSet, isArtist, isTrack} from "@/Tools/utils";
import ArrowCircleDownIcon from "@mui/icons-material/ArrowCircleDown";
import ArrowCircleUpIcon from "@mui/icons-material/ArrowCircleUp";
import ClearAllOutlinedIcon from "@mui/icons-material/ClearAllOutlined";
import FlareIcon from "@mui/icons-material/Flare";
import {ItemDescriptor} from "@/Analysis/ItemDescriptor";


const ChangeIndicator = (props: { indexChange: number, selectedPrevDatapoint: Datapoint | null }) => {
    const {indexChange, selectedPrevDatapoint} = props;
    if (indexChange < 0) {
        return <><span style={{
            color: 'var(--primary-colour)',
            fontSize: '10px',
        }}>{indexChange}</span><ArrowCircleDownIcon style={{
            color: 'var(--primary-colour)',
            animation: 'down-change-animation 0.5s ease-out'
        }}
                                                    fontSize={"small"}></ArrowCircleDownIcon></>
    } else if (indexChange > 0) {
        return <><span style={{
            color: 'var(--primary-colour)',
            fontSize: '10px'
        }}>{indexChange}</span><ArrowCircleUpIcon style={{
            color: 'var(--primary-colour)',
            animation: 'up-change-animation 0.5s ease-out'
        }}
                                                  fontSize={"small"}></ArrowCircleUpIcon></>
    } else if (indexChange === 0) {
        return <ClearAllOutlinedIcon
            style={{color: 'var(--primary-colour)', animation: 'equals-animation 0.5s ease-out'}}
            fontSize={"small"}></ClearAllOutlinedIcon>
    } else if (selectedPrevDatapoint !== null) {
        return
        <FlareIcon style={{color: 'var(--primary-colour)', animation: 'fadeIn 0.5s ease-in'}} fontSize={"small"}/>
    }
}

const DecorativeImages = (props: { srcSet: string, alternateState: boolean }) => {
    const {srcSet, alternateState} = props
    const stdClass =
        [
            'absolute object-cover blur-3xl w-96 opacity-35 translate-x-2/4 -translate-y-2/4 transition-all duration-500',
            'absolute object-cover blur-3xl w-96 opacity-35 -translate-x-2/4 translate-y-2/4 transition-all duration-500'
        ]
    const altClass =
        [
            'absolute object-cover blur-3xl w-96 opacity-0 translate-x-2/4 -translate-y-3/4 transition-all duration-500',
            'absolute object-cover blur-3xl w-96 opacity-0 -translate-x-2/4 translate-y-3/4 transition-all duration-500'
        ]

    return (
        <div
            className={"absolute w-full h-full inline-flex flex-col items-center justify-center"}>
            <img alt={'decorative blur'} srcSet={srcSet}
                 className={!alternateState ? altClass[0] : stdClass[0]}/>
            <img alt={'decorative blur'} srcSet={srcSet}
                 className={!alternateState ? altClass[1] : stdClass[1]}/>
        </div>
    )
}


interface ShowcaseListItemContextProps {
    pageUser: User;
    element: Artist | TrackWithAnalytics | string;
    index: number;
    allDatapoints: Datapoint[];
    selectedDatapoint: Datapoint;
    selectedPrevDatapoint: Datapoint;
    playlists: Array<PlFromListWithTracks>;
    type: string;
    term: Term;
    isOwnPage: boolean;
    level: number;
    setLevel: React.Dispatch<React.SetStateAction<Number>>
}

const ShowcaseListItemContext = createContext<ShowcaseListItemContextProps | undefined>(undefined);

export const ShowcaseListItemProvider = ({children, ...props}: PropsWithChildren<ShowcaseListItemContextProps>) => {
    return (
        <ShowcaseListItemContext.Provider value={props}>
            {children}
        </ShowcaseListItemContext.Provider>
    );
};

const ShowcaseListItemWrapper = ({children}) => {
    const {element, level, setLevel} = useContext(ShowcaseListItemContext);

    return (
        <div
            className={`relative h-fit transition-height max-w-screen-lg bg-gradient-to-r from-border via-transparent to-border p-1 overflow-clip items-center justify-center`}
            tabIndex={0}
            onClick={() => {
                level === 0 ? setLevel(1) : setLevel(0)
            }}>
            <DecorativeImages srcSet={getImgSrcSet(element, 0.01)} alternateState={level > 0}/>
            {children}
        </div>
    )
}


export const ShowcaseListItemContent = () => {
    const {
        pageUser,
        element,
        index,
        type,
        selectedDatapoint,
        selectedPrevDatapoint,
        allDatapoints,
        playlists,
        term,
        isOwnPage,
        level,
        setLevel
    } = useContext(ShowcaseListItemContext);
    const [showAnalytics, setShowAnalytics] = useState(index === 0 ? (type !== 'genre' && isLoggedIn()) : false);
    const indexChange = selectedPrevDatapoint ? getItemIndexChange(element, index, type, selectedPrevDatapoint) : null;


    return (
        <div className={`h-full bg-background text-foreground`}>
            <div
                className={`relative inline-flex flex-col h-full w-full items-center group cursor-pointer p-8 transition-all`} style={{gap: `${level > 0 ? '1rem': '0'}`}}>
                <p className={`absolute h-fit left-4 top-0 bottom-0 my-auto font-bold text-xl opacity-${level > 0 ? '0' : '35'} transition-opacity`}>{index + 1}.</p>
                <div className={"inline-flex flex-col text-center justify-center items-center"}>
                    <h2 className={"font-bold text-2xl transition-all"}>{getLIName(element)}</h2>
                    <div>
                        <ChangeIndicator indexChange={indexChange} selectedPrevDatapoint={selectedPrevDatapoint}/>
                        <p className={"text-sm text-muted-foreground"}>{getLIDescription(element)}</p>
                    </div>
                </div>
                <div className={`grid transition-all duration-500 overflow-hidden `} style={{gridTemplateRows: `${level > 0 ? '1fr' : '0fr'}`}}>
                    <div
                        className={`text-center justify-center items-center m-auto overflow-hidden`}>
                        <ItemDescriptor
                            item={element}
                            user={pageUser}
                            selectedDatapoint={selectedDatapoint}
                            allDatapoints={allDatapoints}
                            term={term}
                            isOwnPage={isOwnPage}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

export const ShowcaseListItem = (props: {
    pageUser: User;
    playlists: Array<PlFromListWithTracks>;
    allDatapoints: Datapoint[];
    selectedDatapoint: Datapoint;
    selectedPrevDatapoint: Datapoint;
    element: Artist | TrackWithAnalytics | string;
    index: number;
    type: string;
    term: Term;
    isOwnPage: boolean;
}) => {
    const [level, setLevel] = useState(0);
    const value = {
        level,
        setLevel,
        ...props
    };
    return (
        <ShowcaseListItemProvider {...value}>
            <ShowcaseListItemWrapper>
                <ShowcaseListItemContent/>
            </ShowcaseListItemWrapper>
        </ShowcaseListItemProvider>
    )
}

