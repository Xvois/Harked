migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("kl6jr7ad6g6twr8")

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "6182cynt",
    "name": "playlist_id",
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
    "id": "srqmizqc",
    "name": "owner",
    "type": "relation",
    "required": true,
    "unique": false,
    "options": {
      "collectionId": "h7dmi7gxscp2mxo",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": 1,
      "displayFields": []
    }
  }))

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
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("kl6jr7ad6g6twr8")

  // update
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

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "srqmizqc",
    "name": "owner",
    "type": "relation",
    "required": false,
    "unique": false,
    "options": {
      "collectionId": "h7dmi7gxscp2mxo",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": 1,
      "displayFields": []
    }
  }))

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "kbfr9osh",
    "name": "tracks",
    "type": "relation",
    "required": false,
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
