/**
 * The focus component displays an image with a title and description, as well
 * as an accompanying message. It is used to display artist and song art and give
 * context about them for a specific user.
 */

import React, {useEffect, useState} from "react";
import './../CSS/Focus.css'


const Focus = React.memo((props) => {
    const {user, item, datapoint, tertiary} = props;
    useEffect(() => {
        updateArtistQualities(datapoint);
        if (item) {
            updateFocus();
        }
    }, [item])
    const [focus, setFocus] = useState({
        item: null,
        title: '', //main text
        secondary: '', //sub-title
        tertiary: '', //desc
        image: '',
        link: '',
    })
    const [focusMessage, setFocusMessage] = useState(<p>See what is says.</p>);
    const [showArt, setShowArt] = useState(true);
    const [artistQualities, setArtistQualities] = useState();
    const analyticsMetrics = ['acousticness', 'danceability', 'energy', 'instrumentalness', 'valence', `tempo`];
    const translateAnalytics = {
        acousticness: {name: 'acoustic', description: 'Music with no electric instruments.'},
        danceability: {name: 'danceable', description: 'Music that makes you want to move it.'},
        energy: {name: 'energetic', description: 'Music that feels fast and loud.'},
        instrumentalness: {name: 'instrumental', description: 'Music that contains no vocals.'},
        liveness: {name: 'live', description: 'Music that is performed live.'},
        loudness: {name: 'loud', description: 'Music that is noisy.'},
        valence: {name: 'positive', description: 'Music that feels upbeat.'},
        tempo: {name: 'tempo', description: 'Music that moves and flows quickly.'}
    }
    // Delay function used for animations
    const delay = ms => new Promise(res => setTimeout(res, ms));

    // The function that updates the focus.
    async function updateFocus() {
        console.info("updateFocus called!")
        focus.item = item;
        setShowArt(false);
        let localState = focus;
        await delay(400);
        localState.image = item.image;
        localState.link = item.link;
        if (item.type === "song") {
            localState.title = item.title;
            localState.secondary = `by ${item.artist}`;
            localState.tertiary = tertiary;
        } else if (item.type === "artist") {
            localState.title = item.name;
            localState.secondary = item.genre;
            localState.tertiary = tertiary;
        } else {
            localState.title = '';
            localState.secondary = item;
            localState.tertiary = '';
        }
        setFocus(localState);
        await updateFocusMessage();
        setShowArt(true)
    }

    // Update the artist attributes that are used to make the focus
    // message.
    const updateArtistQualities = function (data) {
        const songs = data.topSongs;
        const artists = data.topArtists;
        const genres = data.topGenres;
        let result = {};
        // The analytics from the datapoint that we will compare
        // Get the artist that has the max value in each
        // metric
        analyticsMetrics.forEach(metric => {
            let max = {artist: '', value: 0};
            for (let i = 0; i < 50; i++) {
                if (songs[i].analytics[metric] > max.value) {
                    max.artist = songs[i].artist;
                    max.value = songs[i].analytics[metric];
                }
            }
            // Append the result to the existing result object
            result = {
                ...result,
                [max.artist]: {theme: metric}
            }
        })
        // For every artist [in order of listen time]
        artists.forEach(artist => {
            // Add the genre quality to them
            // equal to their genre
            if (artist && genres.includes(artist.genre)) {
                result[artist.name] = {
                    ...result[artist.name],
                    genre: artist.genre
                }
            }
        })
        setArtistQualities(result);
    }

    // Update the focus message to be
    // relevant to the current focus
    const updateFocusMessage = async function () {
        // What do we use as our possessive?
        let possessive;
        user.userID === 'me' ? possessive = 'your' : possessive = `${user.username}'s`
        const item = focus.item;
        let topMessage = '';
        let secondMessage = '';
        switch (item.type) {
            case "artist":
                if (artistQualities[`${item.name}`] === undefined) {
                    // If the artist doesn't have a genre analysis then we assume
                    // that they are not wildly popular.
                    topMessage += `${item.name} is a rare to see artist. They make ${possessive} profile quite unique.`
                } else {
                    Object.keys(artistQualities[item.name]).length > 1 ?
                        topMessage += `${item.name} represents ${possessive} love for ${artistQualities[item.name]["genre"]} and ${translateAnalytics[artistQualities[item.name]["theme"]].name} music.`
                        :
                        topMessage += `${item.name} is the artist that defines ${possessive} love for ${artistQualities[item.name][Object.keys(artistQualities[item.name])[0]]} music.`
                }
                // The index of the song in the user's top songs list made by this artist.
                const songIndex = datapoint.topSongs.findIndex((element) => element.artist === item.name);
                if (songIndex !== -1) {
                    secondMessage += `${datapoint.topSongs[songIndex].title} by ${item.name} is Nº ${songIndex + 1} on ${possessive} top 50 songs list for this time frame.`
                }
                break;
            case "song":
                let maxAnalytic = "acousticness";
                analyticsMetrics.forEach(analytic => {
                    let comparisonValue;
                    if (analytic === "tempo") {
                        comparisonValue = (item.analytics[analytic] - 50) / 150
                    } else {
                        comparisonValue = item.analytics[analytic]
                    }
                    if (comparisonValue > item.analytics[maxAnalytic]) {
                        maxAnalytic = analytic;
                    }
                })
                topMessage += `${item.title} is a very ${maxAnalytic === 'tempo' ? 'high' : ''} ${translateAnalytics[maxAnalytic].name} song by ${item.artist}.`
                if (datapoint.topArtists.some((element) => element && element.name === item.artist)) {
                    const index = datapoint.topArtists.findIndex((element) => element.name === item.artist);
                    secondMessage += `${item.artist} is Nº ${index + 1} on ${possessive} top artists list in this time frame.`
                }
                break;
            case undefined:
                let relevantArtists = [];
                for (let artist in artistQualities) {
                    if (artistQualities[artist].genre === item) {
                        relevantArtists.push(artist);
                    }
                }
                datapoint.topArtists.forEach(artist => {
                    if (!!artist) {
                        if (artist.genre === item && !relevantArtists.includes(artist.name)) {
                            relevantArtists.push(artist.name)
                        }
                    }
                });
                if (relevantArtists.length > 1) {
                    topMessage += `${possessive[0].toUpperCase() + possessive.substring(1)} love for ${item} is not only defined by ${possessive} love for ${relevantArtists[0]} but also ${relevantArtists.length - 1} other artist${relevantArtists.length - 1 === 1 ? `` : "s"}...`
                    for (let i = 1; i < relevantArtists.length; i++) {
                        secondMessage += relevantArtists[i];
                        if (i !== relevantArtists.length - 1) {
                            secondMessage += ', '
                        }
                    }
                } else {
                    if (relevantArtists.length === 1) {
                        topMessage += `${possessive[0].toUpperCase() + possessive.substring(1)} love for ${item} is very well marked by ${possessive} time listening to ${relevantArtists[0]}.`
                    } else {
                        topMessage += `${possessive[0].toUpperCase() + possessive.substring(1)} taste in ${item} music isn't well defined by one artist, it's the product of many songs over many artists.`
                    }
                }
                break;
            default:
                console.warn("updateFocusMessage error: No focus type found.")
        }
        setFocusMessage(
            <>
                <h2>{topMessage}</h2>
                <p style={{
                    color: '#22C55E',
                    fontFamily: 'Inter Tight',
                    fontWeight: '600',
                    fontSize: '20px'
                }}>{secondMessage}</p>
            </>
        );
    }

    return (
        <div className='focus-container'>
            <a className={'play-wrapper'}
               style={showArt ? {opacity: '1'} : {opacity: '0'}}
               href={focus.link} rel="noopener noreferrer" target="_blank">
                <img alt={''} className='art' src={focus.image}></img>
                <img alt={''} className='art' id={'art-backdrop'} src={focus.image}></img>
                <div className='art-text-container'>
                    <h1 className={"art-name"}
                        style={showArt ? {animation: 'swoopUpR 0.4s ease-out'} : {animation: 'swoopUpH 0.2s ease-out forwards'}}>{focus.title}</h1>
                    <h2 className={"art-desc"}
                        style={showArt ? {animation: 'swoopUpR 0.6s ease-out'} : {animation: 'swoopUpH 0.2s ease-out forwards'}}>{focus.secondary}</h2>
                    <p className={"art-desc"}
                       style={showArt ? {animation: 'swoopUpR 0.8s ease-out'} : {animation: 'swoopUpH 0.2s ease-out forwards'}}>{focus.tertiary}</p>
                </div>
            </a>
            <div className={'focus-message'}>
                {focusMessage}
            </div>
        </div>
    )
})

export default Focus
