migrate((db) => {
  const collection = new Collection({
    "id": "d5kpanvycoam44i",
    "created": "2023-04-04 17:46:21.823Z",
    "updated": "2023-04-04 17:46:21.823Z",
    "name": "artists",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "3xiivbke",
        "name": "artist_id",
        "type": "text",
        "required": true,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "nhvgtesn",
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
        "id": "z4obwbid",
        "name": "image",
        "type": "url",
        "required": false,
        "unique": false,
        "options": {
          "exceptDomains": null,
          "onlyDomains": null
        }
      },
      {
        "system": false,
        "id": "bzl2av4t",
        "name": "link",
        "type": "url",
        "required": false,
        "unique": false,
        "options": {
          "exceptDomains": null,
          "onlyDomains": null
        }
      },
      {
        "system": false,
        "id": "ufc8emaq",
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
  const collection = dao.findCollectionByNameOrId("d5kpanvycoam44i");

  return dao.deleteCollection(collection);
})
