'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var objsSchema = new Schema({
    name            : [{
        key            : {type: String, default: null},
        value          : {type: String, default: null},
    }],
    code            : {type: String, required: true, unique: true}, // e.g., invitationCollaboration, ResponseNotification
    subject         : {type: Schema.Types.Mixed, required: true},
    content         : {type: Schema.Types.Mixed, required: true}, // HTML template string or array of [{key, value}]
    variables       : [{type: String}] // Available dynamic variables, e.g., ['firstName', 'lastName', 'artworkTitle']
}, { timestamps: true });

module.exports = mongoose.model('Setting_EmailTemplate', objsSchema, 'Setting_EmailTemplate');
