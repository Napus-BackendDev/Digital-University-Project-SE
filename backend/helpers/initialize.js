'use strict';

var mongoose = require('mongoose');
var cfg = require('../config/config');
var resMsg = require('../config/message');
var mongodb = null;

exports.init = function (callback) {
    mongoose.Promise = global.Promise;

    mongodb = mongoose.connect(cfg.mongoURI
        // If someone not use it, comment it dont delete
        , {
            useNewUrlParser: true,
            useCreateIndex: true,
            useUnifiedTopology: true
        }
    );
    var db = mongoose.connection;
    db.on('error', function (err) {

        return callback(true);
    });

    db.once('open', function () {
        // we're connected!
        global.mongodb = db;

        return callback(true);
    });

    db.on('connected', console.info.bind(console, "MongoDB connection is connected:"))
};
//db.createUser({user:"securitys",pwd:"Zk8K3BE3k8ASEr4A",roles:[{role:"readWrite",db:"securitys"}]})
