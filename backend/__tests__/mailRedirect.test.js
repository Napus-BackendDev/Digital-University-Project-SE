const { _testables } = require('../helpers/google/Mail');

describe('Mail.js SMTP_REDIRECT_TO developer safeguard', () => {
    const { resolveSmtpRecipient } = _testables;
    const savedEnv = process.env;

    beforeEach(() => {
        process.env = { ...savedEnv };
    });

    afterAll(() => {
        process.env = savedEnv;
    });

    test('redirects any recipient strictly to SMTP_REDIRECT_TO when APP_ENV=developer', () => {
        process.env.APP_ENV = 'developer';
        process.env.SMTP_REDIRECT_TO = 'napus.dev@gmail.com';

        const r1 = resolveSmtpRecipient('6631501001@lamduan.mfu.ac.th', 'Hello Student');
        expect(r1.to).toBe('napus.dev@gmail.com');
        expect(r1.redirectedFrom).toBe('6631501001@lamduan.mfu.ac.th');
        expect(r1.subject).toContain('[DEV-REDIRECT to:6631501001@lamduan.mfu.ac.th]');

        const rSame = resolveSmtpRecipient('napus.dev@gmail.com', 'Clean Subject');
        expect(rSame.to).toBe('napus.dev@gmail.com');
        expect(rSame.redirectedFrom).toBeNull();
        expect(rSame.subject).toBe('Clean Subject');
    });

    test('never redirects recipients when APP_ENV is production or unset', () => {
        process.env.APP_ENV = 'production';
        process.env.SMTP_REDIRECT_TO = 'napus.dev@gmail.com';

        const rProd = resolveSmtpRecipient('student@lamduan.mfu.ac.th', 'Prod Subject');
        expect(rProd.to).toBe('student@lamduan.mfu.ac.th');
        expect(rProd.redirectedFrom).toBeNull();
        expect(rProd.subject).toBe('Prod Subject');

        delete process.env.APP_ENV;
        const rDefault = resolveSmtpRecipient('student@lamduan.mfu.ac.th', 'Default Subject');
        expect(rDefault.to).toBe('student@lamduan.mfu.ac.th');
        expect(rDefault.redirectedFrom).toBeNull();
    });
});
