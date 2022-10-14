import { useState } from "react";
import { fetchData } from "./API";

let cachedUser = {
    userID: '',
    username: '',
    profilePicture: '',
    media: '',
}


export const parseSong = function(song){ //takes in the song item
    if(!song){ cachedUser.media = false; return; }
    let tempSong = song.name + " -";
    song.artists.forEach(function(element, i){ //add commas for songs with multiple artists
        tempSong +=  " " + element.name;
        if(i !== (song.artists).length - 1){ tempSong += ","; } //stop adding commas if we are one before the end
    })
    return tempSong;
}

export const updateCachedUser = async function(userID){
    if(userID === "me"){ //if we are on the logged in user's page
        cachedUser.userID = userID;
        await fetchData("me").then(function(result){ //get profile details
            cachedUser.username = result.display_name;
            cachedUser.profilePicture = result.images[0].url; //TODO: ADD CHECK FOR IF THEY DON'T HAVE PFP
        })
        await fetchData("me/player").then(function(result){ //get media details
            cachedUser.media = parseSong(result.item)
        })
    }else if (userID !== cachedUser.userID){
        cachedUser.userID = userID;
        await fetchData(`users/${userID}`).then(function(result){ //if we are not, get their details
            cachedUser.media = result.images[0].url
            cachedUser.username = result.display_name;
        });
    }else{ //if the user is already cached, just update their play status
        await fetchData("me/player").then(function(result){ //get media details
            cachedUser.media = parseSong(result)
        })
    }
    return cachedUser;
}

export const getDatapoint = async function(userID, term){
    let datapoint = {
        topSongs: [],
        topArtists: [],
        topGenres: [],
    }
    if(userID === "me"){
        let topTracks;
        await fetchData(`me/top/tracks?time_range=${term}`).then(function(result){ topTracks = result.items });
        for(let i = 0; i < 3; i++){
            datapoint.topSongs.push({
                song: true,
                name: parseSong(topTracks[i]),
                title: topTracks[i].name,
                artist: topTracks[i].artists[0].name,
                image: topTracks[i].album.images[1].url, 
                link: topTracks[i].external_urls.spotify,
            })
        }
        let topArtists;
        await fetchData(`me/top/artists?time_range=${term}`).then(function(result){ topArtists = result.items })
        for(let i = 0; i < 3; i++){
            datapoint.topArtists.push({
                artist: true,
                name: topArtists[i].name, 
                image: topArtists[i].images[1].url, 
                link: `https://open.spotify.com/artist/${topArtists[i].id}`,
                genre: topArtists[i].genres[0]
            })
        }
        datapoint.topGenres = calculateTopGenres(topArtists);
    }else{
        //LATER CODE FOR INTERACTING WITH DATABASE
    }
    return datapoint;
}

const calculateTopGenres = function(artists){
    let topGenres = [];
    artists.forEach(function(artist, i){
        artist.genres.forEach(function(genre){
            if(topGenres.some(e => e.genre === genre)){ //is genre already in array?
                var index = topGenres.map(function(e){ return e.genre }).indexOf(genre); //get index
                topGenres[index].weight += artists.length - i; //combine wieghts
            }else{
                topGenres.push({genre: genre, weight: artists.length - i})
            }
        })
    })
    topGenres.sort((a,b) => b.weight - a.weight) //sort based on weight diffs
    return topGenres;
}