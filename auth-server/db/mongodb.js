const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

// Connection URL
const url = process.env.MONGODB_CONNECTION_URL

// Database Name
const dbName = process.env.MONGODB_DB_NAME;
const client = new MongoClient(url);

let db = null

// Use connect method to connect to the Server
client.connect(function(err) {
  assert.equal(null, err);
  console.log("Connected successfully to server");

  db = client.db(dbName);
});


exports.get = function() {
  return db
}
