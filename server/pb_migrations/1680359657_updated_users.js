migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("h7dmi7gxscp2mxo")

  // remove
  collection.schema.removeField("ii95bjix")

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("h7dmi7gxscp2mxo")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "ii95bjix",
    "name": "user_id",
    "type": "text",
    "required": true,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "pattern": ""
    }
  }))

  return dao.saveCollection(collection)
})
