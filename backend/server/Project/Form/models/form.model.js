'use strict'

const cron = require('node-cron');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var objSchema = new Schema({
    // creator : { type: Schema.Types.ObjectId, ref: 'users' },
    title : [{ key: { type: String , default: null}, value: { type: String , default: null}}],
    // questions: [{ type: Schema.Types.ObjectId, ref: 'questions' }],
    can_duplicate: { type: Boolean, default: false },
    // permissionRole: [{ type: Schema.Types.ObjectId, ref: 'roles' }],
    status: { type: String, enum: ['draft', 'open','close'], default: 'draft' },
    schedule: {
        mode: { 
            type: String, 
            enum: ['manual', 'auto'], 
            default: 'manual' 
        },
        startAt: { type: Date, default: null },
        endAt: { type: Date, default: null }
    },
    // responses: [{ type: Schema.Types.ObjectId, ref: 'responses' }],
    // originalFormId: { type: Schema.Types.ObjectId, ref: 'forms', default: null },

}, { timestamps: true});

module.exports = mongoose.model('forms', objSchema, "forms");