// noinspection SpellCheckingInspection
import React from "react";
import {capitalize} from "@mui/material";


/**
 * Holds all the methods used to generate analysis for certain objects within the context of a datapoint.
 */

export const translateAnalytics = {
    acousticness: { name: 'acoustic', description: 'Music with natural instruments.' },
    danceability: { name: 'upbeat', description: 'Energetic and groove-inducing music.' },
    energy: { name: 'dynamic', description: 'High-energy and lively tunes.' },
    instrumentalness: { name: 'instrumental', description: 'Music without vocals.' },
    liveness: { name: 'live', description: 'Music performed in a live setting.' },
    loudness: { name: 'loud', description: 'Energetic and sonically powerful music.' },
    valence: { name: 'positive', description: 'Uplifting and feel-good melodies.' },
    tempo: { name: 'tempo', description: 'Music with a fast and vibrant tempo.' }
};

export const translateAnalyticsLow = {
    acousticness: { name: 'electronic', description: 'Music with electronic instruments.' },
    danceability: { name: 'subtle', description: 'Music with a subtle rhythm.' },
    energy: { name: 'calm', description: 'Relaxed and calm music.' },
    instrumentalness: { name: 'vocal', description: 'Music that contains vocals.' },
    liveness: { name: 'studio recorded', description: 'Music that is recorded in a studio.' },
    loudness: { name: 'soft', description: 'Gentle and quiet music.' },
    valence: { name: 'negative', description: 'Music that feels downbeat.' },
    tempo: { name: 'low tempo', description: 'Music that moves at a moderate pace.' }
};


export const analyticsMetrics = ['acousticness', 'danceability', 'energy', 'instrumentalness', 'valence', `tempo`];

// Get the display name of the list item.
export const getLIName = function (data, maxLength = 30) {
    let result;
    if(!data){
        return null;
    }
    if (data.hasOwnProperty('artist_id')) {
        result = data.name;
    } else if (data.hasOwnProperty('song_id')) {
        result = data.title;
    } else if (data.hasOwnProperty('album_id')) {
        result = data.name;
    } else {
        result = data;
    }
    if (result.length > maxLength) {
        result = result.substring(0, maxLength) + "..."
    }
    return result;
}

export const getLIDescription = function (data, maxLength = 30) {
    let result;
    if (data.hasOwnProperty('artist_id')) {
        if (data.genres && data.genres.length > 0) {
            result = data.genres[0];
        } else {
            result = '';
        }
    } else if (data.hasOwnProperty('song_id') || data.hasOwnProperty('album_id')) {
        result = data.artists.map(e => e.name).join(', ');
    } else {
        result = '';
    }
    if (result.length > maxLength) {
        result = result.substring(0, maxLength) + "..."
    }
    return result;
}

export const containsElement = function (e, dp, type) {
    let contains = false;
    switch (type) {
        case "artists":
            contains = dp[`top_${type}`].some((element) => element.artist_id === e.artist_id);
            break;
        case "songs":
            contains = dp[`top_${type}`].some((element) => element.song_id === e.song_id);
            break;
        case "genres":
            contains = dp[`top_${type}`].some(element => element === e);
            break;
    }
    return contains;
}


