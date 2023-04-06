migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("pv9gax2vt2oiyjz")

  collection.indexes = [
    "CREATE INDEX `idx_XSWBKl2` ON `songs` (`song_id`)"
  ]

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("pv9gax2vt2oiyjz")

  collection.indexes = []

  return dao.saveCollection(collection)
})
