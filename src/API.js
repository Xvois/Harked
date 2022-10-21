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