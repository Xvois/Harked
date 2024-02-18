import {capitalize} from "@mui/material";
import {
    getAverageAnalytics,
    getLIDescription,
    getLIName,
    getMostInterestingAttribute,
    getOrdinalSuffix,
    getTopInterestingAnalytics,
    translateAnalytics,
    translateAnalyticsLow
} from "@/Analysis/analysis";
import React, {useContext} from "react";
import {Artist} from "@/API/Interfaces/artistInterfaces";
import {User} from "@/Tools/Interfaces/userInterfaces";
import {Datapoint, Term} from "@/Tools/Interfaces/datapointInterfaces";
import {isArtist, isTrack} from "@/Tools/utils";
import {TrackWithAnalytics} from "@/API/Interfaces/trackInterfaces";

const ArtistDescriptor = function () {
    const {item, user, selectedDatapoint, allDatapoints, term, possessive, pronoun} = useContext(AnalysisContext);
    const artist = item as Artist;
    const name = getLIName(artist);

    // Short to long term
    let indexes = allDatapoints.map(d => {
        return d?.top_artists.findIndex(a => a.id === artist.id);
    });

    // If any null datapoints, assume -1 index result
    indexes.map(i => i === null ? -1 : i);
    const associatedSongIndex = selectedDatapoint.top_tracks.findIndex(s => s.artists.some(a => a.id === artist.id));
    const associatedSong = selectedDatapoint.top_tracks[associatedSongIndex];
    const allSongs = selectedDatapoint.top_tracks.filter(s => s.artists.some(a => a.id === artist.id));
    const avgAnalytics = getAverageAnalytics(allSongs);
    const intAttribute = getMostInterestingAttribute(avgAnalytics);

    // Construct first part of the analysis.
    let firstPartArtist;
    switch (term) {
        case "long_term":
            // If they haven't listened to them at all in the last month
            if (indexes[0] === -1) {
                firstPartArtist = `${name} is still one of ${possessive} most listened to artists, although ${pronoun} has been listening to them significantly less than usual recently.`;

            }
            // If they have listened to less of them in the last month
            else if (indexes[0] > indexes[2]) {
                firstPartArtist = `${capitalize(pronoun)} ${pronoun === 'you' ? 'have' : 'has'} listened to ${name} less recently due to exploring new sounds and artists.`;
            }
            // If they have listened to the same or more of them in the last month
            else {
                firstPartArtist = `${capitalize(pronoun)} ${pronoun === 'you' ? 'have' : 'has'} been enjoying ${name}'s music more than ever before.`;
            }
            break;
        case "medium_term":
            // If they haven't listened to them at all in the medium term
            if (indexes[1] === -1) {
                firstPartArtist = `${name} remains an influential figure in ${pronoun}'s recent music preferences, despite limited listening in the past 6 months.`;
            }
            // If they have listened to less of them in the medium term
            else if (indexes[1] > indexes[2] && indexes[2] !== -1) {
                firstPartArtist = `${capitalize(pronoun)} ${pronoun === 'you' ? 'have' : 'has'} listened to ${name} less than usual in the past 6 months, but it still holds a significant place in ${possessive} overall listening time.`;
            }
            // If they have listened to more of them in the medium term
            else if (indexes[1] < indexes[2] && indexes[2] !== -1) {
                firstPartArtist = `${capitalize(pronoun)} ${pronoun === 'you' ? 'have' : 'has'} been increasingly captivated by ${name}'s music in the past 6 months.`;
            }
            // If all indexes are the same
            else if (indexes[0] === indexes[1] && indexes[1] === indexes[2]) {
                firstPartArtist = `In the last 6 months, ${pronoun} ${pronoun === 'you' ? 'have' : 'has'} maintained a consistent listening pattern for ${name}'s music.`;
            }
            // If they have listened to more or less of them in the short term compared to the medium term
            else if (indexes[0] !== indexes[1]) {
                if (indexes[0] < indexes[1]) {
                    firstPartArtist = `In the last month, ${pronoun} ${pronoun === 'you' ? 'have' : 'has'} been listening to ${name} more frequently than in the previous 6 months.`;
                } else {
                    firstPartArtist = `In the last month, ${pronoun} ${pronoun === 'you' ? 'have' : 'has'} explored other music, resulting in less time spent on ${name}'s tracks compared to the previous 6 months.`;
                }
            }

            break;
        case "short_term":
            // If this artist is totally new to them
            if (indexes[2] === -1 && indexes[1] === -1) {
                firstPartArtist = `In the last 4 weeks, ${pronoun} ${pronoun === 'you' ? 'have' : 'has'} shown a new interest in ${name}'s music.`;
            }
            // If they have listened to less of this artist in the last 4 weeks than usual
            else if ((indexes[1] < indexes[0] && indexes[2] < indexes[0]) || (indexes[1] < indexes[0] && indexes[2] === -1)) {
                firstPartArtist = `In the last 4 weeks, ${pronoun} ${pronoun === 'you' ? 'have' : 'has'} listened to ${name}'s music less frequently than before.`;
            }
            // If they have listened to more than usual in the last 6 months, and more than the last 6 months in the last 4 weeks
            else if ((indexes[1] > indexes[0] && indexes[2] > indexes[1]) || (indexes[1] > indexes[0] && indexes[2] === -1)) {
                firstPartArtist = `In the past 6 months and especially in the last 4 weeks, ${pronoun} ${pronoun === 'you' ? 'have' : 'has'} been increasingly captivated by ${name}'s music.`;
            }
            // If they have listened to less than the last 6 months average
            else if (indexes[0] > indexes[1] && indexes[1] !== 1) {
                firstPartArtist = `Compared to the previous 6 months, ${pronoun} ${pronoun === 'you' ? 'have' : 'has'} listened to ${name} less frequently in the last 4 weeks.`;
            }
            // If they have listened to more than the last 6 months average and they are not yet on the top artists list but they are on their way to be
            else if (indexes[1] > indexes[0] && indexes[2] === -1) {
                firstPartArtist = `In the last 4 weeks, ${pronoun} ${pronoun === 'you' ? 'have' : 'has'} been increasingly drawn to ${name}'s music.`;
            }
            // If both indexes[0] and indexes[2] are less than indexes[1]
            else if (indexes[0] < indexes[1] && indexes[2] < indexes[1]) {
                firstPartArtist = `In the last 4 weeks, ${pronoun} ${pronoun === 'you' ? 'have' : 'has'} experienced a renewed appreciation for ${name}'s music.`;
            }
            // If both indexes[0] and indexes[2] are greater than indexes[1]
            else if (indexes[0] > indexes[1] && indexes[2] > indexes[1]) {
                firstPartArtist = `In the last 4 weeks, ${pronoun}'s listening to ${name} has decreased compared to the previous 6 months, but it remains higher than the all-time average.`;
            }
            // If all indexes are the same
            else if (indexes[0] === indexes[1] && indexes[1] === indexes[2]) {
                firstPartArtist = `In the last 4 weeks, ${pronoun} ${pronoun === 'you' ? 'have' : 'has'} maintained a consistent listening pattern for ${name}'s music.`;
            }
            // If indexes[0] and indexes[1] are equal but less than indexes[2]
            else if (indexes[0] === indexes[1] && indexes[0] < indexes[2]) {
                firstPartArtist = `Over the last 4 weeks and 6 months ${pronoun} ${pronoun === 'you' ? 'have' : 'has'} been listening to ${name} consistently more than usual.`;
            }
            // If indexes[0] and indexes[1] are equal but less than indexes[2]
            else if (indexes[0] === indexes[1] && indexes[0] > indexes[2]) {
                firstPartArtist = `Over the last 4 weeks and 6 months ${pronoun} ${pronoun === 'you' ? 'have' : 'has'} been listening to ${name} consistently less than usual.`;
            }
            break;
    }
    // Construct the second part of the analysis
    let secondPartArtist;
    if (!!intAttribute && !!associatedSong) {
        secondPartArtist = `The songs ${pronoun} listen${pronoun !== 'you' ? 's' : ''} to by ${name} are predominantly ${intAttribute.name}, with ${possessive} top song by them of ${term === 'long_term' ? 'all time' : (term === 'medium_term' ? 'the last 6 months' : 'the last 4 weeks')} being "${getLIName(associatedSong)}" at number ${associatedSongIndex + 1}.`;
    } else if (!intAttribute && !!associatedSong) {
        secondPartArtist = `${capitalize(possessive)} top song by them of ${term === 'long_term' ? 'all time' : (term === 'medium_term' ? 'the last 6 months' : 'the last 4 weeks')} being "${getLIName(associatedSong)}" at number ${associatedSongIndex + 1}.`;
    }
    return (
        <p>
            {firstPartArtist}
            {secondPartArtist &&
                <React.Fragment>
                    <br/>
                    <br/>
                    {secondPartArtist}
                </React.Fragment>
            }
        </p>
    )
}

