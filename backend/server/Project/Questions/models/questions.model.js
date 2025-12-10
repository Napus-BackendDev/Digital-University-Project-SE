'use strict';

const QUESTION_TYPE = require('../service/questiontype');

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var objSchema = new Schema({
    // form: [{ type: Schema.Types.ObjectId, ref: 'Forms', required: true }],
    order: { type: Number, default: 1 },
    title: [
        {
            _id: false,
            key: { type: String, required: true },
            value: { type: String, required: true }
        }
    ],
    type: {
        type: String,
        required: true,
        validate: {
            validator: (value) => Object.values(QUESTION_TYPE).includes(value), // ['text', 'rating', 'checkbox', 'choices'] 
            message: props => `${props.value} is not a valid question type!`
        }
    },
    required: { type: Boolean, default: false },
    config: { type: Schema.Types.Mixed, default: {} } // Config of each question type
}, { timestamps: true });

// Auto-update Form's questions array when a new Question is created
// objSchema.post('save', async function (doc, next) {
//     try {
//         const form = mongoose.model('Forms');
//         await form.findByIdAndUpdate(doc.form, { $push: { questions: doc._id } });
//         next();
//     } catch (err) {
//         next(err);
//     }
// })

var Questions = mongoose.model('Questions', objSchema, 'Questions');

module.exports = {
    Questions
};