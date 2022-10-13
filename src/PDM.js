import { fetchData } from "./API";

export const cachedUser = {
    username: '',
    profilePicture: '',
    media: false,
}


export const parseSong = function(song){
    let tempSong = song.item.name + " -";
    song.item.artists.forEach(function(element, i){ //add commas for songs with multiple artists
        tempSong +=  " " + element.name;
        if(i !== (song.item.artists).length - 1){ tempSong += ","; } //stop adding commas if we are one before the end
    })
    return tempSong;
}

export const updateCachedUser = async function(userID){
    if(userID === "me"){ //if we are on the logged in user's page
        fetchData("me").then(function(result){ //get profile details
            cachedUser.username = result.display_name;
            cachedUser.profilePicture = result.images[0].url;
        })
        fetchData("me/player").then(function(result){ //get media details
            cachedUser.media = parseSong(result)
        })
    }else{
        fetchData(`users/${userID}`).then(function(result){ //if we are not, get their details
            cachedUser.media = result.images[0].url
            cachedUser.username = result.display_name;
        });
    }
    return true;
}