export const getMatchingItems = (dp1, dp2, type) => {
    let matches = [];
    dp1[`top_${type}`].forEach(item => {
        if (containsElement(item, dp2, type)) {
            matches.push(item)
        }
    })
    return matches;
}
export const calculateSimilarity = (dp1, dp2) => {
    let artistsSimilarity = 0;
    let genresSimilarity = 0;
    const avgGenreListLength = Math.floor((dp1.top_genres.length + dp2.top_genres.length) / 2);
    let metricDelta = 0;
    let u0Metrics = getAverageAnalytics(dp1.top_songs);
    let u1Metrics = getAverageAnalytics(dp2.top_songs);
    let similarity;
    dp1.top_artists.forEach(artist1 => {
        if (dp2.top_artists.some(artist2 => artist2.name === artist1.name)) {
            artistsSimilarity++;
        }
    })
    dp1.top_genres.forEach((genre, i1) => {
        const i2 = dp2.top_genres.findIndex(e => e === genre);
        if (i2 !== -1) {
            const diff = Math.abs(i1 - i2);
            genresSimilarity += Math.abs(avgGenreListLength - diff) / avgGenreListLength;
        }
    })
    artistsSimilarity /= dp1.top_artists.length;
    genresSimilarity /= avgGenreListLength;
    genresSimilarity = Math.pow(genresSimilarity, 0.25);
    const excludedKeys = ['tempo', 'loudness'];
    for (const key in u0Metrics) {
        if (!excludedKeys.some(e => e === key)) {
            metricDelta += Math.abs(u0Metrics[key] - u1Metrics[key]);
        }
    }
    metricDelta /= (Object.entries(u0Metrics).length - excludedKeys.length);
    metricDelta = Math.sqrt(metricDelta);
    similarity = ((2 * genresSimilarity + artistsSimilarity + 2 * (1 - metricDelta)) / 4);
    similarity = Math.round(100 * similarity)
    if (similarity > 100) {
        similarity = 100
    } // Ensure not over 100%
    return {
        artists: artistsSimilarity * 100,
        genres: genresSimilarity * 100,
        metrics: (1 - metricDelta) * 100,
        overall: similarity
    };
}


export const getAverageAnalytics = function (songs) {
    // noinspection SpellCheckingInspection
    let avgAnalytics = {
        acousticness: 0,
        danceability: 0,
        energy: 0,
        instrumentalness: 0,
        liveness: 0,
        loudness: 0,
        valence: 0,
        tempo: 0
    }
    const validSongs = songs.filter(s => s.hasOwnProperty("analytics") && s.analytics !== null);
    for (const song of validSongs) {
        Object.keys(translateAnalytics).forEach(key => {
            avgAnalytics[key] += song.analytics[key] / validSongs.length;
        })
    }
    return avgAnalytics;
}

export const getItemIndexChange = function (item, index, type, comparisonDP) {
    let lastIndex = -1;
    switch (type) {
        case "artists":
            lastIndex = comparisonDP[`top_${type}`].findIndex((element) => element.artist_id === item.artist_id);
            break;
        case "songs":
            lastIndex = comparisonDP[`top_${type}`].findIndex((element) => element.song_id === item.song_id);
            break;
        case "genres":
            lastIndex = comparisonDP[`top_${type}`].indexOf(item);
            break;
    }
    if (lastIndex < 0) {
        return null
    }
    //console.log(`----${item.name || item}----`);
    //console.log(`Prev: ${lastIndex}, New: ${index}, Diff: ${lastIndex - index}`);
    return lastIndex - index;
}

function getMaxValueAttribute(attributes) {
    const ignoredAttributes = ["key", "mode", "speechiness", "duration_ms", "time_signature", "tempo"];

    let max = Number.MIN_SAFE_INTEGER;
    let maxAttribute = '';

    for (const key in attributes) {
        if (typeof attributes[key] === 'number' && !ignoredAttributes.includes(key)) {
            let value = attributes[key];

            if (value > max) {
                max = value;
                maxAttribute = key;
            }
        }
    }

    return maxAttribute;
}

function getMostInterestingAnalytic(analytics) {
    const ignoredAttributes = ["key", "mode", "duration_ms", "time_signature", "tempo", "loudness"];
    let max = Number.MIN_SAFE_INTEGER;
    let maxAnalytic;
    let min = Number.MAX_SAFE_INTEGER;
    let minAnalytic;

    for (const key in analytics) {
        if (typeof analytics[key] === 'number' && !ignoredAttributes.includes(key)) {
            let value = analytics[key];
            if(value > max){
                max = value;
                maxAnalytic = key;
            }
            if(value < min){
                // Having a vocal / studio recorded song is not interesting
                if(key !== "instrumentalness" && key !== "liveness"){
                    min = value;
                    minAnalytic = key;
                }
            }
        }
    }
    if(max === 0){
        return null;
    }
    console.log(maxAnalytic, max, minAnalytic, min);
    if(max >= (1-min) || max > 0.8){
        return {analytic: maxAnalytic, type: "high"}
    }else if (max <= (1-min) || min < 0.2){
        return {analytic: minAnalytic, type: "low"}
    } else {
        return null;
    }
}

