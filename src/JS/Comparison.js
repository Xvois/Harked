/**
 * This component is the comparison page, which can be found by logging in and
 * pressing 'compare' on someone else's profile page. Alternatively the format
 * /compare#userID1&userID2 can be used as the page simply captures the hash
 * for the IDs.
 */

import React, {useEffect, useState} from "react";
import './../CSS/Comparison.css';
import './../CSS/Profile.css';
import './../CSS/Focus.css';

import {retrieveDatapoint, retrieveUser} from "./PDM";
import {
    analyticsMetrics,
    calculateSimilarity,
    getAverageAnalytics,
    getGenresRelatedArtists,
    getLIDescription,
    getLIName,
    getMatchingItems,
    StatBlock,
    translateAnalytics
} from "./Analysis";

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
                            <div style={{
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
            <div className={'user-details'} style={alignment === 'right' ? {marginLeft: 'auto'} : {}}>
                <p style={alignment === 'right' ? {marginLeft: 'auto'} : {}}>Comparison with</p>
                <h2 style={alignment === 'right' ? {marginLeft: 'auto'} : {}}>{user.username}</h2>
                <p style={alignment === 'right' ? {marginLeft: 'auto'} : {}}><span
                    style={{color: 'var(--accent-colour)'}}>{topArtist.name}</span> fan · <span
                    style={{color: 'var(--accent-colour)'}}>{topGenre}</span> fan</p>
                <div style={alignment === 'right' ? {marginLeft: 'auto', marginTop: '15px', width: 'max-content'} : {marginTop: '15px', width: 'max-content'}}>
                    <a className={'std-button'} href={`/profile#${user.user_id}`}>View profile</a>
                </div>
            </div>
        )
    }

    function ValueIndicator(props) {
        const {value, diameter = 70} = props;
        const padding = 5 * (diameter / 70);

        return (
            <div style={{
                padding: '3px',
                border: `3px solid var(--primary-colour)`,
                borderRadius: '100%',
                height: 'max-content',
                width: 'max-content',
                margin: 'auto'
            }}>
                <div style={{
                    position: 'relative',
                    height: `${diameter}px`,
                    width: `${diameter}px`,
                    padding: `${padding}px`,
                    borderRadius: '100%',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        zIndex: '0',
                        transform: `translate(0, ${(diameter + 2 * padding) - ((value / 100) * (diameter + 2 * padding))}px)`,
                        position: 'absolute',
                        height: `${diameter + 2 * padding}px`,
                        width: `${diameter + 2 * padding}px`,
                        background: 'var(--accent-colour)',
                        top: '0',
                        left: '0',
                        animation: 'rise 1s ease-out'
                    }}/>
                    <div style={{position: 'relative', width: '100%', height: '100%'}}>
                        <div className={'centre'}>
                            <h2 style={{
                                margin: '0',
                                color: 'var(--primary-colour)',
                                fontSize: `${(diameter / 70) * 24}px`
                            }}>{Math.round(value)}%</h2>
                        </div>
                    </div>
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
                        return (<div className={'stat-block'}>
                            <h3>{getLIName(item)}</h3>
                            <p>{description}</p>
                        </div>)
                    })}
                </div>
            </div>
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
                        borderTop: '1px solid var(--secondary-colour)'
                    }}>
                        <meta
                            name="description"
                            content={`${users[0].username} and ${users[1].username} are a ${Math.round(similarity.overall)}% match on Harked. Click the link to explore in more detail.`}
                        />
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
                    </div>
                    :
                    <></>
            }
        </>

    )
}

export default Comparison;