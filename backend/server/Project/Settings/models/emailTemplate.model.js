'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var objsSchema = new Schema({
    owner           : { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    name            : [{
        key            : { type: String, default: null },
        value          : { type: String, default: null },
    }],
    code            : { type: String, required: true }, // e.g., invitationCollaboration, ResponseNotification
    subject         : { type: String, required: true },
    content         : { type: String, required: true }, // HTML template string
    variables       : [{ type: String }] // Available dynamic variables for this trigger
}, { timestamps: true });

// Each account owns at most one template document per trigger code (owner: null holds system defaults)
objsSchema.index({ owner: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Setting_EmailTemplate', objsSchema, 'Setting_EmailTemplate');
