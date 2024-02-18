import {useEffect} from 'react';
import {catchSpotifyToken} from './catchSpotifyToken';
import {createNewPBInstance, putLocalData} from "@/API/pocketbase"
import {userExists} from '@/Tools/users';
import {hashString} from '@/Tools/utils';

const REDIRECT_PATH = '/';
const AUTHENTICATION_PATH = '/authentication';

const useAuthenticationLogic = (redirect) => {
    useEffect(() => {
        handleAuthentication(redirect);
    }, [redirect]);
};

const handleAuthentication = async (redirect) => {
    const code = getCodeFromUrl();
    const redirectURL = getRedirectUrl();
    const provider = getProviderFromLocalStorage();

    const pb = createNewPBInstance();

    if (!pb.authStore.isValid && code) {
        console.info('Code found in URL, attempting to exchange for token.')
        await handleOAuth2Code(pb, provider, code, redirectURL, redirect);
    } else if (pb.authStore.isValid && window.location.hash) {
        console.info('Token found in URL, attempting to catch.');
        catchSpotifyToken(redirect);
    } else {
        console.info('No code found in URL, or token already exists.');
        handleSessionExpired();
    }
};

const getCodeFromUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('code');
};

const getRedirectUrl = () => {
    const url = new URL(window.location.toString());
    return `${url.origin}${AUTHENTICATION_PATH}`;
};

const getProviderFromLocalStorage = () => {
    return JSON.parse(localStorage.getItem('provider'));
};

const handleOAuth2Code = async (pb, provider, code, redirectURL, redirect) => {
    try {
        const authData = await pb.collection('users').authWithOAuth2Code(
            provider.name,
            code,
            provider.codeVerifier,
            redirectURL,
        );
        handleAuthData(authData, pb, redirect);
    } catch (err) {
        console.log("Failed to exchange code.\n" + err);
    }
};

const handleAuthData = async (authData, pb, redirect) => {
    const id = pb.authStore.model.id;
    const user = authData.meta.rawUser;
    window.localStorage.setItem('access-token', authData.meta.accessToken);
    window.localStorage.setItem('refresh-token', authData.meta.refreshToken);
    window.localStorage.setItem('db_id', id);
    let formattedUser = formatUser(user);
    const userExists = await checkIfUserExists(formattedUser.user_id);

    if (!userExists) {
        await handleNewUser(formattedUser, id, pb, redirect);
    } else {
        handleExistingUser(redirect);
    }
};

const formatUser = (user) => {
    let formattedUser = {user_id: user.id, username: user.display_name};
    formattedUser.username = formattedUser.username.replaceAll(' ', '-');
    return formattedUser;
};

const checkIfUserExists = async (userId) => {
    return await userExists(userId);
};

const handleNewUser = async (formattedUser, id, pb, redirect) => {
    try {
        await pb.collection('users').update(id, formattedUser);
        await handleUserData(formattedUser, id, redirect);
    } catch (err) {
        console.error('Error patching user: ', err);
        await handleUserPatchError(id, pb);
    }
};

const handleUserData = async (formattedUser, id, redirect) => {
    const hash = hashString(formattedUser.user_id);
    const settings = {id: hash, user: id, public: true};
    const profile_data = {id: hash, user: id};
    const profile_comments = {id: hash, owner: id, comments: []};
    const profile_recommendations = {id: hash, user: id, recommendations: []};

    await Promise.all(
        [
            putLocalData("settings", settings),
            putLocalData("profile_data", profile_data),
            putLocalData("comment_section", profile_comments),
            putLocalData("profile_recommendations", profile_recommendations),
        ]
    );
    redirect(REDIRECT_PATH, true);
};

const handleUserPatchError = async (id, pb) => {
    try {
        await pb.collection('users').delete(id);
        console.info('User successfully removed as a result.');
    } catch (deletionError) {
        console.error('Error subsequently deleting user: ', deletionError);
    }
};

const handleExistingUser = (redirect) => {
    const redirectPath = window.localStorage.getItem("redirect");
    if (redirectPath) {
        window.localStorage.removeItem("redirect");
        redirect(redirectPath, true);
    } else {
        redirect(REDIRECT_PATH, true);
    }
};

const handleSessionExpired = () => {
    console.info('Session expired.');
    window.localStorage.clear();
    window.location.href = '/';
};

export default useAuthenticationLogic;