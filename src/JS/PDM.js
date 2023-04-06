import {
    deleteData,
    deleteUser,
    fetchData,
    getAllUserIDs,
    getDatapoint, getPlaylists,
    getUser,
    postDatapoint, postMultiplePlaylists, postPlaylist,
    postUser,
    putData
} from "./API";

/**
 * Creates a combined song name with the associated artists in the form
 * SONG - ARTIST_1, ARTIST_2, ...
 * from a song object.
 * @param song A song object.
 * @returns {string|null} A full song name.
 */
export const parseSong = function (song) { //takes in the song item
    if (!song) {
        return null;
    }
    let tempSong = song.name + " -";
    song.artists.forEach(function (element, i) { //add commas for songs with multiple artists
        tempSong += " " + element.name;
        if (i !== (song.artists).length - 1) {
            tempSong += ",";
        } //stop adding commas if we are one before the end
    })
    return tempSong;
}
/**
 * Returns a media object containing the content (if any) the logged-in user is listening to.
 * @returns {Promise<{name: string, image: string}>}
 */
export const retrieveMedia = async function () {
    let returnMedia;
    await fetchData("me/player").then(function (result) {
        if (result) {
            // Update the user's media information with the current song and album image
            returnMedia = {name: parseSong(result.item), image: result.item.album.images[0].url}
        }
    })
    return returnMedia;
}

/**
 * Gets a user from the PRDB as well as updating the media attribute for the
 * current user, if that is the parameter.
 * @param user_id A local user_id.
 * @returns {Promise<{profilePicture: string, media: {image: string, name: string}, user_id: string, username: string}>} A user object.
 */
export const retrieveUser = async function (user_id) {
    let user = {
        user_id: '',
        username: '',
        profile_picture: '',
        media: {name: '', image: ''},
    }
    // Check if we are retrieving the current user
    if (user_id === 'me') {
        // Get the global user ID from local storage
        let globalUser_id = window.localStorage.getItem("user_id");
        user.user_id = globalUser_id;
        // Get the user's profile information from the local database
        await getUser(globalUser_id).then(result => user = result);
    } else {
        // Get the user's profile information from the local database
        await getUser(user_id).then(result => user = result);
    }
    console.log(user);
    return user;
}

/**
 * Makes a put request to the API to follow the argument user from the logged-in user's account.
 * @param user_id
 */
export const followUser = function (user_id) {
    putData(`me/following?type=user&ids=${user_id}`);
}
/**
 * Makes a put request to the API to unfollow the argument user from the logged-in user's account.
 * @param user_id
 */
export const unfollowUser = function (user_id) {
    deleteData(`me/following?type=user&ids=${user_id}`);
}
/**
 * Returns all the user_ids currently in the database.
 * @returns {Promise<[user_id: string]>}
 */
export const retrieveAllUserIDs = async function () {
    let user_ids;
    // Deconstruct the array of objects to just an array
    await getAllUserIDs().then(r => user_ids = r.map(function (id) {
        return id.user_id
    }));
    return user_ids;
}
/**
 * Returns an array of public non-collaborative playlists from a given user.
 * @param user_id
 * @returns {Promise<[]>}
 */
export const retrievePlaylists = async function (user_id) {
    let globalUser_id = user_id;
    if (globalUser_id === 'me') {globalUser_id = window.localStorage.getItem("user_id")}
    return await getPlaylists(globalUser_id);
}

/**
 * Creates / updates the logged-in user's record.
 * @returns {Promise<void>}
 */
export const postLoggedUser = async function () {
    // Get our global user_id
    let globalUser_id = window.localStorage.getItem("user_id");
    let user = {
        user_id: globalUser_id,
        username: '',
        profile_picture: '',
        media: null,
    }
    const playlists = (await fetchData(`users/${globalUser_id}/playlists`)).items;
    // Get the profile details
    let profilePromise = fetchData("me").then(function (result) {
        user.username = result.display_name;
        if (result.images[0]) {
            user.profile_picture = result.images[0].url;
        } else if (result.images[0] === undefined) {
            user.profile_picture = null;
        }
    })
    await profilePromise;
    await postUser(user);
    await postMultiplePlaylists(playlists);
}
/**
 * A boolean function that returns true if the currently logged-in user follows the target and false if not.
 * @param user_id
 * @returns {Promise<*>}
 */
