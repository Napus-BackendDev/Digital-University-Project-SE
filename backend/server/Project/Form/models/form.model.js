'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var objSchema = new Schema({
    title: [{ key: { type: String, default: null }, value: { type: String, default: null } }],
    description: [{ key: { type: String, default: null }, value: { type: String, default: null } }],
    questions: { type: [{ type: Schema.Types.ObjectId, ref: 'Questions' }], default: [] },
    schedule: {
        isPublished: { type: Boolean, default: false },
        mode: {
            type: String,
            enum: ['always', 'range', 'end_only', 'scheduled'],
            default: 'always'
        },
        startAt: { type: Date, default: null },
        endAt: { type: Date, default: null }
    },
    organization: {
        type: [{ type: Schema.Types.ObjectId, ref: 'Organizations' }],
        default: []
    },
    collaborator: [{
        user: { type: Schema.Types.ObjectId, ref: 'Users' },
        type: { type: Schema.Types.ObjectId, ref: 'Setting_Collaborator' }
    }],
    settings: {
        accessMode: { type: String, enum: ['private', 'public'], default: null },
        collectEmail: { type: Boolean, default: false },
        limitResponse: { type: Boolean, default: false },
        allowEditAfterSubmit: { type: Boolean, default: false },
        maxResponses: { type: Number, default: null },
        emailNotifications: { type: Boolean, default: false },
        emailMessage: { type: String, default: '' },
        notifyCreator: { type: Boolean, default: false },
        requireResponse: { type: Boolean, default: false },
        confirmMessage: { type: String, default: 'Thank you for completing this survey. Your response has been recorded.' },
        showAnotherResponseLink: { type: Boolean, default: true },
        allowedUser: { type: [{ type: Schema.Types.ObjectId, ref: 'Users' }], default: [] },
        allowedEmails: { type: [String], default: [] },
        requireLogin: { type: Boolean, default: false },
        allowedRoles: { type: [{ type: Schema.Types.ObjectId, ref: 'Roles' }], default: [] },
        contactOrganization: { type: String, default: '' },
        contactEmail: { type: String, default: '' }
    },
    responses: { type: [{ type: Schema.Types.ObjectId, ref: 'Responses' }], default: [] },
    originalFormId: { type: Schema.Types.ObjectId, ref: 'Forms', default: null, index: true },
    creator: { type: Schema.Types.ObjectId, ref: 'Users' },
    status: { type: Schema.Types.ObjectId, ref: 'Setting_Status' },
}, { 
    timestamps: true,
    toJSON: {virtuals:true},
    toObject: {virtuals:true}
 });


objSchema.virtual("responsesCount",{
    ref: "Responses",
    localField: "_id",
    foreignField: "form",
    count: true,
    match: { submit: true }
});

module.exports = mongoose.model('Forms', objSchema, "Forms");
