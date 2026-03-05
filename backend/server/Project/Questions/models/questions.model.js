'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var objSchema = new Schema({
    form: { type: mongoose.Schema.Types.ObjectId, ref: 'Forms', required: true },
    order: { type: Number, default: 1 },
    title: [{
        _id: false,
        key: { type: String, required: true },
        value: { type: String, required: true }
    }],
    description: [{
        _id: false,
        key: { type: String, default: '' },
        value: { type: String, default: '' }
    }],
    type: { type: mongoose.Schema.Types.ObjectId, ref: 'Question_Types', required: true },
    config: {
        // Multiple Choices / Checkbox
        choices: [{
            _id: false,
            key: { type: String, default: null },
            lang: [{
                _id: false,
                key: { type: String, default: null },
                value: { type: String, default: null }
            }]
        }],
        // Checkbox
        allowMultipleSelect: { type: Boolean, default: null },
        // Rating
        maxRating: { type: Number, default: null },
        // Paragraph
        maxText: { type: Number, default: null },
        // File Upload
        maxFiles: { type: Number, default: null },
        maxFileSize: { type: Number, default: null },
        fileTypes: [{ type: String }],

        // Title / Description
        title: [{
            _id: false,
            key: { type: String, default: null },
            value: { type: String, default: null },
            order: { type: Number, default: 1 }
        }],
        description: [{
            _id: false,
            key: { type: String, default: null },
            value: { type: String, default: null },
            order: { type: Number, default: 1 }
        }],
        // Image
        imageUrl: { type: String, default: null },
    },
    isRequired: { type: Boolean, default: false }
}, { timestamps: true });

// Auto-update Form's questions array when a new Question is created
objSchema.post('save', async function (doc, next) {
    try {
        const form = mongoose.model('Forms');
        await form.findByIdAndUpdate(doc.form, { $push: { questions: doc._id } });
        next();
    } catch (err) {
        next(err);
    }
});

// Auto-remove Question from Form's questions array when a Question is deleted via query
objSchema.pre('deleteMany', async function (next) {
    try {
        const query = this.getQuery();
        if (query._id) {
            const form = mongoose.model('Forms');
            // Pull the Question ID from any Form's questions array
            await form.updateMany(
                { questions: query._id },
                { $pull: { questions: query._id } }
            );
        }
        next();
    } catch (err) {
        next(err);
    }
});

module.exports = mongoose.model('Questions', objSchema, 'Questions');