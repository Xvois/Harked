// Import database
const knex = require('./../db')

// --- EXTRA FUNCS --- //

charsum = function(s) {
  var i, sum = 0;
  for (i = 0; i < s.length; i++) {
    sum += (s.charCodeAt(i) * (i+1));
  }
  return sum
}

array_hash = function(a) {
  var i, sum = 0, product = 1
  for (i = 0; i < a.length; i++) {
    var cs = charsum(a[i])
    if (product % cs > 0) {
      product = product * cs
      sum = sum + (65027 / cs)  
    }
  }
  return ("" + sum).slice(0, 16)
}

// --- END OF EXTRA FUNCS --- //


// Retrieve all users
exports.getUsers = async (req, res) => {
  // Get all users from database
  knex
    .from('users')
    .select('*') // select all records // from 'users' table
    .then(user => {
      // Send users extracted from database in response
      res.json(user)
    })
    .catch(err => {
      // Send a error message in response
      res.json({ message: `There was an error retrieving users: ${err}` })
    })
}

exports.getUser = async (req, res) => {
  var errorMessage;
  let user = {
    userID: req.query.userID,
    username: '',
    profilePicture: '',
    media: null
}
  await knex('users')
    .where({user_id: req.query.userID})
      .select('*')
        .then(function(results){
          const record = results[0];
          user.username = record.username;
          user.profilePicture = record.picture_url;
        }).catch(function(err){errorMessage = err})
  if(!errorMessage){
    res.status(200).json(user);
  }else{
    console.log(errorMessage)
  }   
}

// Create new user
exports.createUser = async (req, res) => {
  var errorMessage;
  // Add new user to database
  knex('users')
    .where({user_id: req.body.userID})
      .then(function(results){
        if(results.length === 0){
          knex('users')
          .insert({ // insert new record, a user
            'user_id': req.body.userID,
            'username': req.body.username,
            'picture_url': req.body.profilePicture,
          }).catch(function(err){errorMessage = err})
        }else{
          knex('users')
          .where({user_id: req.body.userID})
            .update({
              username: req.body.username,
              picture_url: req.body.profilePicture,
            }).catch(function(err){errorMessage = err})
        }
      })
  if(!errorMessage){
    res.status(201).json({message : `User created.`})
  }else{
    console.log(errorMessage)
  }
}

exports.getDatapoint = async (req, res) => {
  const user_id = req.query.userID;
  const term = req.query.term;
  console.log(`Attempting to get datapoint for: ${user_id}, ${term}`)
  let datapoint = {
    userID: user_id,
    collectionDate: null,
    term: term,
    topSongs: [],
    topArtists: [],
    topGenres: [],
  }
  await knex('datapoints')
    .select('collection_date', 'top_songs_id', 'top_artists_id', 'top_genres_id')
      .where({user_id: user_id, term: term})
      // Get the most recent datapoint
        .orderBy('collection_date')
          .then(async function(results){
            // Return null if there are no matching datapoints
            if(results.length === 0){ console.log("Datapoint requested but nullified: none found."); }
            else{
              // The datapoint contains the references
              // to the other tables
              const references = results[0];
              datapoint.collectionDate = references.collection_date;
              const WEEK_IN_MILISECONDS = 604800 * 1000;
              //const WEEK_IN_SECONDS = 0;
              if(Date.now() - datapoint.collectionDate < WEEK_IN_MILISECONDS){
                await knex('songs_ref')
                // Find the top songs reference
                  .where('id', references.top_songs_id)
                    .select('*')
                    // Add the results
                      .then(async function(song_ids){
                        for(let i = 1; i < 51; i++){
                          await knex('songs')
                            .where('song_id', song_ids[0][`song_id_${i}`])
                              .select('*')
                                .then(async function(result){
                                  let song = result[0]
                                  datapoint.topSongs.push(song)
                                  await knex('analytics')
                                    .where({song_id: song.song_id})
                                      .then(function(analytic){
                                        datapoint.topSongs[i-1]['analytics'] = analytic[0];
                                      })
                                })
                        }
                      })
                await knex('artists_ref')
                // Find the top songs reference
                  .where('id', references.top_artists_id)
                    .select('*')
                    // Add the results
                      .then(async function(artist_ids){
                        for(let i = 1; i < 21; i++){
                          await knex('artists')
                            .where('artist_id', artist_ids[0][`artist_id_${i}`])
                              .select('*')
                                .then(function(result){
                                  let artist = result[0]
                                  datapoint.topArtists.push(artist)
                                })
                        }
                      })
                await knex('genres')
                .where('id', references.top_genres_id)
                  .select('*')
                    .then(async function(genres){
                      for(let i = 1; i < 51 && genres[0][`genre_${i}`] != undefined; i++){
                        const genre = genres[0][`genre_${i}`];
                        datapoint.topGenres.push(genre);
                      }
                    })
              }else{
                // Return null if the latest datapoint is old
                console.log("Datapoint requested but nullified: old.");
              }
            }
          })
  if(datapoint.topSongs.length === 0){ // Has the request been nullified?
    datapoint = null;
  }
  res.json(datapoint)
}

