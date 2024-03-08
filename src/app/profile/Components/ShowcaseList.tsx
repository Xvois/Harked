import React, {useContext, useState} from "react";
import {Artist} from "@/API/Interfaces/artistInterfaces";
import {TrackWithAnalytics} from "@/API/Interfaces/trackInterfaces";
import {isArtist, isTrack} from "@/Tools/utils";
import {ShowcaseListItem} from "@/Pages/profile/Components/ShowcaseListItem";
import {Button} from "@/Components/ui/button";
import {ProfileContext} from "@/Pages/profile/ProfileContext";
import {Select} from "@/Components/ui/select";

export const ShowcaseList = (props: {
    start: number;
    end: number;
}) => {
    const {
        start,
        end,
    } = props;
    const {
        selectedDatapoint,
        terms,
        termIndex,
        setTermIndex,
        selectedType,
        setSelectedType
    } = useContext(ProfileContext);
    const [modifiableIndex, setModifiableIndex] = useState<number>(0);


    return (
        <div>
            <div className={"inline-flex justify-between w-full"}>
                <div
                    className="grid grid-cols-3 border rounded-lg overflow-hidden w-full max-w-sm items-stretch">
                    <Button
                        onClick={() => setSelectedType('artist')}
                        variant={selectedType === 'artist' ? 'default' : 'outline'}
                        className={"h-12 rounded-none border-none"}>
                        Artists
                    </Button>
                    <Button
                        onClick={() => setSelectedType('track')}
                        variant={selectedType === 'track' ? 'default' : 'outline'}
                        className={"h-12 rounded-none border-none"}>
                        Tracks
                    </Button>
                    <Button
                        onClick={() => setSelectedType('genre')}
                        variant={selectedType === 'genre' ? 'default' : 'outline'}
                        className={"h-12 rounded-none border-none"}>
                        Genres
                    </Button>
                </div>
                <div className="grid grid-cols-3 border rounded-lg overflow-hidden w-full max-w-sm items-stretch">
                    {terms.map((term, index) => {
                        return (
                            <Button className={"h-12 rounded-none border-none"} key={index} variant={termIndex === index ? 'default' : 'outline'}
                                    onClick={() => setTermIndex(index)}>{term}</Button>
                        )
                    })}
                </div>
            </div>

            <div className={`flex flex-col h-[1400px] justify-evenly`}>
                {selectedDatapoint ?
                    selectedDatapoint[`top_${selectedType}s`].map(function (element: Artist | TrackWithAnalytics | string, index: number) {
                        if (index >= start && index <= end) {
                            return (
                                <ShowcaseListItem
                                    key={(isTrack(element) || isArtist(element)) ? element.id : element}
                                    element={element}
                                    index={index}
                                    modifiable={modifiableIndex === index}
                                    setModifiableIndex={setModifiableIndex}/>
                            )
                        }
                    })
                    :
                    <></>
                }
            </div>
        </div>

    )
}

