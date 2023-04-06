migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("h7dmi7gxscp2mxo")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "cuznnxqg",
    "name": "user_id",
    "type": "text",
    "required": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "pattern": ""
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("h7dmi7gxscp2mxo")

  // remove
  collection.schema.removeField("cuznnxqg")

  return dao.saveCollection(collection)
})
