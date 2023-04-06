migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("kl6jr7ad6g6twr8")

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "kbfr9osh",
    "name": "tracks",
    "type": "relation",
    "required": true,
    "unique": false,
    "options": {
      "collectionId": "pv9gax2vt2oiyjz",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": null,
      "displayFields": []
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("kl6jr7ad6g6twr8")

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "kbfr9osh",
    "name": "tracks",
    "type": "relation",
    "required": true,
    "unique": false,
    "options": {
      "collectionId": "pv9gax2vt2oiyjz",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": 1,
      "displayFields": []
    }
  }))

  return dao.saveCollection(collection)
})
