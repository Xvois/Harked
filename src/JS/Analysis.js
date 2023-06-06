// noinspection SpellCheckingInspection
import React from "react";


/**
 * Holds all the methods used to generate analysis for certain objects within the context of a datapoint.
 */

export const translateAnalytics = {
    acousticness: {name: 'acoustic', description: 'Music with no electric instruments.'},
    danceability: {name: 'danceable', description: 'Music that makes you want to move it.'},
    energy: {name: 'energetic', description: 'Music that feels fast and loud.'},
    instrumentalness: {name: 'instrumental', description: 'Music that contains no vocals.'},
    liveness: {name: 'live', description: 'Music that is performed live.'},
    loudness: {name: 'loud', description: 'Music that is noisy.'},
    valence: {name: 'positive', description: 'Music that feels upbeat.'},
    tempo: {name: 'tempo', description: 'Music that moves and flows quickly.'}
}

export const analyticsMetrics = ['acousticness', 'danceability', 'energy', 'instrumentalness', 'valence', `tempo`];

// Get the display name of the list item
export const getLIName = function (data) {
    let result;
    if (data.hasOwnProperty('artist_id')) {
        result = data.name;
    } else if (data.hasOwnProperty('song_id')) {
        result = data.title;
    } else {
        result = data;
    }
    if (result.length > 30) {
        result = result.substring(0, 30) + "..."
    }
    return result;
}

export const getLIDescription = function (data, maxLength = 80) {
    let result;
    if (data.hasOwnProperty('artist_id')) {
        if (data.genres && data.genres.length > 0) {
            result = data.genres[0];
        } else {
            result = '';
        }
    } else if (data.hasOwnProperty('song_id')) {
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
    genresSimilarity = Math.sqrt(genresSimilarity);
    const excludedKeys = ['tempo', 'loudness'];
    for (const key in u0Metrics) {
        if(!excludedKeys.some(e => e === key)){
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

export const getAllItemIndexChanges = function (type, dp1, dp2) {
    let deltas = [];
    dp1[`top_${type}`].forEach(function (element, index) {
        deltas.push(getItemIndexChange(element, index, type, dp2));
    })
    return deltas;
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

export const getItemAnalysis = function (item, type, user, datapoint) {
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
                secondMessage += `${datapoint.top_songs[songIndex].title} by ${item.name} is Nº ${songIndex + 1} on ${possessive} top 50 songs list for this time frame.`
            }
            break;
        case "songs":
            try {
                let maxAnalytic = Object.keys(item.analytics).reduce((a,b) => item.analytics[a] > item.analytics[b] ? a : b);
                topMessage += `"${item.title}" highlights ${possessive} love for ${maxAnalytic === 'tempo' ? 'high' : ''} ${translateAnalytics[maxAnalytic].name} music and ${item.artists[0].name}.`
                if (datapoint.top_artists.some((element) => element && element.name === item.artists[0].name)) {
                    const index = datapoint.top_artists.findIndex((element) => element.name === item.artists[0].name);
                    secondMessage += `${item.artists[0].name} is Nº ${index + 1} on ${possessive} top artists list in this time frame.`
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
                    secondMessage = `It's also contributed to by ${possessive} time listening to${relatedArtists.slice(1, relatedArtists.length).map(e => ' ' + e.name)}.`
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

export const compareItemBetweenUsers = (item, dp1, dp2, type) => {
    let returnMessage;
    switch (type) {
        case 'artists':
            const dp1Contains = containsElement(item, dp1, type);
            const dp2Contains = containsElement(item, dp2, type);
            if (dp1Contains && dp2Contains) {
                returnMessage = `Both users have this artist in their datapoints.`
            } else {
                const genresShared = item.genres.filter(g => containsElement(g, dp1, 'genres') && containsElement(g, dp2, 'genres'));
                if (genresShared.length > 0) {
                    returnMessage = `${item.name} isn't a shared interest, but the following genre(s) are ${genresShared}.`
                } else {
                    returnMessage = `Not only is the artist not shared, but neither are any of the genres.`
                }
            }
    }

    return returnMessage;
}

export const getItemType = (item) => {
    if(item.hasOwnProperty('artist_id')){
        return 'artists'
    }else if(item.hasOwnProperty('song_id')){
        return 'songs'
    }else if(typeof item !== "object"){
        return 'genres'
    }else {
        throw new Error('Unknown item submitted to getItemType.');
    }
}

export const getGenresRelatedArtists = (genre, artists) => {
    return artists.filter(a => a.genres ? a.genres.some(g => g === genre) : false)
}