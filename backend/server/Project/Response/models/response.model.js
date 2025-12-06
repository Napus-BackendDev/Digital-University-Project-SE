'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var objSchema = new Schema({
    responder_id: {type: Schema.Types.ObjectId, ref: 'users'},
    form: { type: Schema.Types.ObjectId, ref: 'forms' },
    answers: [{ 
        question: { type: Schema.Types.ObjectId, ref: 'Questions' },
        response: { type: Schema.Types.Mixed }
    }],
    submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('responses', objSchema, "responses");