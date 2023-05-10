// noinspection SpellCheckingInspection
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
    for (const song of songs) {
        Object.keys(translateAnalytics).forEach(key => {
            avgAnalytics[key] += song.analytics[key] / songs.length;
        })
    }
    return avgAnalytics;
}

export const getItemIndexChange = function (item, index, type, comparisonDP) {
    const lastIndex = item.name ? comparisonDP[`top_${type}`].findIndex((element) => element.name === item.name) : comparisonDP[`top_${type}`].indexOf(item);
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
    const analyticsMetrics = ['acousticness', 'danceability', 'energy', 'instrumentalness', 'valence', `tempo`];
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
            for (let i = 0; i < 50; i++) {
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
}();
// Update the focus message to be
// relevant to the current focus
export const getItemAnalysis = function (item, type, user, datapoint) {
    // What do we use as our possessive?
    const artistAssociations = getAllArtistAssociations(datapoint);
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
            // noinspection SpellCheckingInspection
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
            topMessage += `"${item.title}" highlights ${possessive} love for ${maxAnalytic === 'tempo' ? 'high' : ''} ${translateAnalytics[maxAnalytic].name} music and ${item.artists[0].name}.`
            if (datapoint.top_artists.some((element) => element && element.name === item.artists[0].name)) {
                const index = datapoint.top_artists.findIndex((element) => element.name === item.artists[0].name);
                secondMessage += `${item.artists[0].name} is Nº ${index + 1} on ${possessive} top artists list in this time frame.`
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

export const getGenresRelatedArtists = (genre, artists) => {
    return artists.filter(a => a.genres ? a.genres.some(g => g === genre) : false)
}