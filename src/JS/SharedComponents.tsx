import {ReactJSXElement} from "@emotion/react/types/jsx-namespace";

export const StatBlock = (props: {name: string, description: string, value: number, alignment? : "left" | "right", shadow? : number}) => {
    const {name, description, value, alignment = 'left', shadow = null} = props;

    return (
        <div className={'stat-block'}>
        <h3 style={{textAlign: alignment}}>{name}</h3>
    <div className={'stat-bar'} style={
    {
        '--val': `100%`,
        backgroundColor: 'var(--primary-colour)',
        opacity: '0.1',
        marginBottom: '-5px',
        animation: 'none'
    } as React.CSSProperties
}></div>
    <div className={'stat-bar'}
    style={{'--val': `${value}%`, marginLeft: `${alignment === 'right' ? 'auto' : ''}`} as React.CSSProperties }></div>
    {shadow ?
        <div className={'stat-bar'}
        style={{
            '--val': `${shadow}%`,
            marginLeft: `${alignment === 'right' ? 'auto' : ''}`,
            marginTop: '-5px',
            opacity: '0.25'
    } as React.CSSProperties
        }></div>
    :
        <></>
    }

    <p style={{textAlign: alignment}}>{description}</p>
    </div>
)
}

export const SpotifyLink = (props : {link: string, simple?: boolean}) => {
    const {link, simple = false} = props;
    const darkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return (
        simple ?
            <a href={link} style={{height: 'max-content', alignItems: 'center'}}>
                <img alt={'Spotify logo'} style={{height: '21px', width: '21px'}} src={`/Spotify_Icon_RGB_${!darkMode ? 'Black' : 'White'}.png`} />
            </a>
        :
            <a className={'std-button'} style={{flexDirection: 'row', display: 'flex', alignItems: 'center', gap: '10.5px', height: 'max-content'}} href={link}>
                <img alt={'Spotify logo'} style={{height: '21px', width: '21px'}} src={`/Spotify_Icon_RGB_${!darkMode ? 'Black' : 'White'}.png`} />
                <p style={{margin: '0'}}>Open in Spotify</p>
            </a>
)
}

export const PageError = (props : {icon : ReactJSXElement, description: string}) => {
    const {icon, description} = props;
    return (
        <div style={{top: '50%', left: '0', right: '0', position: 'absolute'}}>
            <div className="centre" style={{textAlign: 'center'}}>
                {icon}
                <h1>{description}</h1>
            </div>
        </div>
    )
}