'use strict'

const cron = require('node-cron');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Schema สำหรับ Follow-up Question (recursive - ซ้อนกันได้หลายชั้น)
var FollowUpQuestionSchema = new Schema({
    type: { type: String, default: 'multiple-choice' },
    title: { type: String, default: '' },
    required: { type: Boolean, default: false },
    options: { type: Array, default: [] } // options จะมี nested followUpQuestion ได้
}, { _id: false });

// Schema สำหรับ Option (รองรับ follow-up)
var OptionSchema = new Schema({
    id: { type: Number },
    text: { type: String },
    hasFollowUp: { type: Boolean, default: false },
    followUpQuestion: { type: Schema.Types.Mixed, default: null } // ใช้ Mixed เพื่อรองรับ recursive
}, { _id: false });

// Schema สำหรับ Question (embedded document)
var QuestionSchema = new Schema({
    id: { type: Number, required: true },
    type: { type: String, required: true },
    title: { type: String, default: 'Untitled Question' },
    required: { type: Boolean, default: false },
    options: { type: [OptionSchema], default: undefined },
    // สำหรับ rating
    maxRating: { type: Number, default: 5 },
    // สำหรับ file upload
    maxFileSize: { type: Number },
    allowedTypes: [{ type: String }],
    allowSpecificTypes: { type: Boolean, default: false },
    allowedFileTypes: [{ type: String }],
    maxFiles: { type: Number, default: 1 },
    maxSize: { type: Number, default: 10 },
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
    settings: {
        whoCanRespond: { type: String, default: 'anyone' },
        collectEmails: { type: Boolean, default: false },
        limitResponses: { type: Boolean, default: false },
        maxResponses: { type: Number, default: 100 },
        showProgressBar: { type: Boolean, default: true },
        confirmationMessage: { type: String, default: 'Thank you for completing this survey. Your response has been recorded.' },
        showAnotherResponseLink: { type: Boolean, default: true }
    },
    responses: { type: [{ type: Schema.Types.ObjectId, ref: 'Responses' }], default: [] },
    originalFormId: { type: Schema.Types.ObjectId, ref: 'Forms', default: null },

}, { timestamps: true });

module.exports = mongoose.model('Forms', objSchema, "Forms");