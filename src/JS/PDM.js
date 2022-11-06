
import { getDatapoint, postDatapoint, fetchData, postUser, getUser } from "./API";

export const parseSong = function(song){ //takes in the song item
    if(!song){return;}
    let tempSong = song.name + " -";
    song.artists.forEach(function(element, i){ //add commas for songs with multiple artists
        tempSong +=  " " + element.name;
        if(i !== (song.artists).length - 1){ tempSong += ","; } //stop adding commas if we are one before the end
    })
    return tempSong;
}
export const retrieveUser = async function(userID){
    let user = {
    userID: '',
    username: '',
    profilePicture: '',
    media: '',
    }
    // Are we retrieving ourself?
    if(userID === 'me'){
        // Resolve the relative userID
        // into a global userID (will always be a valid Spotify ID)
        let globalUserID;
        await fetchData('me').then(result => globalUserID = result.id)
        user.userID = globalUserID;
        await getUser(globalUserID).then(result => user = result);
        // Update the player
        // TODO: FIX THIS! THIS TAKES SO LONG!!!
        await fetchData("me/player").then(result => user.media = parseSong(result.item));
    }else{
        // Get the user if they are not ourself
        await getUser(userID).then(result => user = result);
    }
    return user;
}

export const resolveUsername = async function(userID){
    let username;
    await getUser(userID).then(user =>
        username = user.username
    )
    return username;
    
}

export const postLoggedUser = async function(){
    // Get our global userID
    var globalUserID;
    await fetchData("me").then(function(result){globalUserID = result.id})
    let user = {
        userID: globalUserID,
        username: '',
        profilePicture: '',
        media: null,
    }
    // Get the profile details
    let profilePromise = fetchData("me").then(function(result){
        user.username = result.display_name;
        user.profilePicture = result.images[0].url; //TODO: ADD CHECK FOR IF THEY DON'T HAVE PFP
    })
    await profilePromise;
    postUser(user);
}

export const retrieveDatapoint = async function(userID, term){
    var currDatapoint;
    let globalUserID = userID;
    if(globalUserID === 'me'){await fetchData('me').then(result => globalUserID = result.id)}
    await getDatapoint(globalUserID, term).then(function(result){
        currDatapoint = result;
    }).catch(err => console.warn(err))
    if(!currDatapoint){
        await hydrateDatapoints(globalUserID);
        currDatapoint = await getDatapoint(globalUserID, term);
    }
    return currDatapoint;
}

export const fillDatabase = async function(){
    let songs;
    let analytics;
    let analyticsIDs= "";
    let artistIDs = "";
    let artists;
    await fetchData("recommendations?limit=100&seed_artists=1WgXqy2Dd70QQOU7Ay074N&seed_genres=pop&seed_tracks=6VE2tx7tI90I7F138f5cCR").then(result =>{
        songs = result.tracks
    });
    // Concatenate the strings so they can be 
    // used in the analytics call
    songs.forEach(function (song, i){
        analyticsIDs += song.id + ','; 
        if(i < 49){artistIDs += song.artists[0].id + ',';}
    })
    await fetchData(`audio-features?ids=${analyticsIDs}`).then(function(result) { analytics = result.audio_features })
    await fetchData(`artists?ids=2${artistIDs.slice(0,-1)}`).then(result => artists = result.artists);
    // BUG WITH SPOTIFY GET ARTISTS
    // THE FIRST VALUE IS ALWAYS NULL
    // THIS FIXED IT
    await fetchData(`artists/${songs[0].artists[0].id}`).then(result => artists[0] = result);
    for(let i = 0; i < 100; i++){
        console.time("Creating user: ")
        const data = createFauxUser(songs, analytics, artists);
        await postUser(data.user);
        for(const datapoint of data.datapoints){
            await postDatapoint(datapoint);
        }
        console.timeEnd("Creating user: ")
    }
}

const createFauxUser = function(songs, analytics, artists){
    let userID = '';
    let username = '';
    let datapoints = []
    for(let i = 0; i < 20; i++){
        // Get capital letters
        userID += String.fromCharCode(Math.floor(Math.random()*25) + 65);
        username += String.fromCharCode(Math.floor(Math.random()*25) + 65);
    }
    let user = {
        userID: userID,
        username: username,
        // Twitter default profile picture
        profilePicture: 'https://i0.wp.com/www.alphr.com/wp-content/uploads/2020/10/twitter.png?w=690&ssl=1',
        media: null,
    }
    const terms = ['short_term', 'medium_term', 'long_term'];
    for(const term of terms){
        let datapoint = {
            userID: userID,
            collectionDate: Date.now(),
            term: term,
            topSongs: [],
            topArtists: [],
            topGenres: [],
        }
        let usedSongSeeds = [];
        do{
            let songSeed = Math.floor(Math.random()*songs.length);
            if(!usedSongSeeds.includes(songSeed)){
                datapoint.topSongs.push({
                    song_id: songs[songSeed].id,
                    song: true,
                    name: parseSong(songs[songSeed]),
                    title: songs[songSeed].name,
                    artist: songs[songSeed].artists[0].name,
                    image: songs[songSeed].album.images[1].url, 
                    link: songs[songSeed].external_urls.spotify,
                    analytics: analytics[songSeed]
                })
                usedSongSeeds.push(songSeed)
            }
        }while(usedSongSeeds.length < 50)
        let usedArtistSeeds = [];
        do{
            let artistSeed = Math.floor(Math.random()*artists.length);
            if(!usedArtistSeeds.includes(artistSeed)){
                try{datapoint.topArtists.push({
                    artist_id: artists[artistSeed].id,
                    artist: true,
                    name: artists[artistSeed].name, 
                    image: artists[artistSeed].images[1].url, 
                    link: `https://open.spotify.com/artist/${artists[artistSeed].id}`,
                    genre: artists[artistSeed].genres[0]
                })}catch(error){ //catch error when artist does not have PFP
                    console.warn(error)
                }
                usedArtistSeeds.push(artistSeed)
            }
        }while(usedArtistSeeds.length < 20)
        datapoint.topGenres = calculateTopGenres(artists);
        datapoints.push(datapoint)
    }
    return {
        user: user,
        datapoints: datapoints
    };
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