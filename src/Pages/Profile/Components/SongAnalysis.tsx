import React from "react";
import {getLIName, getTopInterestingAnalytics, translateAnalytics, translateAnalyticsLow} from "@/Tools/analysis";
import {StatBlock} from "@/Components/StatBlock";

export const SongAnalysis = (props) => {
    const {song, averageAnalytics} = props;
    const includedKeys = getTopInterestingAnalytics(averageAnalytics, 3);
    if (song.hasOwnProperty("song_id")) {
        const analytics = song.analytics;
        if (!!analytics) {
            return (
                <div className={'list-widget-wrapper'}>
                    <div className={'widget-item'} style={{flexGrow: '0', height: '75px'}}>
                        <div className={'widget-button'}>
                            <p style={{margin: 0}}>Analysis of</p>
                            <h3 style={{margin: 0}}>{getLIName(song)}</h3>
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
    }
}