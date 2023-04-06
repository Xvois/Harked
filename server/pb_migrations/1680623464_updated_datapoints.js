migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("w3nfs9zv02kgc7h")

  collection.listRule = ""

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("w3nfs9zv02kgc7h")

  collection.listRule = null

  return dao.saveCollection(collection)
})
