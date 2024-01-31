import React from "react";

export function LoadingObject(props: { num: number, height?: number }) {

    const {num, height = 156} = props;

    const arr = [];

    for (let i = 0; i < num; i++) {
        arr.push(i);
    }

    return (
        <div style={{width: '100%', height: '100%'}}>
            <div className="loading-object-instance">
                {arr.map(i => <div className="animated-background" key={`loading_object_${i}`}
                                   style={{animationDelay: `${i / 10}s`, height: `${height}px`}}></div>)}
            </div>
        </div>
    )
}