const TrackDescriptor = function () {
    const {item, user, selectedDatapoint, allDatapoints, term, possessive, pronoun} = useContext(AnalysisContext);
    const track = item as TrackWithAnalytics;


    const hasAnalytics = track.audio_features !== null;
    let firstPartSong;
    if (hasAnalytics) {
        let analyticsCopy = track.audio_features;
        const interestingAnalytics = getTopInterestingAnalytics(analyticsCopy, 2);
        const translated = interestingAnalytics.map(a => analyticsCopy[a] > 0.3 ? translateAnalytics[a].name : translateAnalyticsLow[a].name).join(', ');
        const artistIndex = selectedDatapoint.top_artists.findIndex(a => track.artists[0].id === a.id);
        firstPartSong = `This ${translated} song by ${getLIDescription(track)} is emblematic of ${possessive} love for REWRITE music.`;

        // Find the artist's position in the top artists list for the current term
        const artistPosition = artistIndex !== -1 ? artistIndex + 1 : null;
        let secondPartSong = '';
        if (artistPosition) {
            const artistName = track.artists[0].name
            secondPartSong = `${artistName} holds the ${artistPosition}${getOrdinalSuffix(artistPosition)} position in ${possessive} top artists of ${term === 'long_term' ? 'all time' : (term === 'medium_term' ? 'the last 6 months' : 'the last 4 weeks')}.`;
        }

        return (
            <p>
                {firstPartSong}
                {secondPartSong &&
                    <React.Fragment>
                        <br/>
                        <br/>
                        {secondPartSong}
                    </React.Fragment>

                }
            </p>
        );
    } else {
        firstPartSong = `The song hasn't been analyzed yet.`;
        return (
            <p>
                {firstPartSong}
            </p>
        );
    }
}

