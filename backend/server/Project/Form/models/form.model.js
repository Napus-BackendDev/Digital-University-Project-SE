'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var objSchema = new Schema({
    title: [
        {
            key: { type: String, default: null },
            value: { type: String, default: null }
        }
    ],
    questions: { type: [{ type: Schema.Types.ObjectId, ref: 'Questions' }], default: [] },
    can_duplicate: { type: Boolean, default: false },
    status: { type: String, default: 'draft' }, // ['draft', 'open', 'close']
    schedule: {
        startAt: { type: Date, default: null },
        endAt: { type: Date, default: null }
    },
    settings: {
        whoCanRespond: { type: String, default: 'anyone' },
        collectEmails: { type: Boolean, default: false },
        limitResponses: { type: Boolean, default: false },
        maxResponses: { type: Number, default: 100 },
        showProgressBar: { type: Boolean, default: true },
        confirmationMessage: { type: String, default: 'Thank you for completing this survey. Your response has been recorded.' },
        showAnotherResponseLink: { type: Boolean, default: true }
    },
    responses: { type: [{ type: Schema.Types.ObjectId, ref: 'Responses' }], default: [] },
    childrenForms: { type: [{ type: Schema.Types.ObjectId, ref: 'Forms' }] , default: [] },
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
        link: { type: String, default: null },
     },
    
}, { timestamps: true });

objSchema.post('save', async function (doc, next) {
    try {
        if (!doc.originalFormId) return next();
        const Form = mongoose.model('Forms');

        await Form.findByIdAndUpdate(doc.originalFormId, { $addToSet: { childrenForms: doc._id } });
        next();
    } catch (err) {
        next(err);
    }
})

module.exports = mongoose.model('Forms', objSchema, "Forms");
