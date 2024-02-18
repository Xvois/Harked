import {Artist} from "@/API/Interfaces/artistInterfaces";
import {TrackWithAnalytics} from "@/API/Interfaces/trackInterfaces";
import {Term} from "@/Tools/Interfaces/datapointInterfaces";
import React, {createContext, PropsWithChildren, useContext, useEffect, useState} from "react";
import {getAverageAnalytics, getItemIndexChange, getLIDescription, getLIName} from "@/Analysis/analysis";
import {createPictureSources, isArtist, isTrack} from "@/Tools/utils";
import ArrowCircleDownIcon from "@mui/icons-material/ArrowCircleDown";
import ArrowCircleUpIcon from "@mui/icons-material/ArrowCircleUp";
import ClearAllOutlinedIcon from "@mui/icons-material/ClearAllOutlined";
import {ItemDescriptor} from "@/Analysis/ItemDescriptor";
import {getGenresRelatedArtists} from "@/Tools/similar";
import {Button} from "@/Components/ui/button";
import {GenericDialog} from "@/Components/GenericDialog";
import {ArtistAnalysis} from "@/Pages/Profile/Components/ArtistAnalysis";
import {TrackAnalysis} from "@/Pages/Profile/Components/TrackAnalysis";
import {ItemRecommendations} from "@/Pages/Profile/Components/ItemRecommendations";
import {ProfileContext} from "@/Pages/Profile/ProfileContext";

const ChangeIndicator = (props: { indexChange: number | null }) => {
    const {indexChange} = props;
    if (indexChange < 0) {
        return <ArrowCircleDownIcon fontSize={"small"}/>
    } else if (indexChange > 0) {
        return <ArrowCircleUpIcon fontSize={"small"}/>
    } else if (indexChange === 0) {
        return <ClearAllOutlinedIcon fontSize={"small"}/>
    } else if (indexChange === null) {
        return <></>
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
    element: Artist | TrackWithAnalytics | string;
    index: number;
    level: number;
    setLevel: React.Dispatch<React.SetStateAction<Number>>;
    modifiable: boolean;
    setModifiableIndex: React.Dispatch<React.SetStateAction<number>>
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
    const {selectedDatapoint} = useContext(ProfileContext);
    const {
        index,
        element,
        level,
        setLevel,
        modifiable,
        setModifiableIndex
    } = useContext(ShowcaseListItemContext);
    let images;
    if (isTrack(element)) {
        images = element.album.images;
    } else if (isArtist(element)) {
        images = element.images;
    } else {
        images = getGenresRelatedArtists(element, selectedDatapoint.top_artists)[0].images;
    }

    useEffect(() => {
        if (!modifiable && level > 0) {
            setLevel(0);
        }
    }, [modifiable]);

    return (
        <div
            className={`relative h-fit transition-height bg-gradient-to-r from-border via-transparent to-border p-[1px] overflow-clip items-center justify-center cursor-pointer`}
            tabIndex={0}
            onClick={() => {
                setModifiableIndex(index)
                level === 0 ? setLevel(1) : setLevel(0)
            }}>
            <DecorativeImages srcSet={createPictureSources(images, 0.01)} alternateState={level > 0}/>
            {children}
        </div>
    )
}


export const ShowcaseListItemContent = () => {
    const {
        pageUser,
        selectedDatapoint,
        allDatapoints,
        playlists,
        terms,
        termIndex,
        isOwnPage,
        selectedPrevDatapoint
    } = useContext(ProfileContext);
    const {
        element,
        index,
        level,
    } = useContext(ShowcaseListItemContext);
    const indexChange: number | null = getItemIndexChange(element, index, selectedPrevDatapoint);


    return (
        <div className={`h-full bg-background text-foreground`}>
            <div
                className={`relative inline-flex flex-col h-full w-full items-center group cursor-pointer p-8 transition-all`}
                style={{gap: `${level > 0 ? '1rem' : '0'}`}}>
                <div
                    className={`inline-flex flex-row gap-2 items-center absolute h-fit left-4 top-0 bottom-0 my-auto font-bold text-xl opacity-${level > 0 ? '0' : '35'} transition-opacity`}>
                    <p>{index + 1}</p>
                    <ChangeIndicator indexChange={indexChange}/>
                </div>
                <div className={"inline-flex flex-col text-center justify-center items-center"}>
                    <h2 className={"font-bold text-2xl transition-all"}>{getLIName(element)}</h2>
                    <div>
                        <p className={"text-sm text-muted-foreground"}>
                            {typeof element === 'string'
                                ?
                                getGenresRelatedArtists(element, selectedDatapoint.top_artists)[0].name
                                :
                                getLIDescription(element)
                            }
                        </p>
                    </div>
                </div>
                <div className={`grid transition-all duration-500 overflow-hidden `}
                     style={{gridTemplateRows: `${level > 0 ? '1fr' : '0fr'}`}}>
                    <div
                        className={`flex flex-col text-center justify-center items-center m-auto overflow-hidden gap-4`}>
                        <ItemDescriptor
                            item={element}
                            user={pageUser}
                            selectedDatapoint={selectedDatapoint}
                            allDatapoints={allDatapoints}
                            term={terms[termIndex] as Term}
                            isOwnPage={isOwnPage}
                        />
                        <GenericDialog trigger={
                            <Button variant={"outline"}
                                    className={"bg-transparent border-opacity-35 hover:bg-secondary/35"}>Explore</Button>
                        } title={`Explore ${getLIName(element)}`} description={"Blah blah blah"}>
                            {isArtist(element) ?
                                <div className={"inline-flex flex-col gap-4"}>
                                    <ArtistAnalysis user_id={pageUser.id} artist={element} playlists={playlists}
                                                    term={terms[termIndex] as Term} isOwnPage={isOwnPage}/>
                                    <ItemRecommendations element={element} selectedDatapoint={selectedDatapoint}/>
                                </div>
                                :
                                isTrack(element) ?
                                    <div className={"inline-flex flex-col gap-4"}>
                                        <TrackAnalysis track={element} averageAnalytics={
                                            getAverageAnalytics(selectedDatapoint.top_tracks)
                                        }/>
                                        <ItemRecommendations element={element} selectedDatapoint={selectedDatapoint}/>
                                    </div>

                                    :
                                    <></>
                            }
                        </GenericDialog>
                    </div>
                </div>
            </div>
        </div>
    )
}

export const ShowcaseListItem = (props: {
    element: Artist | TrackWithAnalytics | string;
    index: number;
    modifiable: boolean;
    setModifiableIndex: React.Dispatch<React.SetStateAction<number>>
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

