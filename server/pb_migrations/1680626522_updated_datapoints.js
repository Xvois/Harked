migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("w3nfs9zv02kgc7h")

  // remove
  collection.schema.removeField("c3hxhuoc")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "o2zlalvy",
    "name": "top_songs",
    "type": "relation",
    "required": false,
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
  const collection = dao.findCollectionByNameOrId("w3nfs9zv02kgc7h")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "c3hxhuoc",
    "name": "top_songs",
    "type": "json",
    "required": false,
    "unique": false,
    "options": {}
  }))

  // remove
  collection.schema.removeField("o2zlalvy")

  return dao.saveCollection(collection)
})
