'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var objSchema = new Schema({
    name: { 
        type: String, 
        required: true,
        uppercase: true,
        unique: true
    },
    description: { type: String },
    permissions: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Roles', objSchema, "roles");