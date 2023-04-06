migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("d5kpanvycoam44i")

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "vacqxwrg",
    "name": "genres",
    "type": "relation",
    "required": false,
    "unique": false,
    "options": {
      "collectionId": "2wusql9pqxt19ic",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": null,
      "displayFields": []
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("d5kpanvycoam44i")

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "vacqxwrg",
    "name": "genre",
    "type": "relation",
    "required": false,
    "unique": false,
    "options": {
      "collectionId": "2wusql9pqxt19ic",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": null,
      "displayFields": []
    }
  }))

  return dao.saveCollection(collection)
})
