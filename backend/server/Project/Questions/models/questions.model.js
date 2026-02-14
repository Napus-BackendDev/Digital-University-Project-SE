'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var objSchema = new Schema({
    form: { type: mongoose.Schema.Types.ObjectId, ref: 'Forms', required: true },
    order: { type: Number, default: 1 },
    title: [{
        _id: false,
        key: { type: String, required: true },
        value: { type: String, required: true }
    }],
    type: { type: mongoose.Schema.Types.ObjectId, ref: 'Question_Types', required: true },
    config: {
        choices: [{
            _id: false,
            choice: { type: String, default: null },
            value: [{
                _id: false,
                key: { type: String, default: null },
                label: { type: String, default: null }
            }]
        }],
        allowMultipleSelect: { type: Boolean, default: false },
        maxRate: { type: Number, default: null },
        maxText: { type: Number, default: null },
        maxFileNumber: { type: Number, default: null },
        maxFileSize: { type: Number, default: null },
    },
    isRequired: { type: Boolean, default: false }
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