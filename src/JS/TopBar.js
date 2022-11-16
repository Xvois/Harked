import React from 'react';
import OutlinedInput from '@mui/material/OutlinedInput';
import './../CSS/TopBar.css';
import { ClickAwayListener, FormControl, Input, InputAdornment, InputLabel, TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';
import { alpha, styled } from '@mui/material/styles';
import { getAllUsers } from './API';
import { useEffect, useState } from 'react';

const SearchBar = styled(TextField)({
  '& label.Mui-focused': {
    color: '#22C55E',
  },
  '& .MuiInput-underline': {
    color: `white`,
  },
  '& .MuiFormLabel-root.Mui-disabled': {
    color: `white`,
  },
  '& .MuiInput-underline:after': {
    borderBottomColor: '#22C55E',
  },
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: 'white',
    },
    '&:hover fieldset': {
      borderColor: 'white',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#22C55E',
    },
  },
  '& label.Mui-focused': {
    color: 'white',
  },
  '& label.Mui': {
      color: 'white',
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
          <a className='element' href='/'><HomeIcon fontSize='large'/><p>Home</p></a>
          <a className='element' href='profile#me'><PersonIcon fontSize='large'/><p>Your profile</p></a>
          <div>
            <ClickAwayListener onClickAway={handleClickAway}>
              <FormControl variant="standard">
                <SearchBar className='search-bar' inputProps={{className: `search-label`}} onChange={handleChange} label="Search" startAdornment={<InputAdornment position="start"><SearchIcon color='white'/></InputAdornment>}></SearchBar>
              </FormControl>
            </ClickAwayListener>
            {searchResults !== null ?
              <div id="result">
              {searchResults.map(function (user) {
                return <a href={`profile#${user.user_id}`}><img src={user.picture_url}></img>{user.username.length > 14 ? user.username.slice(0,14) + "..." : user.username}</a> })
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