'use strict';

const crypto = require('crypto');
const { getJwtSecret } = require('../../Response/utils/responsePolicy');

const CIPHER_PREFIX = 'v1:';
const ALGORITHM = 'aes-256-gcm';

function deriveEncryptionKey() {
    const rawSecret = String(process.env.SMTP_ENCRYPTION_KEY || '').trim() || getJwtSecret();
    return crypto.createHash('sha256').update(rawSecret).digest();
}

function encryptSecret(plainText) {
    const text = plainText === undefined || plainText === null ? '' : String(plainText);
    if (!text) return '';

    const key = deriveEncryptionKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${CIPHER_PREFIX}${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decryptSecret(payload) {
    if (!payload || typeof payload !== 'string') return '';
    if (!payload.startsWith(CIPHER_PREFIX)) {
        return payload;
    }

    const parts = payload.slice(CIPHER_PREFIX.length).split(':');
    if (parts.length !== 3) return '';

    try {
        const [ivHex, tagHex, dataHex] = parts;
        const key = deriveEncryptionKey();
        const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'));
        decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
        const decrypted = Buffer.concat([
            decipher.update(Buffer.from(dataHex, 'hex')),
            decipher.final()
        ]);
        return decrypted.toString('utf8');
    } catch (_err) {
        return '';
    }
}

function normalizeSmtpPort(value, fallback = 587) {
    if (value === undefined || value === null || String(value).trim() === '') {
        return fallback;
    }
    const parsed = Number.parseInt(String(value).trim(), 10);
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 65535) {
        return null;
    }
    return parsed;
}

function normalizeSecureMode(value) {
    const mode = String(value || 'auto').trim().toLowerCase();
    return ['auto', 'tls', 'starttls', 'none'].includes(mode) ? mode : 'auto';
}

function resolveTransportSecurity(port, secureMode = 'auto') {
    const mode = normalizeSecureMode(secureMode);
    if (mode === 'tls') return { secure: true, ignoreTLS: false };
    if (mode === 'none') return { secure: false, ignoreTLS: true };
    if (mode === 'starttls') return { secure: false, ignoreTLS: false };
    return { secure: Number(port) === 465, ignoreTLS: false };
}

function sanitizeHeaderDisplayName(name, fallback = 'Digital University') {
    const clean = String(name || '').replace(/[\r\n"]/g, '').trim();
    return clean || fallback;
}

function getEnvSmtpDefaults() {
    const host = String(process.env.SMTP_HOST || '').trim();
    const port = normalizeSmtpPort(process.env.SMTP_PORT, host === 'smtp.gmail.com' ? 465 : (host ? 587 : 587)) || 587;
    const user = String(process.env.EMAIL_USER || process.env.SMTP_USER || '').trim();
    const pass = String(process.env.EMAIL_PASS || process.env.SMTP_PASS || '');
    const appName = sanitizeHeaderDisplayName(process.env.APP_NAME || process.env.SMTP_APP_NAME, 'Digital University');
    const senderEmail = String(process.env.EMAIL_FROM || process.env.SMTP_FROM || user || 'no-reply@mfu.ac.th').trim();
    return {
        host,
        port,
        secureMode: 'auto',
        username: user,
        password: pass,
        appName,
        senderEmail
    };
}

function sanitizeSmtpConfigResponse(dbDoc, envDefaults = getEnvSmtpDefaults(), devRedirectTo = '') {
    const dbHost = dbDoc && dbDoc.host ? String(dbDoc.host).trim() : '';
    const dbEnabled = dbDoc ? dbDoc.enabled !== false : false;
    const hasDbActive = Boolean(dbDoc && dbEnabled && dbHost);
    const hasEnvActive = Boolean(envDefaults.host || (envDefaults.username && envDefaults.password));

    const source = hasDbActive ? 'database' : (hasEnvActive ? 'env' : 'unconfigured');
    const host = hasDbActive ? dbHost : (dbDoc && dbDoc.host ? String(dbDoc.host).trim() : envDefaults.host);
    const port = hasDbActive
        ? (normalizeSmtpPort(dbDoc.port, 587) || 587)
        : (dbDoc && normalizeSmtpPort(dbDoc.port, null) ? Number(dbDoc.port) : envDefaults.port);
    const secureMode = dbDoc && dbDoc.secureMode
        ? normalizeSecureMode(dbDoc.secureMode)
        : envDefaults.secureMode;
    const username = hasDbActive
        ? String(dbDoc.username || '').trim()
        : (dbDoc && dbDoc.username ? String(dbDoc.username).trim() : envDefaults.username);
    const hasDbPassword = Boolean(dbDoc && dbDoc.passwordEncrypted);
    const hasPassword = hasDbActive
        ? hasDbPassword
        : Boolean(hasDbPassword || envDefaults.password);
    const appName = sanitizeHeaderDisplayName(
        (dbDoc && dbDoc.appName) || envDefaults.appName,
        'Digital University'
    );
    const senderEmail = String(
        (hasDbActive && dbDoc.senderEmail) ||
        (dbDoc && dbDoc.senderEmail) ||
        envDefaults.senderEmail ||
        username ||
        'no-reply@mfu.ac.th'
    ).trim();

    return {
        source,
        enabled: dbDoc ? dbDoc.enabled !== false : true,
        host,
        port,
        secureMode,
        username,
        hasPassword,
        passwordMask: hasPassword ? '••••••••' : '',
        appName,
        senderEmail,
        effectiveFrom: `"${appName}" <${senderEmail}>`,
        envFallbackAvailable: hasEnvActive,
        devRedirectTo: devRedirectTo || '',
        updatedAt: (dbDoc && dbDoc.updatedAt) || null
    };
}

module.exports = {
    encryptSecret,
    decryptSecret,
    normalizeSmtpPort,
    normalizeSecureMode,
    resolveTransportSecurity,
    sanitizeHeaderDisplayName,
    getEnvSmtpDefaults,
    sanitizeSmtpConfigResponse
};
