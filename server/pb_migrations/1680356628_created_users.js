migrate((db) => {
  const collection = new Collection({
    "id": "h7dmi7gxscp2mxo",
    "created": "2023-04-01 13:43:48.638Z",
    "updated": "2023-04-01 13:43:48.638Z",
    "name": "users",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "ii95bjix",
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
        "id": "eh3wt37j",
        "name": "username",
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
        "id": "7awei0g2",
        "name": "picture_url",
        "type": "url",
        "required": false,
        "unique": false,
        "options": {
          "exceptDomains": null,
          "onlyDomains": null
        }
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
  const collection = dao.findCollectionByNameOrId("h7dmi7gxscp2mxo");

  return dao.deleteCollection(collection);
})
