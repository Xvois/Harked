// noinspection SpellCheckingInspection
import React from "react";


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
    liveness: { name: 'studio', description: 'Music that is recorded in a studio.' },
    loudness: { name: 'soft', description: 'Gentle and quiet music.' },
    valence: { name: 'negative', description: 'Music that feels downbeat.' },
    tempo: { name: 'low tempo', description: 'Music that moves at a moderate pace.' }
};


export const analyticsMetrics = ['acousticness', 'danceability', 'energy', 'instrumentalness', 'valence', `tempo`];

// Get the display name of the list item.
export const getLIName = function (data, maxLength = 30) {
    let result;
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
    const validSongs = songs.filter(s => s.analytics.length !== 0);
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

export const getAllArtistAssociations = function () {
    // noinspection SpellCheckingInspection
    const memo = new Map();
    return function (datapoint) {
        if (memo.has(datapoint)) {
            return memo.get(datapoint);
        }
        const songs = datapoint.top_songs;
        const artists = datapoint.top_artists;
        const genres = datapoint.top_genres;
        let result = {};
        analyticsMetrics.forEach(metric => {
            let max = {artist: '', value: 0};
            for (let i = 0; i < songs.length; i++) {
                if (songs[i].analytics[metric] > max.value) {
                    max.artist = songs[i].artists[0].name;
                    max.value = songs[i].analytics[metric];
                }
            }
            result = {
                ...result,
                [max.artist]: {theme: metric}
            }
        })
        artists.forEach(artist => {
            if (!!artist.genres && genres.includes(artist.genres[0])) {
                result[artist.name] = {
                    ...result[artist.name],
                    genre: artist.genres[0]
                }
            }
        })
        memo.set(datapoint, result);
        return result;
    }
};

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


export const getItemAnalysis = function (item, type, user, datapoint, term) {
    const memoFunc = getAllArtistAssociations(datapoint);
    const artistAssociations = memoFunc(datapoint); // Call the artistAssociations function with the datapoint
    let topMessage = '';
    let secondMessage = '';
    const possessive = window.location.hash.slice(1, window.location.hash.length) === 'me' ? 'your' : `${user.username}'s`;
    // noinspection SpellCheckingInspection
    const analyticsMetrics = ['acousticness', 'danceability', 'energy', 'instrumentalness', 'valence', `tempo`];
    switch (type) {
        case "artists":
            if (artistAssociations[`${item.name}`] === undefined) {
                // If the artist doesn't have a genre analysis then we assume
                // that they are not wildly popular.
                topMessage += `${item.name} is a rare to see artist. They make ${possessive} profile quite unique.`
            } else {
                Object.keys(artistAssociations[item.name]).length > 1 ?
                    topMessage += `${item.name} represents ${possessive} love for ${artistAssociations[item.name]["genre"]} and ${translateAnalytics[artistAssociations[item.name]["theme"]].name === 'tempo' ? 'high' : ''} ${translateAnalytics[artistAssociations[item.name]["theme"]].name} music.`
                    :
                    topMessage += `${item.name} is the artist that defines ${possessive} love for ${artistAssociations[item.name][Object.keys(artistAssociations[item.name])[0]]} music.`
            }
            // The index of the song in the user's top songs list made by this artist.
            const songIndex = datapoint.top_songs.findIndex((element) => element.artists[0].name === item.name);
            if (songIndex !== -1) {
                secondMessage += `"${datapoint.top_songs[songIndex].title}" by ${item.name} is Nº ${songIndex + 1} on ${possessive} top songs of ${term === 'long_term' ? 'all time' : (term === 'medium_term' ? 'the last 6 months' : 'the last 4 weeks')}.`
            }
            break;
        case "songs":
            try {
                let maxAnalytic = getMaxValueAttribute(item.analytics);
                topMessage += `"${item.title}" highlights ${possessive} love for ${maxAnalytic === 'tempo' ? 'high' : ''} ${translateAnalytics[maxAnalytic].name} music and ${item.artists[0].name}.`
                if (datapoint.top_artists.some((element) => element && element.name === item.artists[0].name)) {
                    const index = datapoint.top_artists.findIndex((element) => element.name === item.artists[0].name);
                    secondMessage += `${item.artists[0].name} is Nº ${index + 1} on ${possessive} top artists of ${term === 'long_term' ? 'all time' : (term === 'medium_term' ? 'the last 6 months' : 'the last 4 weeks')}.`
                }
            } catch (e) {
                topMessage += "This song hasn't been analysed yet. Look back at another time to see this song's characteristics."
            }
            break;
        case "genres":
            let relatedArtists = getGenresRelatedArtists(item, datapoint.top_artists);
            if (relatedArtists.length <= 0) {
                topMessage = 'An error has occurred! There are no related artists for this genre.'
            } else {
                topMessage = `${possessive.slice(0, 1).toUpperCase() + possessive.slice(1, possessive.length)} love for ${item} is best described by ${possessive} time listening to ${relatedArtists[0].name}.`
                if (relatedArtists.length > 1) {
                    secondMessage = `It's also contributed to by ${relatedArtists.slice(1, 4).map(e => ' ' + e.name)}${relatedArtists.length > 4 ? (`, as well as ${relatedArtists.length - 4} other${relatedArtists.length > 5 ? 's' : ''}`) : ('')}.`
                } else {
                    secondMessage = ``
                }
            }
            break;
        default:
            console.warn("updateFocusMessage error: No focus type found.")
    }
    return {
        header: topMessage,
        subtitle: secondMessage
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
    const playlistStandardDeviation = Math.sqrt(
        tracks.reduce((accumulator, currentValue) => accumulator + getSquaredAnalyticsDiff(currentValue, avgAnalytics), 0) / tracks.length
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

    for (let i = 1; i <= tracks.length; i++) {
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
        regressions[key] = regress(yVals, tracks.map(t => t.analytics[key])).slope;
    }

    const notableTrends = [];
    for(const key of Object.keys(regressions)){
        if(Math.abs(regressions[key]) > 0.05){
            notableTrends.push(key);
        }
    }

    /**
     * NOTABLE ANALYTICS CALCS
     **/

    const notableAnalytics = [];
    for(const key of Object.keys(avgAnalytics)){
        if(key !== "tempo" && key !== "loudness"){
           if(avgAnalytics[key] > 0.7){
               notableAnalytics.push(translateAnalytics[key]);
           }else if(avgAnalytics[key] < 0.2){
               notableAnalytics.push(translateAnalyticsLow[key]);
           }
        }
    }

    return {
        variability: playlistStandardDeviation,
        notableAnalytics: notableAnalytics.map(a => a.name).join(', '),
        trends: notableTrends.map(trend => { return {name: translateAnalytics[trend].name, slope: regressions[trend]} })
    }
}

export const getItemType = (item) => {
    if (item.hasOwnProperty('artist_id')) {
        return 'artists'
    } else if (item.hasOwnProperty('song_id')) {
        return 'songs'
    } else if (item.hasOwnProperty('album_id')) {
        return 'albums'
    }else if (item.hasOwnProperty('user_id')){
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