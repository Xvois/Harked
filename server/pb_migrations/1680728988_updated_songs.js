migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("pv9gax2vt2oiyjz")

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "xz8gedos",
    "name": "artists",
    "type": "relation",
    "required": true,
    "unique": false,
    "options": {
      "collectionId": "d5kpanvycoam44i",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": null,
      "displayFields": []
    }
  }))

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "opin3etl",
    "name": "link",
    "type": "url",
    "required": true,
    "unique": false,
    "options": {
      "exceptDomains": null,
      "onlyDomains": null
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("pv9gax2vt2oiyjz")

  // update
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

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "opin3etl",
    "name": "link",
    "type": "url",
    "required": false,
    "unique": false,
    "options": {
      "exceptDomains": null,
      "onlyDomains": null
    }
  }))

  return dao.saveCollection(collection)
})
