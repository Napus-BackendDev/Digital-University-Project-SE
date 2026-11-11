'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var objSchema = new Schema({
    name: { type: String, default: null },
    email: { type: String, default: null },
    picture: { type: String, default: null },
    password: { type: String, default: null },
    role: { type: Schema.Types.ObjectId, ref: 'Roles', default: "69e9e2226c400846810ef687" },
    organization: { type: Schema.Types.ObjectId, ref: 'Organizations', default: null },
    response: { type: [{ type: Schema.Types.ObjectId, ref: 'Responses' }], default: [] }

}, { timestamps: true });

// Automatically remove sensitive fields when converting to JSON
objSchema.set('toJSON', {
    transform: function(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Users', objSchema, "Users");
