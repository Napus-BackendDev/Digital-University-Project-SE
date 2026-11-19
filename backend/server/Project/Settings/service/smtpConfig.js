'use strict';

const mongo = require('mongodb');
const SmtpConfigModel = require('../models/smtpConfig.model');
const UserModel = require('../../User/models/user.model');
const resMsg = require('./message');
const mailer = require('../../../../helpers/google/Mail');
const {
    isAdminUser,
    isDeveloperEnv,
    resolveReadScopeUserId
} = require('../../Response/utils/responsePolicy');
const { isValidEmailAddress } = require('../utils/emailTemplateDefaults');
const {
    encryptSecret,
    decryptSecret,
    normalizeSmtpPort,
    normalizeSecureMode,
    sanitizeHeaderDisplayName,
    getEnvSmtpDefaults,
    sanitizeSmtpConfigResponse
} = require('../utils/smtpCrypto');

async function requireAdminCaller(request, response) {
    const body = (request && request.body) || {};
    const query = (request && request.query) || {};
    const scoped = resolveReadScopeUserId({
        request,
        fallbackId: query.userId || body.userId
    });
    if (!scoped || !scoped.userId || !mongo.ObjectId.isValid(scoped.userId)) {
        response.status(401).json({
            code: 40100,
            message: 'Authentication required for SMTP settings'
        });
        return null;
    }

    const userDoc = await UserModel.findById(scoped.userId)
        .select('_id name email role')
        .populate('role', 'title')
        .lean()
        .catch(() => null);

    if (!userDoc || !isAdminUser(userDoc)) {
        response.status(403).json({
            code: 40300,
            message: 'Admin privileges required for SMTP settings'
        });
        return null;
    }

    return userDoc;
}

function getDevRedirectNotice() {
    if (!isDeveloperEnv()) return '';
    return String(process.env.SMTP_REDIRECT_TO || '').trim();
}

exports.onGet = async function (request, response) {
    try {
        const adminDoc = await requireAdminCaller(request, response);
        if (!adminDoc) return;

        const dbDoc = await SmtpConfigModel.findOne({ key: 'default' }).lean().catch(() => null);
        const sanitized = sanitizeSmtpConfigResponse(dbDoc, getEnvSmtpDefaults(), getDevRedirectNotice());
        const resData = await resMsg.onMessage_Response(0, 20000);
        resData.data = sanitized;
        return response.status(200).json(resData);
    } catch (err) {
        console.error('[SMTP Config] onGet Error:', err);
        return response.status(500).json({
            code: 50000,
            message: err.message || 'Failed to load SMTP configuration'
        });
    }
};

exports.onUpdate = async function (request, response) {
    try {
        const adminDoc = await requireAdminCaller(request, response);
        if (!adminDoc) return;

        const body = (request && request.body) || {};
        const host = String(body.host || '').trim();
        if (!host) {
            return response.status(400).json({
                code: 40000,
                message: 'SMTP Host is required'
            });
        }

        const port = normalizeSmtpPort(body.port, 587);
        if (port === null) {
            return response.status(400).json({
                code: 40000,
                message: 'SMTP Port must be a valid integer between 1 and 65535'
            });
        }

        const username = String(body.username || '').trim();
        const senderEmail = String(body.senderEmail || username || '').trim();
        if (senderEmail && !isValidEmailAddress(senderEmail)) {
            return response.status(400).json({
                code: 40000,
                message: 'Sender Email must be a valid email address'
            });
        }

        const appName = sanitizeHeaderDisplayName(body.appName, 'Digital University');
        const secureMode = normalizeSecureMode(body.secureMode);
        const enabled = body.enabled !== undefined ? Boolean(body.enabled) : true;

        const existingDoc = await SmtpConfigModel.findOne({ key: 'default' }).lean().catch(() => null);
        let passwordEncrypted = (existingDoc && existingDoc.passwordEncrypted) || '';

        if (body.clearPassword === true) {
            passwordEncrypted = '';
        } else if (typeof body.password === 'string' && body.password.trim() !== '') {
            passwordEncrypted = encryptSecret(body.password);
        }

        const updatePayload = {
            key: 'default',
            host,
            port,
            secureMode,
            username,
            passwordEncrypted,
            appName,
            senderEmail,
            enabled,
            updatedBy: adminDoc._id
        };

        const updatedDoc = await SmtpConfigModel.findOneAndUpdate(
            { key: 'default' },
            { $set: updatePayload },
            { upsert: true, new: true, lean: true }
        );

        const resData = await resMsg.onMessage_Response(0, 20000);
        resData.data = sanitizeSmtpConfigResponse(updatedDoc, getEnvSmtpDefaults(), getDevRedirectNotice());
        return response.status(200).json(resData);
    } catch (err) {
        console.error('[SMTP Config] onUpdate Error:', err);
        return response.status(500).json({
            code: 50000,
            message: err.message || 'Failed to save SMTP configuration'
        });
    }
};

