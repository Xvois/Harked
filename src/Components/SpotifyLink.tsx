import React from "react";

export const SpotifyLink = (props: { link: string, simple?: boolean }) => {
    const {link, simple = false} = props;
    const darkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return (
        simple ?
            <a href={link} style={{height: 'max-content', alignItems: 'center'}}>
                <img alt={'Spotify logo'} style={{height: '21px', width: '21px', marginBottom: '-4px'}}
                     src={`/Spotify_Icon_RGB_${!darkMode ? 'Black' : 'White'}.png`}/>
            </a>
            :
            <a className={'std-button'} style={{
                flexDirection: 'row',
                display: 'flex',
                alignItems: 'center',
                gap: '10.5px',
                height: 'max-content'
            }} href={link}>
                <img alt={'Spotify logo'} style={{height: '21px', width: '21px'}}
                     src={`/Spotify_Icon_RGB_${!darkMode ? 'Black' : 'White'}.png`}/>
                <p style={{margin: '0'}}>Open in Spotify</p>
            </a>
    )
}