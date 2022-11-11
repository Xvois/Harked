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

// Create users table
knex.schema
  // Make sure no "users" table exists
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
// Create datapoint table
knex.schema
    // Make sure no "datapoints" table exists
    .hasTable('datapoints')
        .then((exists) => {
            if(!exists){
                return knex.schema.createTable('datapoints', (table) => {
                    table.increments('datapoint_id').primary();
                    table.string('user_id').references('user_id').inTable('users');
                    table.string('term');
                    table.dateTime('collection_date');
                    table.integer('top_songs_id').references('ref').inTable('songs_ref');
                    table.integer('top_artists_id').references('ref').inTable('artists_ref');
                    table.integer('top_genres_id').references('id').inTable('genre_array');
                })
                .then(() => {
                    // Log success message
                    console.log('Table \'datapoints\' created')
                  })
                  .catch((error) => {
                    console.error(`There was an error creating table: ${error}`)
                  })
            }
        })
// Create songs_ref table
knex.schema
    // Make sure no "songs_ref" table exists
    .hasTable('songs_ref')
        .then((exists) => {
            if(!exists){
                return knex.schema.createTable('songs_ref', (table) => {
                    table.float('id').primary();
                    for(var i = 1; i < 51; i++){
                      table.string(`song_id_${i}`).references('song_id').inTable('songs')
                    }
                })
                .then(() => {
                    // Log success message
                    console.log('Table \'songs_ref\' created')
                  })
                  .catch((error) => {
                    console.error(`There was an error creating table: ${error}`)
                  })
            }
        })
// Create songs table
knex.schema
    // Make sure no "songs" table exists
    .hasTable('songs')
        .then((exists) => {
            if(!exists){
                return knex.schema.createTable('songs', (table) => {
                    table.string('song_id').primary().references('song_id').inTable('analytics');
                    table.string('artist');
                    table.string('image');
                    table.string('link');
                    table.string('name');
                    table.string('type');
                    table.string('title');
                })
                .then(() => {
                    // Log success message
                    console.log('Table \'songs\' created')
                  })
                  .catch((error) => {
                    console.error(`There was an error creating table: ${error}`)
                  })
            }
        })
// Create analytics table
knex.schema
    // Make sure no "analytics" table exists
    .hasTable('analytics')
        .then((exists) => {
            if(!exists){
                return knex.schema.createTable('analytics', (table) => {
                    table.string('song_id').primary();
                    table.float('acousticness');
                    table.float('danceability');
                    table.float('duration_ms');
                    table.float('energy');
                    table.float('instrumentalness');
                    table.integer('key');
                    table.float('liveness');
                    table.float('loudness');
                    table.integer('mode');
                    table.float('speechiness');
                    table.float('tempo');
                    table.integer('time_signature');
                    table.float('valence');
                })
                .then(() => {
                    // Log success message
                    console.log('Table \'analytics\' created')
                  })
                  .catch((error) => {
                    console.error(`There was an error creating table: ${error}`)
                  })
            }
        })
// Create artists_ref table
knex.schema
    // Make sure no "artists_ref" table exists
    .hasTable('artists_ref')
        .then((exists) => {
            if(!exists){
                return knex.schema.createTable('artists_ref', (table) => {
                    table.float('id').primary();
                      for(var i = 1; i < 21; i++){
                        table.string(`artist_id_${i}`).references('artist_id').inTable('artists')
                      }
                })
                .then(() => {
                    // Log success message
                    console.log('Table \'artists_ref\' created')
                  })
                  .catch((error) => {
                    console.error(`There was an error creating table: ${error}`)
                  })
            }
        })
// Create artists table
knex.schema
    // Make sure no "artists" table exists
    .hasTable('artists')
        .then((exists) => {
            if(!exists){
                return knex.schema.createTable('artists', (table) => {
                    table.string('artist_id').primary();
                    table.string('type');
                    table.string('genre');
                    table.string('image');
                    table.string('link');
                    table.string('name');
                })
                .then(() => {
                    // Log success message
                    console.log('Table \'artists\' created')
                  })
                  .catch((error) => {
                    console.error(`There was an error creating table: ${error}`)
                  })
            }
        })
// Create genres table
knex.schema
    // Make sure no "genres" table exists
    .hasTable("genres")
        .then((exists) => {
            if(!exists){
                return knex.schema.createTable('genres', (table) => {
                    table.float('id').primary();
                    for(var i = 1; i < 51; i++){
                        table.string(`genre_${i}`)
                      }
                })
                .then(() => {
                    // Log success message
                    console.log('Table \'genres\' created')
                  })
                  .catch((error) => {
                    console.error(`There was an error creating table: ${error}`)
                  })
            }
        })
// Export the database
module.exports = knex