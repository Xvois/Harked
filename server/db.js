// Import path module
const path = require('path')

// Get the location of database.sqlite file
const dbPath = path.resolve(__dirname, 'db/database.db')

// Create connection to SQLite database
const knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: dbPath,
  },
  useNullAsDefault: true
})

// Create a table
knex.schema
  // Make sure no "users" table exists
  // before trying to create new
  .hasTable('users')
    .then((exists) => {
      if (!exists) {
        // If no user table exists
        // create new
        return knex.schema.createTable('users', (table)  => {
          table.string('user_id').primary();
          table.string("username");
          table.string("picture_url");
        })
        .then(() => {
          // Log success message
          console.log('Table \'users\' created')
        })
        .catch((error) => {
          console.error(`There was an error creating table: ${error}`)
        })
      }
    })
    .then(() => {
      // Log success message
      console.log('done')
    })
    .catch((error) => {
      console.error(`There was an error setting up the database: ${error}`)
    })

// Just for debugging purposes:
knex.select('*').from('users')
  .then(data => console.log('data:', data))
  .catch(err => console.log(err))

// Export the database
module.exports = knex