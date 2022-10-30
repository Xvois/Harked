import axios from 'axios';
import { authURI } from './Authentication';

export const fetchData = async(path) => {
    console.info("API call made to " + path)
    const {data} = await axios.get(`https://api.spotify.com/v1/${path}`, {
        headers: {
            Authorization: `Bearer ${window.localStorage.getItem("token")}`
        },
    }).catch(function(err){
        if(err.response === undefined){ console.warn("[Error in API call] " + err); }
        if(err.response.status === 401 || err.response.status === 400){
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

export const postUser = async(user) => {
    console.info("User " + user.username + " posted.");
    await axios.post(`http://localhost:9000/PRDB/create`, user).then(function(result){console.warn(result)}).catch(
        function(err){
            console.warn(err)
        }
    )
}