const GenreDescriptor = function () {
    const {item, user, selectedDatapoint, allDatapoints, term, possessive, pronoun} = useContext(AnalysisContext);
    const genre = item as string;
    const genreName = getLIName(item);

    function calculatePopularityTrend(genrePopularity) {
        const trendValues = genrePopularity.filter(index => index !== null);

        if (trendValues.length > 1) {
            const firstIndex = trendValues[0];
            const lastIndex = trendValues[trendValues.length - 1];

            if (lastIndex > firstIndex) {
                return "increasing";
            } else if (lastIndex < firstIndex) {
                return "decreasing";
            }
        }

        return "consistent";
    }

    // Analyze the popularity of the genre across different terms
    const genrePopularity = allDatapoints.map(datapoint => {
        const genreIndex = datapoint?.top_genres.findIndex(genre => genre === item);
        return genreIndex !== -1 && genreIndex !== null ? genreIndex + 1 : null;
    });

    // Determine the trend of the genre's popularity
    const popularityTrend = calculatePopularityTrend(genrePopularity);

    let genreAnalysis = "";

    if (popularityTrend === "increasing") {
        genreAnalysis = `${capitalize(pronoun)} have been increasingly drawn to ${genreName} music over time, making it one of ${pronoun === 'you' ? 'your' : `${possessive}`} top genres of ${term === 'long_term' ? 'all time' : (term === 'medium_term' ? 'the last 6 months' : 'the last 4 weeks')}.`;
    } else if (popularityTrend === "decreasing") {
        genreAnalysis = `${capitalize(pronoun)} have been listening to ${genreName} music less frequently over time, but it still holds a significant place in ${pronoun === 'you' ? 'your' : `${possessive}`} overall music preferences.`;
    } else {
        genreAnalysis = `Although ${pronoun} may have experienced fluctuations in ${pronoun === 'you' ? 'your' : `${possessive}`} listening preferences for ${genreName} music over time, it remains an influential genre for ${pronoun === 'you' ? 'your' : `${possessive}`} music taste.`;
    }

    // Find the top artists associated with the genre
    const genreArtists = selectedDatapoint.top_artists.filter(artist => artist.genres?.some(genre => genre === item));
    const remainingArtistCount = Math.max(0, genreArtists.length - 4);

    let artistAnalysis;
    if (genreArtists.length > 0) {
        artistAnalysis =
            <span>{pronoun === 'you' ? 'Your' : `${possessive}`} favorite artists in this genre include {genreArtists.splice(0, 4).map(a => a.name).join(', ')}{remainingArtistCount > 0 ? ` and ${remainingArtistCount} more.` : '.'}</span>;
    }

    return (
        <p>
            {genreAnalysis}
            <br/>
            <br/>
            {artistAnalysis}
        </p>
    );
}

const getPronouns = (user: User, isOwnPage: boolean) => {
    const possessive = isOwnPage ? 'your' : `${user.display_name}'s`;
    const pronoun = isOwnPage ? 'you' : `${user.display_name}`;
    return {possessive, pronoun};
}

interface AnalysisContextProps {
    item: Artist | TrackWithAnalytics | string;
    user: User;
    selectedDatapoint: Datapoint;
    allDatapoints: Datapoint[];
    term: Term;
    possessive: string;
    pronoun: string;
    isOwnPage: boolean;
}

const defaultAnalysisContextValue: AnalysisContextProps = {
    item: '',
    user: {} as User,
    selectedDatapoint: {} as Datapoint,
    allDatapoints: [],
    term: 'long_term',
    possessive: '',
    pronoun: '',
    isOwnPage: false,
};

const AnalysisContext = React.createContext(defaultAnalysisContextValue);
export const ItemDescriptor = function ({
                                            item,
                                            user,
                                            selectedDatapoint,
                                            allDatapoints,
                                            term,
                                            isOwnPage
                                        }: {
    item: Artist | TrackWithAnalytics | string,
    user: User,
    selectedDatapoint: Datapoint,
    allDatapoints: Datapoint[],
    term: Term,
    isOwnPage: boolean
}) {
    const {possessive, pronoun} = getPronouns(user, isOwnPage);

    const contextValue = {
        item,
        user,
        selectedDatapoint,
        allDatapoints,
        term,
        possessive,
        pronoun,
        isOwnPage,
    };

    return (
        <AnalysisContext.Provider value={contextValue}>
            {isArtist(item) && <ArtistDescriptor/>}
            {isTrack(item) && <TrackDescriptor/>}
            {typeof item === 'string' && <GenreDescriptor/>}
        </AnalysisContext.Provider>
    );
}