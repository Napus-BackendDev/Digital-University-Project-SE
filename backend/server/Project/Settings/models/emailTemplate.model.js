'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var objsSchema = new Schema({
    name            : [{
        key            : {type: String, default: null},
        value          : {type: String, default: null},
    }],
    code            : {type: String, required: true, unique: true}, // e.g., invitationCollaboration, ResponseNotification
    subject         : {type: String, required: true},
    content         : {type: String, required: true}, // HTML template string
    variables       : [{type: String}] // Available dynamic variables, e.g., ['firstName', 'lastName', 'artworkTitle']
}, { timestamps: true });

module.exports = mongoose.model('Setting_EmailTemplate', objsSchema, 'Setting_EmailTemplate');
