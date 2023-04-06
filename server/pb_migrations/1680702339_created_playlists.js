migrate((db) => {
  const collection = new Collection({
    "id": "kl6jr7ad6g6twr8",
    "created": "2023-04-05 13:45:39.750Z",
    "updated": "2023-04-05 13:45:39.750Z",
    "name": "playlists",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "nuaznira",
        "name": "name",
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
        "id": "9a0jmpt9",
        "name": "description",
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
      },
      {
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
  const collection = dao.findCollectionByNameOrId("kl6jr7ad6g6twr8");

  return dao.deleteCollection(collection);
})
