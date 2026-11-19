var mongo = require('mongodb');
var EmailTemplate = require('../controller/emailTemplate');
var EmailTemplateModel = require('../models/emailTemplate.model');
var UserModel = require('../../User/models/user.model');
const resMsg = require("../service/message");
const mailer = require('../../../../helpers/google/Mail');
const { resolveReadScopeUserId } = require('../../Response/utils/responsePolicy');
const {
    DEFAULT_EMAIL_TEMPLATES,
    isValidEmailAddress,
    buildRenderedTestEmail,
    buildRenderedTestEmailAsync
} = require('../utils/emailTemplateDefaults');
const { getEnvSmtpDefaults } = require('../utils/smtpCrypto');

let ownerIndexVerified = false;

async function ensureOwnerIndexReady() {
    if (ownerIndexVerified) return;
    ownerIndexVerified = true;
    try {
        if (!EmailTemplateModel || !EmailTemplateModel.collection || typeof EmailTemplateModel.collection.indexes !== 'function') {
            return;
        }
        const indexes = await EmailTemplateModel.collection.indexes();
        const hasLegacyCodeUnique = Array.isArray(indexes) && indexes.some((idx) => idx && idx.name === 'code_1');
        if (hasLegacyCodeUnique && typeof EmailTemplateModel.collection.dropIndex === 'function') {
            await EmailTemplateModel.collection.dropIndex('code_1').catch(() => {});
        }
        if (typeof EmailTemplateModel.collection.createIndex === 'function') {
            await EmailTemplateModel.collection.createIndex({ owner: 1, code: 1 }, { unique: true });
        }
    } catch (err) {
        // Ignore non-fatal index checks on mocked/offline environments
    }
}

function resolveOwnerObjectId(request) {
    const body = (request && request.body) || {};
    const query = (request && request.query) || {};
    const scoped = resolveReadScopeUserId({
        request,
        fallbackId: query.userId || body.owner
    });
    if (!scoped || !scoped.userId || !mongo.ObjectId.isValid(scoped.userId)) {
        return null;
    }
    return new mongo.ObjectId(scoped.userId);
}

async function ensurePersonalTemplates(ownerObjectId) {
    let docs = await EmailTemplate.onQuerys({ owner: ownerObjectId });
    docs = Array.isArray(docs) ? docs : [];
    const existingCodes = new Set(docs.map((item) => item && item.code));
    const missingCodes = Object.keys(DEFAULT_EMAIL_TEMPLATES).filter((code) => !existingCodes.has(code));

    if (!missingCodes.length) {
        return docs;
    }

    for (const code of missingCodes) {
        const def = DEFAULT_EMAIL_TEMPLATES[code];
        const insertPayload = {
            owner: ownerObjectId,
            code: def.code,
            name: def.name,
            subject: def.subject,
            content: def.content,
            variables: def.variables
        };
        if (EmailTemplateModel && typeof EmailTemplateModel.findOneAndUpdate === 'function') {
            await EmailTemplateModel.findOneAndUpdate(
                { owner: ownerObjectId, code: def.code },
                { $setOnInsert: insertPayload },
                { upsert: true, new: true }
            );
        } else {
            await EmailTemplate.onCreate(insertPayload);
        }
    }

    const refreshed = await EmailTemplate.onQuerys({ owner: ownerObjectId });
    return Array.isArray(refreshed) ? refreshed : docs;
}

exports.onQuery = async function (request, response) {
    try {
        const ownerObjectId = resolveOwnerObjectId(request);
        if (!ownerObjectId) {
            return response.status(401).json({
                code: 40100,
                message: 'Authentication required for personal email templates'
            });
        }
        const targetId = (request.params && request.params.id) || (request.query && request.query.id);
        if (!targetId || !mongo.ObjectId.isValid(targetId)) {
            return response.status(400).json({
                code: 40000,
                message: 'Valid email template id is required'
            });
        }
        const doc = await EmailTemplate.onQuery({
            _id: new mongo.ObjectId(targetId),
            owner: ownerObjectId
        });
        if (!doc) {
            var notFound = await resMsg.onMessage_Response(0, 40400);
            return response.status(404).json(notFound);
        }
        var resData = await resMsg.onMessage_Response(0, 20000);
        resData.data = doc;
        return response.status(200).json(resData);
    } catch (err) {
        var resData = await resMsg.onMessage_Response(0, 40400);
        return response.status(404).json(resData);
    }
};

exports.onQuerys = async function (request, response) {
    try {
        const ownerObjectId = resolveOwnerObjectId(request);
        if (!ownerObjectId) {
            return response.status(401).json({
                code: 40100,
                message: 'Authentication required for personal email templates'
            });
        }
        await ensureOwnerIndexReady();
        const docs = await ensurePersonalTemplates(ownerObjectId);
        var resData = await resMsg.onMessage_Response(0, 20000);
        resData.data = docs;
        return response.status(200).json(resData);
    } catch (err) {
        console.error('onQuerys EmailTemplate Error:', err);
        var resData = await resMsg.onMessage_Response(0, 40400);
        return response.status(404).json(resData);
    }
};

exports.onCreate = async function (request, response) {
    try {
        const ownerObjectId = resolveOwnerObjectId(request);
        if (!ownerObjectId) {
            return response.status(401).json({
                code: 40100,
                message: 'Authentication required for personal email templates'
            });
        }
        await ensureOwnerIndexReady();
        const payload = Object.assign({}, request.body || {}, { owner: ownerObjectId });
        delete payload._id;
        const doc = await EmailTemplate.onCreate(payload);
        var resData = await resMsg.onMessage_Response(0, 20000);
        resData.data = doc;
        return response.status(200).json(resData);
    } catch (err) {
        var resData = await resMsg.onMessage_Response(0, 40400);
        return response.status(404).json(resData);
    }
};

