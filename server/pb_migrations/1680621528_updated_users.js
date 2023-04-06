migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("h7dmi7gxscp2mxo")

  collection.indexes = [
    "CREATE UNIQUE INDEX `idx_dvY3KSW` ON `users` (`user_id`)"
  ]

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("h7dmi7gxscp2mxo")

  collection.indexes = []

  return dao.saveCollection(collection)
})