export const followsUser = async function (user_id) {
    const data = await fetchData(`me/following/contains?type=user&ids=${user_id}`);
    return data[0];
}
/**
 * A boolean function for checking whether the session user is logged in or not.
 * @returns {boolean}
 */
export const isLoggedIn = function () {
    return !!(window.localStorage.getItem("user_id") && window.localStorage.getItem("token"));
}

/**
 * Returns a valid datapoint for a given user in a given term.
 * If the function does not get a valid datapoint from the database, it will hydrate the user's datapoints
 * and return a valid one from that selection.
 * @param user_id
 * @param term [short_term, medium_term, long_term]
 * @param delay
 * @returns {Promise<*>} A datapoint object.
 */
export const retrieveDatapoint = async function (user_id, term, delay = 0) {
    let currDatapoint;
    let timeSensitive = false;
    let globalUser_id = user_id;
    // Are we accessing the logged-in user?
    // [Unknowingly]
    if (globalUser_id === window.localStorage.getItem("user_id")) {
        timeSensitive = true
    }
    // [Knowingly]
    else if (globalUser_id === "me") {
        timeSensitive = true;
        globalUser_id = window.localStorage.getItem("user_id");
    }
    await getDatapoint(globalUser_id, term, timeSensitive, delay).then(function (result) {
        currDatapoint = result;
    }).catch(function (err) {
        console.warn("Error retrieving datapoint: ");
        console.warn(err);
    })
    if (!currDatapoint && user_id === 'me') {
        await hydrateDatapoints().then(async () =>
            await getDatapoint(globalUser_id, term, timeSensitive).then(result =>
                currDatapoint = result
            )
        );
    }
    // Turn relation ids into the actual arrays / records themselves using
    // pocketbase's expand property
    currDatapoint.top_artists = currDatapoint.expand.top_artists;
    currDatapoint.top_songs = currDatapoint.expand.top_songs;
    currDatapoint.top_genres = currDatapoint.expand.top_genres.map(e => e.genre);
    currDatapoint.top_artists.map(e => e.genres = e.expand.genres?.map(g => g.genre));
    currDatapoint.top_songs.map(e => e.artists = e.expand.artists);
    currDatapoint.top_songs.map(e => e.artists.map(a => a.genres = a.expand.genres?.map(g => g.genre)));
    // Delete redundant expansions
    delete currDatapoint.expand;
    currDatapoint.top_artists.forEach(e => delete e.expand);
    currDatapoint.top_songs.forEach(e => delete e.expand);
    currDatapoint.top_songs.forEach(e => e.artists.forEach(a => delete a.expand));

    return currDatapoint;
}
/**
 * Retrieves the last previous datapoint instead of the most recent one. False is returned if none exists.
 * @param user_id
 * @param term [short_term, medium_term, long_term]
 * @returns {Promise<*> || false} A datapoint object.
 */
export const retrievePreviousDatapoint = async function (user_id, term) {
    let result;
    let globalUser_id = user_id;
    if (globalUser_id === "me") {
        globalUser_id = window.localStorage.getItem("user_id");
    }
    await getDatapoint(globalUser_id, term, false, 1).then(r => result = r);
    return result;
}
// noinspection JSUnusedGlobalSymbols
/**
 * A testing function that will begin filling the database with faux users.
 * Unless stopped, the function will populate it with 1000 users.
 * @returns {Promise<void>}
 */
