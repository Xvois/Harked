migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("pv9gax2vt2oiyjz")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "yup9hhok",
    "name": "analytics",
    "type": "json",
    "required": false,
    "unique": false,
    "options": {}
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("pv9gax2vt2oiyjz")

  // remove
  collection.schema.removeField("yup9hhok")

  return dao.saveCollection(collection)
})
