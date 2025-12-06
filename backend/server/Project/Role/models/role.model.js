'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var objSchema = new Schema({
    id:{type: Schema.Types.ObjectId},
    name: { type: String, required: true },
    description: { type: String  },
    permissions: [{ type: String }]
})
module.exports = mongoose.model('roles', objSchema, "roles");