'use strict';

const mockFormDocMap = new Map();
const mockFormFindById = jest.fn((id) => {
    const doc = mockFormDocMap.get(String(id)) || null;
    const chain = {
        select: jest.fn(() => chain),
        populate: jest.fn(() => chain),
        lean: jest.fn(() => Promise.resolve(doc))
    };
    return chain;
});

jest.mock('../server/Project/Form/models/form.model', () => ({
    findById: mockFormFindById
}));

const mockUserFindById = jest.fn();
const mockUserFind = jest.fn();
jest.mock('../server/Project/User/models/user.model', () => ({
    findById: mockUserFindById,
    find: mockUserFind
}));

const mockOrgFind = jest.fn();
jest.mock('../server/Project/Organizations/models/organization.model', () => ({
    find: mockOrgFind
}));

jest.mock('../server/Project/Email/service/dynamicEmail', () => ({
    sendDynamicEmail: jest.fn(() => Promise.resolve({ success: true }))
}));

const {
    buildFormLink,
    formatFormScheduleForEmail,
    generateQrCodeDataUri,
    buildQrCodeHtmlBlock,
    resolveFormContactInfo
} = require('../server/Project/Email/service/email.utils');
const { _testables: mailTestables } = require('../helpers/google/Mail');
const dynamicEmail = require('../server/Project/Email/service/dynamicEmail');
const collaborationService = require('../server/Project/Email/service/collaboration');
const inviteOrgService = require('../server/Project/Email/service/inviteOrganization');

const FORM_ID = '670000000000000000000101';
const CREATOR_ID = '670000000000000000000201';
const EDITOR_ID = '670000000000000000000202';
const VIEWER_ID = '670000000000000000000203';
const ORG_ID = '670000000000000000000301';
const GENERAL_ORG_ID = '6a0b51af2dbf6e77c4df73fe';
const ROLE_STAFF_ID = '670000000000000000000401';

function chainResult(data) {
    const chain = {
        select: jest.fn(() => chain),
        populate: jest.fn(() => chain),
        lean: jest.fn(() => Promise.resolve(data))
    };
    return chain;
}

