migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("d5kpanvycoam44i")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "0ovqxcql",
    "name": "artist",
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
  const collection = dao.findCollectionByNameOrId("d5kpanvycoam44i")

  // remove
  collection.schema.removeField("0ovqxcql")

  return dao.saveCollection(collection)
})
