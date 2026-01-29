'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var objSchema = new Schema({
    title : [{ key: { type: String , default: null}, value: { type: String , default: null}}],
    description : [{ key: { type: String , default: null}, value: { type: String , default: null}}],
    questions: { type : [{ type: Schema.Types.ObjectId, ref: 'Questions' }] , default: [] },
    status: { type: String, ref: 'Setting_Status', default: ''},
    schedule: {
        startAt: { type: Date, default: null },
        endAt: { type: Date, default: null }
    },
    settings: {
        whoCanRespond: { type: String, ref: 'Setting_Respond', default: '' },
        collectEmail: { type: Boolean, default: false },
        limitResponse: { type: Boolean, default: false },
        progressBar: { type: Boolean, default: false },
        confirmMessage: { type: String, default: 'Thank you for completing this survey. Your response has been recorded.' },
        showAnotherResponseLink: { type: Boolean, default: true }
    },
    respolinnses: { type: [{ type: Schema.Types.ObjectId, ref: 'Responses' }], default: [] },
    originalFormId: { type: Schema.Types.ObjectId, ref: 'Forms', default: null },

}, { timestamps: true });

module.exports = mongoose.model('Forms', objSchema, "Forms");
