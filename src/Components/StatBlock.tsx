import React from "react";

export const StatBlock = (props: {
    name: string,
    description: string,
    value: number,
    alignment?: "left" | "right",
    shadow?: number
}) => {
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
                 style={{
                     '--val': `${value}%`,
                     marginLeft: `${alignment === 'right' ? 'auto' : ''}`,
                 } as React.CSSProperties}></div>
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