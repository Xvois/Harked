/**
 * This component deals with capturing and storing the authentication token after
 * authorisation by the Spotify OAuth service.
 */
import {useCallback, useEffect} from 'react';
import {useNavigate} from "react-router-dom";
import PocketBase from "pocketbase";
import {formatUser} from "./PDM";

const REDIRECT_URL = process.env.REACT_APP_REDIRECT_URL;

export async function handleLogin(){
    const SCOPES = "user-read-currently-playing user-read-playback-state user-top-read user-follow-modify user-follow-read"
    const pb = new PocketBase('http://127.0.0.1:8090');
    const authMethods = await pb.collection('users').listAuthMethods();
    const provider = authMethods.authProviders[0];
    const authURL = new URL(provider.authUrl + REDIRECT_URL);
    authURL.searchParams.set('scope', SCOPES);
    localStorage.setItem('provider', JSON.stringify(provider));

    window.location = authURL;
}

export async function authRefresh() {
    const pb = new PocketBase("http://127.0.0.1:8090");
    await pb.collection('users').authRefresh().then(function(auth) {
        window.localStorage.setItem("access-token", auth.meta.accessToken);
        window.localStorage.setItem("refresh-token", auth.meta.refreshToken);
    })
}


function Authentication() {
    const pb = new PocketBase("http://127.0.0.1:8090");
    const navigate = useNavigate();
    const redirect = useCallback((path) => {
        console.warn("Redirecting...");
        navigate(path);
    }, [navigate]);

    useEffect(() => {

        // parse the query parameters from the redirected url
        const params = (new URL(window.location)).searchParams;

        // load the previously stored provider's data
        const provider = JSON.parse(localStorage.getItem('provider'))

        // compare the redirect's state param and the stored provider's one
        if (provider.state !== params.get('state')) {
            throw "State parameters don't match.";
        }

        // authenticate
        pb.collection('users').authWithOAuth2(
            provider.name,
            params.get('code'),
            provider.codeVerifier,
            REDIRECT_URL,
        ).then(function(auth){
            const user = auth.meta.rawUser;
            window.localStorage.setItem("access-token", auth.meta.accessToken);
            window.localStorage.setItem("refresh-token", auth.meta.refreshToken);
            window.localStorage.setItem('user_id', user.id);
            formatUser(user).then(function(fUser){
                pb.collection('users').update(auth.record.id, fUser);
            })
            redirect('/profile#me');
        });
    }, [redirect])

    return (
        <div>Redirecting...</div>
    )
}

export default Authentication