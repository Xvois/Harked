import React, {useEffect, useState} from "react";
import {isArtist, isTrack} from "@/Tools/utils";
import {getSimilarArtists, getTrackRecommendations} from "@/Tools/similar";
import {getLIDescription, getLIName} from "@/Analysis/analysis";
import {Artist} from "@/API/Interfaces/artistInterfaces";
import {Track} from "@/API/Interfaces/trackInterfaces";
import {Datapoint} from "@/Tools/Interfaces/datapointInterfaces";

export const ItemRecommendations = (props: {element: Artist | Track, selectedDatapoint: Datapoint}) => {
    const {element, selectedDatapoint } = props;
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
            return <div className={'placeholder'} style={{width: '100%', height: '100%'}}/>
        }

        return (
            <>
                <div className={'widget-item'} style={{flexGrow: '0', height: '75px'}}>
                    <div className={'widget-button'}>
                        <p style={{margin: 0}}>Recommendations for</p>
                        <h3 style={{margin: 0}}>{getLIName(element)}</h3>
                    </div>
                </div>
                {
                    recommendations.slice(0, 3).map((r, i) => (
                        <div key={getLIName(r)} className={'widget-item'} style={{animationDelay: `${i / 10}s`}}>
                            <a href={r.link} className={'widget-button'}>
                                <h4 style={{margin: 0}}>{getLIName(r)}</h4>
                                <p style={{margin: 0}}>{getLIDescription(r)}</p>
                            </a>
                        </div>
                    ))
                }
            </>
        )
    }

    return (
        <div className={`list-widget-wrapper supplemental-content`}>
            {renderRecommendations()}
        </div>
    )
}