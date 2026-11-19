'use strict';

process.env.JWT_SECRET = 'test-smtp-unit-secret-key-12345';

const mockSmtpFindOne = jest.fn();
const mockSmtpFindOneAndUpdate = jest.fn();
const mockSmtpDeleteOne = jest.fn();

jest.mock('../server/Project/Settings/models/smtpConfig.model', () => ({
    findOne: mockSmtpFindOne,
    findOneAndUpdate: mockSmtpFindOneAndUpdate,
    deleteOne: mockSmtpDeleteOne
}));

const mockUserFindById = jest.fn();
jest.mock('../server/Project/User/models/user.model', () => ({
    findById: mockUserFindById
}));

jest.mock('../server/Project/Settings/service/message', () => ({
    onMessage_Response: jest.fn((_code, status) => Promise.resolve({ code: status, data: null }))
}));

const mockVerify = jest.fn(() => Promise.resolve(true));
const mockSendMail = jest.fn(() => Promise.resolve({ messageId: 'smtp-test-id', response: '250 OK' }));
const mockCreateTransport = jest.fn(() => ({
    verify: mockVerify,
    sendMail: mockSendMail
}));
jest.mock('nodemailer', () => ({
    createTransport: mockCreateTransport
}));

const {
    encryptSecret,
    decryptSecret,
    normalizeSmtpPort,
    resolveTransportSecurity,
    sanitizeSmtpConfigResponse
} = require('../server/Project/Settings/utils/smtpCrypto');
const mailer = require('../helpers/google/Mail');
const smtpService = require('../server/Project/Settings/service/smtpConfig');

const ADMIN_ID = '670000000000000000000901';
const USER_ID = '670000000000000000000902';

function mockRes() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    };
}

function chainLean(value) {
    const chain = {
        select: jest.fn(() => chain),
        populate: jest.fn(() => chain),
        lean: jest.fn(() => Promise.resolve(value))
    };
    return chain;
}

