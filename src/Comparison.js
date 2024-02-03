/**
 * This component is the comparison page, which can be found by logging in and
 * pressing 'compare' on someone else's profile page. Alternatively the format
 * /compare#userID1&userID2 can be used as the page simply captures the hash
 * for the IDs.
 */

import React, {useEffect, useState} from "react";
import './CSS/Comparison.css';
import './CSS/Profile.css';
import './CSS/Focus.css';

import {
    analyticsMetrics,
    calculateSimilarity,
    getAverageAnalytics,
    getGenresRelatedArtists,
    getLIDescription,
    getLIName,
    getMatchingItems,
    translateAnalytics
} from "@/Analysis/analysis";
import NotesSharpIcon from "@mui/icons-material/NotesSharp";
import {retrieveUnresolvedReviews} from "@/Tools/reviews";
import {StyledRating} from "@/Components/styles";
import {ValueIndicator} from "@/Components/ValueIndicator";
import {retrieveUser} from "@/Tools/users";
import {retrieveDatapoint} from "@/Tools/datapoints";
import {resolveItems} from "@/Tools/utils";
import {StatBlock} from "@/Components/StatBlock";

const Comparison = () => {
    let re = /[^#&]+/g;
    const userIDs = [...window.location.hash.matchAll(re)].map(e => e[0]);
    const [users, setUsers] = useState([]);
    const [datapoints, setDatapoints] = useState([]);
    const [similarity, setSimilarity] = useState(-1);

    const resolveUsers = () => {
        retrieveUser(userIDs[0])
            .then(user1 => {
                return retrieveUser(userIDs[1])
                    .then(user2 => {
                        setUsers([user1, user2]);
                    });
            })
            .catch(error => {
                // Handle any errors that occur during retrieval or setting of users
                console.error(error);
            });
    };

    const resolveDatapoints = async () => {
        const [dp1, dp2] = [await retrieveDatapoint(userIDs[0], "long_term"), await retrieveDatapoint(userIDs[1], "long_term")];
        return [dp1, dp2];
    }

    useEffect(() => {
        resolveUsers();
        resolveDatapoints().then((dps) => {
            setDatapoints([dps[0], dps[1]]);
            setSimilarity(calculateSimilarity(dps[0], dps[1]));
        });
    }, []);


    const AverageAnalytics = (props) => {
        const {userIndex, alignment, shadowUserIndex = null} = props;
        const datapoint = datapoints[userIndex];
        const avgAnalytics = getAverageAnalytics(datapoint.top_songs);
        const shadowAvgAnalytics = getAverageAnalytics(datapoints[shadowUserIndex].top_songs);
        const excludedKeys = ['loudness', 'tempo']

        return (
            <div style={{display: 'flex', flexDirection: 'column'}}>
                {analyticsMetrics.map(metric => {
                    if (excludedKeys.findIndex(e => e === metric) === -1) {
                        return (
                            <div key={metric} style={{
                                padding: `15px ${alignment === 'left' ? '0px' : '15px'} 15px ${alignment === 'right' ? '0px' : '15px'}`,
                                borderTop: '1px solid var(--secondary-colour)',
                                borderBottom: '1px solid var(--secondary-colour)'
                            }}>
                                <StatBlock key={metric} name={translateAnalytics[metric].name}
                                           description={`${Math.round(avgAnalytics[metric] * 100)}%`}
                                           value={avgAnalytics[metric] * 100} alignment={alignment}
                                           shadow={shadowAvgAnalytics[metric] * 100}/>
                            </div>
                        )
                    }
                })
                }
            </div>
        )
    }


    function UserContainer(props) {
        const {userIndex, alignment} = props;
        const user = users[userIndex];
        const topArtist = datapoints[userIndex].top_artists[0];
        const topGenre = datapoints[userIndex].top_genres[0];
        return (
            <div className={'comparison-user-container'}
                 style={alignment === 'right' ? {marginLeft: 'auto', width: 'max-content'} : {width: 'max-content'}}>
                <p style={alignment === 'right' ? {
                    marginLeft: 'auto',
                    width: 'max-content'
                } : {width: 'max-content'}}>Comparison with</p>
                <h2 style={alignment === 'right' ? {
                    marginLeft: 'auto',
                    width: 'max-content'
                } : {width: 'max-content'}}>{user.username}</h2>
                <div style={alignment === 'right' ? {
                    marginLeft: 'auto',
                    marginTop: '15px',
                    width: 'max-content'
                } : {marginTop: '15px', width: 'max-content'}}>
                    <a className={'subtle-button'} href={`/profile/${user.user_id}`}>View profile</a>
                </div>
            </div>
        )
    }


    function MatchingItems(props) {
        const {type} = props;
        const matches = getMatchingItems(datapoints[0], datapoints[1], type);
        return (
            <div style={{width: '100%'}}>
                {matches.length > 0 ?
                    <p style={{textTransform: 'uppercase', textAlign: 'center'}}>Common {type}</p>
                    :
                    <p>It looks like {users[0].username} and {users[1].username} don't have any {type} in common.</p>
                }
                <div className={'block-wrapper'}>
                    {matches.map(item => {
                        let description = getLIDescription(item);
                        if (type === "genres") {
                            const matchingArtists = getMatchingItems(datapoints[0], datapoints[1], "artists");
                            const genreArtists = getGenresRelatedArtists(item, matchingArtists);
                            if (genreArtists.length > 0) {
                                description = genreArtists[0].name
                            } else {
                                description = 'No matching artists.'
                            }
                        }
                        return (<div key={item.id ?? item} className={'stat-block'}>
                            <h3>{getLIName(item)}</h3>
                            <p>{description}</p>
                        </div>)
                    })}
                </div>
            </div>
        )
    }

    function MatchingReviews() {
        const [matchingReviews, setMatchingReviews] = useState(undefined);

        useEffect(() => {
            const fetchData = async () => {
                const u0Reviews = await retrieveUnresolvedReviews(users[0].user_id);
                const u1Reviews = await retrieveUnresolvedReviews(users[1].user_id);
                let matches = u0Reviews.flatMap(r0 =>
                    u1Reviews
                        .filter(r1 => r0.item && r1.item && r0.item.id === r1.item.id && r0.item.type === r1.item.type)
                        .map(r1 => [r0, r1])
                );
                for (let match of matches) {
                    // TODO: FIX THIS
                    await resolveItems(match);
                }
                setMatchingReviews(matches);
                console.log(matches);
            }
            if (users) {
                fetchData();
            }
        }, [users]);

        return (
            matchingReviews?.length > 0 ?
                <div className={'block-wrapper'} style={{width: '100%'}}>
                    {matchingReviews.map(match => {
                        return <div className={'stat-block'}>
                            <p style={{
                                margin: 0,
                                color: 'var(--secondary-colour)'
                            }}>[ITEM TYPE]</p>
                            <a className={'heavy-link'} href={match[0].item.link}
                               style={{margin: 0}}>{getLIName(match[0].item)}</a>
                            <p style={{margin: 0}}>{getLIDescription(match[0].item)}</p>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'row',
                                flexWrap: 'wrap',
                                gap: '20px',
                                margin: '20px 0 0 0'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    position: 'relative',
                                    width: 'max-content'
                                }}>
                                    {match[0].description &&
                                        <div style={{position: 'absolute', top: 0, right: 0}}>
                                            <NotesSharpIcon fontSize={'small'}/>
                                        </div>
                                    }
                                    <a className={'heavy-link'} href={`/review/${match[0].id}`}
                                       style={{margin: 0}}>{users[0].username}</a>
                                    <StyledRating
                                        readOnly
                                        value={match[0].rating}
                                        precision={0.5}
                                    />
                                </div>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    position: 'relative',
                                    width: 'max-content'
                                }}>
                                    <a className={'heavy-link'} href={`/review/${match[1].id}`}
                                       style={{margin: 0}}>{users[1].username}</a>
                                    <StyledRating
                                        readOnly
                                        value={match[1].rating}
                                        precision={0.5}
                                    />
                                </div>
                            </div>
                        </div>
                    })}
                </div>
                :
                <p>It looks like {users[0].username} and {users[1].username} don't have any reviews in common.</p>
        )
    }

    return (
        <>
            {
                users.length > 0 && datapoints.length > 0 ?
                    <div className='wrapper' style={{
                        fontFamily: 'Inter Tight',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                    }}>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            position: 'relative',
                            flexWrap: 'wrap',
                            gap: '150px',
                            paddingTop: '15px'
                        }}>
                            <UserContainer userIndex={0} alignment={'left'}/>
                            <div className={'centre'}>
                                <ValueIndicator value={similarity.overall}/>
                            </div>
                            <UserContainer userIndex={1} alignment={'right'}/>
                        </div>
                        <div style={{textAlign: 'center', margin: '50px 0 0 0'}}>
                            <p style={{
                                margin: '0',
                                textTransform: 'uppercase'
                            }}>A look at</p>
                            <h2 style={{margin: '0', textTransform: 'uppercase'}}>Average song analysis</h2>
                        </div>
                        <div style={{margin: '15px'}}>
                            <ValueIndicator diameter={50} value={similarity.metrics}/>
                        </div>
                        <div style={{display: 'flex', flexDirection: 'row', width: '100%'}}>
                            <div style={{flexGrow: '1'}}>
                                <AverageAnalytics userIndex={0} shadowUserIndex={1} alignment={'left'}/>
                            </div>
                            <div style={{flexGrow: '1'}}>
                                <AverageAnalytics userIndex={1} shadowUserIndex={0} alignment={'right'}/>
                            </div>
                        </div>
                        <div style={{textAlign: 'center', margin: '50px 0 0 0'}}>
                            <p style={{
                                margin: '0',
                                textTransform: 'uppercase'
                            }}>A look at</p>
                            <h2 style={{margin: '0', textTransform: 'uppercase'}}>Top Genres similarity</h2>
                        </div>
                        <div style={{margin: '15px'}}>
                            <ValueIndicator diameter={50} value={similarity.genres}/>
                        </div>
                        <div style={{display: 'flex', flexDirection: 'row', width: '100%'}}>
                            <MatchingItems type={'genres'}/>
                        </div>
                        <div style={{textAlign: 'center', margin: '50px 0 0 0'}}>
                            <p style={{
                                margin: '0',
                                textTransform: 'uppercase'
                            }}>A look at</p>
                            <h2 style={{margin: '0', textTransform: 'uppercase'}}>Top Artists similarity</h2>
                        </div>
                        <div style={{margin: '15px'}}>
                            <ValueIndicator diameter={50} value={similarity.artists}/>
                        </div>
                        <div style={{display: 'flex', flexDirection: 'row', width: '100%'}}>
                            <MatchingItems type={'artists'}/>
                        </div>
                        <div style={{textAlign: 'center', margin: '50px 0 0 0'}}>
                            <p style={{
                                margin: '0',
                                textTransform: 'uppercase'
                            }}>A look at</p>
                            <h2 style={{margin: '0 0 16px 0', textTransform: 'uppercase'}}>Matching reviews</h2>
                        </div>
                        <div style={{display: 'flex', flexDirection: 'row', width: '100%'}}>
                            <MatchingReviews/>
                        </div>
                    </div>
                    :
                    <></>
            }
        </>

    )
}

export default Comparison;