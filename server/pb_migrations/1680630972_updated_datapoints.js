migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("w3nfs9zv02kgc7h")

  // remove
  collection.schema.removeField("w2etcdpx")

  // remove
  collection.schema.removeField("jdczqlx1")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "9cdpl0ps",
    "name": "top_artists",
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

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "apwprm25",
    "name": "top_genres",
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
  const collection = dao.findCollectionByNameOrId("w3nfs9zv02kgc7h")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "w2etcdpx",
    "name": "top_artists",
    "type": "json",
    "required": false,
    "unique": false,
    "options": {}
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "jdczqlx1",
    "name": "top_genres",
    "type": "json",
    "required": false,
    "unique": false,
    "options": {}
  }))

  // remove
  collection.schema.removeField("9cdpl0ps")

  // remove
  collection.schema.removeField("apwprm25")

  return dao.saveCollection(collection)
})