export const getItemAnalysis = function (item, type, user, selectedDatapoint, allDatapoints, term) {
    const possessive = window.location.hash.slice(1, window.location.hash.length) === 'me' ? 'your' : `${user.username}'s`;
    const pronoun = window.location.hash.slice(1, window.location.hash.length) === 'me' ? 'you' : `${user.username}`;
    switch (type) {
        case "artists":
            const name = getLIName(item);
            // Short to long term
            const indexes = allDatapoints.map(d => {
                return d.top_artists.findIndex(a => a.artist_id === item.artist_id);
            });
            console.log(name, indexes);
            const associatedSongIndex = selectedDatapoint.top_songs.findIndex(s => s.artists.some(a => a.artist_id === item.artist_id));
            const associatedSong = selectedDatapoint.top_songs[associatedSongIndex];
            const allSongs = selectedDatapoint.top_songs.filter(s => s.artists.some(a => a.artist_id === item.artist_id));
            const avgAnalytics = getAverageAnalytics(allSongs);
            const intAnalytic = getMostInterestingAnalytic(avgAnalytics);
            const transIntAnalytic = intAnalytic !== null ? (intAnalytic.type === "high" ? translateAnalytics[intAnalytic.analytic].name : translateAnalyticsLow[intAnalytic.analytic].name) : null;

            // Construct first part of the analysis.
            let firstPart;
            switch (term) {
                case "long_term":
                    // If they haven't listened to them at all in the last month
                    if (indexes[0] === -1) {
                        firstPart = `${name} is still one of ${possessive} most listened to artists, although ${pronoun} has been listening to them significantly less than usual recently.`;

                    }
                    // If they have listened to less of them in the last month
                    else if (indexes[0] > indexes[2]) {
                        firstPart = `${capitalize(pronoun)} ${pronoun === 'you' ? 'have' : 'has'} listened to ${name} less recently due to exploring new sounds and artists.`;
                    }
                    // If they have listened to the same or more of them in the last month
                    else {
                        firstPart = `${capitalize(pronoun)} ${pronoun === 'you' ? 'have' : 'has'} been enjoying ${name}'s music more than ever before. With time they will climb up your top artists of all time.`;
                    }
                    break;
                case "medium_term":
                    // If they haven't listened to them at all in the medium term
                    if (indexes[1] === -1) {
                        firstPart = `${name} remains an influential figure in ${pronoun}'s recent music preferences, despite limited listening in the past 6 months.`;
                    }
                    // If they have listened to less of them in the medium term
                    else if (indexes[1] > indexes[2] && indexes[2] !== -1) {
                        firstPart = `${capitalize(pronoun)} ${pronoun === 'you' ? 'have' : 'has'} listened to ${name} less than usual in the past 6 months, but it still holds a significant place in ${possessive} overall listening time.`;
                    }
                    // If they have listened to more of them in the medium term
                    else if (indexes[1] < indexes[2] && indexes[2] !== -1) {
                        firstPart = `${capitalize(pronoun)} ${pronoun === 'you' ? 'have' : 'has'} been increasingly captivated by ${name}'s music in the past 6 months.`;
                    }
                    // If all indexes are the same
                    else if (indexes[0] === indexes[1] && indexes[1] === indexes[2]) {
                        firstPart = `In the last 6 months, ${pronoun} ${pronoun === 'you' ? 'have' : 'has'} maintained a consistent listening pattern for ${name}'s music.`;
                    }
                    // If they have listened to more or less of them in the short term compared to the medium term
                    else if (indexes[0] !== indexes[1]) {
                        if (indexes[0] < indexes[1]) {
                            firstPart = `In the last month, ${pronoun} ${pronoun === 'you' ? 'have' : 'has'} been listening to ${name} more frequently than in the previous 6 months.`;
                        } else {
                            firstPart = `In the last month, ${pronoun} ${pronoun === 'you' ? 'have' : 'has'} explored other music, resulting in less time spent on ${name}'s tracks compared to the previous 6 months.`;
                        }
                    }

                    break;
                case "short_term":
                    // If this artist is totally new to them
                    if (indexes[1] === -1 && indexes[0] === -1) {
                        firstPart = `In the last 4 weeks, ${pronoun} ${pronoun === 'you' ? 'have' : 'has'} discovered ${name}'s music.`;
                    }
                    // If they have listened to less of this artist in the last 4 weeks than usual
                    else if ((indexes[1] < indexes[0] && indexes[2] < indexes[0]) || (indexes[1] < indexes[0] && indexes[2] === -1)) {
                        firstPart = `In the last 4 weeks, ${pronoun} ${pronoun === 'you' ? 'have' : 'has'} listened to ${name}'s music less frequently than before.`;
                    }
                    // If they have listened to more than usual in the last 6 months, and more than the last 6 months in the last 4 weeks
                    else if ((indexes[1] > indexes[0] && indexes[2] > indexes[1]) || (indexes[1] > indexes[0] && indexes[2] === -1)) {
                        firstPart = `In the past 6 months and especially in the last 4 weeks, ${pronoun} has been increasingly captivated by ${name}'s music.`;
                    }
                    // If they have listened to less than the last 6 months average
                    else if (indexes[0] > indexes[1] && indexes[1] !== 1) {
                        firstPart = `Compared to the previous 6 months, ${pronoun} has listened to ${name} less frequently in the last 4 weeks.`;
                    }
                    // If they have listened to more than the last 6 months average and they are not yet on the top artists list but they are on their way to be
                    else if (indexes[1] > indexes[0] && indexes[2] === -1) {
                        firstPart = `In the last 4 weeks, ${pronoun} ${pronoun === 'you' ? 'have' : 'has'} been increasingly drawn to ${name}'s music.`;
                    }
                    // If both indexes[0] and indexes[2] are less than indexes[1]
                    else if (indexes[0] < indexes[1] && indexes[2] < indexes[1]) {
                        firstPart = `In the last 4 weeks, ${pronoun} ${pronoun === 'you' ? 'have' : 'has'} experienced a renewed appreciation for ${name}'s music.`;
                    }
                    // If both indexes[0] and indexes[2] are greater than indexes[1]
                    else if (indexes[0] > indexes[1] && indexes[2] > indexes[1]) {
                        firstPart = `In the last 4 weeks, ${pronoun}'s listening to ${name} has decreased compared to the previous 6 months, but it remains higher than the all-time average.`;
                    }
                    // If all indexes are the same
                    else if (indexes[0] === indexes[1] && indexes[1] === indexes[2]) {
                        firstPart = `In the last 4 weeks, ${pronoun} ${pronoun === 'you' ? 'have' : 'has'} maintained a consistent listening pattern for ${name}'s music.`;
                    }
                    // If indexes[0] and indexes[1] are equal but less than indexes[2]
                    else if (indexes[0] === indexes[1] && indexes[0] < indexes[2]) {
                        firstPart = `Over the last 4 weeks and 6 months ${pronoun} ${pronoun === 'you' ? 'have' : 'has'} been listening to ${name} consistently more than usual.`;
                    }
                    break;
            }
            // Construct the second part of the analysis
            let secondPart;
            if(!!transIntAnalytic && !!associatedSong){
                secondPart = <span>The songs {pronoun} listen{pronoun !== 'you' && 's'} to by {name} are predominantly {transIntAnalytic}, with {possessive} top song by them being <a className={'heavy-link'} href={associatedSong?.link}>{getLIName(associatedSong)}</a> at number {associatedSongIndex + 1} on {possessive} top songs of {term === 'long_term' ? 'all time' : (term === 'medium_term' ? 'the last 6 months' : 'the last 4 weeks')}.</span>
            }else if (!transIntAnalytic && !!associatedSong){
                secondPart = <span>{capitalize(possessive)} top song by them is <a className={'heavy-link'} href={associatedSong?.link}>{getLIName(associatedSong)}</a> at number {associatedSongIndex + 1} of {possessive} top songs on {term === 'long_term' ? 'all time' : (term === 'medium_term' ? 'the last 6 months' : 'the last 4 weeks')}.</span>
            }
            return (
                <p>
                    {firstPart}
                    <br />
                    <br />
                    {secondPart}
                </p>
            )
        case "songs":
            break;
        case "genres":
            break;
        default:
            console.warn("updateFocusMessage error: No focus type found.")
    }
}

