import axios from 'axios';
import { authURI } from './Authentication';

export const fetchData = async(path) => {
    const {data} = await axios.get(`https://api.spotify.com/v1/${path}`, {
        headers: {
            Authorization: `Bearer ${window.localStorage.getItem("token")}`
        },
    }).catch(function(err){
        if(!err.response){ console.log("No error yet failure to fetch."); }
        if(err.response.status === 401){
            window.localStorage.setItem("token", "");
            window.location.replace(authURI)
        }else{
            alert(err);
        }
    })
    return data;
}