import React from "react";

export function ValueIndicator(props: { value: number, diameter?: number }) {
    const {value, diameter = 70} = props;
    const padding = 5 * (diameter / 70);

    return (
        <div style={{
            padding: '3px',
            border: `2px solid rgba(125,125,125, 0.5)`,
            borderRadius: '100%',
            height: 'max-content',
            width: 'max-content',
            margin: 'auto'
        }}>
            <div style={{
                position: 'relative',
                height: `${diameter}px`,
                width: `${diameter}px`,
                padding: `${padding}px`,
                borderRadius: '100%',
                overflow: 'hidden'
            }}>
                <div style={{
                    zIndex: '0',
                    transform: `translate(0, ${(diameter + 2 * padding) - ((value / 100) * (diameter + 2 * padding))}px)`,
                    position: 'absolute',
                    height: `${diameter + 2 * padding}px`,
                    width: `${diameter + 2 * padding}px`,
                    background: 'rgba(125,125,125, 0.25)',
                    top: '0',
                    left: '0',
                    animation: 'rise 1s ease-out'
                }}/>
                <div style={{position: 'relative', width: '100%', height: '100%'}}>
                    <div className={'centre'}>
                        <h2 style={{
                            margin: '0',
                            color: 'var(--primary-colour)',
                            fontSize: `${(diameter / 70) * 24}px`
                        }}>{Math.round(value)}%</h2>
                    </div>
                </div>
            </div>
        </div>
    )
}