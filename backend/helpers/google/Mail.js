const nodemailer = require("nodemailer");
const { isDeveloperEnv } = require("../../server/Project/Response/utils/responsePolicy");
const SmtpConfigModel = require("../../server/Project/Settings/models/smtpConfig.model");
const {
    decryptSecret,
    normalizeSmtpPort,
    normalizeSecureMode,
    resolveTransportSecurity,
    sanitizeHeaderDisplayName,
    getEnvSmtpDefaults
} = require("../../server/Project/Settings/utils/smtpCrypto");
const { isValidEmail } = require("../../server/Project/Email/service/email.utils");

function resolveSmtpRecipient(to, subject = '') {
    const redirectTo = String(process.env.SMTP_REDIRECT_TO || '').trim();
    if (isDeveloperEnv() && redirectTo) {
        const origList = Array.isArray(to) ? to.join(', ') : String(to || '').trim();
        const isSameTarget = origList.toLowerCase() === redirectTo.toLowerCase();
        return {
            to: redirectTo,
            subject: isSameTarget || !origList ? subject : `[DEV-REDIRECT to:${origList}] ${subject}`,
            redirectedFrom: isSameTarget ? null : origList
        };
    }
    return { to, subject, redirectedFrom: null };
}

function buildEffectiveConfigFromSources(dbDoc, envDefaults = getEnvSmtpDefaults()) {
    const dbHost = dbDoc && dbDoc.host ? String(dbDoc.host).trim() : '';
    const dbEnabled = dbDoc ? dbDoc.enabled !== false : false;

    if (dbDoc && dbEnabled && dbHost) {
        const port = normalizeSmtpPort(dbDoc.port, 587) || 587;
        const username = String(dbDoc.username || '').trim();
        const password = dbDoc.passwordEncrypted ? decryptSecret(dbDoc.passwordEncrypted) : '';
        const appName = sanitizeHeaderDisplayName(dbDoc.appName || envDefaults.appName, 'Digital University');
        const senderEmail = String(dbDoc.senderEmail || username || envDefaults.senderEmail || 'no-reply@mfu.ac.th').trim();
        return {
            source: 'database',
            host: dbHost,
            port,
            secureMode: normalizeSecureMode(dbDoc.secureMode),
            username,
            password,
            appName,
            senderEmail
        };
    }

    return {
        source: envDefaults.host || (envDefaults.username && envDefaults.password) ? 'env' : 'unconfigured',
        host: envDefaults.host,
        port: envDefaults.port,
        secureMode: envDefaults.secureMode,
        username: envDefaults.username,
        password: envDefaults.password,
        appName: envDefaults.appName,
        senderEmail: envDefaults.senderEmail
    };
}

async function getEffectiveSmtpConfig({ overrideConfig = null } = {}) {
    if (overrideConfig && typeof overrideConfig === 'object') {
        const envDefaults = getEnvSmtpDefaults();
        const port = normalizeSmtpPort(overrideConfig.port, envDefaults.port) || 587;
        const username = String(overrideConfig.username || '').trim();
        return {
            source: 'override',
            host: String(overrideConfig.host || '').trim(),
            port,
            secureMode: normalizeSecureMode(overrideConfig.secureMode),
            username,
            password: overrideConfig.password !== undefined ? String(overrideConfig.password) : '',
            appName: sanitizeHeaderDisplayName(overrideConfig.appName || envDefaults.appName, 'Digital University'),
            senderEmail: String(overrideConfig.senderEmail || username || envDefaults.senderEmail || 'no-reply@mfu.ac.th').trim()
        };
    }

    let dbDoc = null;
    try {
        if (SmtpConfigModel && typeof SmtpConfigModel.findOne === 'function') {
            const q = SmtpConfigModel.findOne({ key: 'default' });
            dbDoc = q && typeof q.lean === 'function' ? await q.lean() : await q;
        }
    } catch (_err) {
        dbDoc = null;
    }
    return buildEffectiveConfigFromSources(dbDoc, getEnvSmtpDefaults());
}

function createTransporterFromConfig(cfg) {
    const { host, port, secureMode, username, password } = cfg;
    if (host && host !== 'smtp.gmail.com') {
        const sec = resolveTransportSecurity(port, secureMode);
        const config = {
            host,
            port,
            secure: sec.secure,
            tls: {
                rejectUnauthorized: false
            }
        };
        if (sec.ignoreTLS) {
            config.ignoreTLS = true;
        }
        if (username && password) {
            config.auth = { user: username, pass: password };
        }
        return nodemailer.createTransport(config);
    }

    const gmailConfig = {
        service: "gmail"
    };
    if (username && password) {
        gmailConfig.auth = { user: username, pass: password };
    }
    return nodemailer.createTransport(gmailConfig);
}

