/**
 * This component deals with capturing and storing the authentication token after
 * authorisation by the Spotify OAuth service.
 */
import {useCallback, useEffect} from 'react';
import {useNavigate} from "react-router-dom";
import PocketBase from "pocketbase";
import {formatUser} from "./PDM";
import {fetchData, hashString, putLocalData} from "./API";

const REDIRECT_URL = process.env.REACT_APP_REDIRECT_URL;

export async function authRefresh() {
    console.info("Refreshing auth token.")
    const pb = new PocketBase(process.env.REACT_APP_PB_ROUTE);
    await pb.collection('users').authRefresh().then(function(auth) {
        console.info(auth)
        window.localStorage.setItem("access-token", auth.token);
    })
}

export function handleLogin() {
    window.location = '/authentication';
}

function Authentication() {
    const pb = new PocketBase(process.env.REACT_APP_PB_ROUTE);
    const navigate = useNavigate();
    const redirect = useCallback((path) => {
        console.warn("Redirecting...");
        navigate(path);
    }, [navigate]);

    useEffect(() => {

        const pb = new PocketBase(process.env.REACT_APP_PB_ROUTE);


        if(!pb.authStore.isValid) {
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
                    pb.collection('users').update(id, fUser)
                        .then(() => {
                            const followers = {id: hashString(fUser.user_id), user: id, followers: []}
                            const following = {id: hashString(fUser.user_id), user: id, following: []}
                            putLocalData("user_followers", followers);
                            putLocalData("user_following", following);
                        });
                })
            })
        }
        redirect('/profile#me');
    }, [redirect])

    return (
        <div>Redirecting...</div>
    )
}

export default Authentication