describe('Email #3 & #4 Link Separation, Schedule Format, QR CID & Contact Resolution', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockFormDocMap.clear();
        process.env.FRONTEND_URL = 'http://localhost:8080';
    });

    test('buildFormLink separates responder fill link (?mode=public) and collaborator manage link (/manage/:id)', () => {
        expect(buildFormLink(FORM_ID, 'fill')).toBe(`http://localhost:8080/forms/${FORM_ID}?mode=public`);
        expect(buildFormLink(FORM_ID)).toBe(`http://localhost:8080/forms/${FORM_ID}?mode=public`);
        expect(buildFormLink(FORM_ID, 'manage')).toBe(`http://localhost:8080/manage/${FORM_ID}`);
        expect(buildFormLink(FORM_ID, 'preview')).toBe(`http://localhost:8080/forms/${FORM_ID}?mode=preview&source=invite`);
    });

    test('formatFormScheduleForEmail formats always, range, end_only, and scheduled modes clearly', () => {
        const alwaysRes = formatFormScheduleForEmail({ mode: 'always' });
        expect(alwaysRes.openDate).toBe('Open immediately');
        expect(alwaysRes.closeDate).toBe('No expiration date');
        expect(alwaysRes.schedulePeriod).toContain('Open immediately');

        const rangeRes = formatFormScheduleForEmail({
            mode: 'range',
            startAt: '2026-11-18T02:00:00.000Z',
            endAt: '2026-11-25T16:59:00.000Z'
        });
        expect(rangeRes.openDate).toContain('Nov 2026');
        expect(rangeRes.closeDate).toContain('Nov 2026');
        expect(rangeRes.schedulePeriod).toContain('–');

        const endOnlyRes = formatFormScheduleForEmail({
            mode: 'end_only',
            endAt: '2026-11-30T16:59:00.000Z'
        });
        expect(endOnlyRes.openDate).toBe('Open immediately');
        expect(endOnlyRes.closeDate).toContain('Nov 2026');
        expect(endOnlyRes.schedulePeriod).toContain('Now –');

        const scheduledRes = formatFormScheduleForEmail({
            mode: 'scheduled',
            startAt: '2026-12-01T02:00:00.000Z'
        });
        expect(scheduledRes.openDate).toContain('Dec 2026');
        expect(scheduledRes.closeDate).toBe('No expiration date');
    });

    test('generateQrCodeDataUri + buildQrCodeHtmlBlock extracts cleanly to inline CID MIME attachment in Mail.js', async () => {
        const url = buildFormLink(FORM_ID, 'fill');
        const dataUri = await generateQrCodeDataUri(url);
        expect(dataUri.startsWith('data:image/png;base64,')).toBe(true);

        const qrHtml = buildQrCodeHtmlBlock(dataUri, url);
        expect(qrHtml).toContain('data-qr-block="true"');
        expect(qrHtml).toContain(url);

        const extracted = mailTestables.extractInlineImagesFromHtml(qrHtml);
        expect(extracted.attachments).toHaveLength(1);
        expect(extracted.attachments[0].filename).toMatch(/\.png$/);
        expect(extracted.processedHtml).toContain(`src="cid:${extracted.attachments[0].cid}"`);
        expect(extracted.processedHtml).not.toContain('data:image/png;base64');
    });

    test('resolveFormContactInfo prioritizes form settings override then falls back to creator organization/email', () => {
        const formWithOverride = {
            creator: {
                email: 'prof@mfu.ac.th',
                organization: { title: [{ key: 'en', value: 'School of IT' }] }
            },
            settings: {
                contactOrganization: 'Academic Services Division',
                contactEmail: 'academic@mfu.ac.th'
            }
        };
        expect(resolveFormContactInfo(formWithOverride)).toEqual({
            contactOrganization: 'Academic Services Division',
            contactEmail: 'academic@mfu.ac.th'
        });

        const formCreatorFallback = {
            creator: {
                email: 'prof@mfu.ac.th',
                organization: { title: [{ key: 'en', value: 'School of IT' }] }
            },
            settings: { contactOrganization: '', contactEmail: '' }
        };
        expect(resolveFormContactInfo(formCreatorFallback)).toEqual({
            contactOrganization: 'School of IT',
            contactEmail: 'prof@mfu.ac.th'
        });
    });

    test('maybeSendCollaborationInvites (#4) sends /manage/:id to BOTH Editor and Viewer with contact info & replyTo', async () => {
        mockFormDocMap.set(FORM_ID, {
            _id: FORM_ID,
            title: [{ key: 'en', value: 'Staff Evaluation' }],
            creator: {
                _id: CREATOR_ID,
                name: 'Dean IT',
                email: 'dean@mfu.ac.th',
                organization: { title: [{ key: 'en', value: 'School of IT' }] }
            },
            organization: [{ _id: ORG_ID, title: [{ key: 'en', value: 'School of IT' }] }],
            settings: {
                contactOrganization: 'Quality Assurance Office',
                contactEmail: 'qa@mfu.ac.th'
            },
            collaborator: [
                { user: EDITOR_ID, type: { title: [{ key: 'en', value: 'Editor' }] } },
                { user: VIEWER_ID, type: { title: [{ key: 'en', value: 'Viewer' }] } }
            ]
        });

        mockUserFindById.mockImplementation((uid) => {
            if (String(uid) === EDITOR_ID) {
                return chainResult({ _id: EDITOR_ID, name: 'Ed User', email: 'ed@mfu.ac.th' });
            }
            if (String(uid) === VIEWER_ID) {
                return chainResult({ _id: VIEWER_ID, name: 'View User', email: 'view@mfu.ac.th' });
            }
            return chainResult(null);
        });

        await collaborationService.maybeSendCollaborationInvites({
            previousDoc: { collaborator: [] },
            currentDoc: { _id: FORM_ID }
        });

        expect(dynamicEmail.sendDynamicEmail).toHaveBeenCalledTimes(2);
        const editorCall = dynamicEmail.sendDynamicEmail.mock.calls.find(c => c[2] === 'ed@mfu.ac.th');
        const viewerCall = dynamicEmail.sendDynamicEmail.mock.calls.find(c => c[2] === 'view@mfu.ac.th');

        expect(editorCall[0]).toBe('invitationCollaboration');
        expect(editorCall[1].InvitationLink).toBe(`http://localhost:8080/manage/${FORM_ID}`);
        expect(editorCall[1].ManageURL).toBe(`http://localhost:8080/manage/${FORM_ID}`);
        expect(editorCall[1].Permission).toBe('Editor');
        expect(editorCall[1].ContactOrganization).toBe('Quality Assurance Office');
        expect(editorCall[1].ContactEmail).toBe('qa@mfu.ac.th');
        expect(editorCall[3]).toEqual(expect.objectContaining({ replyTo: 'qa@mfu.ac.th' }));

        expect(viewerCall[0]).toBe('invitationCollaboration');
        expect(viewerCall[1].InvitationLink).toBe(`http://localhost:8080/manage/${FORM_ID}`);
        expect(viewerCall[1].ManageURL).toBe(`http://localhost:8080/manage/${FORM_ID}`);
        expect(viewerCall[1].Permission).toBe('Viewer');
    });

    test('maybeSendOrganizationInvites (#3) sends to newly targeted Private Published recipients (including Scheduled & individual external emails) with QR + schedule + fill link', async () => {
        const futureStart = new Date(Date.now() + 86400000).toISOString();
        const futureEnd = new Date(Date.now() + 7 * 86400000).toISOString();

        const currentForm = {
            _id: FORM_ID,
            title: [{ key: 'en', value: 'IT Annual Questionnaire' }],
            status: { title: [{ key: 'en', value: 'Open' }] },
            schedule: { isPublished: true, mode: 'scheduled', startAt: futureStart, endAt: futureEnd },
            creator: {
                _id: CREATOR_ID,
                name: 'IT Lead',
                email: 'it-lead@mfu.ac.th',
                organization: { title: [{ key: 'en', value: 'School of Information Technology' }] }
            },
            organization: [
                { _id: GENERAL_ORG_ID, title: [{ key: 'en', value: 'General' }] },
                { _id: ORG_ID, title: [{ key: 'en', value: 'School of Information Technology' }] }
            ],
            settings: {
                accessMode: 'private',
                allowedRoles: [ROLE_STAFF_ID],
                allowedUser: [],
                allowedEmails: []
            }
        };
        mockFormDocMap.set(FORM_ID, currentForm);

        mockOrgFind.mockReturnValue(chainResult([
            { _id: ORG_ID, title: [{ key: 'en', value: 'School of Information Technology' }] }
        ]));
        mockUserFind.mockReturnValue(chainResult([
            { _id: EDITOR_ID, name: 'Somchai', email: 'somchai@mfu.ac.th', organization: ORG_ID }
        ]));

        // Draft -> Published transition
        await inviteOrgService.maybeSendOrganizationInvites({
            previousDoc: {
                ...currentForm,
                schedule: { isPublished: false, mode: 'scheduled', startAt: futureStart, endAt: futureEnd }
            },
            currentDoc: { _id: FORM_ID }
        });

        expect(dynamicEmail.sendDynamicEmail).toHaveBeenCalledTimes(1);
        const [code, vars, to, opts] = dynamicEmail.sendDynamicEmail.mock.calls[0];
        expect(code).toBe('invitationOrganization');
        expect(to).toBe('somchai@mfu.ac.th');
        expect(vars.InvitationLink).toBe(`http://localhost:8080/forms/${FORM_ID}?mode=public`);
        expect(vars.FormURL).toBe(`http://localhost:8080/forms/${FORM_ID}?mode=public`);
        expect(vars.SchedulePeriod).toContain('–');
        expect(vars.QRCode).toContain('data:image/png;base64,');
        expect(vars.QRCode).toContain(`http://localhost:8080/forms/${FORM_ID}?mode=public`);
        expect(vars.ContactOrganization).toBe('School of Information Technology');
        expect(vars.ContactEmail).toBe('it-lead@mfu.ac.th');
        expect(opts).toEqual(expect.objectContaining({
            ownerId: CREATOR_ID,
            replyTo: 'it-lead@mfu.ac.th',
            contactOrganization: 'School of Information Technology',
            contactEmail: 'it-lead@mfu.ac.th'
        }));

        // Subsequent save with individual external emails added -> invites ONLY the external email (union preserves existing org member somchai)
        jest.clearAllMocks();
        const updatedWithExternal = {
            ...currentForm,
            settings: {
                ...currentForm.settings,
                allowedEmails: ['external.guest@gmail.com']
            }
        };
        mockFormDocMap.set(FORM_ID, updatedWithExternal);
        mockUserFind.mockImplementation((query) => {
            if (query && query.email) {
                return chainResult([]); // external guest has no user doc yet
            }
            if (query && query.organization) {
                return chainResult([
                    { _id: EDITOR_ID, name: 'Somchai', email: 'somchai@mfu.ac.th', organization: ORG_ID }
                ]);
            }
            return chainResult([]);
        });

        await inviteOrgService.maybeSendOrganizationInvites({
            previousDoc: currentForm,
            currentDoc: { _id: FORM_ID }
        });

        expect(dynamicEmail.sendDynamicEmail).toHaveBeenCalledTimes(1);
        expect(dynamicEmail.sendDynamicEmail.mock.calls[0][2]).toBe('external.guest@gmail.com');
    });

    test('collectEligibleRecipientsForForm returns deduplicated UNION of individuals (allowedUser + allowedEmails) and organization(+bound role) members', async () => {
        const unionForm = {
            _id: FORM_ID,
            title: [{ key: 'en', value: 'Union Audience Survey' }],
            status: { title: [{ key: 'en', value: 'Open' }] },
            schedule: { isPublished: true, mode: 'always' },
            creator: {
                _id: CREATOR_ID,
                name: 'IT Lead',
                email: 'it-lead@mfu.ac.th',
                organization: { title: [{ key: 'en', value: 'School of Information Technology' }] }
            },
            organization: [
                { _id: ORG_ID, title: [{ key: 'en', value: 'School of Information Technology' }] }
            ],
            settings: {
                accessMode: 'private',
                allowedRoles: [ROLE_STAFF_ID],
                allowedUser: [VIEWER_ID],
                allowedEmails: ['external.vip@gmail.com', 'somchai@mfu.ac.th']
            }
        };
        mockFormDocMap.set(FORM_ID, unionForm);

        mockOrgFind.mockReturnValue(chainResult([
            { _id: ORG_ID, title: [{ key: 'en', value: 'School of Information Technology' }] }
        ]));
        mockUserFind.mockImplementation((query) => {
            if (query && query._id) {
                return chainResult([
                    {
                        _id: VIEWER_ID,
                        name: 'Suda Individual',
                        email: 'suda@mfu.ac.th',
                        organization: { title: [{ key: 'en', value: 'School of Science' }] }
                    }
                ]);
            }
            if (query && query.email) {
                return chainResult([
                    {
                        _id: EDITOR_ID,
                        name: 'Somchai Staff',
                        email: 'somchai@mfu.ac.th',
                        organization: { title: [{ key: 'en', value: 'School of Information Technology' }] }
                    }
                ]);
            }
            if (query && query.organization) {
                return chainResult([
                    { _id: EDITOR_ID, name: 'Somchai Staff', email: 'somchai@mfu.ac.th', organization: ORG_ID },
                    { _id: '670000000000000000000209', name: 'Napus Staff', email: 'napus@mfu.ac.th', organization: ORG_ID }
                ]);
            }
            return chainResult([]);
        });

        await inviteOrgService.maybeSendOrganizationInvites({
            previousDoc: null,
            currentDoc: { _id: FORM_ID }
        });

        const invitedEmails = dynamicEmail.sendDynamicEmail.mock.calls.map(c => c[2]).sort();
        expect(invitedEmails).toEqual([
            'external.vip@gmail.com',
            'napus@mfu.ac.th',
            'somchai@mfu.ac.th',
            'suda@mfu.ac.th'
        ]);
    });

    test('maybeSendOrganizationInvites skips Public forms completely', async () => {
        mockFormDocMap.set(FORM_ID, {
            _id: FORM_ID,
            title: [{ key: 'en', value: 'Public Survey' }],
            schedule: { isPublished: true, mode: 'always' },
            organization: [{ _id: ORG_ID }],
            settings: { accessMode: 'public', allowedUser: [], allowedEmails: [] }
        });

        await inviteOrgService.maybeSendOrganizationInvites({
            previousDoc: null,
            currentDoc: { _id: FORM_ID }
        });

        expect(dynamicEmail.sendDynamicEmail).not.toHaveBeenCalled();
    });
});
