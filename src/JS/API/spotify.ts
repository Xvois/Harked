import axios from "axios";

/**
 * Fetches data from the Spotify API at the specified endpoint.
 * If the request fails due to rate limiting or server issues, it will retry up to 3 times.
 * @param {string} endpoint - The endpoint to request data from.
 * @param {number} [retryCount=0] - The current number of retry attempts.
 * @returns {Promise<any>} The data received from the Spotify API.
 * @throws Will throw an error if reauthentication is needed.
 */
export async function fetchSpotifyData<T>(endpoint: string, retryCount: number = 0): Promise<T | null> {
    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 3000;
    const UNAUTHENTICATED_STATUS = 401;
    const RATE_LIMIT_STATUS = 429;
    const SERVER_ISSUE_STATUS = 503;

    try {
        const { data } = await axios.get(`https://api.spotify.com/v1/${endpoint}`, {
            headers: {
                Authorization: `Bearer ${window.localStorage.getItem('access-token')}`
            },
        });
        return data;
    } catch (err) {
        const responseStatus = err.response?.status;

        switch (responseStatus) {
            case UNAUTHENTICATED_STATUS:
                console.warn('Token expired. Attempting to reauthenticate.');
                throw new Error('Reauthentication not implemented.');
            case RATE_LIMIT_STATUS:
            case SERVER_ISSUE_STATUS:
                if (retryCount < MAX_RETRIES) {
                    console.warn(`[Error in API call] CODE : ${responseStatus}. Retrying...`);
                    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
                    return fetchSpotifyData<T>(endpoint, retryCount + 1);
                } else {
                    console.warn(`[Error in API call] CODE : ${responseStatus}. Maximum retries exceeded.`);
                    return null;
                }
            default:
                console.error(`[Error in Spotify API call] ${err}`);
        }
    }
}


/**
 * Makes a put request to the Spotify api.
 * @param path
 */
export const putData = (path) => {
    axios.put(`https://api.spotify.com/v1/${path}`, {}, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${window.localStorage.getItem("token")}`
        },
    }).catch(function (err) {
        console.warn("[Error in Spotify API put] " + err);
    })
}

export const deleteData = (path) => {
    axios.delete(`https://api.spotify.com/v1/${path}`, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${window.localStorage.getItem("token")}`
        },
    }).catch(function (err) {
        console.warn("[Error in Spotify API delete] " + err);
    })
}