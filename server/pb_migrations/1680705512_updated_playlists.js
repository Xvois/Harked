migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("kl6jr7ad6g6twr8")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "zjnmcf2t",
    "name": "image",
    "type": "url",
    "required": false,
    "unique": false,
    "options": {
      "exceptDomains": null,
      "onlyDomains": null
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("kl6jr7ad6g6twr8")

  // remove
  collection.schema.removeField("zjnmcf2t")

  return dao.saveCollection(collection)
})
