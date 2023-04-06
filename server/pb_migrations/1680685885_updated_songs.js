migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("pv9gax2vt2oiyjz")

  // remove
  collection.schema.removeField("cqr0ctwl")

  // remove
  collection.schema.removeField("bz2zj952")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "xz8gedos",
    "name": "artists",
    "type": "relation",
    "required": false,
    "unique": false,
    "options": {
      "collectionId": "d5kpanvycoam44i",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": null,
      "displayFields": []
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("pv9gax2vt2oiyjz")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "cqr0ctwl",
    "name": "artist",
    "type": "text",
    "required": true,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "pattern": ""
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "bz2zj952",
    "name": "name",
    "type": "text",
    "required": true,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "pattern": ""
    }
  }))

  // remove
  collection.schema.removeField("xz8gedos")

  return dao.saveCollection(collection)
})
