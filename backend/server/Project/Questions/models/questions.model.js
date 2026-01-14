'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var objSchema = new Schema({
    form: [{ type: Schema.Types.ObjectId, ref: 'Forms', required: true }],
    order: { type: Number, default: 1 },
    title: [
        {
            _id: false,
            key: { type: String, required: true },
            value: { type: String, required: true }
        }
    ],
    type: { type: mongoose.Schema.Types.ObjectId, ref: 'Question_Types', required: true },
    config: { type: mongoose.Schema.Types.Mixed, default: {} },
    required: { type: Boolean, default: false },
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