export const fillDatabase = async function () {
    let songs;
    let analytics;
    let analyticsIDs = "";
    let artistIDs = "";
    let artists;
    await fetchData("recommendations?limit=100&seed_artists=1WgXqy2Dd70QQOU7Ay074N&seed_genres=pop&seed_tracks=6VE2tx7tI90I7F138f5cCR").then(result => {
        songs = result.tracks
    });
    // Concatenate the strings, so they can be
    // used in the analytics call
    songs.forEach(function (song, i) {
        analyticsIDs += song.id + ',';
        if (i < 49) {
            artistIDs += song.artists[0].id + ',';
        }
    })
    await fetchData(`audio-features?ids=${analyticsIDs}`).then(function (result) {
        analytics = result.audio_features
    })
    await fetchData(`artists?ids=2${artistIDs.slice(0, -1)}`).then(result => artists = result.artists);
    // BUG WITH SPOTIFY GET ARTISTS
    // THE FIRST VALUE IS ALWAYS NULL
    // THIS FIXED IT ^^
    await fetchData(`artists/${songs[0].artists[0].id}`).then(result => artists[0] = result);
    for (let i = 0; i < 1000; i++) {
        console.time("Creating user")
        const data = createFauxUser(songs, analytics, artists);
        await postUser(data.user);
        for (const datapoint of data.datapoints) {
            await postDatapoint(datapoint);
        }
        console.timeEnd("Creating user")
    }
}
/**
 * Creates a faux user with their datapoints that will be added to the
 * @param songs
 * @param analytics
 * @param artists
 * @returns {{datapoints: *[], user: {profilePicture: string, media: null, user_id: string, username: string}}}
 */
const createFauxUser = function (songs, analytics, artists) {
    let user_id = '';
    let username = '';
    let datapoints = []
    for (let i = 0; i < 20; i++) {
        // Get capital letters
        user_id += String.fromCharCode(Math.floor(Math.random() * 25) + 65);
        username += String.fromCharCode(Math.floor(Math.random() * 25) + 65);
    }
    let user = {
        user_id: user_id,
        username: username,
        // Twitter default profile picture
        profilePicture: 'https://i0.wp.com/www.alphr.com/wp-content/uploads/2020/10/twitter.png?w=690&ssl=1',
        media: null,
    }
    const terms = ['short_term', 'medium_term', 'long_term'];
    terms.forEach(function (term) {
        let datapoint = {
            user_id: user_id,
            collectionDate: Date.now(),
            term: term,
            topSongs: [],
            topArtists: [],
            topGenres: [],
        }
        let usedSongSeeds = [];
        do {
            let songSeed = Math.floor(Math.random() * songs.length);
            if (!usedSongSeeds.includes(songSeed)) {
                datapoint.topSongs.push({
                    song_id: songs[songSeed].id,
                    title: songs[songSeed].name,
                    artist: songs[songSeed].artists[0].name,
                    image: songs[songSeed].album.images[1].url,
                    link: songs[songSeed].external_urls.spotify,
                    analytics: analytics[songSeed]
                })
                usedSongSeeds.push(songSeed)
            }
        } while (usedSongSeeds.length < 50)
        let usedArtistSeeds = [];
        do {
            let artistSeed = Math.floor(Math.random() * artists.length);
            if (!usedArtistSeeds.includes(artistSeed)) {
                try {
                    datapoint.topArtists.push({
                        artist_id: artists[artistSeed].id,
                        name: artists[artistSeed].name,
                        image: artists[artistSeed].images[1].url,
                        link: `https://open.spotify.com/artist/${artists[artistSeed].id}`,
                        genre: artists[artistSeed].genres[0]
                    })
                } catch (error) { //catch error when artist does not have PFP
                    console.warn(error)
                }
                usedArtistSeeds.push(artistSeed)
            }
        } while (usedArtistSeeds.length < 20)
        datapoint.topGenres = calculateTopGenres(artists);
        datapoints.push(datapoint)
    })
    return {
        user: user,
        datapoints: datapoints
    };
}

function chunks(array, size) {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
    }
    return result;
}

export const batchAnalytics = async (songs) => {
    const songChunks = chunks(songs, 50);
    const analytics = [];
    for (const chunk of songChunks) {
        const songIDs = chunk.map(song => song.song_id).join(',');
        const result = await fetchData(`audio-features?ids=${songIDs}`);
        analytics.push(...result.audio_features);
    }
    return analytics;
};

// noinspection JSUnusedGlobalSymbols
export const deleteAllFauxUsers = async () => {
    let user_ids;
    await getAllUserIDs().then(res => user_ids = res.map(e => e.user_id));
    for (const user_id of user_ids) {
        if (user_id.length === 20) {
            await deleteUser(user_id);
        }
    }
}

