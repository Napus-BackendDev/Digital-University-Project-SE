'use strict'

const cron = require('node-cron');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var objSchema = new Schema({
    title: [
        {
            key: { type: String, default: null },
            value: { type: String, default: null }
        }
    ],
    questions: { type: [{ type: Schema.Types.ObjectId, ref: 'Questions' }], default: [] },
    can_duplicate: { type: Boolean, default: false },
    status: { type: String, default: 'draft' }, // ['draft', 'open', 'close']
    schedule: {
        startAt: { type: Date, default: null },
        endAt: { type: Date, default: null }
    },
    responses: { type: [{ type: Schema.Types.ObjectId, ref: 'Responses' }], default: [] },
    originalFormId: { type: Schema.Types.ObjectId, ref: 'Forms', default: null },

}, { timestamps: true });

module.exports = mongoose.model('Forms', objSchema, "Forms");