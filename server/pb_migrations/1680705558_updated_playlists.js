migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("kl6jr7ad6g6twr8")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "6182cynt",
    "name": "playlist_id",
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
  const collection = dao.findCollectionByNameOrId("kl6jr7ad6g6twr8")

  // remove
  collection.schema.removeField("6182cynt")

  return dao.saveCollection(collection)
})
