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
                        width: `250px`,
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
        setUsers(localState);
        return "Users resolved."
    }


    useEffect(() => {
        resolveUsers().then(r => console.log(r));
    }, [])
    return (
        <div className="compare-wrapper">
            <div className="left">
                {users.length ?
                    <>
                        <UserContainer user={users[0]}/>
                        <ul>
                            <li>Top artist: {users[0].datapoint.topArtists[0].name}</li>
                            <li>Top song: {users[0].datapoint.topSongs[0].title}</li>
                            <li>Top genre: {users[0].datapoint.topGenres[0]}</li>
                            <li>Hello.</li>
                            <li>Hello.</li>
                        </ul>
                    </>
                    :
                    <></>}
            </div>
            <div className="right">
                {users.length ?
                    <>
                        <UserContainer user={users[1]}/>
                        <ul>
                            <li>Top artist: {users[1].datapoint.topArtists[0].name}</li>
                            <li>Top song: {users[1].datapoint.topSongs[0].title}</li>
                            <li>Hello.</li>
                            <li>Hello.</li>
                            <li>Hello.</li>
                        </ul>
                    </>
                    :
                    <></>}
            </div>
        </div>
    )
}

export default Comparison;