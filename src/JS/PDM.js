
import { getDatapoint, postDatapoint, fetchData, postUser, getUser } from "./API";

// TODO: REPLACE ALL OF THE GLOBAL USERID CONVERSIONS TO SIMPLY ACCESS A CONSTANT
// OF THE LOGGED IN USER'S

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
export const retrieveUser = async function(userID){
    if(userID === 'me'){
        if(cachedUser.userID !== 'me'){
            await updateCachedUser(userID);
        }
        await updateMedia();
    }else{
        if(cachedUser.userID !== userID){
            await updateCachedUser(userID);
        }
    }
    return cachedUser;
}

export const updateCachedUser = async function(userID){
    // Convert "me" into the user's userID if needed.
    var globalUserID;
    if(userID === "me"){await fetchData(userID).then(function(result){globalUserID = result.id})}else{globalUserID = userID}
    await getUser(globalUserID).then(function(user){cachedUser = user});
}

export const updateMedia = async function(){
    await fetchData("me/player").then(function(result){ //get media details
        cachedUser.media = parseSong(result.item)
    })
}

export const postLoggedUser = async function(){
    // Convert "me" into the user's userID if needed.
    var globalUserID;
    await fetchData("me").then(function(result){globalUserID = result.id})
    let user = {
        userID: globalUserID,
        username: '',
        profilePicture: '',
        media: null,
    }
    let profilePromise = fetchData("me").then(function(result){ //get profile details
        user.username = result.display_name;
        user.profilePicture = result.images[0].url; //TODO: ADD CHECK FOR IF THEY DON'T HAVE PFP
    })
    await profilePromise;
    postUser(user);
}

export const retrieveDatapoint = async function(userID, term){
    var globalUserID;
    var currDatapoint;
    // Convert "me" into the user's userID if needed.
    if(userID === "me"){await fetchData(userID).then(function(result){globalUserID = result.id})}else{globalUserID = userID}
    await getDatapoint(globalUserID, term).then(function(result){
        currDatapoint = result;
    })
    if(!currDatapoint){
        await hydrateDatapoints(globalUserID);
        await getDatapoint(globalUserID, term);
    }
    return currDatapoint;
}
// Update all of the datapoints for the logged in user
// with the parameter being their global user id.
export const hydrateDatapoints = async function(globalUserID){
    console.warn("Hydrating...");
    const terms = ['short_term', 'medium_term', 'long_term'];
    for(const term of terms){
        console.warn("Hydrating: "+ term)
        let datapoint = {
            userID: globalUserID,
            collectionDate: Date.now(),
            term: term,
            topSongs: [],
            topArtists: [],
            topGenres: [],
        }
        let topTracks;
        let topArtists;
        let analyticsIDs = "";
        let analytics;
        // Queue up promises
        let promises = [await fetchData(`me/top/tracks?time_range=${term}&limit=50`), await fetchData(`me/top/artists?time_range=${term}`)];
        // Await the promises for the arrays of data
        await Promise.all(promises).then(function(result){
            topTracks = result[0].items;
            topArtists = result[1].items;
        })
        // Concatenate the strings so they can be 
        // used in the analytics call
        topTracks.forEach(track => analyticsIDs += track.id + ',')
        await fetchData(`audio-features?ids=${analyticsIDs}`).then(function(result) { analytics = result.audio_features })
        // Add all of the songs
        for(let i = 0; i < topTracks.length; i++){
            datapoint.topSongs.push({
                song_id: topTracks[i].id,
                song: true,
                name: parseSong(topTracks[i]),
                title: topTracks[i].name,
                artist: topTracks[i].artists[0].name,
                image: topTracks[i].album.images[1].url, 
                link: topTracks[i].external_urls.spotify,
                analytics: analytics[i]
            })
        }
        // Add all of the artists
        for(let i = 0; i < topArtists.length; i++){
            try{datapoint.topArtists.push({
                artist_id: topArtists[i].id,
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
        await postDatapoint(datapoint).then(console.log(term + " success!"));
    }
    console.warn("Hydration over.")
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
    // DECONSTRUCTS THE OBJECT OF A GENRE TO SIMPLY BE A STRING:
    topGenres.forEach((genre, i) => topGenres[i] = genre.genre)
    // LOOKS INSANE BUT A GENRE IN THIS FUNCTION IS AN OBJECT OF ITS NAME
    // AND WEIGHT. THAT LINE SIMPLY TURNS IT FROM AN OBJECT INTO A STRING
    return topGenres;
}