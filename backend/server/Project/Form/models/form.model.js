'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var objSchema = new Schema({
    title: [{ key: { type: String, default: null }, value: { type: String, default: null } }],
    description: [{ key: { type: String, default: null }, value: { type: String, default: null } }],
    questions: { type: [{ type: Schema.Types.ObjectId, ref: 'Questions' }], default: [] },
    status: { type: Schema.Types.ObjectId, ref: 'Setting_Status', default: '689c04cb255db4e56aea88ef' },
    schedule: {
        startAt: { type: Date, default: null },
        endAt: { type: Date, default: null }
    },
    settings: {
        whoCanRespond: { type: Schema.Types.ObjectId, ref: 'Setting_Respond', default: null },
        accessType: { type: String, default: 'Anyone with the link' },
        newCollaborator: {
            email: { type: String, default: '' },
            role: { type: String, default: 'Editor' }
        },
        startDateTime: { type: String, default: '' },
        endDateTime: { type: String, default: '' },
        collectEmail: { type: Boolean, default: false },
        limitResponse: { type: Boolean, default: false },
        allowEditing: { type: Boolean, default: false },
        progressBar: { type: Boolean, default: false },
        confirmMessage: { type: String, default: 'Thank you for completing this survey. Your response has been recorded.' },
        showAnotherResponseLink: { type: Boolean, default: true }
    },
    responses: { type: [{ type: Schema.Types.ObjectId, ref: 'Responses' }], default: [] },
    originalFormId: { type: Schema.Types.ObjectId, ref: 'Forms', default: null },

}, { timestamps: true });

module.exports = mongoose.model('Forms', objSchema, "Forms");
