migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("d5kpanvycoam44i")

  // add
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
      "maxSelect": 1,
      "displayFields": []
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("d5kpanvycoam44i")

  // remove
  collection.schema.removeField("vacqxwrg")

  return dao.saveCollection(collection)
})
