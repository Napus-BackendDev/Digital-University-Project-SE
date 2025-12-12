'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var objSchema = new Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    roles: [{ type: Schema.Types.ObjectId, ref: 'Roles' }],
    createdAt: { type: Date, default: Date.now},
    updatedAt: { type: Date, default: Date.now}
});

module.exports = mongoose.model('Users', objSchema, "Users");