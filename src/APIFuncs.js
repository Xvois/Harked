import axios from 'axios';

export const callAPI = async(path) => {
    const {data} = await axios.get(`https://api.spotify.com/v1/${path}`, {
        headers: {
            Authorization: `Bearer ${window.localStorage.getItem("token")}`
        },
    })
    return data;
}