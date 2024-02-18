import React, {useEffect, useState} from "react";
import {isArtist, isTrack} from "@/Tools/utils";
import {getSimilarArtists, getTrackRecommendations} from "@/Tools/similar";
import {getLIDescription, getLIName} from "@/Analysis/analysis";
import {Artist} from "@/API/Interfaces/artistInterfaces";
import {Track} from "@/API/Interfaces/trackInterfaces";
import {Datapoint} from "@/Tools/Interfaces/datapointInterfaces";
import {Separator} from "@/Components/ui/separator";

export const ItemRecommendations = (props: { element: Artist | Track, selectedDatapoint: Datapoint }) => {
    const {element, selectedDatapoint} = props;
    const [recommendations, setRecommendations] = useState(null);

    useEffect(() => {
        generateRecommendations();
    }, [])

    const generateRecommendations = async () => {
        if (isArtist(element)) {
            const result = await getSimilarArtists(element.id);
            setRecommendations(result);
        } else if (isTrack(element)) {
            const seed_artists = element.artists.map(a => a.id).slice(0, 2);
            const seed_genres = selectedDatapoint.top_genres.slice(0, 2);
            const seed_track = [element.id];
            const result = await getTrackRecommendations(seed_artists, seed_genres, seed_track);
            setRecommendations(result);
        }
    }

    const renderRecommendations = () => {
        if (!recommendations) {
            return <div/>
        }

        return (
            <>
                <div>
                    <h3 className={"text-xl font-bold"}>Recommendations</h3>
                    <p className={"text-sm text-muted-foreground"}>Tailored recommendations for you and this item.</p>
                </div>
                <Separator className={"my-4"}/>
                <ul>
                    {
                        recommendations.slice(0, 3).map((r: Track | Artist, i) => (
                            <li key={getLIName(r)}>
                                <a href={r.uri}>
                                    <h4 className={""}>{getLIName(r)}</h4>
                                    <p className={"text-sm text-muted-foreground"}>{getLIDescription(r)}</p>
                                </a>
                            </li>
                        ))
                    }
                </ul>
            </>
        )
    }

    return (
        <div>
            {renderRecommendations()}
        </div>
    )
}