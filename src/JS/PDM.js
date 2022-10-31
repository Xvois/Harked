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
//TODO: updateCachedUser needs a refactor
export const updateCachedUser = async function(userID){
    if(userID === "me"){ //if we are on the logged in user's page
        cachedUser.userID = userID;
        let profilePromise = fetchData("me").then(function(result){ //get profile details
            cachedUser.username = result.display_name;
            cachedUser.profilePicture = result.images[0].url; //TODO: ADD CHECK FOR IF THEY DON'T HAVE PFP
        })
        let mediaPromise = fetchData("me/player").then(function(result){ //get media details
            cachedUser.media = parseSong(result.item)
        })
        await profilePromise;
        await mediaPromise;
    }else if (userID !== cachedUser.userID){
        cachedUser.userID = userID;
        await fetchData(`users/${userID}`).then(function(result){ //if we are not, get their details
            cachedUser.profilePicture = result.images[0].url
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
        collectionDate: Date.now(),
        term: term,
        topSongs: [],
        topArtists: [],
        topGenres: [],
    }
    if(userID === "me"){
        let topTracks;
        let topArtists;
        let analyticsIDs = "";
        let analytics;
        let promises = [fetchData(`me/top/tracks?time_range=${term}&limit=50`), fetchData(`me/top/artists?time_range=${term}`)];
        await Promise.all(promises).then(function(result){
            topTracks = result[0].items;
            topArtists = result[1].items;
        })
        topTracks.forEach(track => analyticsIDs += track.id + ',')
        await fetchData(`audio-features?ids=${analyticsIDs}`).then(function(result) { analytics = result.audio_features })
        for(let i = 0; i < topTracks.length; i++){
            datapoint.topSongs.push({
                id: topTracks[i].id,
                song: true,
                name: parseSong(topTracks[i]),
                title: topTracks[i].name,
                artist: topTracks[i].artists[0].name,
                image: topTracks[i].album.images[1].url, 
                link: topTracks[i].external_urls.spotify,
                analytics: analytics[i]
            })
        }
        for(let i = 0; i < topArtists.length; i++){
            try{datapoint.topArtists.push({
                id: topArtists[i].id,
                artist: true,
                name: topArtists[i].name, 
                image: topArtists[i].images[1].url, 
                link: `https://open.spotify.com/artist/${topArtists[i].id}`,
                genre: topArtists[i].genres[0]
            })}catch(error){ //catch error when artist does not have PFP
                console.warn(error)
            }
        }
        datapoint.topGenres = calculateTopGenres(topArtists);
    }else{
        //TODO: LATER CODE FOR INTERACTING WITH DATABASE
    }
    return datapoint;
}

const calculateTopGenres = function(artists){
    let topGenres = [];
    artists.forEach(function(artist, i){
        artist.genres.forEach(function(genre){
            if(topGenres.some(e => e.genre === genre)){ //is genre already in array?
                var index = topGenres.map(function(e){ return e.genre }).indexOf(genre); //get index
                topGenres[index].weight += artists.length - i; //combine weights
            }else{
                topGenres.push({genre: genre, weight: artists.length - i})
            }
        })
    })
    topGenres.sort((a,b) => b.weight - a.weight) //sort based on weight diffs
    return topGenres;
}