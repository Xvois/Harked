import {createNewPBInstance} from "@/API/pocketbase";
import {CLIENT_ID} from "@/Authentication/Authentication";

/**
 * Initiates the OAuth process with Spotify by redirecting the user to the Spotify authorization page.
 * @async
 */
export const handleLogin = async () => {
    console.info('Attempting to log in.')
    const pb = createNewPBInstance();

    const url = new URL(window.location.toString());
    const redirect = `${url.origin}/authentication`;

    const authMethodsList = await pb.collection('users').listAuthMethods();
    const authDetails = authMethodsList.authProviders[0];

    window.localStorage.setItem("provider", JSON.stringify(authDetails));

    const args = new URLSearchParams({
        response_type: 'code',
        client_id: CLIENT_ID,
        scope: ['user-top-read'].join(' '),
        redirect_uri: redirect,
        state: authDetails.state,
        code_challenge_method: 'S256',
        code_challenge: authDetails.codeChallenge
    });

    window.location.href = `https://accounts.spotify.com/authorize?${args}`;
}