exports.onReset = async function (request, response) {
    try {
        const adminDoc = await requireAdminCaller(request, response);
        if (!adminDoc) return;

        await SmtpConfigModel.deleteOne({ key: 'default' });
        const resData = await resMsg.onMessage_Response(0, 20000);
        resData.data = sanitizeSmtpConfigResponse(null, getEnvSmtpDefaults(), getDevRedirectNotice());
        return response.status(200).json(resData);
    } catch (err) {
        console.error('[SMTP Config] onReset Error:', err);
        return response.status(500).json({
            code: 50000,
            message: err.message || 'Failed to reset SMTP configuration'
        });
    }
};

exports.onTestConnection = async function (request, response) {
    try {
        const adminDoc = await requireAdminCaller(request, response);
        if (!adminDoc) return;

        const body = (request && request.body) || {};
        const dbDoc = await SmtpConfigModel.findOne({ key: 'default' }).lean().catch(() => null);
        const envDefaults = getEnvSmtpDefaults();

        const hasDraftHost = Object.prototype.hasOwnProperty.call(body, 'host') && String(body.host || '').trim() !== '';
        const host = hasDraftHost ? String(body.host).trim() : ((dbDoc && dbDoc.host) || envDefaults.host);
        if (!host) {
            return response.status(400).json({
                code: 40000,
                message: 'SMTP Host is required to test connection'
            });
        }

        const port = normalizeSmtpPort(
            Object.prototype.hasOwnProperty.call(body, 'port') ? body.port : (dbDoc && dbDoc.port),
            envDefaults.port
        );
        if (port === null) {
            return response.status(400).json({
                code: 40000,
                message: 'SMTP Port must be a valid integer between 1 and 65535'
            });
        }

        const username = Object.prototype.hasOwnProperty.call(body, 'username')
            ? String(body.username || '').trim()
            : String((dbDoc && dbDoc.username) || envDefaults.username || '').trim();

        const clearPassword = body.clearPassword === true;
        let password = '';
        if (!clearPassword) {
            if (typeof body.password === 'string' && body.password.trim() !== '') {
                password = body.password;
            } else if (dbDoc && dbDoc.passwordEncrypted) {
                password = decryptSecret(dbDoc.passwordEncrypted);
            } else if (!hasDraftHost) {
                password = envDefaults.password;
            }
        }

        const secureMode = Object.prototype.hasOwnProperty.call(body, 'secureMode')
            ? normalizeSecureMode(body.secureMode)
            : normalizeSecureMode((dbDoc && dbDoc.secureMode) || envDefaults.secureMode);

        const appName = sanitizeHeaderDisplayName(
            Object.prototype.hasOwnProperty.call(body, 'appName') ? body.appName : (dbDoc && dbDoc.appName) || envDefaults.appName,
            'Digital University'
        );

        const rawSender = Object.prototype.hasOwnProperty.call(body, 'senderEmail')
            ? String(body.senderEmail || '').trim()
            : String((dbDoc && dbDoc.senderEmail) || '').trim();
        const senderEmail = rawSender || username || envDefaults.senderEmail || 'no-reply@mfu.ac.th';
        if (!isValidEmailAddress(senderEmail)) {
            return response.status(400).json({
                code: 40000,
                message: 'Sender Email must be a valid email address'
            });
        }

        const requestedTo = String(body.testTo || '').trim();
        const testTo = requestedTo || String(adminDoc.email || '').trim();
        if (!isValidEmailAddress(testTo)) {
            return response.status(400).json({
                code: 40000,
                message: 'Valid recipient email address is required for SMTP test'
            });
        }

        const overrideConfig = {
            host,
            port,
            secureMode,
            username,
            password,
            appName,
            senderEmail,
            enabled: true
        };

        const result = await mailer.verifyAndTestSmtp(overrideConfig, testTo, {
            adminName: adminDoc.name || adminDoc.email || 'Admin'
        });

        const resData = await resMsg.onMessage_Response(0, 20000);
        resData.data = {
            verified: Boolean(result && result.verified),
            sent: Boolean(result && result.sent),
            to: (result && result.redirectedTo) || testTo,
            originalTo: testTo,
            effectiveFrom: `"${appName}" <${senderEmail}>`,
            messageId: (result && result.messageId) || null,
            error: (result && result.error) || null
        };
        return response.status(200).json(resData);
    } catch (err) {
        console.error('[SMTP Config] onTestConnection Error:', err);
        return response.status(500).json({
            code: 50000,
            message: err.message || 'SMTP connection test failed'
        });
    }
};
