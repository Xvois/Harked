import React, {useEffect, useState} from 'react';
import {
    followUser,
    isLoggedIn,
    retrieveFollowers,
    retrieveFollowing,
    retrieveLoggedUserID,
    retrieveUser,
    unfollowUser
} from './Tools/HDM.ts';
import './../CSS/Followers.css'

const FollowersComponent = () => {
    const [followers, setFollowers] = useState([]);
    const [targetUser, setTargetUser] = useState(null);
    const [loggedUser, setLoggedUser] = useState(null);
    const [loggedFollowing, setLoggedFollowing] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            let targetUserID = window.location.hash.substr(1);

            const user = await retrieveUser(targetUserID);
            setTargetUser(user);

            const fetchedFollowers = await retrieveFollowers(targetUserID);
            setFollowers(fetchedFollowers);

            if (isLoggedIn()) {
                const user_id = await retrieveLoggedUserID();
                const user = await retrieveUser(user_id);
                setLoggedFollowing(await retrieveFollowing(user_id));
                setLoggedUser(user);
            }
        };

        fetchData();
    }, []);

    const handleFollowClick = async (followerUserID) => {
        if (loggedFollowing.some((followedUser) => followedUser.user_id === followerUserID)) {
            await unfollowUser(loggedUser.user_id, followerUserID);
            setLoggedFollowing((prevFollowing) => prevFollowing.filter((followedUser) => followedUser.user_id !== followerUserID));
        } else {
            await followUser(loggedUser.user_id, followerUserID);
            setLoggedFollowing((prevFollowing) => [...prevFollowing, {user_id: followerUserID}]);
        }
    };

    return (
        <div style={{display: 'flex', flexDirection: 'column'}}>
            <div style={{borderBottom: '1px solid var(--secondary-colour)', marginBottom: '15px'}}>
                <h2 style={{fontSize: '1.5em', marginBottom: '0px'}}>
                    Followers for <a style={{textDecoration: 'none', color: 'var(--primary-colour)'}}
                                     href={targetUser ? `/profile#${targetUser.user_id}` : ''}>{targetUser ? targetUser.username : 'Loading...'}</a>
                </h2>
                <p style={{color: 'var(--secondary-colour)', fontSize: '1.2em', marginBottom: '0', marginTop: '0'}}>
                    {followers.length} follower{followers.length !== 1 ? 's' : ''}
                </p>
            </div>
            {followers.map((follower, index) => (
                <div
                    key={follower.user_id}
                    style={{
                        position: 'relative',
                        padding: '15px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: index === followers.length - 1 ? 'none' : '1px solid var(--accent-colour)'
                    }}
                >
                    {index % 2 === 0 && <div className={'bg-element'}/>}
                    <a
                        href={`/profile#${follower.user_id}`}
                        style={{
                            color: 'var(--primary-colour)',
                            textDecoration: 'none',
                            fontWeight: 'bold',
                            fontSize: '1.1em',
                        }}
                    >
                        {follower.username}
                    </a>
                    {isLoggedIn() && (
                        follower.user_id !== loggedUser?.user_id && loggedUser && (
                            <button className="std-button" onClick={() => handleFollowClick(follower.user_id)}>
                                {loggedFollowing.some((followedUser) => followedUser.user_id === follower.user_id)
                                    ? 'Unfollow'
                                    : 'Follow'}
                            </button>
                        )
                    )}
                </div>
            ))}
        </div>
    );
};

export default FollowersComponent;