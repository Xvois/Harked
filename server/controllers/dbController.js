// Import database
const knex = require('./../db')

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

// Create new user
exports.createUser = async (req, res) => {
  // Add new user to database
  knex('users')
    .insert({ // insert new record, a user
      'user_id': req.body.user.userID,
      'username': req.body.user.username,
      'picture_url': req.body.user.profilePicture,
    })
}

exports.postDatapoint = async (req, res) => {
  // Get the index of current top_songs reference
  knex('songs_ref').count('id').then(function(result){
    const id = result;
    knex('songs_ref').insert();
  })
  req.body.topSongs.forEach(function(song,i){ // If the song already exists do nothing
    console.log(song);
    knex('songs').where('song_id', song.id).select("*").then(function(results){
      if(results == []){
        console.log("Adding song.")
        knex('songs').insert({
          'song_id': song.id,
          'artist': song.artist,
          'image': song.image,
          'link': song.link,
          'name': song.name,
          'title': song.title,
          'song': true
        }).catch(function(err){res.json({message: `Error adding song: ${err}`})})
      }else{
        console.log("Song exists!")
      }
    })
  })
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