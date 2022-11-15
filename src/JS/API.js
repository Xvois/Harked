import axios from 'axios';
import { authURI } from './Authentication';

export const fetchData = async(path) => {
    //console.log("External API call made to: " + path)
    const {data} = await axios.get(`https://api.spotify.com/v1/${path}`, {
        headers: {
            Authorization: `Bearer ${window.localStorage.getItem("token")}`
        },
    }).catch(function(err){
        if(err.response === undefined){ console.warn("[Error in API call] " + err); }
        if(err.response.status === 401){
            window.localStorage.setItem("token", "");
            window.location.replace(authURI)
        }else if(err.response.status === 429){
            alert("Too many API calls made! Take a deep breath and refresh the page.")
        }else{
            alert(err);
        }
    })
    return data;
}

export const fetchLocalData = async(path) => {
    console.info("Local API call made to " + path);
    const {data} = await axios.get(`http://localhost:9000/PRDB/${path}`).catch(
        function(err){
            console.warn(err)
        }
    )
    console.log(data)
}

export const getUser = async(userID) => {
    var user;
    await axios.get(`http://localhost:9000/PRDB/getUser?userID=${userID}`).then(
        function(result){
            user = result.data;
        }
    ).catch(
        function(err){
            console.warn("Error getting user: ");
            console.warn(err);
        }
    )
    return user;
}

export const getAllUsers = async() => {
    var users;
    await axios.get(`http://localhost:9000/PRDB/all`).then(
        function(result){
            users = result.data;
        }
        ).catch(
        function(err){
            console.warn(err);
        }
    )
    return users;
}

export const postUser = async(user) => {
    //console.info("User " + user.username + " posted.");
    await axios.post(`http://localhost:9000/PRDB/create`, user).catch(
        function(err){
            console.warn(err);
        }
    )
}

export const postDatapoint = async(datapoint) => {  
    await axios.post(`http://localhost:9000/PRDB/addDatapoint`, datapoint).catch(
        function(err){
            console.warn("Error posting datapoint: ");
            console.warn(err);
        }
    )
}

export const getDatapoint = async(userID, term) => {
    let returnRes;
    await axios.get(`http://localhost:9000/PRDB/getDatapoint?userID=${userID}&term=${term}`).then(result => {
        if(result.data != null){ // Does the datapoint exist? (Has the collectionDate been overwritten?)
            returnRes = result.data;
        }else{
            returnRes = false;
        }
    })
    return returnRes;
}