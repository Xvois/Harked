import React from 'react';
import OutlinedInput from '@mui/material/OutlinedInput';
import './../CSS/TopBar.css';
import { ClickAwayListener, FormControl, InputAdornment, InputLabel } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { alpha, styled } from '@mui/material/styles';
import { getAllUsers } from './API';
import { useEffect, useState } from 'react';

const SearchBar = styled(OutlinedInput)({
  '&	label.Mui-focused':{
    borderColor: `white`,
  },
  '& .MuiOutlinedInput-root':{
    '& .MuiOutlinedInput fieldset': {
      borderColor: `white`,
    },
  },
  '	.MuiOutlinedInput-input':{
    color: `white`,
  },
  '.MuiOutlinedInput-root':{
    color: `white`,
    borderColor: `green`,
  },
  '& input:valid + fieldset': {
    borderColor: 'white',
    borderWidth: 1,
  },
});


const TopBar = () => {
  const [searchResults, setSearchResults] = useState(null)
  const [cachedUsers, setCachedUsers] = useState(null)

  const Levenshtein = (a, b) => {
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    const arr = [];
    for (let i = 0; i <= b.length; i++) {
      arr[i] = [i];
      for (let j = 1; j <= a.length; j++) {
        arr[i][j] =
          i === 0
            ? j
            : 
            Math.min(
              arr[i - 1][j] + 1,
              arr[i][j - 1] + 1,
              arr[i - 1][j - 1] + (a[j - 1] === b[i - 1] ? 0 : 1)
            );
      }
    }
    return arr[b.length][a.length];
  }

  const handleClickAway = () => {
    setSearchResults(null);
  }

  const handleChange = (event) => {
    let searchParam = event.target.value;
    const usernames = cachedUsers.map(user => user.username);
    let results = [];
    if(searchParam.length > 2){
      usernames.forEach(username => {
        let weight = Levenshtein(searchParam, username)
        if(weight < 7){results.push({username: username, weight: weight})}
      })
      results.sort((a,b) => a.weight - b.weight)
      // Match each username to their user record in the DB
      results.forEach((user,i) =>{
        results[i] = cachedUsers[cachedUsers.findIndex(object => {return object.username === user.username})]
      })
      setSearchResults(results);
    }else{
      setSearchResults(null)
    }
  }

  const updateCachedUsers = async () => {
    await getAllUsers().then(function(result){
      setCachedUsers(result);
    })
  }
  useEffect(() => {
    console.warn("useEffect called!")
    updateCachedUsers();
  }, [])

  return (
    <header className="header">
        <div className = "element-container">
          <a className='element' href='/'>Home</a>
          <a className='element' href='profile#me'>Profile</a>
          <div>
            <ClickAwayListener onClickAway={handleClickAway}>
              <FormControl>
                <InputLabel className='search-label'>Search</InputLabel>
                <SearchBar type="search" className='search-bar' label = "Search" onChange={handleChange} onClick={handleChange}></SearchBar>
              </FormControl>
            </ClickAwayListener>
            {searchResults !== null ?
              <div id="result">
              {searchResults.map(function (user) {
                return <a href={`profile#${user.user_id}`}><img src={user.picture_url}></img>{user.username.length > 7 ? user.username.slice(0,7) + "..." : user.username}</a> })
              }</div>
              :
              <></>
            }
          </div>
        </div>
    </header>
  )
}

export default TopBar