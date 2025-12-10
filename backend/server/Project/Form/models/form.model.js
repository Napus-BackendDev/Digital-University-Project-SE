'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const { STATUS, ALLOW_STATUS } = require('../service/formStatus'); 

var objSchema = new Schema({
    title : [{ key: { type: String , default: null}, value: { type: String , default: null}}],
    // questions: { type : [{ type: Schema.Types.ObjectId, ref: 'Questions' }] , default: [] },
    can_duplicate: { type: Boolean, default: false },
    status: { type: String, default: STATUS.DRAFT, validate: { validator: v => ALLOW_STATUS.includes(v), message: 'invalid status'} },
    schedule: {
        startAt: { type: Date, default: null },
        endAt: { type: Date, default: null }
    },
    duplicatedForms: { type: [{ type: Schema.Types.ObjectId, ref: 'Forms' }] , default: [] },
    originalFormId: { type: Schema.Types.ObjectId, ref: 'Forms', default: null },
    
}, { timestamps: true });

objSchema.post('save', async function (doc, next) {
    try {
        if (!doc.originalFormId) return next();
        const Form = mongoose.model('Forms');

        await Form.findByIdAndUpdate(doc.originalFormId, { $addToSet: { duplicatedForms: doc._id } });
        next();
    } catch (err) {
        next(err);
    }
})

module.exports = mongoose.model('Forms', objSchema, "Forms");
