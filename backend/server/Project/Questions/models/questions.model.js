'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var objSchema = new Schema({
    form: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Forms',
            required: true
        }
    ],
    order: { type: Number, default: 1 },
    title: [
        {
            key: { type: String, required: true },
            value: { type: String, required: true }
        }
    ],
    type: { type: String, required: true }, // ['text', 'rating', 'checkbox', 'choices'] 
    required: { type: Boolean, default: false },
}, { discriminatorKey: 'type', collection: 'Questions' });

var TextSchema = new Schema({
    questionTitle: [
        {
            key: { type: String, required: true },
            value: { type: String, required: true }
        }
    ],
    textType: { type: String, default: 'short_answer' }, // ['short_answer', 'paragraph']
    maxLength: { type: Number, default: 500 },
});

var RatingSchema = new Schema({
    questionTitle: [
        {
            key: { type: String, required: true },
            value: { type: String, required: true }
        }
    ],
    min: { type: Number, default: 1 },
    max: { type: Number, default: 5 },
    step: { type: Number, default: 1 }
});

var CheckboxSchema = new Schema({
    questionTitle: [
        {
            key: { type: String, required: true },
            value: { type: String, required: true }
        }
    ],
    options: [
        {
            key: { type: String, required: true },
            value: { type: String, required: true },
            checked: { type: Boolean, default: false },
        }
    ],
});

var ChoicesSchema = new Schema({
    questionTitle: [
        {
            key: { type: String, required: true },
            value: { type: String, required: true }
        }
    ],
    options: [
        {
            key: { type: String, required: true },
            value: { type: String, required: true }
        }
    ],
    isQuestion: { type: Boolean, default: false },
    subQuestion: [{ type: Schema.Types.ObjectId, ref: 'Questions' }]
});

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

var TextQuestion = Questions.discriminator('text', TextSchema);
var RatingQuestion = Questions.discriminator('rating', RatingSchema);
var CheckboxQuestion = Questions.discriminator('checkbox', CheckboxSchema);
var ChoicesQuestion = Questions.discriminator('choices', ChoicesSchema);

module.exports = {
    Questions,
    TextQuestion,
    RatingQuestion,
    CheckboxQuestion,
    ChoicesQuestion
};