import React from "react";
import {Datapoint} from "@/Tools/Interfaces/datapointInterfaces";


const TopSongsOfArtists = (props: { selectedDatapoint: Datapoint; number: number; }) => {
    const {selectedDatapoint, number} = props;
    return (
        <div className={'block-wrapper'}>
            {selectedDatapoint.top_artists.slice(0, number).map((artist) => {
                const topSongIndex = selectedDatapoint.top_tracks.findIndex(s => s.artists.some(a => a.id === artist.id));
                if (topSongIndex > -1) {
                    return (
                        <div key={artist.id} className={'stat-block'}
                             style={{
                                 padding: '15px',
                                 background: 'var(--transparent-colour)',
                                 border: '1px solid rgba(125, 125, 125, 0.5)'
                             }}>
                            <h3 style={{margin: '0'}}>{selectedDatapoint.top_tracks[topSongIndex].name}</h3>
                            <p style={{margin: '0'}}>{artist.name}</p>
                        </div>
                    )
                }
            })}
        </div>
    )
}