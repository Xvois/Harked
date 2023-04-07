/**
 * This component deals with capturing and storing the authentication token after
 * authorisation by the Spotify OAuth service.
 */


import {useCallback, useEffect} from 'react';
import {useNavigate} from "react-router-dom";
import {postLoggedUser} from './PDM';
import {fetchData} from './API';
import PocketBase from "pocketbase";

export const handleLogIn = async () => {
    const pb = new PocketBase(process.env.REACT_APP_PB_ROUTE);
    const authMethodsList = await pb.collection('users').listAuthMethods();
    const authDetails = authMethodsList.authProviders[0];
    window.localStorage.setItem("provider", JSON.stringify(authDetails));
    let args = new URLSearchParams({
        response_type: 'code',
        client_id: CLIENT_ID,
        scope: SCOPES,
        redirect_uri: REDIRECT_URL,
        state: authDetails.state,
        code_challenge_method: 'S256',
        code_challenge: authDetails.codeChallenge
    });
    window.location = 'https://accounts.spotify.com/authorize?' + args;
}

const CLIENT_ID = "a0b3f8d150d34dd79090608621999149";
const REDIRECT_URL = process.env.REACT_APP_REDIRECT_URL;
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const RESPONSE_TYPE = "token";
const SCOPES = "user-read-currently-playing, user-read-playback-state, user-top-read, user-follow-modify, user-follow-read"

function Authentication() {

    const navigate = useNavigate();
    const redirect = useCallback((path) => {
        console.warn("Redirecting...")
        if (window.localStorage.getItem("token") === "denied-scopes") {
            navigate(path);
        } else {
            fetchData('me').then(result => {
                window.localStorage.setItem("user_id", result.id);
                postLoggedUser().then(() => {
                    navigate(path);
                });
            });
        }
    }, [navigate]);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        let code = urlParams.get('code');
        let provider = JSON.parse(localStorage.getItem('provider'));
        let body = new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: process.env.REACT_APP_REDIRECT_URL,
            client_id: CLIENT_ID,
            code_verifier: provider.codeVerifier
        });

        // authenticate
        const pb = new PocketBase(process.env.REACT_APP_PB_ROUTE);
        console.log({
            name: provider.name,
            code: code,
            codeVerifier: provider.codeVerifier,
            redirectURL: process.env.REACT_APP_REDIRECT_URL,
            createData: {
                emailVisibility: false,
            }
        })
        pb.collection('users').authWithOAuth2(
            provider.name,
            code,
            provider.codeVerifier,
            process.env.REACT_APP_REDIRECT_URL,
            // pass optional user create data
            {
                emailVisibility: false,
            }
        ).then((authData) => {
            console.log(JSON.stringify(authData, null, 2));
        }).catch((err) => {
            console.log("Failed to exchange code.\n" + err);
        });

        // Get token
        const response = fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: body
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('HTTP status ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                console.info(data);
                localStorage.setItem('access-token', data.access_token);
            })
            .catch(error => {
                console.error('Error:', error);
            });

    }, [redirect])

    return (
        <div>Redirecting...</div>
    )
}

export default Authentication