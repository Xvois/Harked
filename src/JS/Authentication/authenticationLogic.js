import { useEffect } from 'react';
import { catchSpotifyToken } from './catchSpotifyToken';
import { createNewPBInstance, putLocalData } from "../API/pocketbase.ts";
import { formatUser, hashString, userExists } from "../Data Tools/HDM.ts";

export const useAuthenticationLogic = (redirect) => {
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        let code = urlParams.get('code');

        const url = new URL(window.location);
        const redirectURL = `${url.origin}/authentication`;

        if (code) {
            window.localStorage.setItem('code', code);
        }

        let provider = JSON.parse(localStorage.getItem('provider'));

        const pb = createNewPBInstance();
        if (!pb.authStore.isValid && code) {
            pb.collection('users').authWithOAuth2Code(
                provider.name,
                code,
                provider.codeVerifier,
                redirectURL,
            ).then((authData) => {
                const id = pb.authStore.model.id;
                const user = authData.meta.rawUser;
                window.localStorage.setItem('access-token', authData.meta.accessToken);
                let fUser = formatUser(user)
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
                                        putLocalData("comment_section", profile_comments),
                                        putLocalData("profile_recommendations", profile_recommendations),
                                    ]
                                )
                                redirect('/profile/me', true);
                            }).catch((err) => {
                            console.error('Error patching user: ', err);
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
            if (window.location.hash) {
                catchSpotifyToken(redirect);
            }
        } else {
            console.info('Session expired.')
            window.localStorage.clear();
            window.location = '/';
        }
    }, [redirect]);
};