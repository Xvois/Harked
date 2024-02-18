import {CLIENT_ID} from "@/Authentication/Authentication";

export const reAuthorise = async () => {

    // refresh token that has been previously stored
    const refreshToken = localStorage.getItem('refresh-token');
    const url = "https://accounts.spotify.com/api/token";

    const payload = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: CLIENT_ID
        }),
    }
    const body = await fetch(url, payload);
    const response = await body.json();

    if (response.access_token && response.refresh_token) {
        localStorage.setItem('access-token', response.access_token);
        localStorage.setItem('refresh-token', response.refresh_token);
    }
}