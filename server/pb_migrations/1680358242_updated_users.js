migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("h7dmi7gxscp2mxo")

  collection.listRule = ""

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("h7dmi7gxscp2mxo")

  collection.listRule = null

  return dao.saveCollection(collection)
})
