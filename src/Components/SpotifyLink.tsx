import React from "react";

export const SpotifyLink = (props: { link: string, simple?: boolean }) => {
    const {link, simple = false} = props;
    const darkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return (
        simple ?
            <a href={link} className={"h-max"}>
                <img className={"w-6 h-6"} alt={'Spotify logo'} src={`/Spotify_Icon_RGB_${!darkMode ? 'Black' : 'White'}.png`}/>
            </a>
            :
            <a className={'std-button'} href={link}>
                <img alt={'Spotify logo'}
                     src={`/Spotify_Icon_RGB_${!darkMode ? 'Black' : 'White'}.png`}/>
                <p>Open in Spotify</p>
            </a>
    )
}