import React, {useContext, useState} from "react";
import {Artist} from "@/API/Interfaces/artistInterfaces";
import {TrackWithAnalytics} from "@/API/Interfaces/trackInterfaces";
import {isArtist, isTrack} from "@/Tools/utils";
import {ShowcaseListItem} from "@/Pages/Profile/Components/ShowcaseListItem";
import {Button} from "@/Components/ui/button";
import {ProfileContext} from "@/Pages/Profile/ProfileContext";
import {Select, SelectContent, SelectItem, SelectTrigger} from "@/Components/ui/select";
import {SelectItemText} from "@radix-ui/react-select";

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
            <div className={"space-y-4"}>
                <Select>
                    {
                        terms.map((term, index) => {
                            return (
                                <Button key={index} variant={termIndex === index ? 'default' : 'outline'}
                                        onClick={() => setTermIndex(index)}>{term}</Button>
                            )
                        })
                    }
                </Select>
                <Select onValueChange={(e) => setSelectedType(e)}>
                    <SelectTrigger>
                        {selectedType}
                    </SelectTrigger>
                    <SelectContent>
                        {["artist", "track", "genre"].map((type, index) => {
                            return (
                                <SelectItem value={type}>
                                    <SelectItemText>{type}</SelectItemText>
                                </SelectItem>
                            )
                        })}
                    </SelectContent>
                </Select>
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

