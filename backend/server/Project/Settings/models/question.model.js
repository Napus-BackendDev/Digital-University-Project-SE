'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var objsSchema = new Schema({
    title: [{
        _id: false,
        key: { type: String, default: null },
        value: { type: String, default: null },
    }],
    description: [{
        _id: false,
        key: { type: String, default: null },
        value: { type: String, default: null },
    }],
    config: { type: mongoose.Schema.Types.Mixed, default: {} },
    create: {
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'Information_Accounts' },
        datetime: { type: Date, default: Date.now }
    },
});

module.exports = mongoose.model('Question_Types', objsSchema, 'Question_Types');