exports.onUpdate = async function (request, response) {
    try {
        const ownerObjectId = resolveOwnerObjectId(request);
        if (!ownerObjectId) {
            return response.status(401).json({
                code: 40100,
                message: 'Authentication required for personal email templates'
            });
        }
        await ensureOwnerIndexReady();

        const body = Object.assign({}, request.body || {});
        const targetId = body._id || (request.query && request.query.id);
        var query = { owner: ownerObjectId };

        if (targetId && mongo.ObjectId.isValid(targetId)) {
            query._id = new mongo.ObjectId(targetId);
        } else if (body.code) {
            query.code = String(body.code);
        } else {
            return response.status(400).json({
                code: 40000,
                message: 'Email template _id or code is required'
            });
        }

        delete body._id;
        delete body.owner;

        const doc = await EmailTemplate.onUpdate(query, body);
        if (!doc) {
            var notFound = await resMsg.onMessage_Response(0, 40400);
            return response.status(404).json(notFound);
        }
        var resData = await resMsg.onMessage_Response(0, 20000);
        resData.data = doc;
        return response.status(200).json(resData);
    } catch (err) {
        console.error(err);
        var resData = await resMsg.onMessage_Response(0, 40400);
        return response.status(404).json(resData);
    }
};

exports.onDelete = async function (request, response) {
    try {
        const ownerObjectId = resolveOwnerObjectId(request);
        if (!ownerObjectId) {
            return response.status(401).json({
                code: 40100,
                message: 'Authentication required for personal email templates'
            });
        }
        const targetId = (request.body && request.body.id) || (request.query && request.query.id);
        if (!targetId || !mongo.ObjectId.isValid(targetId)) {
            return response.status(400).json({
                code: 40000,
                message: 'Valid email template id is required'
            });
        }
        const doc = await EmailTemplate.onDelete({
            _id: new mongo.ObjectId(targetId),
            owner: ownerObjectId
        });
        var resData = await resMsg.onMessage_Response(0, 20000);
        resData.data = doc;
        return response.status(200).json(resData);
    } catch (err) {
        var resData = await resMsg.onMessage_Response(0, 40400);
        return response.status(404).json(resData);
    }
};

exports.onGetBranding = async function (_request, response) {
    try {
        const effective = typeof mailer.getEffectiveSmtpConfig === 'function'
            ? await mailer.getEffectiveSmtpConfig().catch(() => null)
            : null;
        const envDefaults = getEnvSmtpDefaults();
        const appName = (effective && effective.appName) || envDefaults.appName || 'Digital University';
        const senderEmail = (effective && effective.senderEmail) || envDefaults.senderEmail || 'no-reply@mfu.ac.th';
        const resData = await resMsg.onMessage_Response(0, 20000);
        resData.data = {
            appName,
            senderEmail
        };
        return response.status(200).json(resData);
    } catch (err) {
        return response.status(500).json({
            code: 50000,
            message: err.message || 'Failed to load email branding'
        });
    }
};

exports.onSendTest = async function (request, response) {
    try {
        const ownerObjectId = resolveOwnerObjectId(request);
        if (!ownerObjectId) {
            return response.status(401).json({
                code: 40100,
                message: 'Authentication required for personal email templates'
            });
        }

        const body = request.body || {};
        let ownerEmail = request && request.user && isValidEmailAddress(String(request.user.email || '').trim())
            ? String(request.user.email).trim()
            : '';

        let ownerDoc = null;
        if (UserModel && typeof UserModel.findById === 'function') {
            ownerDoc = await UserModel.findById(ownerObjectId).select('email').lean().catch(() => null);
            if (!ownerEmail && ownerDoc && isValidEmailAddress(String(ownerDoc.email || '').trim())) {
                ownerEmail = String(ownerDoc.email).trim();
            }
        }

        const fallbackTo = String(body.to || '').trim();
        const to = ownerEmail || fallbackTo;
        if (!isValidEmailAddress(to)) {
            return response.status(400).json({
                code: 40000,
                message: 'Valid owner email address is required'
            });
        }

        let personalDoc = null;
        if (body.code && EmailTemplate && typeof EmailTemplate.onQuery === 'function') {
            personalDoc = await EmailTemplate.onQuery({
                owner: ownerObjectId,
                code: String(body.code)
            }).catch(() => null);
        }

        const effective = typeof mailer.getEffectiveSmtpConfig === 'function'
            ? await mailer.getEffectiveSmtpConfig().catch(() => null)
            : null;

        const renderPayload = {
            code: body.code,
            subject: body.subject !== undefined ? body.subject : (personalDoc && personalDoc.subject),
            content: body.content !== undefined ? body.content : (personalDoc && personalDoc.content),
            variables: {
                ...(ownerEmail ? { ContactEmail: ownerEmail } : {})
            },
            layoutOptions: {
                appName: effective && effective.appName ? effective.appName : undefined
            }
        };

        const rendered = typeof buildRenderedTestEmailAsync === 'function'
            ? await buildRenderedTestEmailAsync(renderPayload)
            : buildRenderedTestEmail(renderPayload);
        const mailResult = await mailer.sendMail(to, `[TEST] ${rendered.subject}`, rendered.text, rendered.html);

        const resData = await resMsg.onMessage_Response(0, 20000);
        resData.data = {
            sent: Boolean(mailResult && mailResult.success),
            to,
            reason: (mailResult && mailResult.error) || null,
            renderedSubject: rendered.subject
        };
        return response.status(200).json(resData);
    } catch (err) {
        console.error('onSendTest Error:', err);
        return response.status(500).json({
            code: 50000,
            message: err.message || 'Failed to send test email'
        });
    }
};
