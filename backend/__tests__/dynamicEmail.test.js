const mockEmailTemplateModel = {
    findOne: jest.fn(() => ({
        lean: jest.fn(() => Promise.resolve(null))
    })),
    findOneAndUpdate: jest.fn(() => Promise.resolve({}))
};

jest.mock('../server/Project/Settings/models/emailTemplate.model', () => mockEmailTemplateModel);

const mockUserModel = {
    findById: jest.fn(() => ({
        select: jest.fn(() => ({
            lean: jest.fn(() => Promise.resolve(null))
        }))
    }))
};
jest.mock('../server/Project/User/models/user.model', () => mockUserModel);

jest.mock('../helpers/google/Mail', () => ({
    sendMail: jest.fn(() => Promise.resolve({ success: true, messageId: 'mock-msg-id' }))
}));

const mockEmailTemplateController = {
    onQuery: jest.fn(),
    onQuerys: jest.fn(),
    onCreate: jest.fn(),
    onUpdate: jest.fn(),
    onDelete: jest.fn()
};
jest.mock('../server/Project/Settings/controller/emailTemplate', () => mockEmailTemplateController);

jest.mock('../server/Project/Settings/service/message', () => ({
    onMessage_Response: jest.fn((_code, status) => Promise.resolve({ code: status, data: null }))
}));

const mailer = require('../helpers/google/Mail');
const dynamicEmail = require('../server/Project/Email/service/dynamicEmail');
const {
    DEFAULT_EMAIL_TEMPLATES,
    SAMPLE_TEST_VARIABLES,
    isValidEmailAddress,
    buildRenderedTestEmail
} = require('../server/Project/Settings/utils/emailTemplateDefaults');
const emailTemplateService = require('../server/Project/Settings/service/emailTemplate');

const VALID_USER_ID = '670000000000000000000001';
const VALID_TEMPLATE_ID = '670000000000000000000099';

function mockResponse() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    };
}

describe('dynamicEmail per-account lookup & fallback formatting', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockEmailTemplateModel.findOne.mockImplementation(() => ({
            lean: jest.fn(() => Promise.resolve(null))
        }));
    });

    test('submissionConfirmation includes escaped EmailMessage in HTML and raw text in text body', async () => {
        const res = await dynamicEmail.sendDynamicEmail(
            'submissionConfirmation',
            {
                Responder: 'Alice',
                FormName: 'Course Eval',
                SubmittedAt: '11 Nov 2026, 10:00',
                ReferenceNo: 'REF-1',
                EmailMessage: 'Custom thanks <script>alert(1)</script> & note'
            },
            'alice@mfu.ac.th'
        );

        expect(res.success).toBe(true);
        expect(mailer.sendMail).toHaveBeenCalledTimes(1);
        const [to, subject, textBody, htmlBody] = mailer.sendMail.mock.calls[0];
        expect(to).toBe('alice@mfu.ac.th');
        expect(subject).toContain('Course Eval');
        expect(textBody).toContain('Custom thanks <script>alert(1)</script> & note');
        expect(htmlBody).toContain('Custom thanks &lt;script&gt;alert(1)&lt;/script&gt; &amp; note');
        expect(htmlBody).not.toContain('<script>alert(1)</script>');
    });

    test('creatorNotification renders escaped form & responder info cleanly', async () => {
        const res = await dynamicEmail.sendDynamicEmail(
            'creatorNotification',
            {
                FormName: 'Thesis Feedback',
                Responder: 'Anonymous (Guest)',
                SubmittedAt: '11 Nov 2026, 10:05',
                ReferenceNo: 'REF-9',
                ManageURL: 'http://localhost:8080/manage/form-1'
            },
            'creator@mfu.ac.th'
        );

        expect(res.success).toBe(true);
        const [to, subject, textBody, htmlBody] = mailer.sendMail.mock.calls[0];
        expect(to).toBe('creator@mfu.ac.th');
        expect(subject).toContain('Thesis Feedback');
        expect(textBody).toContain('Anonymous (Guest)');
        expect(htmlBody).toContain('http://localhost:8080/manage/form-1');
    });

    test('prioritizes owner-specific template before falling back to system baseline', async () => {
        mockEmailTemplateModel.findOne.mockImplementationOnce(() => ({
            lean: jest.fn(() => Promise.resolve({
                owner: VALID_USER_ID,
                code: 'invitationOrganization',
                subject: 'Personal Subject: {{FormTitle}}',
                content: '<p>Personal Body from {{OrganizationName}}</p>'
            }))
        }));

        await dynamicEmail.sendDynamicEmail(
            'invitationOrganization',
            { FormTitle: 'Campus Survey', OrganizationName: 'School of IT' },
            'student@mfu.ac.th',
            { ownerId: VALID_USER_ID }
        );

        expect(mockEmailTemplateModel.findOne).toHaveBeenCalledTimes(1);
        expect(mockEmailTemplateModel.findOne).toHaveBeenCalledWith({
            owner: VALID_USER_ID,
            code: 'invitationOrganization'
        });
        const [, subject, , htmlBody] = mailer.sendMail.mock.calls[0];
        expect(subject).toBe('Personal Subject: Campus Survey');
        expect(htmlBody).toContain('Personal Body from School of IT');
    });

    test('falls back strictly to unowned system baseline when owner override is absent', async () => {
        await dynamicEmail.sendDynamicEmail(
            'invitationCollaboration',
            { FormTitle: 'Shared Form' },
            'collab@mfu.ac.th',
            { ownerId: VALID_USER_ID }
        );

        expect(mockEmailTemplateModel.findOne).toHaveBeenNthCalledWith(1, {
            owner: VALID_USER_ID,
            code: 'invitationCollaboration'
        });
        expect(mockEmailTemplateModel.findOne).toHaveBeenNthCalledWith(2, {
            $or: [{ owner: null }, { owner: { $exists: false } }],
            code: 'invitationCollaboration'
        });
    });
});

