import {isAlbum, isArtist, isPlaylist, isTrack} from "@/Tools/utils";
import {Track, TrackAnalytics, TrackWithAnalytics} from "@/API/Interfaces/trackInterfaces";
import {Playlist} from "@/API/Interfaces/playlistInterfaces";
import {Artist} from "@/API/Interfaces/artistInterfaces";
import {Album} from "@/API/Interfaces/albumInterfaces";
import {Datapoint, Term} from "@/Tools/Interfaces/datapointInterfaces";


/**
 * Holds all the methods used to generate analysis for certain objects within the context of a datapoint.
 */

export const translateAnalytics = {
    acousticness: {name: 'acoustic', description: 'Music with natural instruments.'},
    danceability: {name: 'upbeat', description: 'Energetic and groove-inducing music.'},
    energy: {name: 'dynamic', description: 'High-energy and lively tunes.'},
    instrumentalness: {name: 'instrumental', description: 'Music without vocals.'},
    liveness: {name: 'live', description: 'Music performed in a live setting.'},
    loudness: {name: 'loud', description: 'Energetic and sonically powerful music.'},
    valence: {name: 'positive', description: 'Uplifting and feel-good melodies.'},
    tempo: {name: 'tempo', description: 'Music with a fast and vibrant tempo.'}
};

export const translateAnalyticsLow = {
    acousticness: {name: 'electronic', description: 'Music with electronic instruments.'},
    danceability: {name: 'subtle', description: 'Music with a subtle rhythm.'},
    energy: {name: 'calm', description: 'Relaxed and calm music.'},
    instrumentalness: {name: 'vocal', description: 'Music that contains vocals.'},
    liveness: {name: 'studio recorded', description: 'Music that is recorded in a studio.'},
    loudness: {name: 'soft', description: 'Gentle and quiet music.'},
    valence: {name: 'negative', description: 'Music that feels downbeat.'},
    tempo: {name: 'low tempo', description: 'Music that moves at a moderate pace.'}
};


export const analyticsMetrics = ['acousticness', 'danceability', 'energy', 'instrumentalness', 'valence', `tempo`];

// Get the display name of the list item.
export const getLIName = function (data: any, maxLength = 30) {
    let result = null;
    if (!data) {
        return null;
    }
    if (isArtist(data)) {
        result = data.name;
    } else if (isTrack(data)) {
        result = data.name;
    } else if (isAlbum(data)) {
        result = data.name;
    } else if (isPlaylist(data)) {
        result = data.name;
    } else {
        result = data;
    }
    if (result.length > maxLength) {
        result = result.substring(0, maxLength) + "..."
    }
    return result;
}


export const getLIDescription = function (data: Artist | Track | TrackWithAnalytics | Album | Playlist | string, maxLength = 30) {
    let result;
    if (isArtist(data)) {
        if (data.genres && data.genres.length > 0) {
            result = data.genres[0];
        } else {
            result = '';
        }
    } else if (isTrack(data) || isAlbum(data)) {
        result = data.artists.map(e => e.name).join(', ');
    } else {
        result = '';
    }
    if (result.length > maxLength) {
        result = result.substring(0, maxLength) + "..."
    }
    return result;
}
export const containsElement = (data: Artist | Track | TrackWithAnalytics | string, datapoint: Datapoint) => {
    if (isArtist(data)) {
        return datapoint.top_artists.some((artist) => artist.id === data.id);
    } else if (isTrack(data)) {
        return datapoint.top_tracks.some((song) => song.id === data.id);
    } else if (typeof data === 'string') {
        return datapoint.top_genres.some(genre => genre === data);
    }
    return false;
}


export const getMatchingItems = (dp1: Datapoint, dp2: Datapoint, type: Term) => {
    let matches = [];
    dp1[`top_${type}`].forEach(item => {
        if (containsElement(item, dp2)) {
            matches.push(item)
        }
    })
    return matches;
}

