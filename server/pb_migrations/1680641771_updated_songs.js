migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("pv9gax2vt2oiyjz")

  // remove
  collection.schema.removeField("kf8pz3tn")

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("pv9gax2vt2oiyjz")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "kf8pz3tn",
    "name": "song",
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
})
