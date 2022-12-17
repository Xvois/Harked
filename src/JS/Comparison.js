import React, {useEffect, useState} from "react";
import './../CSS/Comparison.css';
import './../CSS/Profile.css'
import {ThemeProvider} from "@emotion/react";
import {Chip} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import MusicNoteIcon from "@mui/icons-material/MusicNote";

import {retrieveDatapoint, retrieveUser} from "./PDM";
import {createTheme} from "@mui/material/styles";

const Comparison = () => {
    let re = /[^#&]+/g;
    const userIDs = [...window.location.hash.matchAll(re)].map(function(val){return val[0]});
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
                averageAnalytics[key] += song.analytics[key] / length ;
            })
        })
        return averageAnalytics;
    }

    const calculateSimilarity = (u) => {
        let user1Datapoint = u[0].datapoint;
        let user2Datapoint = u[1].datapoint;
        let songsSimilarity = 0;
        let artistsSimilarity = 0;
        let genresSimilarity = 0;
        let metricDelta = 0;
        let u0Metrics = calculateAverageAnalytics(u[0]);
        let u1Metrics = calculateAverageAnalytics(u[1]);
        let similarity;
        // songsKeys in pseudocode.
        user1Datapoint.topSongs.forEach( (song, i) => {
            let songDelta = 0;
            analyticsMetrics.forEach(analytic => {
                songDelta += Math.abs(song.analytics[analytic] - user2Datapoint.topSongs[i].analytics[analytic]);
            })
            songsSimilarity += songDelta / analyticsMetrics.length;
        })
        songsSimilarity /= user1Datapoint.topSongs.length;
        user1Datapoint.topArtists.forEach(artist1 => {
            if(user2Datapoint.topArtists.some(artist2 => artist2.name === artist1.name)){
                artistsSimilarity++;
            }
        })
        user1Datapoint.topGenres.forEach(genre => {
            if(user2Datapoint.topGenres.includes(genre)){
                genresSimilarity++;
            }
        })
        artistsSimilarity /= user1Datapoint.topArtists.length;
        // Takes discrete average of the two lengths.
        genresSimilarity /= Math.floor((user1Datapoint.topGenres.length + user2Datapoint.topGenres.length) / 2);
        for(const key in u0Metrics){metricDelta += Math.abs( u0Metrics[key] - u1Metrics[key] ) / Object.entries(u0Metrics).length;}
        similarity = ( genresSimilarity + 5 * artistsSimilarity + 5 * songsSimilarity + 3 * (1 - Math.sqrt(metricDelta))) / 6;
        similarity = Math.round(100*similarity)
        if(similarity > 100){similarity = 100} // Ensure not over 100%
        setSimilarity(similarity);
    }

    const Card = (props) => {
        const item = props.item;
        const source = props.item.image;
        const number = props.num;
        const [state, setState] = useState({isExpanded: false})

        const handleExpansion = () => {
            setState({ isExpanded: !state.isExpanded });  };

        return(
            <div className={"card"} tabIndex={0} onBlur={() => setState({isExpanded: false})} onClick={handleExpansion} style={state.isExpanded ? {width: '400px'} : {}}>
                <div className="card-text-container" style={state.isExpanded ? {width: '400px', height: '400px', opacity: "1"} : {}}>
                    {!state.isExpanded ?
                        <h1 className={"card-num"}>{number}.</h1>
                        :
                        <>
                            <p>{item[`${item.type === 'artist' ? 'name' : 'title'}`]}</p>
                            <p style={{fontSize: '20px'}}>{item[`${item.type === 'artist' ? 'genre' : 'artist'}`]}</p>
                        </>

                    }
                </div>
                <img alt="Artist" src={source} style={state.isExpanded ? {transform: 'scale(120%)', filter: 'blur(10px) brightness(75%)'} : {}}></img>
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
            if(localDelta < bestDelta){bestDelta = localDelta; bestGuess = song;}
        })
        return bestGuess;
    }

    const UserContainer = (props) => {
        const user = props.user;
        const chipletTheme = createTheme({
            palette: {
                primary: {
                    main: '#22C55E',
                },

            },
        });
        return (
            <div className='user-container'>
                <img className='profile-picture' alt='Profile' src={user.profilePicture}></img>
                <div style={{display: `flex`, flexDirection: `column`, paddingLeft: `5px`}}>
                    <div className='username'>{user.username}</div>
                    <a className={"compare-button"} href={`/profile#${user.userID}`}>View profile</a>
                    <div style={{
                        display: `flex`,
                        paddingTop: `5px`,
                        gap: `20px`,
                        width: `300px`,
                        flexWrap: `wrap`
                    }}>
                        <ThemeProvider theme={chipletTheme}>
                            <Chip label={`${user.datapoint.topArtists[0].name} fan`} style={{borderWidth: `2px`}} variant='outlined'
                                  icon={<PersonIcon fontSize='small' />}
                                  color='primary'/>
                            <Chip label={`${user.datapoint.topGenres[0]} fan`} style={{borderWidth: `2px`}} color='primary' variant='outlined'
                                  icon={<MusicNoteIcon fontSize='small'/>}/>
                        </ThemeProvider>
                    </div>
                </div>
            </div>
        )
    }

    const resolveUsers = async () => {
        let localState = [];
        for(const userID of userIDs){
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
        resolveUsers().then(function(u){ setUsers(u); calculateSimilarity(u);});
    }, [])
    return (
        <>{users.length ?
                <>
                    <div className="top-compare-wrapper">
                        <div className="left">
                            <UserContainer user={users[0]}/>
                            <div className="card-container">
                                <div className="card-header-l">
                                    <h1>Top artists.</h1>
                                </div>
                                <Card item = {users[0].datapoint.topArtists[0]} num = "1"/>
                                <Card item = {users[0].datapoint.topArtists[1]} num = "2"/>
                                <Card item = {users[0].datapoint.topArtists[2]} num = "3"/>
                            </div>
                            <div className="card-container" style={{justifyContent: 'left'}}>
                                <Card item = {users[0].datapoint.topSongs[0]} num = "1"/>
                                <Card item = {users[0].datapoint.topSongs[1]} num = "2"/>
                                <Card item = {users[0].datapoint.topSongs[2]} num = "3"/>
                                <div style={{flexGrow: '1', display: 'flex', flexDirection: 'column', alignItems: 'flex-end'}}>
                                    <h1 style={{position: 'absolute', width: '400px', fontSize: '7em', textTransform: 'uppercase', fontFamily: 'Inter Tight'}}>Of all time.</h1>
                                </div>
                            </div>
                        </div>
                        <div className="right">
                            <UserContainer user={users[1]}/>
                            <div className="card-container" style={{justifyContent: 'left'}}>
                                <Card item = {users[1].datapoint.topArtists[0]} num = "1"/>
                                <Card item = {users[1].datapoint.topArtists[1]} num = "2"/>
                                <Card item = {users[1].datapoint.topArtists[2]} num = "3"/>
                                <div style={{color: '#22C55E', flexGrow: '1', display: 'flex', flexDirection: 'column', alignItems: 'flex-end'}}>
                                    <h1 style={{position: 'absolute', width: '400px', fontSize: '7em', textTransform: 'uppercase', fontFamily: 'Inter Tight'}}>Of all time.</h1>
                                </div>
                            </div>
                            <div className="card-container" style={{justifyContent: 'right'}}>
                                <div className="card-header-l" style={{color: '#22C55E'}}>
                                    <h1>Top songs.</h1>
                                </div>
                                <Card item = {users[1].datapoint.topSongs[0]} num = "1"/>
                                <Card item = {users[1].datapoint.topSongs[1]} num = "2"/>
                                <Card item = {users[1].datapoint.topSongs[2]} num = "3"/>
                            </div>
                        </div>
                    </div>
                    <div className="similarity-score">
                        <h2 style={{marginLeft: "auto", marginRight: "auto", fontSize: '5vw', fontFamily: 'Inter Tight', textTransform: 'uppercase'}}>Your similarity is {similarity}%.</h2>
                        <p style={{fontSize: '30px'}}>Let's have a look at that a little more...</p>
                    </div>
                    <div style={{display: 'flex', flexDirection: 'row'}}>
                        <div className="comparison-metrics">
                            <div className="username">{users[0].username}</div>
                            <p style={{fontSize: '10px'}}>Avg. song characteristics</p>
                            {analyticsMetrics.map(key => {
                                const u0Val= users[0].averageAnalytics[key];
                                const u1Val = users[1].averageAnalytics[key];
                                let diff = u0Val - u1Val;
                                // Cannot have sqrt of negative
                                if(diff > 0){diff = Math.sqrt(diff)}else(diff = -Math.sqrt(Math.abs(diff)))
                                const red = 255 * (1-diff);
                                const green = 255 * (1+diff);
                                const blue = 50;
                                return (<p className="comparison-analytic">{key}: <span style={{color: `rgb(${red},${green},${blue})`, fontFamily: 'Inter Tight'}}>{Math.round(users[0].averageAnalytics[key] * 100)}%</span></p>)
                            })}
                            <div className='art-container' style={{transform: 'scale(75%)'}}>
                                <a className={'play-wrapper'}
                                   style={{boxShadow: 'none'}}
                                   href={users[0].quintessentialSong.link} rel="noopener noreferrer" target="_blank">
                                    <img className='art' src={users[0].quintessentialSong.image} alt='Cover art'></img>
                                    <div className='art-text-container'>
                                        <h1 className={"art-name-shown"}>{users[0].quintessentialSong.title}</h1>
                                        <p className={"art-desc-shown"}
                                           style={{fontSize: '20px'}}>{users[0].username}'s quintessential song</p>
                                    </div>
                                </a>
                            </div>
                            <p style={{marginTop: '25px'}}>Top genre: <span style={{color: '#22C55E'}}>{users[0].datapoint.topGenres[0]}</span></p>
                        </div>
                        <div className="comparison-metrics">
                            <div className="username">{users[1].username}</div>
                            <p style={{fontSize: '10px'}}>Avg. song characteristics</p>
                            {analyticsMetrics.map(key => {
                                const u0Val= users[0].averageAnalytics[key];
                                const u1Val = users[1].averageAnalytics[key];
                                let diff = u1Val - u0Val;
                                // Cannot have sqrt of negative
                                if(diff > 0){diff = Math.sqrt(diff)}else(diff = -Math.sqrt(Math.abs(diff)))
                                const red = 255 * (1-diff);
                                const green = 255 * (1+diff);
                                const blue = 50;
                                return (<p className="comparison-analytic">{key}: <span style={{color: `rgb(${red},${green},${blue})`, fontFamily: 'Inter Tight'}}>{Math.round(users[1].averageAnalytics[key] * 100)}%</span></p>)
                            })}
                            <div className='art-container' style={{transform: 'scale(75%)'}}>
                                <a className={'play-wrapper'}
                                   style={{boxShadow: 'none'}}
                                   href={users[1].quintessentialSong.link} rel="noopener noreferrer" target="_blank">
                                    <img className='art' src={users[1].quintessentialSong.image} alt='Cover art'></img>
                                    <div className='art-text-container'>
                                        <h1 className={"art-name-shown"}>{users[1].quintessentialSong.title}</h1>
                                        <p className={"art-desc-shown"}
                                           style={{fontSize: '20px'}}>{users[1].username}'s quintessential song</p>
                                    </div>
                                </a>
                            </div>
                            <p style={{marginTop: '25px'}}>Top genre: <span style={{color: '#22C55E'}}>{users[1].datapoint.topGenres[0]}</span></p>
                        </div>
                    </div>
                </>
                :
                <></>
        }</>


    )
}

export default Comparison;