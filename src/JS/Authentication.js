/**
 * This component deals with capturing and storing the authentication token after
 * authorisation by the Spotify OAuth service.
 */
import {useCallback, useEffect} from 'react';
import {useNavigate} from "react-router-dom";
import PocketBase from "pocketbase";
import {formatUser, hashString, userExists} from "./HDM.ts";
import {putLocalData} from "./API.ts";

const CLIENT_ID = "a0b3f8d150d34dd79090608621999149";


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

export const handleAlternateLogin = async () => {
    const pb = new PocketBase("https://harked.fly.dev/");
    console.info('Attempting alternate OAuth with Spotify.');
    const url = new URL(window.location);
    const redirect = `${url.origin}/authentication`;
    const authMethodsList = await pb.collection('users').listAuthMethods();
    const authDetails = authMethodsList.authProviders[0];
    window.localStorage.setItem("provider", JSON.stringify(authDetails));
    let args = new URLSearchParams({
        response_type: 'code',
        client_id: CLIENT_ID,
        scope: ['user-top-read'],
        redirect_uri: redirect,
        state: authDetails.state,
        code_challenge_method: 'S256',
        code_challenge: authDetails.codeChallenge
    });
    window.location = 'https://accounts.spotify.com/authorize?' + args;
}

export function reAuthenticate() {
    const url = new URL(window.location);
    const params = new URLSearchParams([
        ["client_id", "a0b3f8d150d34dd79090608621999149"],
        ["redirect_uri", `${url.origin}/authentication`],
        ["response_type", "token"],
        ["scope", ['user-top-read']]
    ])
    if (!url.pathname.includes("authentication")) {
        window.localStorage.setItem("redirect", `${url.pathname + url.hash}`);
    }
    window.location.href = `https://accounts.spotify.com/authorize?${params}`;
}

function Authentication() {
    const navigate = useNavigate();
    const redirect = useCallback((path, refresh = false) => {
        console.warn("Redirecting...");
        if (refresh) {
            window.location.href = path;
        } else {
            navigate(path);
        }
    }, [navigate]);

    const CATCH_SPOTIFY_TOKEN = () => {
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
            redirect('/profile/me');
        }
    }

    useEffect(() => {
        // Grab code from returned url params
        const urlParams = new URLSearchParams(window.location.search);
        let code = urlParams.get('code');

        // Create the redirect url for pb authentication
        const url = new URL(window.location);

        const redirectURL = `${url.origin}/authentication`;

        if (code) {
            window.localStorage.setItem('code', code);
        }

        // Get provider
        let provider = JSON.parse(localStorage.getItem('provider'));

        // Authenticate with pb
        const pb = new PocketBase("https://harked.fly.dev/");
        // Are we authed already?
        if (!pb.authStore.isValid && code) {
            console.info('pb authStore is not valid: ', pb.authStore);
            console.log(code);
            pb.collection('users').authWithOAuth2Code(
                provider.name,
                code,
                provider.codeVerifier,
                redirectURL,
            ).then((authData) => {
                // authenticate
                const id = pb.authStore.model.id;
                const user = authData.meta.rawUser;
                window.localStorage.setItem('access-token', authData.meta.accessToken);
                let fUser = formatUser(user)
                // FIXME: TEMP FIX
                fUser.username = fUser.username.replaceAll(' ', '-');
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
                                redirect('/profile/me', true);
                            }).catch((err) => {
                            console.error('Error patching user: ', err);
                            console.info('User: ', fUser);
                            console.info('Username: ', fUser.username);
                            pb.collection('users').delete(id).then(() => {
                                console.info('User successfully removed as a result.')
                            }).catch((deletionError) => {
                                console.error('Error subsequently deleting user: ', deletionError);
                            });
                        });
                    } else {
                        const redirectPath = window.localStorage.getItem("redirect");
                        if (redirectPath) {
                            window.localStorage.removeItem("redirect");
                            redirect(redirectPath, true);
                        } else {
                            redirect('/profile/me', true);
                        }
                    }
                })
            }).catch((err) => {
                console.log("Failed to exchange code.\n" + err);
            });
        } else if (pb.authStore.isValid) {
            console.info('Attempting to catch spotify token.')
            if (window.location.hash) {
                CATCH_SPOTIFY_TOKEN()
            }
            /*
             FIXME: Sometimes a authStore session will expire
             but the auth expects to only reauth spotify tokens
             so will infinitely reauth them. This is an escape
             hatch for this, simply logging the user out in that
             case.
             */
        } else {
            console.info('Session expired.')
            window.localStorage.clear();
            window.location = '/';
        }
    }, [redirect])

    return (
        <div>
            <h2>Redirecting...</h2>
            <p>Stuck on this page? <a style={{color: 'var(--primary-colour)'}}
                                      href={window.localStorage.getItem("redirect") ?? '/profile/me'}>Click here to
                redirect.</a></p>
        </div>
    )
}

export default Authentication;