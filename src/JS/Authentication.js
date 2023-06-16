/**
 * This component deals with capturing and storing the authentication token after
 * authorisation by the Spotify OAuth service.
 */
import {useCallback, useEffect} from 'react';
import {useNavigate} from "react-router-dom";
import PocketBase from "pocketbase";
import {formatUser, hashString, userExists} from "./HDM.ts";
import {putLocalData} from "./API.ts";

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
    const url = new URL(window.location);
    const params = new URLSearchParams([
        ["client_id", "a0b3f8d150d34dd79090608621999149"],
        ["redirect_uri", `${url.origin}/authentication`],
        ["response_type", "token"],
        ["scope", ['user-top-read']]
    ])
    window.localStorage.setItem("redirect", `${url.pathname + url.hash}`);
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
                scopes: ['user-top-read']
            }).then((authData) => {
                // authenticate
                const id = pb.authStore.model.id;
                const user = authData.meta.rawUser;
                window.localStorage.setItem('access-token', authData.meta.accessToken);
                formatUser(user).then(function (fUser) {
                    // TODO: TEMP FIX
                    fUser.username = fUser.username.replace(' ', '-');
                    userExists(fUser.user_id).then(exists => {
                        if (!exists) {
                            pb.collection('users').update(id, fUser)
                                .then(async () => {
                                    const hash = hashString(fUser.user_id);
                                    const followers = {id: hash, user: id, followers: []}
                                    const following = {id: hash, user: id, following: []}
                                    const settings = {id: hash, user: id, public: true}
                                    const profile_data = {id: hash, user: id}
                                    const profile_comments = {id: hash, owner: id, comments: []}
                                    const profile_recommendations = {id: hash, user: id, recommendations: []}
                                    await Promise.all(
                                        [
                                            putLocalData("user_followers", followers),
                                            putLocalData("user_following", following),
                                            putLocalData("settings", settings),
                                            putLocalData("profile_data", profile_data),
                                            // Automatically generate a comment section for the profile
                                            putLocalData("comment_section", profile_comments),
                                            putLocalData("profile_recommendations", profile_recommendations),
                                        ]
                                    )
                                    redirect('/profile#me');
                                });
                        } else {
                            const redirectPath = window.localStorage.getItem("redirect");
                            if (redirectPath) {
                                window.localStorage.removeItem("redirect");
                                redirect(redirectPath);
                            } else {
                                redirect('/profile#me');
                            }
                        }
                    })
                })
            })
        } else {
            const url = new URL(window.location);
            console.log(url);
            const hash = url.hash;
            const re = new RegExp('\\=(.*?)\\&')
            let local_token = hash.match(re)[0]
            local_token = local_token.substring(1, local_token.length - 1);
            window.location.hash = ""
            window.localStorage.setItem("access-token", local_token);
            const redirectPath = window.localStorage.getItem("redirect");
            if (redirectPath) {
                window.localStorage.removeItem("redirect");
                redirect(redirectPath);
            } else {
                redirect('/profile#me');
            }
        }
    }, [redirect])

    return (
        <div>
            <h2>Redirecting...</h2>
            <p>Stuck on this page? Ensure pop-ups are enabled.</p>
        </div>
    )
}

export default Authentication