// Import database
const knex = require('./../db')

// Retrieve all users
exports.getUsers = async (req, res) => {
  // Get all users from database
  knex
    .select('*') // select all records
    .from('users') // from 'users' table
    .then(userData => {
      // Send users extracted from database in response
      res.json(userData)
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
      'user_id': req.body.userID,
      'username': req.body.username,
      'picture_url': req.body.profilePicture,
    })
    .then(() => {
      // Send a success message in response
      res.json({ message: `user \'${req.body.title}\' by ${req.body.author} created.` })
    })
    .catch(err => {
      // Send a error message in response
      res.json({ message: `There was an error creating ${req.body.title} user: ${err}` })
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