describe('Admin SMTP Configuration Crypto, Guards, Fallback & Live Testing', () => {
    const savedEnv = { ...process.env };

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = {
            ...savedEnv,
            JWT_SECRET: 'test-smtp-unit-secret-key-12345',
            APP_ENV: 'production',
            SMTP_HOST: 'env-smtp.mfu.ac.th',
            SMTP_PORT: '587',
            SMTP_USER: 'envuser@mfu.ac.th',
            SMTP_PASS: 'env-pass',
            EMAIL_FROM: 'env-noreply@mfu.ac.th'
        };
        mockSmtpFindOne.mockImplementation(() => chainLean(null));
    });

    afterAll(() => {
        process.env = savedEnv;
    });

    test('encryptSecret / decryptSecret round-trips securely and hides plaintext', () => {
        const cipher = encryptSecret('super-secret-smtp-pass');
        expect(cipher.startsWith('v1:')).toBe(true);
        expect(cipher).not.toContain('super-secret-smtp-pass');
        expect(decryptSecret(cipher)).toBe('super-secret-smtp-pass');
        expect(decryptSecret('')).toBe('');
    });

    test('normalizeSmtpPort & resolveTransportSecurity validate boundaries properly', () => {
        expect(normalizeSmtpPort('465')).toBe(465);
        expect(normalizeSmtpPort('0')).toBeNull();
        expect(normalizeSmtpPort('70000')).toBeNull();
        expect(resolveTransportSecurity(465, 'auto')).toEqual({ secure: true, ignoreTLS: false });
        expect(resolveTransportSecurity(587, 'auto')).toEqual({ secure: false, ignoreTLS: false });
        expect(resolveTransportSecurity(587, 'tls')).toEqual({ secure: true, ignoreTLS: false });
        expect(resolveTransportSecurity(25, 'none')).toEqual({ secure: false, ignoreTLS: true });
    });

    test('sanitizeSmtpConfigResponse masks password and favors active DB config over .env fallback', () => {
        const envOnly = sanitizeSmtpConfigResponse(null);
        expect(envOnly.source).toBe('env');
        expect(envOnly.host).toBe('env-smtp.mfu.ac.th');
        expect(envOnly.passwordEncrypted).toBeUndefined();
        expect(envOnly.password).toBeUndefined();

        const dbActive = sanitizeSmtpConfigResponse({
            host: 'mail.custom.ac.th',
            port: 465,
            secureMode: 'tls',
            username: 'mailer@custom.ac.th',
            passwordEncrypted: encryptSecret('db-secret'),
            appName: 'MFU Survey Portal',
            senderEmail: 'surveys@custom.ac.th',
            enabled: true
        });
        expect(dbActive.source).toBe('database');
        expect(dbActive.host).toBe('mail.custom.ac.th');
        expect(dbActive.hasPassword).toBe(true);
        expect(dbActive.passwordMask).toBe('••••••••');
        expect(dbActive.effectiveFrom).toBe('"MFU Survey Portal" <surveys@custom.ac.th>');
        expect(JSON.stringify(dbActive)).not.toContain('db-secret');
    });

    test('onGet & onUpdate enforce 401 unauthenticated and 403 non-admin guards', async () => {
        const res401 = mockRes();
        await smtpService.onGet({ headers: {}, cookies: {} }, res401);
        expect(res401.status).toHaveBeenCalledWith(401);

        mockUserFindById.mockImplementationOnce(() => chainLean({
            _id: USER_ID,
            email: 'staff@mfu.ac.th',
            role: { title: [{ key: 'en', value: 'Staff' }] }
        }));
        const res403 = mockRes();
        await smtpService.onGet({ user: { id: USER_ID }, headers: {}, cookies: {} }, res403);
        expect(res403.status).toHaveBeenCalledWith(403);
    });

    test('onUpdate saves encrypted password and preserves existing password when omitted on update', async () => {
        const existingCipher = encryptSecret('existing-pass');
        mockUserFindById.mockImplementation(() => chainLean({
            _id: ADMIN_ID,
            email: 'admin@mfu.ac.th',
            role: { title: [{ key: 'en', value: 'Admin' }] }
        }));
        mockSmtpFindOne.mockImplementationOnce(() => chainLean({
            key: 'default',
            host: 'old.host',
            passwordEncrypted: existingCipher
        }));
        mockSmtpFindOneAndUpdate.mockImplementationOnce((_q, updateObj) => Promise.resolve({
            ...updateObj.$set,
            updatedAt: new Date().toISOString()
        }));

        const res = mockRes();
        await smtpService.onUpdate({
            user: { id: ADMIN_ID },
            body: {
                host: 'smtp.mfu.ac.th',
                port: 587,
                secureMode: 'starttls',
                username: 'form@mfu.ac.th',
                password: '',
                appName: 'MFU Survey Studio',
                senderEmail: 'survey-noreply@mfu.ac.th'
            }
        }, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const savedPayload = mockSmtpFindOneAndUpdate.mock.calls[0][1].$set;
        expect(savedPayload.passwordEncrypted).toBe(existingCipher);
        expect(savedPayload.appName).toBe('MFU Survey Studio');
        expect(res.json.mock.calls[0][0].data.source).toBe('database');
        expect(res.json.mock.calls[0][0].data.hasPassword).toBe(true);
    });

    test('onTestConnection verifies SMTP transport and applies APP_ENV=developer redirect safeguard', async () => {
        process.env.APP_ENV = 'developer';
        process.env.SMTP_REDIRECT_TO = 'dev-inbox@gmail.com';
        mockUserFindById.mockImplementation(() => chainLean({
            _id: ADMIN_ID,
            name: 'Admin MFU',
            email: 'admin@mfu.ac.th',
            role: { title: [{ key: 'en', value: 'Admin' }] }
        }));

        const res = mockRes();
        await smtpService.onTestConnection({
            user: { id: ADMIN_ID },
            body: {
                host: 'smtp.mfu.ac.th',
                port: 465,
                secureMode: 'tls',
                username: 'mailer@mfu.ac.th',
                password: 'fresh-password',
                appName: 'MFU Custom App',
                senderEmail: 'custom@mfu.ac.th',
                testTo: 'admin@mfu.ac.th'
            }
        }, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(mockVerify).toHaveBeenCalledTimes(1);
        expect(mockSendMail).toHaveBeenCalledTimes(1);
        const sentMailArgs = mockSendMail.mock.calls[0][0];
        expect(sentMailArgs.from).toBe('"MFU Custom App" <custom@mfu.ac.th>');
        expect(sentMailArgs.to).toBe('dev-inbox@gmail.com');
        expect(res.json.mock.calls[0][0].data.verified).toBe(true);
        expect(res.json.mock.calls[0][0].data.sent).toBe(true);
        expect(res.json.mock.calls[0][0].data.to).toBe('dev-inbox@gmail.com');
    });

    test('Mail.sendMail sends with DB appName/senderEmail + custom replyTo header when configured', async () => {
        mockSmtpFindOne.mockImplementation(() => chainLean({
            host: 'db-smtp.mfu.ac.th',
            port: 587,
            secureMode: 'starttls',
            username: 'dbuser@mfu.ac.th',
            passwordEncrypted: encryptSecret('dbpass'),
            appName: 'MFU Questionnaires',
            senderEmail: 'noreply@mfu.ac.th',
            enabled: true
        }));

        const res = await mailer.sendMail(
            'responder@lamduan.mfu.ac.th',
            'Form Invitation',
            'Plain text',
            '<p>HTML</p>',
            { replyTo: 'coordinator@mfu.ac.th' }
        );

        expect(res.success).toBe(true);
        const mailOpts = mockSendMail.mock.calls[0][0];
        expect(mailOpts.from).toBe('"MFU Questionnaires" <noreply@mfu.ac.th>');
        expect(mailOpts.replyTo).toBe('coordinator@mfu.ac.th');
    });
});