exports.postDatapoint = async (req, res) => {

  let songs_ref_id;
  const song_ids = [];
  // Push all the song ids to an array
  req.body.topSongs.forEach(function(song){
    song_ids.push(song.song_id);
  })
  // Hash the array to get the id
  songs_ref_id = array_hash(song_ids);

  let artists_ref_id;
  const artist_ids = [];
  // Push all the artist ids to an array
  req.body.topArtists.forEach(function(artist){
    artist_ids.push(artist.artist_id);
  })
  // Hash the array to get the id
  artists_ref_id = array_hash(artist_ids);

  let genres_id;
  const genres = [];
  // Push all the genres to an array
  req.body.topGenres.forEach(function(genre){
    genres.push(genre);
  })
  // Hash the array to get the id
  genres_id = array_hash(genres);

  // Check if the song id already exists
  knex('songs_ref').where('id', songs_ref_id).select("*").then(function(results){
    if(results.length === 0){
      // If not add the record
      knex('songs_ref')
        .insert({
          'id': songs_ref_id
        }).catch(err => console.log(err))
    }
  })

  // Check if the artist id already exists
  knex('artists_ref').where('id', artists_ref_id).select("*").then(function(results){
    if(results.length === 0){
      // If not add the record
      knex('artists_ref')
        .insert({
          'id': artists_ref_id
        }).catch(err => console.log(err))
    }
  })

  // Update the record with all the song's information
  req.body.topSongs.forEach(async function(song,i){
    await knex('songs').where('song_id', song.song_id).select("*").then(function(results){
      if(results.length === 0){ // If the song doesn't exist add it
        knex('songs')
          .insert({
            'song_id': song.song_id,
            'artist': song.artist,
            'image': song.image,
            'link': song.link,
            'name': song.name,
            'title': song.title,
            'type': "song"
         }).catch(err => console.log(err))
         knex('analytics')
          .insert({
            'song_id': song.song_id,
            'acousticness': song.analytics.acousticness,
            'danceability': song.analytics.danceability,
            'duration_ms': song.analytics.duration_ms,
            'energy': song.analytics.energy,
            'instrumentalness': song.analytics.instrumentalness,
            'key': song.analytics.key,
            'liveness': song.analytics.liveness,
            'loudness': song.analytics.loudness,
            'mode': song.analytics.mode,
            'speechiness': song.analytics.speechiness,
            'tempo': song.analytics.tempo,
            'time_signature': song.analytics.time_signature,
            'valence': song.analytics.valence
          }).catch(err => console.log(err))
      }
    }).catch(err => console.log(err))
    // Generate correct column name
    const column = "song_id_" + String(i+1);
    // Update existing columns to have
    // the correct IDs + data
    knex(`songs_ref`)
    .where('id', songs_ref_id)
      .update({
        [column]: song.song_id
      }).catch(function(err){console.log(`Error making song column: ${err}`)})
  })

  // Update the record with all the artist's information
  req.body.topArtists.forEach(async function(artist,i){
    await knex('artists').where('artist_id', artist.artist_id).select("*").then(function(results){
      if(results.length === 0){ // If the song doesn't exist add it
        knex('artists')
          .insert({
            'artist_id': artist.artist_id,
            'type': "song",
            'genre': artist.genre,
            'image': artist.image,
            'link': artist.link,
            'name': artist.name,
          }).catch(err => console.log(err))
      }
    })
    // Generate correct column name
    const column = "artist_id_" + String(i+1);
    // Update existing columns to have
    // the correct IDs + data
    knex(`artists_ref`)
    .where('id', artists_ref_id)
      .update({
        [column]: artist.artist_id
      }).catch(function(err){console.log(`Error making artist column: ${err}`)})
  })

  knex('genres').where('id', genres_id).select("*").then(function(results){
    if(results.length === 0 ){
      knex('genres')
        .insert({
          'id': genres_id
        }).catch(err => console.log(err))
      req.body.topGenres.forEach(function(genre,i){
        // Generate correct column name
        const column = "genre_" + String(i+1);
        // Update existing columns to have
        // the correct IDs + data
        knex(`genres`)
        .where('id', genres_id)
          .update({
            [column]: genre
          }).catch(err => console.log(err))
      })
    }
  }).catch(err => console.log(err))

  const WEEK_IN_SECONDS = 604800;
  await knex('datapoints')
    .where({user_id: req.body.userID, term: req.body.term})
      .select('collection_date')
        .then(oldDate => {
          // Check that any existing datapoint is older than a week
          // before adding a new one
          if(req.body.collectionDate - oldDate > WEEK_IN_SECONDS){
            // Make the final datapoint with all of the data
            knex('datapoints').insert({
              // User ID will not be unique
              // there is an autoincrementing id
              'user_id': req.body.userID,
              'term': req.body.term,
              'collection_date': req.body.collectionDate,
              'top_songs_id': songs_ref_id,
              'top_artists_id': artists_ref_id,
              'top_genres_id': genres_id
            }).catch(function(err){console.log(`Error making datapoint record: ${err}`)})
          }
        }).catch(function(err){console.log(`Error finding existing datapoint record: ${err}`)})
  res.status(201).json({message : "Datapoint successfully compiled."});
}
// Remove specific user
exports.deleteUser = async (req, res) => {
  // Find specific user in the database and remove it
  knex('users')
    .where('id', req.body.userID) // find correct record based on id
    .del() // delete the record
    .then(() => {
      // Send a success message in response
      res.json({ message: `User ${req.body.userId} deleted.` })
    })
    .catch(err => {
      // Send a error message in response
      res.json({ message: `There was an error deleting ${req.body.userId} user: ${err}` })
    })
}

// Remove all users on the list
exports.resetUsers = async (req, res) => {
  // Remove all users from database
  knex
    .select('*') // select all records
    .from('users') // from 'users' table
    .truncate() // remove the selection
    .then(() => {
      // Send a success message in response
      res.json({ message: 'user list cleared.' })
    })
    .catch(err => {
      // Send a error message in response
      res.json({ message: `There was an error resetting user list: ${err}.` })
    })
}