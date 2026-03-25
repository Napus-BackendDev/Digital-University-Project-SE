'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var objSchema = new Schema({
    title: [{ key: { type: String, default: null }, value: { type: String, default: null } }],
    description: [{ key: { type: String, default: null }, value: { type: String, default: null } }],
    questions: { type: [{ type: Schema.Types.ObjectId, ref: 'Questions' }], default: [] },
    schedule: {
        startAt: { type: Date, default: null },
        endAt: { type: Date, default: null }
    },
    organization: {
        type: [{ type: Schema.Types.ObjectId, ref: 'Organizations' }],
        default: ["69baf8349050b9215c700b96"]
    },
    allowedEmails: { type: [String], default: [] },
    settings: {
        whoCanRespond: { type: Schema.Types.ObjectId, ref: 'Setting_Respond', default: null },
        collectEmail: { type: Boolean, default: false },
        limitResponse: { type: Boolean, default: false },
        emailNotifications: { type: Boolean, default: false },
        emailMessage: { type: String, default: '' },
        requireResponse: { type: Boolean, default: false },
        confirmMessage: { type: String, default: 'Thank you for completing this survey. Your response has been recorded.' },
        showAnotherResponseLink: { type: Boolean, default: true }
    },
    responses: { type: [{ type: Schema.Types.ObjectId, ref: 'Responses' }], default: [] },
    originalFormId: { type: Schema.Types.ObjectId, ref: 'Forms', default: null },
    creator: { type: Schema.Types.ObjectId, ref: 'Users' },
}, { timestamps: true });

module.exports = mongoose.model('Forms', objSchema, "Forms");
