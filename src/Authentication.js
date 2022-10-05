const CLIENT_ID = "a0b3f8d150d34dd79090608621999149";
const REDIRECT_URI = "http://localhost:3000/authentication";
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const RESPONSE_TYPE = "token";
const SCOPES = ""
export const authURI = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scopes=${SCOPES}`;

const Authentication = () => {
  return (
    <div>Authentication page.</div>
  )
}

export default Authentication