export const catchSpotifyToken = (redirect) => {
    const url = new URL(window.location);
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
};