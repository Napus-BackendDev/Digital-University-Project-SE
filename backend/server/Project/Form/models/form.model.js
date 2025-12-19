'use strict'

const cron = require('node-cron');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Schema สำหรับ Question (embedded document)
var QuestionSchema = new Schema({
    id: { type: Number, required: true },
    type: { type: String, required: true },
    title: { type: String, default: 'Untitled Question' },
    required: { type: Boolean, default: false },
    options: [{
        id: { type: Number },
        text: { type: String }
    }],
    // สำหรับ rating
    maxRating: { type: Number, default: 5 },
    // สำหรับ file upload
    maxFileSize: { type: Number },
    allowedTypes: [{ type: String }],
    // สำหรับ image/video
    imageUrl: { type: String },
    videoUrl: { type: String },
    caption: { type: String }
}, { _id: false });

var objSchema = new Schema({
    title: [
        {
            key: { type: String, default: null },
            value: { type: String, default: null }
        }
    ],
    description: { type: String, default: '' },
    questions: { type: [QuestionSchema], default: [] },
    can_duplicate: { type: Boolean, default: false },
    status: { type: String, default: 'draft' }, // ['draft', 'open', 'closed', 'scheduled']
    schedule: {
        startAt: { type: Date, default: null },
        endAt: { type: Date, default: null }
    },
    responses: { type: [{ type: Schema.Types.ObjectId, ref: 'Responses' }], default: [] },
    originalFormId: { type: Schema.Types.ObjectId, ref: 'Forms', default: null },

}, { timestamps: true });

module.exports = mongoose.model('Forms', objSchema, "Forms");