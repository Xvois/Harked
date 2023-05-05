// noinspection DuplicatedCode

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

const Comparison = () => {
    let re = /[^#&]+/g;
    const userIDs = [...window.location.hash.matchAll(re)].map(function (val) {
        return val[0]
    });
    const [users, setUsers] = useState([]);
    const analyticsMetrics = ['acousticness', 'danceability', 'energy', 'instrumentalness', 'valence'];

    const calculateAverageAnalytics = (u) => {
        const length = u.datapoint.topSongs.length;
        let averageAnalytics = {
            'acousticness': 0,
            'danceability': 0,
            'energy': 0,
            'instrumentalness': 0,
            'valence': 0
        };
        u.datapoint.topSongs.forEach(song => {
            analyticsMetrics.forEach(key => {
                averageAnalytics[key] += song.analytics[key] / length;
            })
        })
        return averageAnalytics;
    }

    const calculateSimilarity = (u) => {
        let user1Datapoint = u[0].datapoint;
        let user2Datapoint = u[1].datapoint;
        let artistsSimilarity = 0;
        let genresSimilarity = 0;
        let metricDelta = 0;
        let u0Metrics = calculateAverageAnalytics(u[0]);
        let u1Metrics = calculateAverageAnalytics(u[1]);
        let similarity;
        user1Datapoint.topArtists.forEach(artist1 => {
            if (user2Datapoint.topArtists.some(artist2 => artist2.name === artist1.name)) {
                artistsSimilarity++;
            }
        })
        user1Datapoint.topGenres.forEach(genre => {
            if (user2Datapoint.topGenres.includes(genre)) {
                genresSimilarity++;
            }
        })
        artistsSimilarity /= user1Datapoint.topArtists.length;
        // Takes discrete average of the two lengths.
        genresSimilarity /= Math.floor((user1Datapoint.topGenres.length + user2Datapoint.topGenres.length) / 2);
        for (const key in u0Metrics) {
            metricDelta += Math.abs(u0Metrics[key] - u1Metrics[key]) / Object.entries(u0Metrics).length;
        }
        similarity = (genresSimilarity + 3 * artistsSimilarity + 2 * (1 - Math.sqrt(metricDelta * 2)) / 3);
        similarity = Math.round(100 * similarity)
        console.log("---STAT BREAKDOWN---");
        console.log("Genres: " + genresSimilarity);
        console.log("Artists: " + artistsSimilarity);
        console.log("Metrics: " + (1 - Math.sqrt(metricDelta * 2)));
        if (similarity > 100) {
            similarity = 100
        } // Ensure not over 100%
        setSimilarity(similarity);
    }

    const Card = (props) => {
        const item = props.item;
        const source = props.item.image;
        const number = props.num;
        const [state, setState] = useState({isExpanded: false})

        const handleExpansion = () => {
            setState({isExpanded: !state.isExpanded});
        };

        return (
            <div className={"card"} tabIndex={0} onBlur={() => setState({isExpanded: false})} onClick={handleExpansion}
                 style={state.isExpanded ? {width: '400px'} : {}}>
                <div className="card-text-container"
                     style={state.isExpanded ? {width: '400px', height: '400px', opacity: "1"} : {}}>
                    {!state.isExpanded ?
                        <h1 className={"card-num"}>{number}.</h1>
                        :
                        <>
                            <p style={{fontSize: '30px'}}>{item[`${item.type === 'artist' ? 'name' : 'title'}`]}</p>
                            <p style={{
                                fontSize: '20px',
                                fontWeight: 'normal'
                            }}>{item[`${item.type === 'artist' ? 'genre' : 'artist'}`]}</p>
                        </>

                    }
                </div>
                <img alt="" src={source} style={state.isExpanded ? {
                    transform: 'scale(120%)',
                    filter: 'blur(0px) brightness(60%)'
                } : {}}></img>
            </div>
        )
    }

    const quintessentialSong = (user, avgAnalytics) => {
        let bestGuess = {};
        let bestDelta = 100;
        user.datapoint.topSongs.forEach(song => {
            let localDelta = 0;
            Object.keys(avgAnalytics).forEach(key => {
                localDelta += Math.abs(song.analytics[key] - avgAnalytics[key]);
            })
            if (localDelta < bestDelta) {
                bestDelta = localDelta;
                bestGuess = song;
            }
        })
        return bestGuess;
    }

    const UserContainer = (props) => {
        const user = props.user;
        const justification = props.justification;
        return (
            <div className='user-container'
                 style={{'--pfp': `url(${user.profilePicture})`, justifyContent: justification}}>
                {justification === 'left' ?
                    <img className='profile-picture' alt='Profile' src={user.profilePicture}></img>
                    :
                    <></>
                }
                <div style={{
                    display: `flex`,
                    flex: '0 0 auto',
                    flexDirection: `column`,
                    paddingLeft: `5px`,
                    paddingRight: '5px'
                }}>
                    <div className='username'>{user.username}</div>
                    <a className={"auth-button"} href={`/profile#${user.userID}`}>View profile</a>
                    <p style={{
                        fontWeight: 'bold',
                        fontFamily: 'Inter Tight',
                        margin: '10px 0 0 0',
                        width: 'max-content'
                    }}><span style={{color: '#22C55E'}}>{user.datapoint.topArtists[0].name}</span> fan · <span
                        style={{color: '#22C55E'}}>{user.datapoint.topGenres[0]}</span> fan</p>
                    <a target="_blank" href={`https://open.spotify.com/user/${user.userID}`} className='spotify-link'
                       style={{fontFamily: 'Inter Tight', gap: '5px', marginTop: '7px'}}>
                        <svg xmlns="http://www.w3.org/2000/svg" height="25px" width="25px" version="1.1"
                             viewBox="0 0 168 168">
                            <path fill="#22C55E"
                                  d="m83.996 0.277c-46.249 0-83.743 37.493-83.743 83.742 0 46.251 37.494 83.741 83.743 83.741 46.254 0 83.744-37.49 83.744-83.741 0-46.246-37.49-83.738-83.745-83.738l0.001-0.004zm38.404 120.78c-1.5 2.46-4.72 3.24-7.18 1.73-19.662-12.01-44.414-14.73-73.564-8.07-2.809 0.64-5.609-1.12-6.249-3.93-0.643-2.81 1.11-5.61 3.926-6.25 31.9-7.291 59.263-4.15 81.337 9.34 2.46 1.51 3.24 4.72 1.73 7.18zm10.25-22.805c-1.89 3.075-5.91 4.045-8.98 2.155-22.51-13.839-56.823-17.846-83.448-9.764-3.453 1.043-7.1-0.903-8.148-4.35-1.04-3.453 0.907-7.093 4.354-8.143 30.413-9.228 68.222-4.758 94.072 11.127 3.07 1.89 4.04 5.91 2.15 8.976v-0.001zm0.88-23.744c-26.99-16.031-71.52-17.505-97.289-9.684-4.138 1.255-8.514-1.081-9.768-5.219-1.254-4.14 1.08-8.513 5.221-9.771 29.581-8.98 78.756-7.245 109.83 11.202 3.73 2.209 4.95 7.016 2.74 10.733-2.2 3.722-7.02 4.949-10.73 2.739z"/>
                        </svg>
                        View profile in Spotify
                    </a>
                </div>
                {justification === 'right' ?
                    <img className='profile-picture' alt='Profile' src={user.profilePicture}
                         style={{marginLeft: '10px'}}></img>
                    :
                    <></>
                }
            </div>
        )
    }

    const resolveUsers = async () => {
        let localState = [];
        for (const userID of userIDs) {
            let user;
            await retrieveUser(userID).then(result => user = result);
            await retrieveDatapoint(userID, "long_term").then(result => user = {...user, datapoint: result});
            user["averageAnalytics"] = calculateAverageAnalytics(user);
            user["quintessentialSong"] = quintessentialSong(user, user.averageAnalytics);
            localState.push(user);
        }
        console.log(localState);
        return localState;
    }

    const [similarity, setSimilarity] = useState(0);
    useEffect(() => {
        resolveUsers().then(function (u) {
            setUsers(u);
            calculateSimilarity(u);
        });
    }, [])
    return (
        <>{users.length ?
            <>
                <div className="similarity-score">
                    <h2 style={{
                        marginLeft: "auto",
                        marginRight: "auto",
                        fontSize: '5vw',
                        fontFamily: 'Inter Tight',
                        textTransform: 'uppercase'
                    }}>Your similarity is <span style={{color: '#22C55E'}}>{similarity}%</span></h2>
                    <p style={{fontSize: '25px'}}>Let's have a look at that a little more...</p>
                </div>
                <div className="top-compare-wrapper" style={{paddingBottom: '100px'}}>
                    <div className="left">
                        <UserContainer user={users[0]} justification={'right'}/>
                        <div className="card-container">
                            <div className="card-header-l">
                                <h1>Top artists.</h1>
                            </div>
                            <Card item={users[0].datapoint.topArtists[0]} num="1"/>
                            <Card item={users[0].datapoint.topArtists[1]} num="2"/>
                            <Card item={users[0].datapoint.topArtists[2]} num="3"/>
                        </div>
                        <div className="card-container" style={{justifyContent: 'left'}}>
                            <Card item={users[0].datapoint.topSongs[0]} num="1"/>
                            <Card item={users[0].datapoint.topSongs[1]} num="2"/>
                            <Card item={users[0].datapoint.topSongs[2]} num="3"/>
                            <div style={{
                                flexGrow: '1',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-end'
                            }}>
                                <h1 style={{
                                    position: 'absolute',
                                    width: '400px',
                                    fontSize: '7em',
                                    textTransform: 'uppercase',
                                    fontFamily: 'Inter Tight'
                                }}>Of all time.</h1>
                            </div>
                        </div>
                        <div style={{
                            flexGrow: '1',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start'
                        }}>
                            <h1 style={{
                                position: 'absolute',
                                width: '400px',
                                fontSize: '5em',
                                marginTop: '0',
                                textTransform: 'uppercase',
                                fontFamily: 'Inter Tight',
                                color: '#22C55E'
                            }}>
                                Quintessential
                            </h1>

                        </div>
                        <div className='art-container' style={{transform: 'scale(75%)'}}>
                            <a className={'play-wrapper'}
                               style={{boxShadow: 'none'}}
                               href={users[0].quintessentialSong.link} rel="noopener noreferrer" target="_blank">
                                <img className='art' src={users[0].quintessentialSong.image} alt='Cover art'></img>
                                <div className='art-text-container'>
                                    <h1 className={"art-name"}>{users[0].quintessentialSong.title}</h1>
                                    <p className={"art-desc"}
                                       style={{fontSize: '20px'}}>{users[0].username}'s quintessential song</p>
                                </div>
                            </a>
                        </div>
                        <h2 style={{
                            margin: 'auto',
                            width: 'max-content',
                            textTransform: 'uppercase',
                            fontWeight: '900',
                            fontFamily: 'Inter Tight'
                        }}>Top genre: <span
                            style={{color: '#22C55E'}}>{users[0].datapoint.topGenres[0]}</span></h2>
                    </div>
                    <div className="right">
                        <UserContainer user={users[1]} justification={'left'}/>
                        <div className="card-container" style={{justifyContent: 'left'}}>
                            <Card item={users[1].datapoint.topArtists[0]} num="1"/>
                            <Card item={users[1].datapoint.topArtists[1]} num="2"/>
                            <Card item={users[1].datapoint.topArtists[2]} num="3"/>
                            <div style={{
                                color: '#22C55E',
                                flexGrow: '1',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-end'
                            }}>
                                <h1 style={{
                                    position: 'absolute',
                                    width: '400px',
                                    fontSize: '7em',
                                    textTransform: 'uppercase',
                                    fontFamily: 'Inter Tight',
                                }}>Of all time.</h1>
                            </div>
                        </div>
                        <div className="card-container" style={{justifyContent: 'right'}}>
                            <div className="card-header-l" style={{color: '#22C55E'}}>
                                <h1>Top songs.</h1>
                            </div>
                            <Card item={users[1].datapoint.topSongs[0]} num="1"/>
                            <Card item={users[1].datapoint.topSongs[1]} num="2"/>
                            <Card item={users[1].datapoint.topSongs[2]} num="3"/>
                        </div>
                        <div className='art-container' style={{transform: 'scale(75%)'}}>
                            <a className={'play-wrapper'}
                               style={{boxShadow: 'none'}}
                               href={users[1].quintessentialSong.link} rel="noopener noreferrer" target="_blank">
                                <img className='art' src={users[1].quintessentialSong.image} alt='Cover art'></img>
                                <div className='art-text-container'>
                                    <h1 className={"art-name"}>{users[1].quintessentialSong.title}</h1>
                                    <p className={"art-desc"}
                                       style={{fontSize: '20px'}}>{users[1].username}'s quintessential song</p>
                                </div>
                            </a>
                        </div>
                        <div style={{
                            flexGrow: '1',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-end',
                        }}>
                            <h1 style={{
                                position: 'absolute',
                                width: '300px',
                                fontSize: '5em',
                                marginTop: '-80px',
                                textTransform: 'uppercase',
                                fontFamily: 'Inter Tight',
                                zIndex: '-1'
                            }}>
                                Songs
                            </h1>
                            <h2 style={{
                                margin: 'auto',
                                textTransform: 'uppercase',
                                fontWeight: '900',
                                fontFamily: 'Inter Tight'
                            }}>Top genre: <span
                                style={{color: '#22C55E'}}>{users[1].datapoint.topGenres[0]}</span></h2>
                        </div>
                    </div>
                </div>
            </>
            :
            <></>
        }</>


    )
}

export default Comparison;