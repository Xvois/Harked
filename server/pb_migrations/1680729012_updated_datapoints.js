migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("w3nfs9zv02kgc7h")

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "vmjj5exl",
    "name": "user_id",
    "type": "text",
    "required": true,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "pattern": ""
    }
  }))

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "jlgikwcp",
    "name": "term",
    "type": "text",
    "required": true,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "pattern": ""
    }
  }))

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "o2zlalvy",
    "name": "top_songs",
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

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "9cdpl0ps",
    "name": "top_artists",
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
    "id": "apwprm25",
    "name": "top_genres",
    "type": "relation",
    "required": true,
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

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "vmjj5exl",
    "name": "user_id",
    "type": "text",
    "required": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "pattern": ""
    }
  }))

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "jlgikwcp",
    "name": "term",
    "type": "text",
    "required": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "pattern": ""
    }
  }))

  // update
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

  // update
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

  // update
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
})