export const getLikedSongsFromArtist = async function (user_id, artistID) {
    let albumsWithLikedSongs = [];
    let globalUser_id = user_id;
    if (globalUser_id === "me") {
        globalUser_id = window.localStorage.getItem("user_id");
    }
    const tracks = (await getPlaylists(globalUser_id, true)).flatMap(e => e.expand.tracks);
    const albums = (await fetchData(`artists/${artistID}/albums`)).items;
    const albumPromises = albums.map((album) => fetchData(`albums/${album.id}/tracks`));
    const albumTracks = await Promise.all(albumPromises);

    for (let i = 0; i < albums.length; i++) {
        const album = albums[i];
        const trackList = albumTracks[i].items;
        album["saved_songs"] = trackList.filter((t1) => tracks.some(t2 => t1.name === t2.title));
        if (album.album_type !== 'single' && album["saved_songs"].length > 0 && !albumsWithLikedSongs.some((item) => item["saved_songs"].length === album["saved_songs"].length && item.name === album.name)) {
            albumsWithLikedSongs.push(album);
        }
    }
    return albumsWithLikedSongs;
}
/**
 * Creates a datapoint for each term for the logged-in user and posts them
 * to the database using postDatapoint.
 */
export const hydrateDatapoints = async function () {
    console.time("Hydration.");
    const terms = ['short_term', 'medium_term', 'long_term'];
    const promises = terms.map(async (term) => {
        console.info("Hydrating: " + term)
        let datapoint = {
            user_id: window.localStorage.getItem("user_id"),
            term: term,
            top_songs: [],
            top_artists: [],
            top_genres: [],
        }
        let top_songs;
        let top_artists;
        // Queue up promises
        let promises = [await fetchData(`me/top/tracks?time_range=${term}&limit=50`), await fetchData(`me/top/artists?time_range=${term}`)];
        // Await the promises for the arrays of data
        await Promise.all(promises).then(function (result) {
            top_songs = result[0].items;
            top_artists = result[1].items;
        })
        // Add all the songs
        for (let i = 0; i < top_songs.length; i++) {
            datapoint.top_songs.push({
                song_id: top_songs[i].id,
                title: top_songs[i].name,
                artists: top_songs[i].artists,
                image: top_songs[i].album.images[1].url,
                link: top_songs[i].external_urls.spotify,
                analytics: {}
            })
        }
        await batchAnalytics(datapoint.top_songs).then(res =>
            datapoint.top_songs.map((e,i) =>
                e.analytics = res[i]
            )
        );
        console.log(datapoint.top_songs)
        // Add all the artists
        for (let i = 0; i < top_artists.length; i++) {
            try {
                datapoint.top_artists.push({
                    artist_id: top_artists[i].id,
                    name: top_artists[i].name,
                    image: top_artists[i].images[1].url,
                    link: `https://open.spotify.com/artist/${top_artists[i].id}`,
                    genres: top_artists[i].genres
                })
            } catch (error) { //catch error when artist does not have PFP
                console.warn(error)
            }
        }
        datapoint.top_genres = calculateTopGenres(top_artists);
        await postDatapoint(datapoint).then(function () {
            console.info(term + " success!");
        });
    });
    await Promise.all(promises);
    console.info("Hydration over.");
    console.timeEnd("Hydration.");
}

/**
 * Creates an ordered array of a users top genres based on an order list of artists.
 * @param artists
 * @returns {*[]}
 */
const calculateTopGenres = function (artists) {
    let topGenres = [];
    artists.forEach(function (artist, i) {
        artist.genres.forEach(function (genre) {
            if (topGenres.some(e => e.genre === genre)) { //is genre already in array?
                let index = topGenres.map(function (e) {
                    return e.genre
                }).indexOf(genre); //get index
                topGenres[index].weight += artists.length - i; //combine weights
            } else {
                topGenres.push({genre: genre, weight: artists.length - i})
            }
        })
    })
    topGenres.sort((a, b) => b.weight - a.weight) //sort based on weight diffs
    // DECONSTRUCTS THE OBJECT OF A GENRE TO SIMPLY BE A STRING:
    topGenres.forEach((genre, i) => topGenres[i] = genre.genre)
    // LOOKS INSANE BUT A GENRE IN THIS FUNCTION IS AN OBJECT OF ITS NAME
    // AND WEIGHT. THAT LINE SIMPLY TURNS IT FROM AN OBJECT INTO A STRING
    return topGenres;
}