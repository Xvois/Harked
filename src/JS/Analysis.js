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

export const getAllArtistAssociations = function() {
    console.info('getAllArtistAssociations called!');
    const analyticsMetrics = ['acousticness', 'danceability', 'energy', 'instrumentalness', 'valence', `tempo`];
    const memo = new Map();
    return function(datapoint) {
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
export const getItemDescription = function (item, type, user, datapoint) {
    // What do we use as our possessive?
    const artistAssociations = getAllArtistAssociations(datapoint);
    let topMessage = '';
    let secondMessage = '';
    const possessive = window.location.hash.slice(1, window.location.hash.length) === 'me' ?  'your' : `${user.username}'s`;
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
        //TODO: REWRITE THIS WHOLE AREA
        case "genres":

            break;
        default:
            console.warn("updateFocusMessage error: No focus type found.")
    }
    return {
        header: topMessage,
        subtitle: secondMessage
    }
}