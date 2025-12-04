'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var objSchema = new Schema({
    form: { type: Schema.Types.ObjectId, ref: 'Forms' },
    order: { type: Number, default: 1 },
    questionText: { type: String, required: true },
    type: { type: String, enum: ['Text', 'Rating', 'Checkbox', 'Choices'], required: true },
    required: { type: Boolean, default: false },
}, { discriminatorKey: 'type', collection: 'Questions' });

var TextSchema = new Schema({
    subquestionText: { type: String, required: true }
});

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

objSchema.post('save', async function (doc, next) {
    try {
        const Form = mongoose.model('Forms');
        await Form.findByIdAndUpdate(doc.form, { $push: { questions: doc._id } });
        next();
    } catch (err) {
        next(err);
    }
}) 

var Questions = mongoose.model('Questions', objSchema, 'Questions');

var TextQuestion = Questions.discriminator('Text', TextSchema);
var RatingQuestion = Questions.discriminator('Rating', RatingSchema);
var CheckboxQuestion = Questions.discriminator('Checkbox', CheckboxSchema);
var ChoicesQuestion = Questions.discriminator('Choices', ChoicesSchema);

module.exports = {
    Questions,
    TextQuestion,
    RatingQuestion,
    CheckboxQuestion,
    ChoicesQuestion
};