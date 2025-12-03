'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var objSchema = new Schema({
    responder: { type: Schema.Types.ObjectId, ref: 'users' },
    form: { type: Schema.Types.ObjectId, ref: 'forms' },
    answers: [{ 
        question: { type: Schema.Types.ObjectId, ref: 'questions' },
        response: { type: Schema.Types.Mixed }
    }],
    submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('responses', objSchema, "responses");