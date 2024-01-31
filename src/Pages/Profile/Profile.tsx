import {useCallback, useEffect, useState} from 'react';
import '../../../CSS/Profile.css';
import {ArcElement, Chart as ChartJS, Legend, Tooltip} from "chart.js";
import {Doughnut} from "react-chartjs-2";
import {useParams} from "react-router-dom";
import {isLoggedIn, retrieveLoggedUserID, retrieveUser, userExists} from "@tools/users";
import {modifyRecommendation, retrieveProfileRecommendations, submitRecommendation} from "@tools/recommendations";
import React from 'react';
import {retrieveAllDatapoints, retrieveDatapoint, retrievePrevAllDatapoints} from "@tools/datapoints";
import {getAllIndexes, hashString} from "@tools/utils";
import {onHydration} from "@tools/hydration";
import {followsUser, retrieveFollowers} from "@tools/following";
import {retrieveProfileData, retrieveSettings} from "@tools/userMeta";
import {retrievePlaylists} from "@tools/playlists";
import {getAverageAnalytics, translateAnalytics} from "@tools/analysis";
import {StatBlock} from "@components/StatBlock";
import {PageError} from "@components/PageError";
import {LoadingIndicator} from "@components/LoadingIndicator";
import {PlaylistItemList} from "./Components/PlaylistItemList";
import {CommentSection} from "@components/CommentSection";

ChartJS.register(ArcElement, Tooltip, Legend);

const translateTerm = {short_term: '4 weeks', medium_term: '6 months', long_term: 'All time'}

const SongAnalysisAverage = (props) => {
    const {selectedDatapoint} = props;
    const average = getAverageAnalytics(selectedDatapoint.top_songs);
    return (
        <div className={'block-wrapper'} id={'song-analysis-average'}>
            {Object.keys(translateAnalytics).map(function (key) {
                if (key !== "loudness") {
                    return <StatBlock key={key} name={translateAnalytics[key].name}
                                      description={translateAnalytics[key].description}
                                      value={average ? (key === 'tempo' ? 100 * (average[key] - 50) / 150 : average[key] * 100) : average[key] * 100}/>
                }
            })}
        </div>
    )
}






