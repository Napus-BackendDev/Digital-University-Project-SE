'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var questionSchema = new Schema({
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

var Questions = mongoose.model('Questions', questionSchema);

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