export const calculateSimilarity = (dp1: Datapoint, dp2: Datapoint) => {
    let artistsSimilarity = 0;
    let genresSimilarity = 0;
    const avgGenreListLength = Math.floor((dp1.top_genres.length + dp2.top_genres.length) / 2);
    let metricDelta = 0;
    let u0Metrics = getAverageAnalytics(dp1.top_tracks);
    let u1Metrics = getAverageAnalytics(dp2.top_tracks);
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


export const getAverageAnalytics = function (tracks) {
    // noinspection SpellCheckingInspection
    const avgAnalytics: TrackAnalytics = {
        id: null,
        analysis_url: null,
        track_href: null,
        type: null,
        uri: null,
        acousticness: 0,
        danceability: 0,
        energy: 0,
        instrumentalness: 0,
        liveness: 0,
        valence: 0,
        tempo: 0,
        loudness: 0,
        key: 0,
        mode: 0,
        speechiness: 0,
        duration_ms: 0,
        time_signature: 0
    }
    const validTracks = tracks.filter(t => t.hasOwnProperty("audio_features") && t.audio_features !== null);
    for (const track of validTracks) {
        Object.keys(translateAnalytics).forEach(key => {
            if (typeof track.audio_features[key] === 'number') {
                avgAnalytics[key] += track.audio_features[key] / validTracks.length;
            }
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

export function getMostInterestingAttribute(analytics) {
    const ignoredAttributes = ["key", "mode", "duration_ms", "time_signature", "tempo", "loudness", "speechiness"];
    let max = Number.MIN_SAFE_INTEGER;
    let maxAnalytic;
    let min = Number.MAX_SAFE_INTEGER;
    let minAnalytic;

    for (const key in analytics) {
        if (typeof analytics[key] === 'number' && !ignoredAttributes.includes(key)) {
            let value = analytics[key];
            if (value > max) {
                max = value;
                maxAnalytic = key;
            }
            if (value < min) {
                // Having a vocal / studio recorded song is not interesting
                if (key !== "instrumentalness" && key !== "liveness") {
                    min = value;
                    minAnalytic = key;
                }
            }
        }
    }
    if (max === 0) {
        return null;
    }
    if (max >= (1 - min) || max > 0.7) {
        return translateAnalytics[maxAnalytic]
    } else if (max <= (1 - min) || min < 0.2) {
        return translateAnalyticsLow[minAnalytic]
    } else {
        return null;
    }
}

export const getTopInterestingAnalytics = (analytics: TrackAnalytics, number: number) => {
    let analyticsCopy = structuredClone(analytics);
    const intAnalytics = [];
    const ignoredAttributes = ["key", "mode", "duration_ms", "time_signature", "tempo", "loudness", "speechiness"];

    for (let i = 0; i < number; i++) {
        let max = Number.MIN_SAFE_INTEGER;
        let maxAnalytic;
        let min = Number.MAX_SAFE_INTEGER;
        let minAnalytic;

        for (const key in analyticsCopy) {
            if (typeof analyticsCopy[key] === 'number' && !ignoredAttributes.includes(key)) {
                let value = analyticsCopy[key];
                if (value > max) {
                    max = value;
                    maxAnalytic = key;
                }
                if (value < min) {
                    // Having a vocal / studio recorded song is not interesting
                    if (key !== "instrumentalness" && key !== "liveness") {
                        min = value;
                        minAnalytic = key;
                    }
                }
            }
        }

        if (max >= (1 - min)) {
            intAnalytics.push(maxAnalytic);
            delete analyticsCopy[maxAnalytic];
        } else if (max <= (1 - min)) {
            intAnalytics.push(minAnalytic);
            delete analyticsCopy[minAnalytic];
        }
    }

    return intAnalytics;
}

export function getOrdinalSuffix(number) {
    const suffixes = ["th", "st", "nd", "rd"];
    const lastDigit = number % 10;
    const lastTwoDigits = number % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
        return "th";
    }

    return suffixes[lastDigit] || "th";
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
    const r2 = Math.pow(r, 2);
    let sst = 0;
    for (let i = 0; i < n; i++) {
        sst += Math.pow((y[i] - my), 2);
    }
    const sse = sst - r2 * sst;
    const see = Math.sqrt(sse / (n - 2));
    const ssr = sst - sse;
    return {slope, intercept, r, r2, sse, ssr, sst, sy, sx, see};
};

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
            for (const key of Object.keys(avgAnalytics)) {
                if (key !== "tempo" && key !== "loudness") {
                    rollingTotal += Math.pow((track.analytics[key] - avgAnalytics[key]), 2)
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

    for (const key of Object.keys(regressions)) {
        regressions[key] = regress(yVals, tracksWithAnalytics.map(t => t.analytics[key])).slope;
    }

    const notableTrends = [];
    for (const key of Object.keys(regressions)) {
        if (Math.abs(regressions[key]) > 0.1) {
            notableTrends.push(key);
        }
    }

    notableTrends.sort((a, b) => Math.abs(regressions[b]) - Math.abs(regressions[a]))

    /**
     * NOTABLE ANALYTICS CALCS
     **/

    const notableAnalytic = getMostInterestingAttribute(avgAnalytics);

    return {
        variability: playlistStandardDeviation,
        vibe: notableAnalytic?.name,
        trends: notableTrends.map(trend => {
            return {name: translateAnalytics[trend].name, slope: regressions[trend]};
        })
    };
};

export const getGenresRelatedArtists = (genre, artists) => {
    return artists.filter(a => a.genres ? a.genres.some(g => g === genre) : false)
};