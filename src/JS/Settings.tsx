import {useEffect, useState} from "react";
import {changeSettings, deleteUser, retrieveLoggedUserID, retrieveSettings, retrieveUser} from "./HDM.ts";
import "./../CSS/Settings.css"


const SettingElement = (props : {name : string, value : string, toggle? : boolean, button? : boolean, callback?, warning? : boolean }) => {
    const {name, value, toggle = false, button = false, callback, warning} = props;
    return (
        <div className={'setting-element'} style={warning ? {background: 'rgba(255,0,0,0.1)'} : {}}>
            <p style={{color: 'var(--secondary-colour)'}}>{name}</p>
            {button && <button style={warning ? {borderColor: 'red', color: 'red'} : {}} onClick={callback} className={'std-button'}>{value}</button>}
            {!button && !toggle && <p>{value}</p>}
        </div>
    )
}


export const Settings = () => {
    const [user, setUser] = useState(null);
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        async function retrieveData(){
            const user_id = await retrieveLoggedUserID();
            const promises = [
                retrieveUser(user_id).then(u => {
                    setUser(u);
                }),
                retrieveSettings(user_id).then(s => {
                    setSettings(s);
                })
            ]
            await Promise.all(promises);
        }

        retrieveData();
    }, [])

    const invertProfilePrivacy = () => {
        const new_settings = {...settings, public: !settings.public};
        setSettings(new_settings);
        changeSettings(user.user_id, new_settings);
    }

    const handleDeleteUser = () => {
        deleteUser(user.user_id).then(() => {
            if ('caches' in window) {
                caches.delete('userIDCache').then(success => {
                    if (success) {
                        console.log(`Cache userIDCache has been cleared.`);
                    } else {
                        console.log(`Cache userIDCache does not exist.`);
                    }
                })
            }
            window.localStorage.clear();
            window.location.href = '/';
        });
    }

    return user && settings && (
        <div>
            <h2>Settings</h2>
            <h3>Your account</h3>
            <SettingElement name={'Username'} value={user.username} />
            <SettingElement name={'UserID'} value={user.user_id} />
            <SettingElement name={'Profile created'} value={(new Date(user.created)).toDateString()} />
            <h3>Privacy</h3>
            <SettingElement name={'Profile visibility'} value={settings.public ? 'Public' : 'Private'} button callback={invertProfilePrivacy} />
            <SettingElement name={'Delete profile'} value={'Delete'} button warning callback={handleDeleteUser} />
        </div>
    )
}

