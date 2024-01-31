import React from "react";

export const PageError = (props: { description: string, errCode?: string }) => {
    const {description, errCode} = props;
    return (
        !!description ?
            <div className="page-error centre">
                <h1 style={{margin: 0}}>Uh oh...</h1>
                <p>{description}</p>
                {errCode && (
                    <p style={{fontSize: '12px'}}>ERR CODE: {errCode}</p>
                )}
                <a style={{color: 'var(--primary-colour)'}} href={'/'}>Take me home</a>
            </div>
            :
            <></>
    )
}


