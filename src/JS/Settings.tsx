import {useEffect, useState} from "react";
import {
    changeSettings,
    deleteUser,
    handleCacheReset,
    isLoggedIn,
    retrieveLoggedUserID,
    retrieveSettings,
    retrieveUser
} from "./HDM.ts";
import "./../CSS/Settings.css"
import {PageError} from "./SharedComponents.tsx";


const SettingElement = (props: { name: string, value: string, button?: boolean, callback?, warning?: boolean }) => {
    const {name, value, button = false, callback} = props;
    return (
        <div className={'setting-element'}>
            <p>{name}</p>
            {button &&
                <button onClick={callback} className={'subtle-button'}>{value}</button>}
            {!button && <h4 style={{margin: '0'}}>{value}</h4>}
        </div>
    )
}


export const Settings = () => {
    const [user, setUser] = useState(null);
    const [settings, setSettings] = useState(null);
    const [isError, setIsError] = useState(false);
    const [errorDetails, setErrorDetails] = useState({description: null, errCode: null});

    useEffect(() => {
        async function retrieveData() {
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

        if (isLoggedIn()) {
            retrieveData();
        } else {
            setIsError(true);
            setErrorDetails({description: "Viewing settings requires being logged in."});
        }
    }, [])

    const invertProfilePrivacy = () => {
        const new_settings = {...settings, public: !settings.public};
        setSettings(new_settings);
        changeSettings(user.user_id, new_settings);
    }

    const handleDeleteUser = () => {
        if (window.confirm("Are you sure you want to delete your account?")) {
            deleteUser(user.user_id).then(() => {
                handleCacheReset();
                window.localStorage.clear();
                window.location.href = '/';
            }).catch(err => {
                console.error('Error deleting user: ', err);
            });
        }
    }

    return (
        isError ?
            <PageError description={errorDetails.description} errCode={errorDetails.errCode}/>
            :
            user && settings && (
                <div>
                    <div className={'settings-section'}>
                        <h3>Your account</h3>
                        <p>Details about your account.</p>
                        <SettingElement name={'Username'} value={user.username}/>
                        <SettingElement name={'UserID'} value={user.user_id}/>
                        <SettingElement name={'Profile created'} value={(new Date(user.created)).toDateString()}/>
                    </div>
                    <div className={'settings-section'}>
                        <h3>Privacy</h3>
                        <p>Settings to control your privacy and data.</p>
                        <SettingElement name={'Profile visibility'} value={settings.public ? 'Public' : 'Private'} button
                                        callback={invertProfilePrivacy}/>
                        <SettingElement name={'Delete profile'} value={'Delete'} button warning
                                        callback={handleDeleteUser}/>
                    </div>
                </div>
            )
    )
}

