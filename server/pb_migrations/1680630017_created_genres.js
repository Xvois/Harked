migrate((db) => {
  const collection = new Collection({
    "id": "2wusql9pqxt19ic",
    "created": "2023-04-04 17:40:17.162Z",
    "updated": "2023-04-04 17:40:17.162Z",
    "name": "genres",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "4bbmvunm",
        "name": "genre",
        "type": "text",
        "required": true,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      }
    ],
    "indexes": [
      "CREATE UNIQUE INDEX `idx_23MjoPi` ON `genres` (`genre`)"
    ],
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
  const collection = dao.findCollectionByNameOrId("2wusql9pqxt19ic");

  return dao.deleteCollection(collection);
})
