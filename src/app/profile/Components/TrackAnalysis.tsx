import React from "react";
import {getLIName, getTopInterestingAnalytics, translateAnalytics, translateAnalyticsLow} from "@/Analysis/analysis";
import {StatBlock} from "@/Components/StatBlock";
import {TrackAnalytics, TrackWithAnalytics} from "@/API/Interfaces/trackInterfaces";
import {SectionWrapper} from "@/Pages/profile/Components/SectionWrapper";
import {Separator} from "@/Components/ui/separator";

export const TrackAnalysis = (props: { track: TrackWithAnalytics; averageAnalytics: TrackAnalytics; }) => {
    const {track, averageAnalytics} = props;
    const includedKeys = getTopInterestingAnalytics(averageAnalytics, 3);
    const analytics = track.audio_features;
    return (
        <div>
            <h3 className={"text-xl font-bold"}>Analysis</h3>
            <p className={"text-sm text-muted-foreground"}>Audio and vibe analysis of this track..</p>
            <Separator className={'my-4'}/>
            {
                Object.keys(translateAnalytics).map(function (key) {
                    if (includedKeys.findIndex(e => e === key) !== -1) {
                        const rawAnalytic = analytics[key];
                        const translated = rawAnalytic < 0.3 ? translateAnalyticsLow[key] : translateAnalytics[key];
                        const val = rawAnalytic < 0.3 ? 1 - rawAnalytic : rawAnalytic;
                        return (
                            <div key={key}>
                                <div>
                                    <StatBlock name={translated.name}
                                               description={translated.description}
                                               value={val * 100}/>
                                </div>
                            </div>
                        )
                    }
                })
            }
        </div>
    )
}