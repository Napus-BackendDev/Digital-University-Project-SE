'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var objSchema = new Schema({
    id:{type: Schema.Types.ObjectId},
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    roles: [{ type: Schema.Types.ObjectId, ref: 'roles' }],
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now},
    updatedAt: { type: Date, default: Date.now}
});

module.exports = mongoose.model('users', objSchema, "users");