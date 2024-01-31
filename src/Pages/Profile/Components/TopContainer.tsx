import React, {useState} from "react";
import {isLoggedIn} from "@tools/users";
import {UserContainer} from "./UserContainer";

function TopContainer(props) {
    const {
        pageUser,
        followers,
        isLoggedUserFollowing,
        isOwnPage,
        loggedUserID,
        longTermDP,
        terms,
        setTermIndex,
        termIndex
    } = props;

    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    window.addEventListener("resize", () => setWindowWidth(window.innerWidth));

    return (
        <div>
<           UserContainer {...{windowWidth, pageUser, followers, isLoggedUserFollowing, isOwnPage, loggedUserID, longTermDP}} />
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                marginTop: '25px',
                width: '100%',
                alignItems: 'left',
                gap: '15px'
            }}>
                <TermSelection terms={terms} termIndex={termIndex} setTermIndex={setTermIndex}/>
                {!isOwnPage && isLoggedIn() && windowWidth > 700 &&
                    <ComparisonLink pageUser={pageUser} loggedUserID={loggedUserID} longTermDP={longTermDP}/>
                }
            </div>
        </div>
    );
}