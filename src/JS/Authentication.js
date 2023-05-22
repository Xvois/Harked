/**
 * This component deals with capturing and storing the authentication token after
 * authorisation by the Spotify OAuth service.
 */
import {useCallback, useEffect} from 'react';
import {useNavigate} from "react-router-dom";
import PocketBase from "pocketbase";
import {formatUser} from "./PDM";
import {hashString, putLocalData} from "./API";

// TODO: FIX ISSUE THAT STATES THAT USERNAME MUST BE IN VALID FORMAT
// LIKELY AN ISSUE WITH USERNAMES WITH SPACES

export async function authRefresh() {
    console.info("Refreshing auth token.")
    const pb = new PocketBase("https://harked.fly.dev/");
    await pb.collection('users').authRefresh().then(function (auth) {
        console.info(auth)
        window.localStorage.setItem("access-token", auth.token);
    })
}

export function handleLogin() {
    window.location = `/authentication`;
}

export function reAuthenticate() {
    const params = new URLSearchParams([
        ["client_id", "a0b3f8d150d34dd79090608621999149"],
        ["redirect_uri", "http://localhost:3000/authentication"],
        ["response_type", "token"],
        ["scope", ['user-follow-read', 'user-follow-modify', 'user-library-read', 'user-library-modify', 'user-read-recently-played', 'user-top-read', 'playlist-read-private']]
    ])
    window.location.href = `https://accounts.spotify.com/authorize?${params}`;
}

function Authentication() {
    const navigate = useNavigate();
    const redirect = useCallback((path) => {
        console.warn("Redirecting...");
        navigate(path);
    }, [navigate]);

    useEffect(() => {

        const pb = new PocketBase("https://harked.fly.dev/");
        // Is the user not in authorised on the database yet?
        console.log(pb.authStore.isValid);
        if (!pb.authStore.isValid) {
            console.info('Attempting OAuth with Spotify.');
            pb.collection('users').authWithOAuth2({
                provider: 'spotify',
                scopes: ['user-follow-read', 'user-follow-modify', 'user-library-read', 'user-library-modify', 'user-read-recently-played', 'user-top-read', 'playlist-read-private']
            }).then((authData) => {
                // authenticate
                const id = pb.authStore.model.id;
                const user = authData.meta.rawUser;
                window.localStorage.setItem('access-token', authData.meta.accessToken);
                window.localStorage.setItem('user_id', user.id);
                formatUser(user).then(function (fUser) {
                    // TODO: TEMP FIX
                    fUser.username = fUser.username.replace(' ', '-');
                    pb.collection('users').update(id, fUser)
                        .then(() => {
                            const followers = {id: hashString(fUser.user_id), user: id, followers: []}
                            const following = {id: hashString(fUser.user_id), user: id, following: []}
                            putLocalData("user_followers", followers);
                            putLocalData("user_following", following);
                            redirect('/profile#me');
                        });
                })
            })
        } else {
            const hash = window.location.hash
            const re = new RegExp('\\=(.*?)\\&')
            let local_token = hash.match(re)[0]
            local_token = local_token.substring(1, local_token.length - 1);
            window.location.hash = ""
            window.localStorage.setItem("access-token", local_token);
            redirect('/profile#me');
        }
    }, [redirect])

    return (
        <div>Redirecting... [If you are stuck on this page please enable pop-ups and reload]</div>
    )
}

export default Authentication