'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var objSchema = new Schema({
    form: { type: Schema.Types.ObjectId, ref: 'Forms', required: true },
    order: { type: Number, default: 1 },
    title: [
        {
            _id: false,
            key: { type: String, required: true },
            value: { type: String, required: true }
        }
    ],
    type: { type: mongoose.Schema.Types.ObjectId, ref: 'Question_Types', required: true },
    config: {
        options: [
            {
                key: { type: String, default: null },
                value: { type: String, default: null }
            }
        ],
        allowMultipleSelect: { type: Boolean, default: false },
        maxRate: { type: Number, default: null },
        maxText: { type: Number, default: null },
    },
    required: { type: Boolean, default: false },
    answers: [
        {
            id: false,
            respondent: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
            answer: { type: Schema.Types.Mixed, required: true },
            datetime: { type: Date, default: Date.now }
        }
    ]
}, { timestamps: true });

// Auto-update Form's questions array when a new Question is created
objSchema.post('save', async function (doc, next) {
    try {
        const form = mongoose.model('Forms');
        await form.findByIdAndUpdate(doc.form, { $push: { questions: doc._id } });
        next();
    } catch (err) {
        next(err);
    }
})

module.exports = mongoose.model('Questions', objSchema, 'Questions');