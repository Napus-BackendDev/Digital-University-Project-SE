'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const { STATUS, ALLOW_STATUS } = require('../service/formStatus'); 
const form = require('../controller/form');

var objSchema = new Schema({
    title : [{ key: { type: String , default: null}, value: { type: String , default: null}}],
    description : [{ key: { type: String , default: null}, value: { type: String , default: null}}],
    questions: { type : [{ type: Schema.Types.ObjectId, ref: 'Questions' }] , default: [] },
    status: { type: String, ref: 'Setting_Status', default: ''},
    schedule: {
        startAt: { type: Date, default: null },
        endAt: { type: Date, default: null }
    },
    responses: { type: [{ type: Schema.Types.ObjectId, ref: 'Responses' }], default: [] },
    originalFormId: { type: Schema.Types.ObjectId, ref: 'Forms', default: null },

    // access_control: [{
    //     response: { type: String, default: null }, 
    //     collaborators: [ { userId: { type: Schema.Types.ObjectId, ref: 'Users' }, role: { type: String, default: 'editor' } } ] // editor, viewer
    // }],

    form_settings: {
        collectEmail: { type: Boolean, default: false },
        limitResponse: { type: Boolean, default: false },
        editSubmit: { type: Boolean, default: false },
        progressBar: { type: Boolean, default: false },
    },

    confirm_message: { 
        message: { type: String, default: 'Your response has been recorded. Thank you!' },
     },
    
}, { timestamps: true });

module.exports = mongoose.model('Forms', objSchema, "Forms");
