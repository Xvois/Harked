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
    const calculateSimilarity = (u) => {
        let user1Datapoint = u[0].datapoint;
        let user2Datapoint = u[1].datapoint;
        let songsSimilarity = 0;
        let artistsSimilarity = 0;
        let genresSimilarity = 0;
        let similarity;
        // songsKeys in pseudocode.
        const analyticsMetrics = ['acousticness', 'danceability', 'energy', 'instrumentalness', 'valence'];
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
        similarity = ( genresSimilarity + 10 * artistsSimilarity + 5 * songsSimilarity) / 3;
        if(similarity > 100){similarity = 100} // Ensure not over 100%
        console.log(`SS: ${songsSimilarity}`);
        console.log(`AS: ${artistsSimilarity}`);
        console.log(`GS: ${genresSimilarity}`);
        console.log(`S: ${similarity}`);
        similarity *= 100;
        setSimilarity(Math.round(similarity));
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
                            <p>{item[`${item.type === 'artist' ? 'genre' : 'artist'}`]}</p>
                        </>

                    }
                </div>
                <img alt="Artist" src={source} style={state.isExpanded ? {transform: 'scale(100%)'} : {}}></img>
            </div>
        )
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
            localState.push(user);
        }
        console.log(localState);
        return localState;
    }

    const [similarity, setSimilarity] = useState(0);
    useEffect(() => {
        resolveUsers().then(function(u){ setUsers(u); calculateSimilarity(u)});

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
                    </div>
                </>
                :
                <></>
        }</>


    )
}

export default Comparison;