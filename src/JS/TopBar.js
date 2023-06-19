// noinspection HtmlUnknownAnchorTarget

import React, {useEffect, useState} from 'react';
import './../CSS/TopBar.css';
import PersonIcon from '@mui/icons-material/Person';
import Search from "./Search"
import {isLoggedIn} from "./HDM.ts";
import {BlurOn, Settings} from "@mui/icons-material";

const RedirectElement = (props) => {
    const {title, href, icon, requiresLogIn = false} = props;
    return (((requiresLogIn && isLoggedIn()) || !requiresLogIn) &&
        <a className={'redirect-element'} href={href} >
            {icon}
            <p>{title}</p>
        </a>
    )
}

const TopBar = () => {
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [showBar, setShowBar] = useState(true);
    const [showBorder, setShowBorder] = useState(false);

    useEffect(() => {
        if(!window.pageYOffset){
            setShowBorder(true);
        }else{
            if(showBar){
                setShowBorder(false);
            }
        }
    }, [])

    const redirects =
        [
            {title: 'Profile', href: '/profile#me', icon: <PersonIcon fontSize={'medium'} />, requiresLogIn: true},
            {title: 'Settings', href: '/settings', icon: <Settings fontSize={'medium'} />, requiresLogIn: true}
        ]

    const updateSize = () => {
        setWindowWidth(window.innerWidth);
    }
    window.addEventListener("resize", updateSize);

    window.onscroll = function(e) {
        // Show the bar if scrolling up or if at the top of the page
        if(this.oldScroll > this.scrollY && document.body.scrollHeight > window.innerHeight){
            if(!showBar){
                setShowBar(true);
            }
        }else{
            if(showBar){
                setShowBar(false);
            }
        }

        if(window.pageYOffset <= 75){
            setShowBorder(true);
        }else{
            if(showBar){
                setShowBorder(false);
            }
        }

        this.oldScroll = this.scrollY;
    }

    // noinspection HtmlUnknownAnchorTarget
    return (
        <header className="header" style={showBar ? (showBorder  ? {height: '75px', borderBottom: '1px solid var(--bg-colour)'} : {height: '75px'})  : {height: '0px', opacity: '0', overflow: 'hidden'}}>
            <div className={'element-container'}>
                <a id='logo' href={'/'}>
                    <BlurOn fontSize={'large'} />
                    <h1>Harked</h1>
                </a>
                {redirects.map(e => {
                    return <RedirectElement title={e.title} href={e.href} icon={e.icon} requiresLogIn={e.requiresLogIn} />
                })}
                <Search showSearchResults={true} />
            </div>
        </header>
    )
}

export default TopBar