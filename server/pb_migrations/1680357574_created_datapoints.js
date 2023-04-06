migrate((db) => {
  const collection = new Collection({
    "id": "w3nfs9zv02kgc7h",
    "created": "2023-04-01 13:59:34.478Z",
    "updated": "2023-04-01 13:59:34.478Z",
    "name": "datapoints",
    "type": "base",
    "system": false,
    "schema": [
      {
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
      },
      {
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
      },
      {
        "system": false,
        "id": "c3hxhuoc",
        "name": "top_songs",
        "type": "json",
        "required": false,
        "unique": false,
        "options": {}
      },
      {
        "system": false,
        "id": "w2etcdpx",
        "name": "top_artists",
        "type": "json",
        "required": false,
        "unique": false,
        "options": {}
      },
      {
        "system": false,
        "id": "jdczqlx1",
        "name": "top_genres",
        "type": "json",
        "required": false,
        "unique": false,
        "options": {}
      }
    ],
    "indexes": [],
    "listRule": null,
    "viewRule": null,
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("w3nfs9zv02kgc7h");

  return dao.deleteCollection(collection);
})
