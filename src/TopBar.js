import React from 'react';
import './TopBar.css';


const TopBar = () => {
  return (
    <header className="header">
        <div className = "element-container">
          <a className='element' href='/'>Home</a>
          <a className='element' href='profile#me'>Profile</a>
          <a className='element' href='search'>Search</a>
        </div>
    </header>
  )
}

export default TopBar