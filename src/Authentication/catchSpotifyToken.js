const REDIRECT_PATH = '/';

export const catchSpotifyToken = (redirect) => {
    const localToken = getLocalTokenFromUrl();
    window.localStorage.setItem("access-token", localToken);
    handleRedirect(redirect);
};

const getLocalTokenFromUrl = () => {
    const url = new URL(window.location.toString());
    const hash = url.hash;
    const re = new RegExp('\\=(.*?)\\&');
    let localToken = hash.match(re)[0];
    localToken = localToken.substring(1, localToken.length - 1);
    window.location.hash = "";
    return localToken;
};

const handleRedirect = (redirect) => {
    const redirectPath = window.localStorage.getItem("redirect");
    if (redirectPath) {
        window.localStorage.removeItem("redirect");
        redirect(redirectPath);
    } else {
        redirect(REDIRECT_PATH);
    }
};