// noinspection HtmlUnknownAnchorTarget

import React, {useEffect, useState} from 'react';
import './../CSS/TopBar.css';
import Search from "./Search"
import {isLoggedIn} from "./HDM.ts";
import {BlurOn} from "@mui/icons-material";
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import {handleAlternateLogin} from "./Authentication";

const RedirectElement = (props) => {
    const {title, href, icon, requiresLogIn = false, requiresLogOut = false, concise = false, callback = null} = props;
    const [loggedIn, setLoggedIn] = useState(isLoggedIn());

    const link = (
        <a className={'subtle-button'} href={href}>
            {title}
        </a>
    );
    const button = (
        <button className={'subtle-button'}>
            {title}
        </button>
    );
    const element = callback !== null ? button : link;
    return (
        requiresLogIn ?
            (
                isLoggedIn() ?
                    element
                    :
                    <></>
            )
            :
            (
                requiresLogOut ?
                    (
                        !isLoggedIn() ?
                            element
                            :
                            <></>
                    )
                    :
                    element
            )
    )
}

const TopBar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [showBar, setShowBar] = useState(true);
    const [showBorder, setShowBorder] = useState(false);

    const ShowBarStyle = (showBorder ? {borderBottom: 'none'} : {})
    const HideBarStyle = {height: '0px', opacity: '0', overflow: 'hidden', pointerEvents: 'none'};
    const OpenMenuStyle = {...ShowBarStyle, height: '100vh', background: 'var(--bg-colour)'}

    useEffect(() => {
        if (!window.pageYOffset) {
            setShowBorder(true);
        } else {
            if (showBar) {
                setShowBorder(false);
            }
        }
    }, [])

    const redirects =
        [
            {title: 'Profile', href: '/profile/me', requiresLogIn: true},
            {title: 'Feed', href: '/feed', requiresLogIn: true},
            {title: 'Settings', href: '/settings', requiresLogIn: true},
            {
                title: 'Login',
                callback: handleAlternateLogin,
                requiresLogOut: true
            }
        ]

    const updateSize = () => {
        setWindowWidth(window.innerWidth);
        if (window.innerWidth > 700 && isMenuOpen) {
            setIsMenuOpen(false);
        }
    }
    window.addEventListener("resize", updateSize);

    window.onscroll = function (e) {
        // Show the bar if scrolling up or if at the top of the page
        if (this.oldScroll > this.scrollY && document.body.scrollHeight > window.innerHeight) {
            if (!showBar) {
                setShowBar(true);
            }
        } else {
            if (showBar && window.pageYOffset >= 77) {
                setShowBar(false);
            }
        }

        if (window.pageYOffset <= 77 && !isMenuOpen) {
            setShowBorder(true);
        } else {
            if (showBar) {
                setShowBorder(false);
            }
        }

        this.oldScroll = this.scrollY;
    }

    return (
        <header className='header-pin'>
            <div className="header" style={
                isMenuOpen ?
                    (OpenMenuStyle)
                    :
                    (showBar ? ShowBarStyle : HideBarStyle)
            }>
                <div>
                    {(windowWidth > 700) ?
                        <div className={'element-container'}>
                            <a id='logo' href={'/'}>
                                <BlurOn fontSize={'large'}/>
                                <h1 style={{margin: '0'}}>Harked</h1>
                            </a>
                            {
                                redirects.map(e => {
                                    return <RedirectElement callback={e.callback} requiresLogOut={e.requiresLogOut}
                                                            key={e.title} concise title={e.title} href={e.href}
                                                            icon={e.icon} requiresLogIn={e.requiresLogIn}/>
                                })
                            }
                            <Search showSearchResults/>
                        </div>
                        :
                        <div style={{
                            alignItems: 'center',
                            display: 'flex',
                            flexDirection: 'row',
                            width: '100%',
                            height: '100%',
                            justifyContent: 'space-between'
                        }}>
                            <a id='logo' href={'/'}>
                                <BlurOn fontSize={'large'}/>
                            </a>
                            <button style={{border: 'none', background: 'none', color: 'var(--primary-colour)'}}
                                    onClick={() => {
                                        const state = isMenuOpen;
                                        setIsMenuOpen(!state)
                                    }}>
                                {!isMenuOpen && <MenuIcon fontSize={'medium'}/>}
                                {isMenuOpen && <CloseIcon fontSize={'medium'}/>}
                            </button>
                        </div>

                    }
                </div>
                {isMenuOpen && (
                    <>
                        <h1 style={{margin: '20px auto 0 auto'}}>Menu</h1>
                        <div className={'expanded-menu-container'}>
                            {
                                redirects.map(e => {
                                    return <RedirectElement callback={e.callback} requiresLogOut={e.requiresLogOut}
                                                            key={e.title} title={e.title} href={e.href} icon={e.icon}
                                                            requiresLogIn={e.requiresLogIn}/>
                                })
                            }
                            <Search width={'100%'} showSearchResults/>
                        </div>
                    </>
                )}
            </div>
        </header>
    )
}

export default TopBar