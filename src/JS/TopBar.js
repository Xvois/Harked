// noinspection HtmlUnknownAnchorTarget

import React, {useState} from 'react';
import './../CSS/TopBar.css';
import {ClickAwayListener} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import Search from "./Search"
import {isLoggedIn} from "./HDM.ts";

const TopBar = () => {
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [menuExpanded, setMenuExpanded] = useState(false);
    const [sideMenuSearchFocused, setSideMenuSearchFocused] = useState(false);

    const updateSize = () => {
        setWindowWidth(window.innerWidth);
        if (window.innerWidth > 1000) {
            setMenuExpanded(false);
        }
    }
    window.addEventListener("resize", updateSize);

    // noinspection HtmlUnknownAnchorTarget
    return (
        <header className="header">
            {windowWidth > 1000 ?
                <div className="element-container">
                    <a className='element' href='/'><HomeIcon fontSize='large'/><p>Home</p></a>
                    {isLoggedIn() &&
                        (
                            <a className='element' href='profile#me'><PersonIcon fontSize='large'/><p>Your profile</p>
                            </a>
                        )
                    }
                    <ClickAwayListener onClickAway={() => setShowSearchResults(false)}>
                        <div className='element' onClick={() => setShowSearchResults(true)}>
                            <Search showResults={showSearchResults}></Search>
                        </div>
                    </ClickAwayListener>
                </div>
                :
                <div className={"element"} id={"menu"} onClick={() => setMenuExpanded(true)}>
                    <MenuIcon fontSize="large"/>
                    <p>Menu</p>
                </div>
            }
            <div id="expanded-menu" style={menuExpanded ? {} : {opacity: '0', pointerEvents: 'none', display: 'none'}}>
                <div className='menu-element' id={"close-button"} onClick={() => setMenuExpanded(false)}><CloseIcon
                    fontSize="large"/><p>Close</p></div>
                <ClickAwayListener onClickAway={function () {
                    if (sideMenuSearchFocused) {
                        setSideMenuSearchFocused(false);
                        setShowSearchResults(false);
                    }
                }}>
                    <div className='menu-element' onClick={() => {
                        setSideMenuSearchFocused(true);
                        setShowSearchResults(true)
                    }}>
                        <Search showResults={showSearchResults}></Search>
                    </div>
                </ClickAwayListener>
                {!sideMenuSearchFocused ?
                    <>
                        <a className='menu-element' href='/'><HomeIcon fontSize='large'/><p>Home</p></a>
                        <a className='menu-element' href='profile#me'><PersonIcon fontSize='large'/><p>Your profile</p>
                        </a>
                    </>
                    :
                    <></>
                }
            </div>
        </header>
    )
}

export default TopBar