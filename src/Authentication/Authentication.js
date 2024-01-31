/**
 * This component deals with capturing and storing the authentication token after
 * authorisation by the Spotify OAuth service.
 */
import React from "react";
import {useAuthenticationLogic} from "./authenticationLogic";
import {useRedirect} from "./redirect";


function Authentication() {
    const redirect = useRedirect();
    useAuthenticationLogic(redirect);

    return <div>
        <h2>Redirecting...</h2>
        <p>Stuck on this page? <a style={{color: 'var(--primary-colour)'}}
                                  href={window.localStorage.getItem("redirect") ?? '/profile/me'}>Click here to
            redirect.</a></p>
    </div>;
}

export default Authentication;