describe('per-account emailTemplate service isolation & onSendTest', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockEmailTemplateController.onQuery.mockResolvedValue(null);
        mockEmailTemplateController.onQuerys.mockResolvedValue([]);
        mockEmailTemplateController.onUpdate.mockResolvedValue(null);
    });

    test('validates email addresses strictly', () => {
        expect(isValidEmailAddress('admin@mfu.ac.th')).toBe(true);
        expect(isValidEmailAddress('  napus.dev@gmail.com  ')).toBe(true);
        expect(isValidEmailAddress('')).toBe(false);
        expect(isValidEmailAddress('not-an-email')).toBe(false);
        expect(isValidEmailAddress('missing@domain')).toBe(false);
    });

    test('DEFAULT_EMAIL_TEMPLATES exposes expected codes and buildRenderedTestEmail substitutes sample data', () => {
        expect(Object.keys(DEFAULT_EMAIL_TEMPLATES)).toEqual(
            expect.arrayContaining([
                'invitationCollaboration',
                'invitationOrganization',
                'submissionConfirmation',
                'ResponseNotification'
            ])
        );

        const rendered = buildRenderedTestEmail({ code: 'invitationOrganization' });
        expect(rendered.subject).toContain(SAMPLE_TEST_VARIABLES.FormTitle);
        expect(rendered.html).toContain(SAMPLE_TEST_VARIABLES.ResponderName);
        expect(rendered.html).toContain(SAMPLE_TEST_VARIABLES.OrganizationName);
        expect(rendered.html).toContain('Open Questionnaire');
        expect(rendered.text).not.toContain('{{ResponderName}}');
    });

    test('rejects unauthenticated access with 401 on onQuerys, onUpdate, and onSendTest', async () => {
        const res1 = mockResponse();
        await emailTemplateService.onQuerys({ headers: {}, cookies: {} }, res1);
        expect(res1.status).toHaveBeenCalledWith(401);

        const res2 = mockResponse();
        await emailTemplateService.onUpdate({ headers: {}, cookies: {}, body: { _id: VALID_TEMPLATE_ID } }, res2);
        expect(res2.status).toHaveBeenCalledWith(401);

        const res3 = mockResponse();
        await emailTemplateService.onSendTest({ headers: {}, cookies: {}, body: { to: 'qa@mfu.ac.th' } }, res3);
        expect(res3.status).toHaveBeenCalledWith(401);
        expect(mailer.sendMail).not.toHaveBeenCalled();
    });

    test('onQuerys provisions personal templates scoped solely to signed-in owner', async () => {
        const seededForUser = Object.keys(DEFAULT_EMAIL_TEMPLATES).map((code, idx) => ({
            _id: `67000000000000000000001${idx}`,
            owner: VALID_USER_ID,
            code,
            subject: DEFAULT_EMAIL_TEMPLATES[code].subject,
            content: DEFAULT_EMAIL_TEMPLATES[code].content,
            variables: DEFAULT_EMAIL_TEMPLATES[code].variables
        }));

        mockEmailTemplateController.onQuerys
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce(seededForUser);

        const res = mockResponse();
        await emailTemplateService.onQuerys({ user: { id: VALID_USER_ID }, headers: {}, cookies: {} }, res);

        expect(mockEmailTemplateModel.findOneAndUpdate).toHaveBeenCalledTimes(4);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                code: 20000,
                data: seededForUser
            })
        );
    });

    test('onUpdate scopes query by { _id, owner } and strips spoofed owner from payload', async () => {
        const updatedDoc = { _id: VALID_TEMPLATE_ID, owner: VALID_USER_ID, subject: 'Mine' };
        mockEmailTemplateController.onUpdate.mockResolvedValueOnce(updatedDoc);

        const res = mockResponse();
        await emailTemplateService.onUpdate(
            {
                user: { id: VALID_USER_ID },
                headers: {},
                cookies: {},
                body: {
                    _id: VALID_TEMPLATE_ID,
                    owner: '670000000000000000000099',
                    subject: 'Mine'
                }
            },
            res
        );

        expect(mockEmailTemplateController.onUpdate).toHaveBeenCalledTimes(1);
        const [queryArg, payloadArg] = mockEmailTemplateController.onUpdate.mock.calls[0];
        expect(String(queryArg._id)).toBe(VALID_TEMPLATE_ID);
        expect(String(queryArg.owner)).toBe(VALID_USER_ID);
        expect(payloadArg.owner).toBeUndefined();
        expect(payloadArg._id).toBeUndefined();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('onSendTest rejects invalid email with 400 and does not call mailer', async () => {
        const res = mockResponse();
        await emailTemplateService.onSendTest(
            { user: { id: VALID_USER_ID }, body: { to: 'bad-email', code: 'ResponseNotification' } },
            res
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(mailer.sendMail).not.toHaveBeenCalled();
    });

    test('onSendTest always sends back to signed-in owner email when available on user record', async () => {
        mockUserModel.findById.mockImplementationOnce(() => ({
            select: jest.fn(() => ({
                lean: jest.fn(() => Promise.resolve({ email: 'owner@mfu.ac.th' }))
            }))
        }));

        const res = mockResponse();
        await emailTemplateService.onSendTest(
            {
                user: { id: VALID_USER_ID },
                body: {
                    to: 'other@mfu.ac.th',
                    code: 'ResponseNotification',
                    subject: 'Alert: {{FormTitle}}',
                    content: '<p>Hi {{UserName}}, {{Responder}} replied.</p>'
                }
            },
            res
        );

        expect(mailer.sendMail).toHaveBeenCalledTimes(1);
        const [to, subject, textBody, htmlBody] = mailer.sendMail.mock.calls[0];
        expect(to).toBe('owner@mfu.ac.th');
        expect(subject).toBe(`[TEST] Alert: ${SAMPLE_TEST_VARIABLES.FormTitle}`);
        expect(textBody).toContain(SAMPLE_TEST_VARIABLES.UserName);
        expect(htmlBody).toContain(SAMPLE_TEST_VARIABLES.Responder);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                code: 20000,
                data: expect.objectContaining({
                    sent: true,
                    to: 'owner@mfu.ac.th',
                    renderedSubject: `Alert: ${SAMPLE_TEST_VARIABLES.FormTitle}`
                })
            })
        );
    });

    test('onSendTest renders sample variables, prefixes [TEST], and calls mailer', async () => {
        const res = mockResponse();
        await emailTemplateService.onSendTest(
            {
                user: { id: VALID_USER_ID },
                body: {
                    to: 'qa@mfu.ac.th',
                    code: 'ResponseNotification',
                    subject: 'Alert: {{FormTitle}}',
                    content: '<p>Hi {{UserName}}, {{Responder}} replied.</p>'
                }
            },
            res
        );

        expect(mailer.sendMail).toHaveBeenCalledTimes(1);
        const [to, subject, textBody, htmlBody] = mailer.sendMail.mock.calls[0];
        expect(to).toBe('qa@mfu.ac.th');
        expect(subject).toBe(`[TEST] Alert: ${SAMPLE_TEST_VARIABLES.FormTitle}`);
        expect(textBody).toContain(SAMPLE_TEST_VARIABLES.UserName);
        expect(htmlBody).toContain(SAMPLE_TEST_VARIABLES.Responder);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                code: 20000,
                data: expect.objectContaining({
                    sent: true,
                    to: 'qa@mfu.ac.th',
                    renderedSubject: `Alert: ${SAMPLE_TEST_VARIABLES.FormTitle}`
                })
            })
        );
    });
});
