migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("kl6jr7ad6g6twr8")

  collection.indexes = [
    "CREATE UNIQUE INDEX `idx_TcAPxHY` ON `playlists` (`playlist_id`)"
  ]

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("kl6jr7ad6g6twr8")

  collection.indexes = []

  return dao.saveCollection(collection)
})