const Profile = () => {

    const simpleDatapoints = ["artists", "songs", "genres"];
    const pageID = (useParams()).id;

    const [terms, setTerms] = useState(["short_term", "medium_term", "long_term"]);
    // The datapoint that is selected for viewing
    const [selectedDatapoint, setSelectedDatapoint] = useState(null);
    // The datapoint prior to the current that is selected for comparison
    const [selectedPrevDatapoint, setSelectedPrevDatapoint] = useState(null);
    // The currently selected term
    const [termIndex, setTermIndex] = useState(2);
    const [loaded, setLoaded] = useState(false);
    const [isLoggedUserFollowing, setIsLoggedUserFollowing] = useState(null);
    const [loggedUserID, setLoggedUserID] = useState(null);

    // Uninitialised variables
    const [pageUser, setPageUser] = useState(null);
    const [isOwnPage, setIsOwnPage] = useState(false);
    const [pageGlobalUserID, setPageGlobalUserID] = useState(null);
    const [followers, setFollowers] = useState([]);
    const [allDatapoints, setAllDatapoints] = useState([]);
    const [allPreviousDatapoints, setAllPreviousDatapoints] = useState([]);
    const [playlists, setPlaylists] = useState([]);
    const [possessive, setPossessive] = useState('');
    const [settings, setSettings] = useState({});
    const [profileData, setProfileData] = useState({});

    // If something happens that doesn't allow a user to load the page
    // then an error is passed. These states are passed in to the PageError object
    // and then shown on the page.
    const [isError, setIsError] = useState(false);
    const [errorDetails, setErrorDetails] = useState({description: null, errCode: null});


    const loadPage = useCallback(() => {

        // Resolve logged user's information
        // and context of page
        const resolveContext = async () => {
            // The ID we will use for loading references
            let loadID;
            if (isLoggedIn()) {
                console.log('Context is of logged in user.')
                await retrieveLoggedUserID().then(id => {
                    // Are we on our page and don't know it?
                    if (id === pageID) {
                        window.location.href = '/profile/me'
                        // Are we on our own page and know it?
                    } else if (pageID === 'me') {
                        setIsOwnPage(true);
                        loadID = id;
                        setPageGlobalUserID(id);
                        // Are we on someone else's page?
                    } else {
                        followsUser(id, pageID).then(f => setIsLoggedUserFollowing(f));
                        loadID = pageID;
                        setPageGlobalUserID(pageID);
                        setLoggedUserID(id);
                    }
                })
            } else {
                setPageGlobalUserID(pageID)
                loadID = pageID;
            }
            return loadID;
        }

        resolveContext().then((loadID) => {
            const loadPromises = [
                retrieveUser(loadID).then(function (user) {
                    setPageUser(user);
                    retrieveFollowers(user.id).then(f => setFollowers(f));
                    if (pageID !== 'me') {
                        setPossessive(user.display_name + "'s");
                    } else {
                        setPossessive("your");
                    }
                    console.info("User retrieved!");
                }),
                retrieveAllDatapoints(loadID).then(function (datapoints) {
                    if (datapoints.some(d => d === null)) {
                        const indexes = getAllIndexes(datapoints, null);
                        if (indexes.length === 3) {
                            console.warn("ALL TERMS ELIMINATED. NOT ENOUGH DATA.");
                            setIsError(true);
                            userExists(loadID).then(exists => {
                                if (exists) {
                                    setErrorDetails({
                                        description: 'We do not have enough information about this user to generate a profile for them.',
                                        errCode: 'complete_term_elimination'
                                    });
                                } else {
                                    setErrorDetails({
                                        description: "This user isn't on Harked yet so you can't view their profile.",
                                    });
                                }
                            })

                        }
                        let termsCopy = terms;
                        indexes.forEach(i => termsCopy[i] = null);
                        setTerms(termsCopy);
                    }
                    setAllDatapoints(datapoints);
                    setSelectedDatapoint(datapoints[termIndex]);
                    console.info("Datapoints retrieved!");
                    console.log(datapoints);
                }),
                retrievePrevAllDatapoints(loadID, 1).then(function (datapoints) {
                    setAllPreviousDatapoints(datapoints);
                    setSelectedPrevDatapoint(datapoints[2]);
                    console.info("Previous datapoints retrieved!");
                    console.log(datapoints);
                }),
                retrieveSettings(loadID).then(function (s) {
                    setSettings(s);
                    if (!s.public && pageID !== 'me') {
                        console.info("LOCKED PAGE", settings);
                        setIsError(true);
                        setErrorDetails({
                            description: 'This profile is private.'
                        });
                    }
                }),
                retrieveProfileData(loadID).then(function (d) {
                    setProfileData(d);
                }),
            ];

            Promise.all(loadPromises)
                .then(() => {
                        setLoaded(true);
                        if (isLoggedIn()) {
                            retrievePlaylists(loadID).then(function (p) {
                                p.sort((a, b) => b.tracks.length - a.tracks.length);
                                setPlaylists(p);
                                console.info("Playlists retrieved!");
                                console.log('Playlists: ', p);
                            })
                        }
                    }
                )
                .catch((error) => {
                    console.error("Error loading page:", error);
                    // Handle errors appropriately
                });
            if (pageID === "me") {
                // Create onHydration to update page
                // when hydration is fully complete
                onHydration(loadID, () => {
                    retrievePrevAllDatapoints(loadID, 1).then(function (datapoints) {
                        setAllPreviousDatapoints(datapoints);
                        setSelectedPrevDatapoint(datapoints[2]);
                        console.info("Previous datapoints retrieved!");
                        console.log(datapoints);
                    })
                })
            }
        })

    }, []);

    useEffect(() => {
        // Load the page
        loadPage();
    }, [loadPage]);

    useEffect(() => {
        setSelectedDatapoint(allDatapoints[termIndex]);
        setSelectedPrevDatapoint(allPreviousDatapoints[termIndex]);
    }, [termIndex])

    return (
        <>
            {!loaded || isError ?
                isError ?
                    <PageError icon={errorDetails.icon} description={errorDetails.description}
                               errCode={errorDetails.errCode}/>
                    :
                    <LoadingIndicator/>
                :
                <div className='wrapper'>
                    <TopContainer pageUser={pageUser} followers={followers}
                                  isLoggedUserFollowing={isLoggedUserFollowing} isOwnPage={isOwnPage}
                                  loggedUserID={loggedUserID} longTermDP={allDatapoints[2]} terms={terms}
                                  setTermIndex={setTermIndex} termIndex={termIndex}/>
                    <div className={'simple-wrapper'}>
                        {simpleDatapoints.map(function (type) {
                            let description = '';
                            switch (termIndex) {
                                // Long term
                                case 2:
                                    description = `These are ${possessive} staple ${type}, those that define ${possessive} overarching taste in music.`;
                                    break;
                                // Medium term
                                case 1:
                                    description = `These are ${possessive} most popular ${type} in the last 6 months.`;
                                    break;
                                // Short term
                                case 0:
                                    description = `These are ${possessive} most popular ${type} in the last 4 weeks.`;
                                    break;
                            }
                            return (
                                <div key={type} className='simple-instance' style={{minWidth: '0px'}}>
                                    <div className={'section-header'}>
                                        <div>
                                            <p style={{
                                                margin: '16px 0 0 0',
                                                textTransform: 'uppercase'
                                            }}>{possessive}</p>
                                            <h2 style={{margin: '0', textTransform: 'uppercase'}}>Top {type}</h2>
                                            <p style={{
                                                margin: '0',
                                                textTransform: 'uppercase'
                                            }}>Of {termIndex !== 2 ? 'the last' : ''} {translateTerm[terms[termIndex]]}</p>
                                            <p>{description}</p>
                                        </div>
                                    </div>
                                    <ShowcaseList allDatapoints={allDatapoints} selectedDatapoint={selectedDatapoint}
                                                  selectedPrevDatapoint={selectedPrevDatapoint} pageUser={pageUser}
                                                  playlists={playlists}
                                                  datapoint={selectedDatapoint} type={type} start={0} end={9}
                                                  term={terms[termIndex]} isOwnPage={isOwnPage}/>
                                    {type !== 'genres' &&
                                        <div className={'section-footer'}>
                                            {type === 'songs' ?
                                                <div style={{textAlign: 'left'}}>
                                                    <p style={{
                                                        margin: '16px 0 0 0',
                                                        textTransform: 'uppercase'
                                                    }}>{possessive}</p>
                                                    <h2 style={{margin: '0', textTransform: 'uppercase'}}>average song
                                                        stats</h2>
                                                    <p style={{
                                                        margin: '0 0 16px 0',
                                                        textTransform: 'uppercase'
                                                    }}>Of {termIndex !== 2 ? 'the last' : ''} {translateTerm[terms[termIndex]]}</p>
                                                    <p>All of {possessive} taste in music
                                                        of {termIndex !== 2 ? 'the last' : ''} {translateTerm[terms[termIndex]]} described
                                                        in one place.</p>
                                                    <SongAnalysisAverage selectedDatapoint={selectedDatapoint}/>
                                                </div>
                                                :
                                                type === 'artists' &&
                                                <div style={{textAlign: 'left'}}>
                                                    <p style={{
                                                        margin: '16px 0 0 0',
                                                        textTransform: 'uppercase'
                                                    }}>{possessive}</p>
                                                    <h2 style={{margin: '0', textTransform: 'uppercase'}}>top song for
                                                        each artist</h2>
                                                    <p>{possessive.slice(0, 1).toUpperCase() + possessive.slice(1, possessive.length)} most
                                                        listened to track
                                                        by some of {possessive} top artists.</p>
                                                    <TopSongsOfArtists selectedDatapoint={selectedDatapoint}
                                                                       number={10}/>
                                                </div>
                                            }
                                        </div>
                                    }
                                </div>
                            )
                        })}
                        <div className={'simple-instance'} style={{alignItems: 'center'}}>
                            <div className={'section-header'}>
                                <div>
                                    <p style={{
                                        margin: '16px 0 0 0',
                                        textTransform: 'uppercase'
                                    }}>{possessive}</p>
                                    <h2 style={{margin: '0', textTransform: 'uppercase'}}>Playlists</h2>
                                    {isLoggedIn() ?
                                        <>
                                            <p>A look at {possessive} public playlists, sorted by their number of
                                                songs.</p>
                                        </>
                                        :
                                        <>
                                            <p>Viewing someone's playlists requires being logged in.</p>
                                            <button className={'subtle-button'} onClick={handleAlternateLogin}>Log-in
                                            </button>
                                        </>
                                    }
                                </div>
                            </div>
                            {!isLoggedIn() ?
                                <></>
                                :
                                playlists.length < 1 ?
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        flexWrap: 'wrap',
                                        gap: '10px',
                                        width: '100%'
                                    }}>
                                        <p style={{color: "var(--secondary-colour)", marginRight: 'auto'}}>Looks like
                                            there aren't any public playlists.</p>
                                    </div>
                                    :
                                    <PlaylistItemList playlists={playlists}/>
                            }
                        </div>
                        <div className={'simple-instance'}>
                            <div className={'section-header'}>
                                <div style={{maxWidth: '400px'}}>
                                    <p style={{
                                        margin: '16px 0 0 0',
                                        textTransform: 'uppercase'
                                    }}>{possessive}</p>
                                    <h2 style={{margin: '0', textTransform: 'uppercase'}}>Recommendations</h2>
                                    {isLoggedIn() ?
                                        <>
                                            <p><span style={{textTransform: 'capitalize'}}>{possessive}</span> artists
                                                and songs
                                                that are recommended to others.</p>
                                        </>
                                        :
                                        <>
                                            <p>Viewing someone's recommendations requires being logged in.</p>
                                            <button className={'subtle-button'} onClick={handleAlternateLogin}>Log-in
                                            </button>
                                        </>
                                    }
                                </div>
                            </div>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'row',
                                flexWrap: 'wrap',
                                gap: '10px',
                                width: '100%'
                            }}>
                                {isLoggedIn() &&
                                    <ProfileRecommendations pageGlobalUserID={pageGlobalUserID} isOwnPage={isOwnPage}/>
                                }
                            </div>
                        </div>
                        <div className={'simple-instance'}>
                            <div className={'section-header'}>
                                <div style={{maxWidth: '400px'}}>
                                    <p style={{
                                        margin: '16px 0 0 0',
                                        textTransform: 'uppercase'
                                    }}>{possessive}</p>
                                    <h2 style={{margin: '0', textTransform: 'uppercase'}}>Reviews</h2>
                                    {isLoggedIn() ?
                                        <>
                                            <p>Have a look at {possessive} reviews on albums, artists and songs.</p>
                                            <a className={'subtle-button'}
                                               href={`/reviews/${pageUser.user_id}`}>View</a>
                                        </>
                                        :
                                        <>
                                            <p>Viewing someone's reviews requires being logged in.</p>
                                            <button className={'subtle-button'} onClick={handleAlternateLogin}>Log-in
                                            </button>
                                        </>
                                    }
                                </div>
                            </div>
                        </div>
                        <div className={'simple-instance'}>
                            <div className={'section-header'}>
                                <div style={{maxWidth: '400px'}}>
                                    <p style={{
                                        margin: '16px 0 0 0',
                                        textTransform: 'uppercase'
                                    }}>{possessive}</p>
                                    <h2 style={{margin: '0', textTransform: 'uppercase'}}>Profile comments</h2>
                                    <p>See what other users have to say about {possessive} profile.</p>
                                </div>
                            </div>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'row',
                                flexWrap: 'wrap',
                                gap: '10px',
                                width: '100%'
                            }}>
                                <CommentSection sectionID={hashString(pageGlobalUserID)} owner={pageUser}
                                                isAdmin={isOwnPage}/>
                            </div>
                        </div>
                    </div>

                </div>
            }
        </>
    )
}

export default Profile