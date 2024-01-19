import {createNewPBInstance} from "../API/pocketbase.ts";

/**
 * Initiates the OAuth process with Spotify by redirecting the user to the Spotify authorization page.
 * @async
 */
export const handleLogin = async () => {
    const pb = createNewPBInstance();

    const CLIENT_ID = "a0b3f8d150d34dd79090608621999149";

    const url = new URL(window.location);
    const redirect = `${url.origin}/authentication`;

    const authMethodsList = await pb.collection('users').listAuthMethods();
    const authDetails = authMethodsList.authProviders[0];

    window.localStorage.setItem("provider", JSON.stringify(authDetails));

    const args = new URLSearchParams({
        response_type: 'code',
        client_id: CLIENT_ID,
        scope: ['user-top-read'],
        redirect_uri: redirect,
        state: authDetails.state,
        code_challenge_method: 'S256',
        code_challenge: authDetails.codeChallenge
    });

    window.location.href = `https://accounts.spotify.com/authorize?${args}`;
}