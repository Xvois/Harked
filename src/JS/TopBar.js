// noinspection HtmlUnknownAnchorTarget

import React, {useState} from 'react';
import './../CSS/TopBar.css';
import Search from "./Search"
import {isLoggedIn} from "./HDM.ts";
import {BlurOn} from "@mui/icons-material";
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import {handleAlternateLogin} from "./Authentication";

const RedirectElement = (props) => {
    const {title, href, requiresLogIn = false, requiresLogOut = false, callback = null} = props;

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

    const redirects =
        [
            {title: 'Profile', href: '/profile/me', requiresLogIn: true},
            {title: 'Reviews', href: '/reviews/me', requiresLogIn: true},
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


    return (
        <header className='header-pin'>
            <div className="header" style={(windowWidth < 700) ? {background: 'var(--bg-colour)'} : {}}>
                <div>
                    {(windowWidth > 700) ?
                        <div className={'element-container'}>
                            <a id='logo' href={'/'}>
                                <BlurOn fontSize={'large'}/>
                            </a>
                            {
                                redirects.map(r => {
                                    return <RedirectElement key={r.title} {...r} />
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
                                        setIsMenuOpen(state => !state)
                                    }}>
                                {!isMenuOpen && <MenuIcon fontSize={'medium'}/>}
                                {isMenuOpen && <CloseIcon fontSize={'medium'}/>}
                            </button>
                        </div>

                    }
                </div>
                {isMenuOpen && (
                    <>
                        <div className={'expanded-menu-container'}>
                            <div className={'expanded-wrap-box'}>
                                {
                                    redirects.map(r => {
                                        return <RedirectElement key={r.title} {...r} />
                                    })
                                }
                            </div>
                            <Search width={'100%'} showSearchResults/>
                        </div>
                    </>
                )}
            </div>
        </header>
    )
}

export default TopBar