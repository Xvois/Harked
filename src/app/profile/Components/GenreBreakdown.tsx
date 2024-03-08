import React, {useState} from "react";
import {Doughnut} from "react-chartjs-2";
import {getLIName} from "@/Analysis/analysis";
import {ItemDescriptor} from "@/Analysis/ItemDescriptor";

/**
 * File: src/Pages/profile/Components/GenreBreakdown.tsx
 *
 * WARNING: This file is currently not in use and is not suitable for production.
 * Please do not use this file without further modifications.
 */

const GenreBreakdown = (props) => {
    const {selectedDatapoint, pageUser, allDatapoints, term, isOwnPage} = props;
    const [selectedGenre, setSelectedGenre] = useState(selectedDatapoint.top_genres[0]);

    // Custom CSS variables don't work in the data attribute so this is my workaround.
    const darkModePreference = window.matchMedia("(prefers-color-scheme: dark)");
    const [bgColor, setBgColor] = useState(
        darkModePreference.matches ?
            [
                'rgba(255, 255, 255, 0.1)',
                'rgba(255, 255, 255, 0.2)',
                'rgba(255, 255, 255, 0.3)',
                'rgba(255, 255, 255, 0.4)',
                'rgba(255, 255, 255, 0.3)',
                'rgba(255, 255, 255, 0.2)',
            ]
            :
            [
                'rgba(0, 0, 0, 0.1)',
                'rgba(0, 0, 0, 0.2)',
                'rgba(0, 0, 0, 0.3)',
                'rgba(0, 0, 0, 0.4)',
                'rgba(0, 0, 0, 0.3)',
                'rgba(0, 0, 0, 0.2)',
            ]
    );
    darkModePreference.addEventListener("change", e => {
        if (e.matches) {
            setBgColor(
                [
                    'rgba(200, 200, 200, 0.1)',
                    'rgba(200, 200, 200, 0.2)',
                    'rgba(200, 200, 200, 0.3)',
                    'rgba(200, 200, 200, 0.4)',
                    'rgba(200, 200, 200, 0.3)',
                    'rgba(200, 200, 200, 0.2)',
                ]
            )
        } else {
            setBgColor(
                [
                    'rgba(125, 125, 125, 0.1)',
                    'rgba(125, 125, 125, 0.2)',
                    'rgba(125, 125, 125, 0.3)',
                    'rgba(125, 125, 125, 0.4)',
                    'rgba(125, 125, 125, 0.3)',
                    'rgba(125, 125, 125, 0.2)',
                ]
            )
        }
    })

    const artists = selectedDatapoint.top_artists.filter(a => a.genres ? a.genres.some(g => g === selectedGenre) : false);
    const artistWeights = artists.map(e => selectedDatapoint.top_artists.length - selectedDatapoint.top_artists.findIndex(a => a.artist_id === e.artist_id));
    const totalWeights = artistWeights.reduce((partialSum, a) => partialSum + a, 0);
    const percentages = [];
    for (let i = 0; i < artists.length; i++) {
        percentages.push((artistWeights[i] / totalWeights) * 100);
    }

    const handleSelect = (e) => {
        setSelectedGenre(e.target.value);
    }

    const data = {
        labels: artists.map(a => getLIName(a)),
        datasets: [{
            label: `Percentage contribution to ${selectedGenre}`,
            data: percentages,
            backgroundColor: bgColor,
            hoverOffset: 4
        }]
    };

    const options = {
        borderColor: 'rgba(125, 125, 125, 0.2)',
        plugins: {
            legend: {
                display: false
            }
        }
    }

    return (
        <div id={'genre-breakdown-wrapper'}>
            <div style={{display: 'flex', justifyContent: 'center'}}>
                <select style={{margin: 0}} id={'genre-select'} defaultValue={selectedDatapoint.top_genres[0]}
                        onChange={handleSelect}>
                    {selectedDatapoint.top_genres.slice(0, 9).map(g => {
                        return <option key={g} value={g}>{g}</option>
                    })}
                </select>
            </div>
            <div id={'genre-breakdown'}>
                <div id={'genre-chart-wrapper'}>
                    <Doughnut options={options} data={data} updateMode={"show"}/>
                </div>
                <div className={'item-description'} style={{
                    height: 'max-content',
                    padding: '15px',
                    background: 'var(--transparent-colour)',
                    border: '1px solid var(--transparent-border-colour)',
                    maxWidth: '400px'
                }}>
                    <ItemDescriptor item={selectedGenre} user={pageUser} selectedDatapoint={selectedDatapoint}
                                    allDatapoints={allDatapoints} term={term} isOwnPage={isOwnPage}/>
                </div>
            </div>
        </div>

    )
}