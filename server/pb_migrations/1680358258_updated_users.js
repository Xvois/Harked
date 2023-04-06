migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("h7dmi7gxscp2mxo")

  collection.viewRule = ""
  collection.createRule = ""
  collection.updateRule = ""
  collection.deleteRule = ""

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("h7dmi7gxscp2mxo")

  collection.viewRule = null
  collection.createRule = null
  collection.updateRule = null
  collection.deleteRule = null

  return dao.saveCollection(collection)
})
