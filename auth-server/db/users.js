const mongodb = require('./mongodb')
const ObjectId = require('mongodb').ObjectId

exports.findById = function(id, cb) {
  const collection = mongodb.get().collection('users');
  return collection.findOne( {_id: ObjectId(id)}, cb)
}

exports.findByEmail = function(email, cb) {
  const collection = mongodb.get().collection('users');
  return collection.findOne({email: email}, cb);
}

exports.create = function(user, cb) {
  return exports.findByEmail(user.email, (err, user) => {
    if (err) {return cb(err, null)}
    if (user) {return cb(new Error("User already exists"), null)}

    const collection = mongodb.get().collection('users');
    return collection.insert(user, cb);
  })
}