function extractInlineImagesFromHtml(html) {
    let attachments = [];
    let processedHtml = html || '';

    if (processedHtml.includes('data:image/')) {
        const imageRegex = /<img\b[^>]*\bsrc=(["'])data:(image\/[a-zA-Z0-9.+-]+);base64,([^"']+)\1/gi;
        let match;
        let count = 0;

        while ((match = imageRegex.exec(html)) !== null) {
            const fullTag = match[0];
            const quote = match[1];
            const mimeType = match[2];
            const base64Data = match[3];
            const cid = `image_${Date.now()}_${count++}`;
            const extension = (mimeType.split('/')[1] || 'png').replace(/[^a-z0-9]/gi, '') || 'png';

            attachments.push({
                filename: `${cid}.${extension}`,
                content: Buffer.from(base64Data, 'base64'),
                cid: cid
            });

            const originalDataUri = `${quote}data:${mimeType};base64,${base64Data}${quote}`;
            processedHtml = processedHtml.replace(fullTag, fullTag.replace(originalDataUri, `${quote}cid:${cid}${quote}`));
        }
    }

    return { processedHtml, attachments };
}

exports.getEffectiveSmtpConfig = getEffectiveSmtpConfig;

exports.sendMail = async function (to, subject, text, html, options = {}) {
    const cfg = await getEffectiveSmtpConfig({ overrideConfig: options && options.smtpOverride });
    const host = cfg.host;
    const user = cfg.username;
    const pass = cfg.password;

    if (!host && (!user || !pass)) {
        console.warn("Mail credentials not configured, skipping email to:", to);
        return { success: false, error: "Credentials not configured" };
    }

    const { processedHtml, attachments } = extractInlineImagesFromHtml(html);

    const resolved = resolveSmtpRecipient(to, subject);
    const effectiveTo = resolved.to;
    const effectiveSubject = resolved.subject;
    if (resolved.redirectedFrom) {
        console.log(`[Mail Dev Redirect] Redirected SMTP (${resolved.redirectedFrom}) -> ${effectiveTo}`);
    }

    const displayName = sanitizeHeaderDisplayName((options && options.fromName) || cfg.appName, 'Digital University');
    const senderEmail = String(cfg.senderEmail || user || 'no-reply@mfu.ac.th').trim();
    const replyToEmail = options && typeof options.replyTo === 'string' && isValidEmail(options.replyTo.trim())
        ? options.replyTo.trim()
        : '';

    let mailOptions = {
        from: `"${displayName}" <${senderEmail}>`,
        to: effectiveTo,
        subject: effectiveSubject,
        text,
        html: processedHtml,
        attachments: attachments
    };

    if (replyToEmail) {
        mailOptions.replyTo = replyToEmail;
    }

    try {
        const transporter = createTransporterFromConfig(cfg);
        let info = await transporter.sendMail(mailOptions);
        console.log(`[Mail Sent] ${effectiveTo} (${info.messageId || 'no-id'}) ${info.response || ''}`.trim());
        return { success: true, messageId: info.messageId, response: info.response, redirectedTo: effectiveTo };
    } catch (error) {
        console.error("Error sending mail:", error);
        return { success: false, error: error && error.message ? error.message : String(error) };
    }
};

exports.verifyAndTestSmtp = async function (overrideConfig, testTo, meta = {}) {
    const cfg = await getEffectiveSmtpConfig({ overrideConfig });
    const transporter = createTransporterFromConfig(cfg);
    await transporter.verify();

    const safeName = String(meta.adminName || 'Admin').replace(/[<>]/g, '');
    const appName = cfg.appName || 'Digital University';
    const subject = `[SMTP TEST] ${appName} Mail Configuration Verified`;
    const text = [
        `Hello ${safeName},`,
        '',
        `This test email confirms your SMTP configuration for "${appName}" is working properly.`,
        `SMTP Host: ${cfg.host}:${cfg.port} (${cfg.secureMode})`,
        `From: "${appName}" <${cfg.senderEmail}>`,
    ].join('\n');
    const html = `
        <div style="font-family: Arial, sans-serif; color: #1f2937; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
            <h2 style="margin: 0 0 12px; color: #8c1515;">${appName} — SMTP Verification</h2>
            <p>Hello <strong>${safeName}</strong>,</p>
            <p>Your SMTP configuration has been verified and successfully dispatched this message.</p>
            <ul style="background: #f8fafc; padding: 14px 20px; border-radius: 8px; list-style: none; margin: 16px 0;">
                <li><strong>Host:</strong> ${cfg.host}:${cfg.port} (${cfg.secureMode})</li>
                <li><strong>Sender Display:</strong> &quot;${appName}&quot; &lt;${cfg.senderEmail}&gt;</li>
            </ul>
        </div>
    `;

    const mailRes = await exports.sendMail(testTo, subject, text, html, { smtpOverride: overrideConfig });
    return {
        verified: true,
        sent: Boolean(mailRes && mailRes.success),
        messageId: mailRes && mailRes.messageId,
        redirectedTo: (mailRes && mailRes.redirectedTo) || testTo,
        error: (mailRes && mailRes.error) || null
    };
};

exports._testables = {
    resolveSmtpRecipient,
    buildEffectiveConfigFromSources,
    extractInlineImagesFromHtml
};
