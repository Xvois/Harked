import {useCallback, useEffect} from 'react';
import {useNavigate} from "react-router-dom";
import {postLoggedUser} from './PDM';
import {fetchData} from './API';

const CLIENT_ID = "a0b3f8d150d34dd79090608621999149";
const REDIRECT_URI = "bhasvic-photon.vercel.app/authentication";
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const RESPONSE_TYPE = "token";
const SCOPES = "user-read-currently-playing, user-read-playback-state, user-top-read, user-follow-modify, user-follow-read"
export const authURI = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=${SCOPES}`;

function Authentication() {

    const navigate = useNavigate();
    const redirect = useCallback((path) => {
        console.warn("Redirecting...")
        fetchData('me').then(result => {
            window.localStorage.setItem("userID", result.id);
            postLoggedUser().then(() => {
                navigate(path);
            });
        });
    }, [navigate]);

    useEffect(() => {
        const hash = window.location.hash // Get the anchor of the URL
        let local_token = window.localStorage.getItem("token") // Get the current token
        if (local_token === "denied-scopes") {
            local_token = null
        }
        if (!local_token && hash) { //update token whenever authorised to
            const re = new RegExp('(?<=\\=)(.*?)(?=\\&)')
            local_token = hash.match(re)[0]
            window.location.hash = ""
            window.localStorage.setItem("token", local_token);
        }
        if (!local_token && !hash) {
            window.localStorage.setItem("token", "denied-scopes")
        }
        if (window.localStorage.getItem("token") !== "denied-scopes") {
            redirect("/profile#me");
        } else {
            redirect("/");
        }
    }, [redirect])

    return (
        <div>Redirecting...</div>
    )
}

export default Authentication