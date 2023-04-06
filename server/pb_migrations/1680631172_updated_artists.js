migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("d5kpanvycoam44i")

  collection.indexes = [
    "CREATE UNIQUE INDEX `idx_IjkerPy` ON `artists` (`artist_id`)"
  ]

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("d5kpanvycoam44i")

  collection.indexes = []

  return dao.saveCollection(collection)
})
