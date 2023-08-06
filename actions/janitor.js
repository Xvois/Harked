

async function runJanitor() {

    const PocketBase = await import("pocketbase");
    const axios = await import("axios");
    const request = await import("request");

// Spotify API authentication
    let client_id, client_secret, token, pb_email, pb_password = null;

// Get client_id and client_secret from CLI arguments
    if (process.argv.length < 6) {
        console.error('Usage: node your_script_name.js <client_id> <client_secret> <pb_email> <pb_password>');
        process.exit(1);
    } else {
        client_id = process.argv[2];
        client_secret = process.argv[3];
        pb_email = process.argv[4];
        pb_password = process[5];
    }


// PocketBase authentication
    const pb = new PocketBase('https://harked.fly.dev/');
    const authData = await pb.admins.authWithPassword(pb_email, pb_password);


    let authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        headers: {
            'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
        },
        form: {
            grant_type: 'client_credentials'
        },
        json: true
    };

    request.post(authOptions, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            // use the access token to access the Spotify Web API
            token = body.access_token;
        }
    });

// End Spotify API Authentication

    function hashString(inputString) {
        let hash = 0n; // Use BigInt to support larger values
        if (inputString.length === 0) {
            return '0000000000000000';
        }
        for (let i = 0; i < inputString.length; i++) {
            const char = BigInt(inputString.charCodeAt(i));
            hash = ((hash << 5n) - hash) + char;
            hash &= hash; // Convert to 64-bit integer
        }
        const hex = hash.toString(16);
        return hex.padStart(15, '0').substring(0, 15);
    }

    async function fetchData(path) {
        try {
            const {data} = await axios.get(`https://api.spotify.com/v1/${path}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                },
            });
            return data;
        } catch (err) {
            if (err.response === undefined) {
                console.warn("[Error in Spotify API call] " + err);
            } else if (err.response.status === 401) {
                throw new Error('Token expired.');
            } else if (err.response.status === 429 || err.response.status === 503) {
                console.warn(`[Error in API call] CODE : ${err.response.status}`);
            }
        }
    };

    function chunks(array, size) {
        const result = [];
        for (let i = 0; i < array.length; i += size) {
            result.push(array.slice(i, i + size));
        }
        return result;
    };

    let databaseCache = {
        artists: [],
        songs: [],
        genres: []
    };

    const updateDatabaseCache = async () => {
        let p = [];
        p.push(await pb.collection('artists').getFullList());
        p.push(await pb.collection('songs').getFullList());
        p.push(await pb.collection('genres').getFullList());
        let cache = await Promise.all(p);
        databaseCache = {
            artists: cache[0],
            songs: cache[1],
            genres: cache[2]
        }
    };

    const updateDatabaseCacheWithItems = (items) => {
        if (items.hasOwnProperty("artists")) {
            databaseCache.artists = databaseCache.artists.concat(items.artists);
        }
        if (items.hasOwnProperty("songs")) {
            databaseCache.songs = databaseCache.songs.concat(items.songs);
        }
        if (items.hasOwnProperty("genres")) {
            databaseCache.genres = databaseCache.genres.concat(items.genres);
        }
    }

    const formatArtist = (artist) => {
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
    };

    const batchArtists = async (artist_ids) => {
        const artistChunks = chunks(artist_ids, 50);
        const artists = [];
        for (const chunk of artistChunks) {
            const ids = chunk.join(',');
            const result = (await fetchData(`artists/?ids=${ids}`)).artists;
            artists.push(...result.map(function (e) {
                return formatArtist(e);
            }));
        }
        return artists;
    };

    const batchAnalytics = async (song_ids) => {
        const songChunks = chunks(song_ids, 50);
        const analytics = [];
        for (const chunk of songChunks) {
            const ids = chunk.join(',');
            const result = await fetchData(`audio-features?ids=${ids}`);
            analytics.push(...result.audio_features);
        }
        return analytics;
    };

    const postGenre = async (genre) => {
        if (!genre.hasOwnProperty("id")) {
            throw new Error("Genre must have database id before posting!");
        }
        await pb.collection('genres').create(genre).catch(err => console.error(err));
        updateDatabaseCacheWithItems({genres: [genre]});
    }

    const genresToRefIDs = async (genres) => {
        if (databaseCache.genres.length === 0) {
            await updateDatabaseCache();
        }
        let ids = [];
        // Genres are added as an array of strings, but stored in cache as having their string and id
        const newGenres = genres.filter(g1 => !databaseCache.genres.some(g2 => g2.genre === g1));

        for (let i = 0; i < genres.length; i++) {
            let genre = genres[i];
            const id = hashString(genre);
            ids.push(id);
            if (newGenres.includes(genre)) {
                await postGenre({
                    id: id,
                    genre: genre
                });
            }
        }
        return ids;
    };

    console.info('Updating cache...')
    await updateDatabaseCache();

    console.info('Checking artists...');
    const artists = databaseCache.artists;
    const artist_ids = artists.map(a => a.artist_id);
    const retrievedArtists = await batchArtists(artist_ids);
    let artistsModified = 0;
    let artistsChecked = 0;

    for (const artist of artists) {
        const index = retrievedArtists.findIndex(e => e.artist_id === artist.artist_id);
        const retrievedInstance = retrievedArtists[index];
        const instanceGenresHashes = retrievedInstance.genres.map(g => hashString(g));
        const lengthMatch = artist.genres?.length === instanceGenresHashes?.length;
        const allGenresExist = !(artist.genres?.map(g1 => instanceGenresHashes.some(g2 => g1 === g2)).some(bool => bool === false));
        const genresMatch = lengthMatch && allGenresExist;

        if (retrievedInstance.profile_picture !== artist.profile_picture || !genresMatch) {
            retrievedInstance.genres = await genresToRefIDs(retrievedInstance.genres);

            try {
                await pb.collection('artists').update(hashString(artist.artist_id), retrievedInstance);
                artistsModified++;
            } catch (err) {
                console.error('Error updating artist', err);
            }
        }
        artistsChecked++;
    }

    console.log(artistsModified + ' artists modified.')
    console.log(`${artistsChecked} / ${artists.length} artists checked.`);

    console.log('Checking songs...');
    const songs = databaseCache.songs;
    const songsWithoutAnalytics = songs.filter(s => !s.analytics.hasOwnProperty('acousticness'));
    const analytics = await batchAnalytics(songsWithoutAnalytics.map(s => s.song_id));
    let songsModified = 0;

    for (let i = 0; i < songsWithoutAnalytics.length; i++) {
        const song = songsWithoutAnalytics[i];
        try {
            await pb.collection('songs').update(hashString(song.song_id), {...song, analytics: analytics[i]});
            songsModified++;
        } catch (err) {
            console.error('Error updating song', err);
        }
    }

    console.log(songsModified + ' songs modified.')
    console.log(`${songsWithoutAnalytics.length} songs without analytics identified.`);

    console.log('Database updates complete!');

}

runJanitor().catch((err) => {
    console.error('Error running the Janitor:', err);
    process.exit(1);
});