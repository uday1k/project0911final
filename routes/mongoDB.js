const MongoClient = require('mongodb').MongoClient;
const url = "mongodb://localhost:27017/";

var dbo;

module.exports = {

  connectToServer: function( callback ) {
    MongoClient.connect( url,function( err, db ) {
        if (err) throw err;
        dbo = db.db("onlinejob");
        return callback( err );
    } );
  },

  getDb: function() {
    return dbo;
  }
};