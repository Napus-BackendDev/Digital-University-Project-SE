'use strict';

var mongoose = require('mongoose');
var cfg = require('../config/config');
var resMsg = require('../config/message');
var mongodb = null;

exports.init = async function (callback) {
    try {
        mongoose.Promise = global.Promise;

        console.log("MongoURI:", cfg.mongoURI);

        await mongoose.connect(cfg.mongoURI);

        console.log("✅ MongoDB connected");

        const db = mongoose.connection;
        global.mongodb = db;

        return callback(true);

    } catch (err) {
        console.error("❌ MongoDB error:", err);
        return callback(false);
    }
};
//db.createUser({user:"securitys",pwd:"Zk8K3BE3k8ASEr4A",roles:[{role:"readWrite",db:"securitys"}]})
