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
    calculateSimilarity, compareItemBetweenUsers,
    containsElement,
    getAverageAnalytics,
    getLIDescription,
    getLIName,
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
        const user = users[userIndex];
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
                                borderTop: '1px solid #343434',
                                borderBottom: '1px solid #343434'
                            }}>
                                <StatBlock key={metric} name={translateAnalytics[metric].name}
                                           description={`${Math.round(avgAnalytics[metric] * 100)}%`}
                                           value={avgAnalytics[metric] * 100} alignment={alignment} shadow={shadowAvgAnalytics[metric] * 100}/>
                            </div>
                        )
                    }
                })
                }
            </div>
        )
    }

    const ItemComparisonDisplay = (props) => {
        const {item, type} = props;

        return (
            <div style={{position: 'relative', padding: '15px', border: '1px solid #343434', width: '40%'}}>
                <img src={item.image} style={{objectFit: 'cover', position: 'absolute', width: '100%', height: '100%', top: '0', left: '0', filter: 'blur(10px) brightness(75%)', clipPath: 'inset(1px)', zIndex: '-1'}} />
                <h3>{getLIName(item)}</h3>
                <p>{compareItemBetweenUsers(item, datapoints[0], datapoints[1], type)}</p>
            </div>
        )
    }

    const ComparisonBlock = (props) => {
        const {type} = props;

        const [selection, setSelection] = useState({
            item: null,
            dpIndex: null
        });

        return (
            <div>
                <h2>Some text</h2>
                <p>Click on an item to explore their links between {users[0].username} and {users[1].username}</p>
                <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%'}}>
                    <div style={{textAlign: 'left', width: '25%'}}>
                        {datapoints[0][`top_${type}`].slice(0,5).map(e => {
                            const highlighted = e === selection.item;
                            return (
                                <div style={{margin: '10px 0', cursor: 'pointer', opacity: `${selection.item ? (highlighted ? '1' : '0.25') : '1' }`, scale: `${selection.item ? (highlighted ? '1' : '0.95') : '1' }` , transition: 'all 0.5s'}}
                                     onClick={() => setSelection({item: e, dpIndex: 0})}>
                                    <p style={{fontSize: '20px', margin: '0', fontWeight: 'bold'}}>{getLIName(e)}</p>
                                    <p style={{fontSize: '15px', margin: '0'}}>{getLIDescription(e)}</p>
                                </div>
                            )
                        })
                        }
                    </div>
                    {selection.item ?
                        <ItemComparisonDisplay item={selection.item} type={type} />
                        :
                        <></>
                    }
                    <div style={{textAlign: 'right', width: '25%'}}>
                        {datapoints[1][`top_${type}`].slice(0,5).map(e => {
                            const highlighted = e === selection.item;
                            return (
                                <div style={{margin: '10px 0', cursor: 'pointer', opacity: `${selection.item ? (highlighted ? '1' : '0.25') : '1' }`, scale: `${selection.item ? (highlighted ? '1' : '0.95') : '1' }` , transition: 'all 0.5s'}}
                                     onClick={() => setSelection({item: e, dpIndex: 0})}>
                                    <p style={{fontSize: '20px', margin: '0', fontWeight: 'bold'}}>{getLIName(e)}</p>
                                    <p style={{fontSize: '15px', margin: '0'}}>{getLIDescription(e)}</p>
                                </div>
                            )
                        })
                        }
                    </div>
                </div>
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
                <h2>{user.username}</h2>
                <p style={alignment === 'right' ? {marginLeft: 'auto'} : {}}><span
                    style={{color: '#22C55E'}}>{topArtist.name}</span> fan · <span
                    style={{color: '#22C55E'}}>{topGenre}</span> fan</p>
            </div>
        )
    }

    function SimilarityIndicator() {
        const diameter = 70;
        const padding = 5;
        const value = similarity.overall;
        return (
            <div style={{padding: '3px', border: `3px solid white`, borderRadius: '100%', height: 'max-content', width: 'max-content', margin: 'auto'}}>
                <div style={{position: 'relative', height: `${diameter}px`, width: `${diameter}px`, padding: `${padding}px`, borderRadius: '100%', overflow: 'hidden'}}>
                    <div style={{zIndex: '0', transform: `translate(0, ${(diameter + 2 * padding)-((value / 100) * (diameter + 2 * padding) )}px)` ,position: 'absolute', height: `${diameter + 2*padding}px`, width: `${diameter + 2*padding}px`, background: '#22C55E', top: '0', left: '0'}} />
                    <div style={{position: 'relative', width: '100%', height: '100%'}}>
                        <div className={'centre'}>
                            <h2 style={{margin: '0', color: 'white'}}>{similarity.overall}%</h2>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        users.length > 0 && datapoints.length > 0 ?
            <div className='wrapper' style={{
                fontFamily: 'Inter Tight',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderTop: '1px solid #343434'
            }}>
                <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', position: 'relative', flexWrap: 'wrap', gap: '150px'}}>
                    <UserContainer userIndex={0} alignment={'left'} />
                    <div className={'centre'}>
                        <SimilarityIndicator />
                    </div>
                    <UserContainer userIndex={1} alignment={'right'} />
                </div>
                <div style={{textAlign: 'center', margin: '50px 0 15px 0'}}>
                    <p style={{
                        margin: '0',
                        textTransform: 'uppercase'
                    }}>A look at</p>
                    <h2 style={{margin: '0', textTransform: 'uppercase'}}>Average song analysis</h2>
                </div>
                <div style={{display: 'flex', flexDirection: 'row', width: '100%'}}>
                    <div style={{flexGrow: '1'}}>
                        <AverageAnalytics userIndex={0} shadowUserIndex={1} alignment={'left'} />
                    </div>
                    <div style={{flexGrow: '1'}}>
                        <AverageAnalytics userIndex={1} shadowUserIndex={0} alignment={'right'} />
                    </div>
                </div>
            </div>
            :
            <></>
    )
}

export default Comparison;