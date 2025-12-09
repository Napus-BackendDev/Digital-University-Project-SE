'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var objSchema = new Schema({
    form: { type: Schema.Types.ObjectId, ref: 'Forms', required: true },
    order: { type: Number, default: 1 },
    title: [
        {
            key: { type: String, required: true },
            value: { type: String, required: true }
        }
    ],
    type: { type: String, required: true }, // enum: ['Text', 'Rating', 'Checkbox', 'Choices']
    required: { type: Boolean, default: false },
}, { discriminatorKey: 'type', collection: 'Questions' });

var RatingSchema = new Schema({
    min: { type: Number, default: 1 },
    max: { type: Number, default: 5 },
    step: { type: Number, default: 1 }
});

var CheckboxSchema = new Schema({
    checked: { type: Boolean, default: false },
});

var ChoicesSchema = new Schema({
    option: { type: Boolean, default: false },
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

var RatingQuestion = Questions.discriminator('Rating', RatingSchema);
var CheckboxQuestion = Questions.discriminator('Checkbox', CheckboxSchema);
var ChoicesQuestion = Questions.discriminator('Choices', ChoicesSchema);

module.exports = {
    Questions,
    RatingQuestion,
    CheckboxQuestion,
    ChoicesQuestion
};