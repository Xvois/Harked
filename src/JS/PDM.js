import {
    disableAutoCancel,
    enableAutoCancel,
    fetchData,
    getDatapoint,
    getDelayedDatapoint,
    getFullLocalData,
    getLocalData,
    getLocalDataByID,
    getUser,
    hashString,
    postDatapoint,
    postUser,
    updateLocalData
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
 * A boolean function that returns true if the currently logged-in user follows the target and false if not.
 * @returns {Promise<*>}
 * @param primaryUserID
 * @param targetUserID
 */
export const followsUser = async function (primaryUserID, targetUserID) {
    if (primaryUserID === targetUserID) {
        return false;
    }
    let follows = false;
    const targetUser = await getUser(targetUserID);
    await getLocalData("user_following", `user.user_id=${primaryUserID}`)
        .then((res) => {
            const item = res[0];
            if (item.following.some(e => e === targetUser.id)) {
                follows = true;
            }
        });
    return follows;
}


/**
 *
 * @param primaryUserID
 * @param targetUserID
 */
export const followUser = async function (primaryUserID, targetUserID) {
    // Get the record for who follows who for both the primary and target user
    let [primaryObj, targetObj] = [await getLocalDataByID("user_following", hashString(primaryUserID)), await getLocalDataByID("user_following", hashString(targetUserID))];

    // Since this is a relational key, .user is simply the record id for tha user
    if (!primaryObj.following.some(e => e === targetObj.user)) {
        primaryObj.following.push(targetObj.user);
        // Update the primary user's data to show they are following the target user
        await updateLocalData("user_following", primaryObj, primaryObj.id);
        // Update the target user's data to show they are being followed by the primary user
        await getLocalDataByID("user_followers", hashString(targetUserID)).then((res) => {
            let item = res;
            item.followers.push(primaryObj.user);
            updateLocalData("user_followers", item, item.id);
        })
    }
}
/**
 *
 * @param primaryUserID
 * @param targetUserID
 */
export const unfollowUser = async function (primaryUserID, targetUserID) {
    // Get the record for who follows who for both the primary and target user
    let [primaryObj, targetObj] = [await getLocalDataByID("user_following", hashString(primaryUserID)), await getLocalDataByID("user_following", hashString(targetUserID))];

    // Since this is a relational key, .user is simply the record id for tha user
    if (primaryObj.following.some(e => e === targetObj.user)) {
        primaryObj.following = primaryObj.following.filter(e => e !== targetObj.user);
        // Update the primary user's data to show they are not following the target user
        await updateLocalData("user_following", primaryObj, primaryObj.id);
        // Update the target user's data to show they are not being followed by the primary user
        await getLocalDataByID("user_followers", hashString(targetUserID)).then((res) => {
            let item = res;
            item.followers = item.followers.filter(e => e !== primaryObj.user);
            updateLocalData("user_followers", item, item.id);
        })
    }
}

export const retrieveFollowers = async function (user_id) {
    const res = await getLocalDataByID("user_followers", hashString(user_id), "followers");
    if (res.followers.length > 0) {
        return res.expand.followers;
    } else {
        return [];
    }
}

export const retrieveFollowing = async function (user_id) {
    const res = await getLocalDataByID("user_following", hashString(user_id), "following");
    if (res.following.length > 0) {
        return res.expand.following;
    } else {
        return [];
    }
}
/**
 * Returns all the user_ids currently in the database.
 * @returns {Promise<Array<Record>>}
 */
export const retrieveAllUsers = async function () {
    await disableAutoCancel();
    const users = await getFullLocalData("users");
    await enableAutoCancel();
    return users;
}
/**
 * Returns an array of public non-collaborative playlists from a given user.
 * @param user_id
 * @returns {Promise<Array>}
 */
export const retrievePlaylists = async function (user_id) {
    const globalUser_id = user_id === 'me' ? window.localStorage.getItem('user_id') : user_id;
    let playlists = (await fetchData(`users/${globalUser_id}/playlists`)).items;
    playlists = playlists.filter(p => !p.collaborative && p.public);
    const playlistTrackPromises = playlists.map(playlist => fetchData(`playlists/${playlist.id}/tracks`).then(response => response.items.map(e => e.track)));
    await Promise.all(playlistTrackPromises).then(tracksArrays => tracksArrays.forEach((tracks, index) => playlists[index].tracks = tracks.map(t => formatSong(t))));
    console.info('Playlists: ', playlists);
    return playlists;
}

export const retrieveSavedSongs = async function (user_id) {
    const globalUser_id = user_id === 'me' ? window.localStorage.getItem('user_id') : user_id;
    const savedTracks = (await fetchData(`users/${globalUser_id}/tracks`)).items;
    console.log(savedTracks);
}


/**
 * Creates / updates the logged-in user's record.
 * @returns {Promise<{user_id, profile_picture: null, media: null, username: *}>}
 */
export const formatUser = async function (user) {
    // Get our global user_id
    let pfp = null;
    if(user.images.length > 0){
        console.log(user);
        pfp = user.images[0].url;
    }
    return {
        user_id: user.id,
        username: user.display_name,
        profile_picture: pfp,
        media: null,
    }
}

/**
 * A boolean function for checking whether the session user is logged in or not.
 * @returns {boolean}
 */
export const isLoggedIn = function () {
    return !!(window.localStorage.getItem("user_id") && window.localStorage.getItem("access-token"));
}

/**
 * Returns a valid datapoint for a given user in a given term.
 * If the function does not get a valid datapoint from the database, it will hydrate the user's datapoints
 * and return a valid one from that selection.
 * @param user_id
 * @param term [short_term, medium_term, long_term]
 * @returns {Promise<*>} A datapoint object.
 */
export const retrieveDatapoint = async function (user_id, term) {
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
    await getDatapoint(globalUser_id, term, timeSensitive).then(function (result) {
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

    currDatapoint = formatDatapoint(currDatapoint);
    return currDatapoint;
}

export const retrievePrevDatapoint = async function (user_id, term) {
    let globalUser_id = user_id;
    // Are we accessing the logged-in user?
    // [Knowingly]
    if (globalUser_id === "me") {
        globalUser_id = window.localStorage.getItem("user_id");
    }
    const datapoint = await getDelayedDatapoint(globalUser_id, term, 1);
    if (datapoint === undefined) {
        return null
    } else {
        return datapoint;
    }
}


const formatDatapoint = function (d) {
    // Turn relation ids into the actual arrays / records themselves using
    // pocketbase's expand property
    d.top_artists = d.expand.top_artists;
    d.top_songs = d.expand.top_songs;
    d.top_genres = d.expand.top_genres.map(e => e.genre);
    d.top_artists.map(e => e.genres = e.expand.genres?.map(g => g.genre));
    d.top_songs.map(e => e.artists = e.expand.artists);
    d.top_songs.map(e => e.artists.map(a => a.genres = a.expand.genres?.map(g => g.genre)));
    // Delete redundant expansions
    delete d.expand;
    d.top_artists.forEach(e => delete e.expand);
    d.top_songs.forEach(e => delete e.expand);
    d.top_songs.forEach(e => e.artists.forEach(a => delete a.expand));
    return d;
}

export const retrieveAllDatapoints = async function (user_id) {
    const terms = ["short_term", "medium_term", "long_term"];
    const datapoints = [];
    for (const term of terms) {
        const datapoint = await retrieveDatapoint(user_id, term);
        datapoints.push(datapoint);
    }
    return datapoints;
}


export const retrievePrevAllDatapoints = async function (user_id) {
    const terms = ["short_term", "medium_term", "long_term"];
    const datapoints = [];
    for (const term of terms) {
        const datapoint = await retrievePrevDatapoint(user_id, term);
        datapoints.push(datapoint);
    }
    return datapoints;
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

export const batchArtists = async (artist_ids) => {
    const artistChunks = chunks(artist_ids, 50);
    const artists = [];
    for (const chunk of artistChunks) {
        const ids = chunk.join(',');
        const result = (await fetchData(`artists/?ids=${ids}`)).artists;
        artists.push(...result.map(function (e) {
            let image = null;
            if (e.images.length > 0) {
                image = e.images[1].url
            }
            return {
                artist_id: e.id,
                name: e.name,
                image: image,
                link: `https://open.spotify.com/artist/${e.id}`,
                genres: e.genres
            }
        }));
    }
    return artists;
};

export const getAlbumsWithTracks = async function (artistID, tracks) {
    let albumsWithTracks = [];
    if (!tracks) {
        return [];
    }

    const albums = (await fetchData(`artists/${artistID}/albums`)).items;
    const albumPromises = albums.map((album) => fetchData(`albums/${album.id}/tracks`));
    const albumTracks = await Promise.all(albumPromises);


    for (let i = 0; i < albums.length; i++) {
        const album = albums[i];
        const trackList = albumTracks[i].items;
        album["saved_songs"] = trackList.filter((t1) => tracks.some(t2 => t1.id === t2.song_id));
        if (album.album_type !== 'single' && album["saved_songs"].length > 0 && !albumsWithTracks.some((item) => item["saved_songs"].length === album["saved_songs"].length && item.name === album.name)) {
            albumsWithTracks.push(album);
        }
    }
    return albumsWithTracks;
}

export const formatArtist = (artist) => {
    let image = null;
    if (artist.hasOwnProperty("images")) {
        if (artist.images[1] !== undefined) {
            image = artist.images[1].url
        }
    }
    return {
        artist_id: artist.id,
        name: artist.name,
        image: image,
        link: `https://open.spotify.com/artist/${artist.id}`,
        genres: artist.genres
    }
}

export const formatSong = (song) => {
    let image = null;
    if (song.album.images !== undefined) {
        image = song.album.images[1].url
    }
    let artists = song.artists.map(a => formatArtist(a));
    return {
        song_id: song.id,
        title: song.name,
        artists: artists,
        image: image,
        link: song.external_urls.spotify,
        analytics: {}
    }
}

export const getSimilarArtists = async (artist) => {
    return (await fetchData(`artists/${artist.artist_id}/related-artists`)).artists;
}

export const getTrackRecommendations = async (seed_artists, seed_genres, seed_tracks, limit = 20) => {
    let params = new URLSearchParams([
        ["seed_artists", seed_artists],
        ["seed_genres", seed_genres],
        ["seed_tracks", seed_tracks],
        ["limit", limit]
    ]);
    return (await fetchData(`recommendations?${params}`)).tracks;
}

/**
 * Creates a datapoint for each term for the logged-in user and posts them
 * to the database using postDatapoint.
 */
export const hydrateDatapoints = async function () {
    console.time("Hydration.");
    const terms = ['short_term', 'medium_term', 'long_term'];

    const datapointPromises = terms.map(async (term) => {
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
        let result = await Promise.all([fetchData(`me/top/tracks?time_range=${term}&limit=50`), fetchData(`me/top/artists?time_range=${term}`)]);
        top_songs = result[0].items;
        top_artists = result[1].items;

        // Add all the songs
        datapoint.top_songs = top_songs.map(s => formatSong(s));
        await batchAnalytics(datapoint.top_songs).then(res =>
            datapoint.top_songs.map((e, i) =>
                e.analytics = res[i]
            )
        );

        // Add all the artists
        datapoint.top_artists = top_artists.map(a => formatArtist(a));

        datapoint.top_genres = calculateTopGenres(top_artists);
        console.log(datapoint);

        return datapoint;
    });

    const datapoints = await Promise.all(datapointPromises);

    console.info("Posting datapoints...");
    for (let i = 0; i < datapoints.length; i++) {
        const datapoint = datapoints[i];
        await postDatapoint(datapoint).then(function () {
            console.info(datapoint.term + " success!");
        });
    }

    console.info("Hydration over.");
    console.timeEnd("Hydration.");
}


/**
 * Creates an ordered array of a users top genres based on an order list of artists.
 * @param artists
 * @returns {*[]}
 */
const calculateTopGenres = function (artists) {
    console.info('CALC TOP GENRES')
    console.log(artists);
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