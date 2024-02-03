import React from 'react';
import './CSS/BottomBar.css';

const BottomBar = () => {
    return (
        <div className={'bottom-wrapper'}>
            <div className={'bottom-section'}>
                <h3>Contributing</h3>
                <ul>
                    <li>
                        <a>Test Item</a>
                    </li>
                    <li>
                        <a>Test Item</a>
                    </li>
                </ul>

            </div>
            <div className={'bottom-section'}>
                <h3>Your privacy</h3>
                <ul>
                    <li>
                        <a>Test Item</a>
                    </li>
                    <li>
                        <a>Test Item</a>
                    </li>
                </ul>

            </div>
        </div>
    )
}

export default BottomBar;