const regress = (x, y) => {
    const n = y.length;
    let sx = 0;
    let sy = 0;
    let sxy = 0;
    let sxx = 0;
    let syy = 0;
    for (let i = 0; i < n; i++) {
        sx += x[i];
        sy += y[i];
        sxy += x[i] * y[i];
        sxx += x[i] * x[i];
        syy += y[i] * y[i];
    }
    const mx = sx / n;
    const my = sy / n;
    const yy = n * syy - sy * sy;
    const xx = n * sxx - sx * sx;
    const xy = n * sxy - sx * sy;
    const slope = xy / xx;
    const intercept = my - slope * mx;
    const r = xy / Math.sqrt(xx * yy);
    const r2 = Math.pow(r,2);
    let sst = 0;
    for (let i = 0; i < n; i++) {
        sst += Math.pow((y[i] - my), 2);
    }
    const sse = sst - r2 * sst;
    const see = Math.sqrt(sse / (n - 2));
    const ssr = sst - sse;
    return {slope, intercept, r, r2, sse, ssr, sst, sy, sx, see};
}

export const getPlaylistAnalysis = (tracks) => {

    let message = '';

    const avgAnalytics = getAverageAnalytics(tracks);

    /**
     * STANDARD DEVIATION CALCS
    **/


    // Calculate the sum of the squares of the differences of a track
    // to the average analytics
    const getSquaredAnalyticsDiff = (track, avgAnalytics) => {
        let rollingTotal = 0;
        for(const key of Object.keys(avgAnalytics)){
            if(key !== "tempo" && key !== "loudness"){
                rollingTotal += Math.pow((track.analytics[key] - avgAnalytics[key]),2)
            }
        }
        return rollingTotal;
    }
    const tracksWithAnalytics = tracks.filter(t => t.hasOwnProperty("analytics") && t.analytics !== null);
    const playlistStandardDeviation = Math.sqrt(
        tracksWithAnalytics.reduce((accumulator, currentValue) => accumulator + getSquaredAnalyticsDiff(currentValue, avgAnalytics), 0) / tracksWithAnalytics.length
    );

    /**
     * LINEAR TENDENCIES CALCS
     *
     * TAKEN INTO ACCOUNT:
     * DECREASING (LINEARLY)
     * STEADY
     * INCREASING (LINEARLY)
     *
     **/
    const yVals = [];

    for (let i = 1; i <= tracksWithAnalytics.length; i++) {
        yVals.push(i);
    }

    let regressions = {
        acousticness: 0,
        danceability: 0,
        energy: 0,
        instrumentalness: 0,
        liveness: 0,
        valence: 0,
    }

    for (const key of Object.keys(regressions)){
        regressions[key] = regress(yVals, tracksWithAnalytics.map(t => t.analytics[key])).slope;
    }

    const notableTrends = [];
    for(const key of Object.keys(regressions)){
        if(Math.abs(regressions[key]) > 0.1){
            notableTrends.push(key);
        }
    }

    notableTrends.sort((a,b) => Math.abs(regressions[b]) - Math.abs(regressions[a]))

    /**
     * NOTABLE ANALYTICS CALCS
     **/

    const notableAnalytic = getMostInterestingAnalytic(avgAnalytics);
    console.log(notableAnalytic);
    const vibe = notableAnalytic !== null ? ( notableAnalytic.type === 'high' ? translateAnalytics[notableAnalytic.analytic].name : translateAnalyticsLow[notableAnalytic.analytic].name ) : null;

    return {
        variability: playlistStandardDeviation,
        vibe: vibe,
        trends: notableTrends.map(trend => { return {name: translateAnalytics[trend].name, slope: regressions[trend]} })
    }
}

export const getItemType = (item) => {
    if (item.hasOwnProperty('artist_id')) {
        return 'artists'
    } else if (item.hasOwnProperty('song_id')) {
        return 'songs'
    } else if (item.hasOwnProperty('album_id')) {
        return 'albums';
    } else if(item.hasOwnProperty('playlist_id')){
        return 'playlists';
    } else if (item.hasOwnProperty('user_id')){
        return 'users'
    } else if (typeof item !== "object") {
        return 'genres'
    } else {
        console.error(item);
        throw new Error('Unknown item submitted to getItemType.');
    }
}

export const getGenresRelatedArtists = (genre, artists) => {
    return artists.filter(a => a.genres ? a.genres.some(g => g === genre) : false)
}