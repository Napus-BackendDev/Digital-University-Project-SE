'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var smtpConfigSchema = new Schema({
    key: { type: String, required: true, unique: true, default: 'default' },
    host: { type: String, default: '' },
    port: { type: Number, default: 587 },
    secureMode: {
        type: String,
        enum: ['auto', 'tls', 'starttls', 'none'],
        default: 'auto'
    },
    username: { type: String, default: '' },
    passwordEncrypted: { type: String, default: '' },
    appName: { type: String, default: 'Digital University' },
    senderEmail: { type: String, default: '' },
    enabled: { type: Boolean, default: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'Users', default: null }
}, { timestamps: true });

module.exports = mongoose.model('Setting_SmtpConfig', smtpConfigSchema, 'Setting_SmtpConfig');
