import React from "react";
import {getLIName, getTopInterestingAnalytics, translateAnalytics, translateAnalyticsLow} from "@/Analysis/analysis";
import {StatBlock} from "@/Components/StatBlock";
import {TrackAnalytics, TrackWithAnalytics} from "@/API/Interfaces/trackInterfaces";

export const TrackAnalysis = (props: { track: TrackWithAnalytics; averageAnalytics: TrackAnalytics; }) => {
    const {track, averageAnalytics} = props;
    const includedKeys = getTopInterestingAnalytics(averageAnalytics, 3);
    const analytics = track.audio_features;
    return (
        <div className={'list-widget-wrapper'}>
            <div className={'widget-item'} style={{flexGrow: '0', height: '75px'}}>
                <div className={'widget-button'}>
                    <p style={{margin: 0}}>Analysis of</p>
                    <h3 style={{margin: 0}}>{getLIName(track)}</h3>
                </div>
            </div>
            {
                Object.keys(translateAnalytics).map(function (key) {
                    if (includedKeys.findIndex(e => e === key) !== -1) {
                        const rawAnalytic = analytics[key];
                        const translated = rawAnalytic < 0.3 ? translateAnalyticsLow[key] : translateAnalytics[key];
                        const val = rawAnalytic < 0.3 ? 1 - rawAnalytic : rawAnalytic;
                        const shadow = rawAnalytic < 0.3 ? 1 - averageAnalytics[key] : averageAnalytics[key];
                        return (
                            <div key={key} className={'widget-item'}>
                                <div style={{transform: `scale(${206 / 221})`, padding: '15px'}}>
                                    <StatBlock name={translated.name}
                                               description={translated.description}
                                               value={val * 100} alignment={'left'}
                                               shadow={shadow * 100}/>
                                </div>
                            </div>
                        )
                    }
                })
            }
        </div>
    )
}