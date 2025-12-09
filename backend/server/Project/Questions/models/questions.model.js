'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var objSchema = new Schema({
    form: [{ type: Schema.Types.ObjectId, ref: 'Forms', required: true }],
    order: { type: Number, default: 1 },
    title: [
        {
            key: { type: String, required: true },
            value: { type: String, required: true }
        }
    ],
    type: { type: String, required: true }, // ['text', 'rating', 'checkbox', 'choices'] 
    required: { type: Boolean, default: false },
    // Config of each question type
    config: { type: Schema.Types.Mixed, default: {} }
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

var Questions = mongoose.model('Questions', objSchema, 'Questions');

module.exports = {
    Questions
};